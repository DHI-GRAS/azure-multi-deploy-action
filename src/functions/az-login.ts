import * as core from '@actions/core'
import { exec } from 'child-process-promise'

interface AzureCredentials {
	clientId: string
	tenantId: string
	clientSecret: string
	subscriptionId: string
}

export default async (): Promise<void> => {
	console.log('Logging into Azure CLI...')
	const azureCredentialsInput = core.getInput('azureCredentials', {
		required: true,
	})

	const azureCredentials: AzureCredentials = JSON.parse(azureCredentialsInput)

	Object.keys(azureCredentials).forEach((key) =>
		core.setSecret(azureCredentials[key]),
	)

	const { clientId, tenantId, clientSecret, subscriptionId } = azureCredentials
	await exec(
		`az login --service-principal --username ${clientId} --tenant ${tenantId} --password ${clientSecret}`,
	)
	await exec(`az account set --subscription ${subscriptionId}`)
}
