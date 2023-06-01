import * as core from '@actions/core'
import { exec } from 'child-process-promise'
import chalk from 'chalk'

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
	console.log('Logging in.. debug 1')
	await exec(
		`az login --service-principal --username ${clientId} --tenant ${tenantId} --password ${clientSecret}`,
	)
	console.log('Logging in.. debug 2')
}
