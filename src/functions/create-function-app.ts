import { exec } from 'child-process-promise'
import chalk from 'chalk'
import { Package, FunctionApp } from '../types'

chalk.level = 1
export default async (pkg: Package): Promise<void> => {
	try {
		if (!pkg.storageAccount) {
			throw Error(
				`${chalk.bold.red('Error')}: ${chalk.bold(
					pkg.id,
				)} needs to specify storageAccount`,
			)
		}

		await exec(
			`az functionapp create --resource-group ${pkg.resourceGroup} --name ${pkg.id} --storage-account ${pkg.storageAccount} --runtime node --consumption-plan-location northeurope --functions-version 3 --disable-app-insights true`,
		)
			.then(({ stdout }) => {
				const newAccountData = JSON.parse(stdout) as FunctionApp
				console.log(
					`${chalk.bold.green('Success')}: Created function app: ${chalk.bold(
						pkg.id,
					)}: ${chalk.bold(newAccountData.defaultHostName)}`,
				)
			})
			.catch((err) => {
				throw Error(err)
			})
	} catch (err) {
		throw Error(err)
	}
}
