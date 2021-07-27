// import { exec } from 'child-process-promise'
// import { readFileSync } from 'fs'
// import * as YAML from 'yaml'
// import { Packages, PackageConfig, StorageAccounts, FunctionApps } from './types'
// import createFunctionApp from './functions/createFunctionApp'
// import createStorageAccount from './functions/createStorageAccount'

// const config = readFileSync('../../deploy-config.yml', 'utf8')

// const getMissingStorageAccounts = async (
// 	packages: Packages,
// ): Promise<Packages> => {
// 	const webAppPackages = packages.filter((item) => item.type === 'app')

// 	const { stdout, stderr } = await exec('az storage account list')

// 	if (stderr) {
// 		throw Error(stderr)
// 	}

// 	const accounts = JSON.parse(stdout) as StorageAccounts
// 	console.log(`Retrieved ${accounts.length} storage accounts`)

// 	return webAppPackages.filter(
// 		(item) => !accounts.map((account) => account.name).includes(item.id),
// 	)
// }

// const getMissingFunctionApps = async (
// 	packages: Packages,
// ): Promise<Packages> => {
// 	const configFuncApps = packages.filter((item) => item.type === 'func-api')

// 	const { stdout, stderr } = await exec('az functionapp list')
// 	if (stderr) {
// 		throw Error(stderr)
// 	}

// 	const apps = JSON.parse(stdout) as FunctionApps
// 	console.log(`Retrieved ${apps.length} function apps`)

// 	return configFuncApps.filter((configApp) => {
// 		const appIds = apps.map((app) => app.name)
// 		return !appIds.includes(configApp.id)
// 	})
// }
// const createServices = async (): Promise<void> => {
// 	const configObj = YAML.parse(config) as PackageConfig
// 	const configArr = Object.values(configObj)

// 	const missingStorageAccounts = await getMissingStorageAccounts(configArr)
// 	const missingFunctionApps = await getMissingFunctionApps(configArr)

// 	console.log(
// 		missingStorageAccounts.length > 0
// 			? `Creating storage accounts: ${missingStorageAccounts
// 					.map((pkg) => pkg.id)
// 					.join()}`
// 			: 'No storage accounts to create',
// 	)

// 	console.log(
// 		missingFunctionApps.length > 0
// 			? `Creating function apps: ${missingFunctionApps
// 					.map((pkg) => pkg.id)
// 					.join()}`
// 			: 'No function apps to create',
// 	)
// 	missingStorageAccounts.forEach((pkg) => createStorageAccount(pkg))
// 	missingFunctionApps.forEach((pkg) => createFunctionApp(pkg))
// }

// export default createServices
