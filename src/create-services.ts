import { exec } from 'child-process-promise'
import chalk from 'chalk'
import { Packages, StorageAccounts, FunctionApps, Package } from './types'
import createFunctionApp from './functions/create-function-app'
import createStorageAccount from './functions/create-storage-account'
import config from './functions/get-packages'

const getMissingStorageAccounts = async (
	packages: Packages,
): Promise<Packages> => {
	const webAppPackages = packages.filter((item) => item.type === 'app')
	if (webAppPackages.length === 0) {
		console.log(`${chalk.bold.blue('info')}: No web app packages in project`)
		return []
	}

	const { stdout, stderr } = await exec('az storage account list')

	if (stderr) {
		throw Error(stderr)
	}

	const accounts = JSON.parse(stdout) as StorageAccounts
	console.log(
		`${chalk.bold.blue('info')}: Retrieved ${chalk.bold.green(
			accounts.length,
		)} storage accounts`,
	)

	return webAppPackages.filter(
		(item) => !accounts.map((account) => account.name).includes(item.id),
	)
}

const getMissingFunctionApps = async (
	packages: Packages,
): Promise<Packages> => {
	const configFuncApps = packages.filter((item) => item.type === 'func-api')

	if (configFuncApps.length === 0) {
		console.log(
			`${chalk.bold.blue('info')}: No function app packages in project`,
		)
		return []
	}

	const { stdout, stderr } = await exec('az functionapp list')
	if (stderr) {
		throw Error(stderr)
	}

	const apps = JSON.parse(stdout) as FunctionApps
	console.log(
		`${chalk.bold.blue('info')}: Retrieved ${chalk.bold.green(
			apps.length,
		)} function apps`,
	)

	return configFuncApps.filter((configApp) => {
		const appIds = apps.map((app) => app.name)
		return !appIds.includes(configApp.id)
	})
}

const createMissingResources = async (
	localConfig: Package[],
	subscriptionId: string,
) => {
	console.log('\n')
	console.log(
		`${chalk.bold.blue(
			'Info',
		)} :Setting the subscription for creating services...`,
	)
	console.log(`chalk.bold.blue("info"): Creating missing Azure services...`)

	await exec(`az account set --subscription ${subscriptionId}`)

	console.log(
		`chalk.bold.blue("info"): Subscription set to ${chalk.bold.green(
			subscriptionId,
		)}`,
	)

	const missingStorageAccounts = await getMissingStorageAccounts(localConfig)
	const missingFunctionApps = await getMissingFunctionApps(localConfig)
	console.log(
		missingStorageAccounts.length > 0
			? `${chalk.bold.blue(
					'info',
			  )}: Creating storage accounts: ${missingStorageAccounts
					.map((pkg) => pkg.id)
					.join()}`
			: `${chalk.bold.blue('info')}: No storage accounts to create`,
	)

	console.log(
		missingFunctionApps.length > 0
			? `${chalk.bold.blue(
					'info',
			  )}: Creating function apps: ${missingFunctionApps
					.map((pkg) => pkg.id)
					.join()}`
			: `${chalk.bold.blue('info')}: No function apps to create`,
	)

	for (const pkg of missingStorageAccounts) {
		await createStorageAccount(pkg)
	}

	for (const pkg of missingFunctionApps) {
		await createFunctionApp(pkg)
	}

	console.log(
		`${chalk.bold.blue(
			'info',
		)}: Completed for subscriptionID ${subscriptionId}`,
	)
}

const createServices = async (): Promise<void> => {
	const groupBySubscription = config.reduce(
		(acc: Record<string, Package[]>, item) => {
			acc[item.subscriptionId] = [...(acc[item.subscriptionId] || []), item]
			return acc
		},
		{},
	)

	for (const subsId of Object.keys(groupBySubscription)) {
		await createMissingResources(groupBySubscription[subsId], subsId)
	}
}

export default createServices
