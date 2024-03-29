import { exec } from 'child-process-promise'
import chalk from 'chalk'
import { StorageAccount, PackageWithMissingStorage } from '../types'

chalk.level = 1
export default async (pkg: PackageWithMissingStorage): Promise<void> => {
	const handleCreatedAccount = async ({ stdout }) => {
		const newAccountData = JSON.parse(stdout) as StorageAccount

		console.log(
			`${chalk.bold.green('Success')}: Created storage account for ${chalk.bold(
				newAccountData.name,
			)}: ${chalk.bold(newAccountData.primaryEndpoints.web)}`,
		)

		await exec(
			`az storage blob service-properties update --account-name ${newAccountData.name} --static-website --404-document index.html --index-document index.html`,
		)

		console.log(
			`${chalk.bold.blue('Info')}: Enabled web container for storage account: ${newAccountData.name
			}`,
		)
	}

	for (const storageAccount of pkg.mssingAccounts) {
		const { stderr, stdout } = await exec(
			`az storage account create --min-tls-version TLS1_2 --https-only true --resource-group ${pkg.resourceGroup} --name ${storageAccount} --location northeurope --kind StorageV2 --sku Standard_LRS --allow-blob-public-access false`,
		)

		if (stderr && !stderr.toLowerCase().includes('warning')) {
			throw new Error(stderr)
		}

		await handleCreatedAccount({ stdout })
	}
}
