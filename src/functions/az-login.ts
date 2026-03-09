import * as core from '@actions/core'
import chalk from 'chalk'
import { exec } from 'child-process-promise'

chalk.level = 1

interface AzureCredentials {
	clientId: string
	tenantId: string
	subscriptionId: string
}

export default async (): Promise<void> => {
	const azureCredentialsInput = core.getInput('azureCredentials', {
		required: true,
	})

	const azureCredentials: AzureCredentials = JSON.parse(azureCredentialsInput)

	Object.values(azureCredentials).forEach((value) =>
		core.setSecret(value),
	)

	const { clientId, tenantId, subscriptionId } = azureCredentials

	// Request GitHub OIDC token (same mechanism azure/login uses)
	const oidcToken = await core.getIDToken('api://AzureADTokenExchange')

	await exec(
		`az login --service-principal --username ${clientId} --tenant ${tenantId} --federated-token "${oidcToken}"`
	)

	await exec(`az account set --subscription ${subscriptionId}`)

	console.log(chalk.green('Azure login successful using federated credentials'))
}