import { exec } from 'child-process-promise'
import chalk from 'chalk'
import { Package, StorageAccount } from '../types'

chalk.level = 1
export default async (pkg: Package, prNumber: number): Promise<void> => {
	try {
		const handleCreatedAccount = async ({ stdout }) => {
			const newAccountData = JSON.parse(stdout) as StorageAccount

			console.log(
				`${chalk.bold.green(
					'Success',
				)}: Created storage account for ${chalk.bold(
					newAccountData.name,
				)}: ${chalk.bold(newAccountData.primaryEndpoints.web)}`,
			)

			await exec(
				`az storage blob service-properties update --account-name ${newAccountData.name} --static-website --404-document index.html --index-document index.html`,
			)
			console.log(
				`${chalk.bold.blue(
					'Info',
				)}: Enabled web container for storage account: ${newAccountData.name}`,
			)
		}

		await exec(
			`az storage account create --resource-group ${pkg.resourceGroup} --name ${pkg.id} --location northeurope --kind StorageV2`,
		)
			.then(handleCreatedAccount)
			.catch((err) => {
				throw Error(err)
			})

		await exec(
			`az storage account create --resource-group ${pkg.resourceGroup} --name ${pkg.id}stag${prNumber} --location northeurope --kind StorageV2 --sku Standard_LRS`,
		)
			.then(async ({ stdout }) => handleCreatedAccount({ stdout }))
			.catch((err) => {
				throw Error(err)
			})
	} catch (err) {
		throw Error(err)
	}
}
