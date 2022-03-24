import { exec } from 'child-process-promise'
import { Package, FunctionApp } from '../types'

export default (pkg: Package): void => {
	try {
		if (!pkg.storageAccount) {
			throw Error(`${pkg.id} needs to specify storageAccount`)
		}

		if (!pkg.subscriptionId) {
			throw Error(`${pkg.id} needs to specify subscriptionId`)
		}

		void exec(`az account set --subscription ${pkg.subscriptionId}`)
			.then(() => console.log(`subscription set to ${pkg.subscriptionId}`))
			.catch((err) => {
				throw Error(err)
			})

		void exec(
			`az functionapp create --resource-group ${pkg.resourceGroup} --name ${pkg.id} --storage-account ${pkg.storageAccount} --runtime node --consumption-plan-location northeurope --functions-version 3 --disable-app-insights true`,
		)
			.then(({ stdout }) => {
				const newAccountData = JSON.parse(stdout) as FunctionApp
				console.log(
					`Created function app: ${pkg.id}: ${newAccountData.defaultHostName}`,
				)
			})
			.catch((err) => {
				throw Error(err)
			})
	} catch (err) {
		throw Error(err)
	}
}
