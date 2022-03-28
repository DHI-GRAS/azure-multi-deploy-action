import { exec } from 'child-process-promise'
import { Package, StorageAccount } from '../types'

export default async (pkg: Package): Promise<void> => {
	try {
		const handleCreatedAccount = async ({ stdout }) => {
			const newAccountData = JSON.parse(stdout) as StorageAccount

			console.log(
				`Created storage account for ${newAccountData.name}: ${newAccountData.primaryEndpoints.web}`,
			)

			await exec(
				`az storage blob service-properties update --account-name ${newAccountData.name} --static-website --404-document index.html --index-document index.html`,
			)
			console.log(
				`Enabled web container for storage account: ${newAccountData.name}`,
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
			`az storage account create --resource-group ${pkg.resourceGroup} --name ${pkg.id}stag --location northeurope --kind StorageV2`,
		)
			.then(async ({ stdout }) => handleCreatedAccount({ stdout }))
			.catch((err) => {
				throw Error(err)
			})
	} catch (err) {
		throw Error(err)
	}
}
