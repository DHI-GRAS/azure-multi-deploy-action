import * as core from '@actions/core'
import chalk from 'chalk'
import { exec } from 'child-process-promise'

chalk.level = 1
interface AzureCredentials {
	clientId: string
	tenantId: string
	clientSecret: string
	subscriptionId: string
}

export default async (): Promise<void> => {
	const azureCredentialsInput = core.getInput('azureCredentials', {
		required: true,
	})

	const azureCredentials: AzureCredentials = JSON.parse(azureCredentialsInput)

	Object.keys(azureCredentials).forEach((key) =>
		core.setSecret(azureCredentials[key]),
	)

	const { clientId, tenantId, clientSecret } = azureCredentials



	const { stdout, stderr } = await exec(
		`az login --service-principal --username ${clientId} --tenant ${tenantId} --password ${clientSecret}`,
	)

	if (stderr) {
		console.log('Throwing error now..')
		throw new Error(stderr)
	}
}
