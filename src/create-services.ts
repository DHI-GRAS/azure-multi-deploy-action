import { exec } from 'child-process-promise'
import chalk from 'chalk'
import {
	Packages,
	StorageAccounts,
	FunctionApps,
	Package,
	PackageWithMissingStorage,
} from './types'
import createFunctionApp from './functions/create-function-app'
import createStorageAccount from './functions/create-storage-account'
import packages from './functions/get-packages'
import groupBySubscription from './functions/group-by-subscription'

chalk.level = 1

const getMissingStorageAccounts = async (
	localPackages: Packages,
	prNumber: number,
): Promise<PackageWithMissingStorage[]> => {
	const webAppPackages = localPackages.filter((item) => item.type === 'app')
	if (webAppPackages.length === 0) {
		console.log(
			`${chalk.bold.yellow('Warning')}: No web app packages in project`,
		)
		return []
	}

	const { stdout, stderr } = await exec('az storage account list')

	if (stderr) {
		throw Error(stderr)
	}

	const accounts = (JSON.parse(stdout) as StorageAccounts).map(
		(account) => account.name,
	)
	console.log(
		`${chalk.bold.blue('Info')}: Retrieved ${chalk.bold(
			accounts.length,
		)} storage accounts`,
	)

	const missingStorageAccounts = webAppPackages
		.reduce((acc, pkg) => [...acc, pkg.id, `${pkg.id}stag${prNumber}`], [])
		.filter((storageApp) => !accounts.includes(storageApp))

	return webAppPackages
		.filter(
			(webApp) =>
				missingStorageAccounts.includes(webApp.id) ||
				missingStorageAccounts.includes(`${webApp.id}stag${prNumber}`),
		)
		.reduce(
			(acc, pkg) => [
				...acc,
				{
					...pkg,
					mssingAccounts: missingStorageAccounts.filter((storageAcc) =>
						storageAcc.includes(pkg.id),
					),
				},
			],
			[],
		)
}

const getMissingFunctionApps = async (
	localPackages: Packages,
): Promise<Packages> => {
	const configFuncApps = localPackages.filter(
		(item) => item.type === 'func-api',
	)

	if (configFuncApps.length === 0) {
		console.log(
			`${chalk.bold.yellow('Warning')}: No function app packages in project`,
		)
		return []
	}

	const { stdout, stderr } = await exec('az functionapp list')
	if (stderr) {
		throw Error(stderr)
	}

	const apps = JSON.parse(stdout) as FunctionApps
	console.log(
		`${chalk.bold.blue('Info')}: Retrieved ${chalk.bold(
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
	prNumber: number,
) => {
	console.log('\n')
	console.log(
		`${chalk.bold.blue(
			'Info',
		)}: Setting the subscription for creating services...`,
	)

	await exec(`az account set --subscription ${subscriptionId}`)
	console.log(
		`${chalk.bold.green('Success')}: Subscription set to ${chalk.bold(
			subscriptionId,
		)}`,
	)
	const pkgMissingStorageAccounts = await getMissingStorageAccounts(
		localConfig,
		prNumber,
	)

	const missingFunctionApps = await getMissingFunctionApps(localConfig)

	console.log(
		pkgMissingStorageAccounts.length > 0
			? `${chalk.bold.blue('Info')}: Creating storage accounts: ${chalk.bold(
					pkgMissingStorageAccounts
						.reduce((acc, pkg) => [...acc, ...pkg.mssingAccounts], [])
						.join(),
			  )}`
			: `${chalk.bold.yellow('Warning')}: No storage accounts to create`,
	)

	console.log(
		missingFunctionApps.length > 0
			? `${chalk.bold.blue('Info')}: Creating function apps: ${chalk.bold(
					missingFunctionApps.map((pkg) => pkg.id).join(),
			  )}`
			: `${chalk.bold.yellow('Warning')}: No function apps to create`,
	)

	for (const pkg of pkgMissingStorageAccounts) {
		await createStorageAccount(pkg)
	}

	for (const pkg of missingFunctionApps) {
		await createFunctionApp(pkg)
	}

	console.log(
		`${chalk.bold.green('Success')}: Completed for subscriptionID ${chalk.bold(
			subscriptionId,
		)}`,
	)
}

const createServices = async (prNumber: number): Promise<void> => {
	const azureResourcesBySubId = groupBySubscription(packages)

	for (const subsId of Object.keys(azureResourcesBySubId)) {
		await createMissingResources(
			azureResourcesBySubId[subsId],
			subsId,
			prNumber,
		)
	}
}

export default createServices
