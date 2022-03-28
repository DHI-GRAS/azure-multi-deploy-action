import { exec } from 'child-process-promise'
import { Packages, StorageAccounts, FunctionApps, Package } from './types'
import createFunctionApp from './functions/create-function-app'
import createStorageAccount from './functions/create-storage-account'
import config from './functions/get-packages'

const getMissingStorageAccounts = async (
	packages: Packages,
): Promise<Packages> => {
	const webAppPackages = packages.filter((item) => item.type === 'app')
	if (webAppPackages.length === 0) {
		console.log('No web app packages in project')
		return []
	}

	const { stdout, stderr } = await exec('az storage account list')

	if (stderr) {
		throw Error(stderr)
	}

	const accounts = JSON.parse(stdout) as StorageAccounts
	console.log(`Retrieved ${accounts.length} storage accounts`)

	return webAppPackages.filter(
		(item) => !accounts.map((account) => account.name).includes(item.id),
	)
}

const getMissingFunctionApps = async (
	packages: Packages,
): Promise<Packages> => {
	const configFuncApps = packages.filter((item) => item.type === 'func-api')

	if (configFuncApps.length === 0) {
		console.log('No function app packages in project')
		return []
	}

	const { stdout, stderr } = await exec('az functionapp list')
	if (stderr) {
		throw Error(stderr)
	}

	const apps = JSON.parse(stdout) as FunctionApps
	console.log(`Retrieved ${apps.length} function apps`)

	return configFuncApps.filter((configApp) => {
		const appIds = apps.map((app) => app.name)
		return !appIds.includes(configApp.id)
	})
}

const createMissingResources = async (localConfig: Package[]) => {
	console.log('Creating missing Azure services...')
	const missingStorageAccounts = await getMissingStorageAccounts(localConfig)
	const missingFunctionApps = await getMissingFunctionApps(localConfig)
	console.log(
		missingStorageAccounts.length > 0
			? `Creating storage accounts: ${missingStorageAccounts
					.map((pkg) => pkg.id)
					.join()}`
			: 'No storage accounts to create',
	)

	console.log(
		missingFunctionApps.length > 0
			? `Creating function apps: ${missingFunctionApps
					.map((pkg) => pkg.id)
					.join()}`
			: 'No function apps to create',
	)
	missingStorageAccounts.forEach((pkg) => createStorageAccount(pkg))
	missingFunctionApps.forEach((pkg) => createFunctionApp(pkg))
}

const createServices = async (): Promise<void> => {
	const groupBySubscription = config.reduce(
		(acc: Record<string, Package[]>, item) => {
			acc[item.subscriptionId] = [...(acc[item.subscriptionId] || []), item]
			return acc
		},
		{},
	)

	const createAzureServicesPromise = Object.keys(groupBySubscription).map(
		async (subsId) => {
			console.log('\n')
			console.log('Setting the subscription for creating services...')
			await exec(`az account set --subscription ${subsId}`)
				.then(() => console.log(`subscription set to ${subsId}`))
				.catch((err) => {
					throw Error(err)
				})
			const localConfig = groupBySubscription[subsId]
			await createMissingResources(localConfig)
		},
	)

	await Promise.all(createAzureServicesPromise)
}

export default createServices
