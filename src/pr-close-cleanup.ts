import { exec } from 'child-process-promise'
import chalk from 'chalk'
import { Package } from './types'
import packages from './functions/get-packages'
import groupBySubscription from './functions/group-by-subscription'

chalk.level = 1
const removeWebStagingDeployment = async (pkg: Package, pullNumber: number) => {
	try {
		if (!pullNumber) throw Error('No PR number')
		const stagName = `${pkg.id}stag${pullNumber}`

		await exec('az extension add --name storage-preview').catch()
		await exec(
			`az storage account delete -n ${pkg.id}stag${pullNumber} -g ${pkg.resourceGroup} --yes`,
		)
		console.log(
			`${chalk.bold.green('Success')}: Deleted web app: ${chalk.bold(
				`${stagName}`,
			)}`,
		)
	} catch (err) {
		throw Error(err)
	}
}

const removeFuncAppStagingDeployment = async (
	pkg: Package,
	pullNumber: number,
) => {
	try {
		if (!pullNumber) throw Error(`${chalk.bold.red('Error')}: No PR number`)
		const slotName = `stag-${pullNumber}`

		const { stdout: deleteOut, stderr: deleteErr } = await exec(
			`az functionapp deployment slot delete -g ${pkg.resourceGroup} -n ${pkg.id} --slot ${slotName}`,
		)
		if (deleteErr) console.log(deleteOut, deleteErr)
		console.log(
			`${chalk.bold.green('Success')}: Deleted function app: ${chalk.bold(
				`${pkg.id}-${slotName}`,
			)}`,
		)
	} catch (err) {
		throw Error(err)
	}
}

const removeResources = async (
	localConfig: Package[],
	subsId: string,
	prNumber: number,
) => {
	console.log('\n')
	console.log(
		`${chalk.bold.blue(
			'Info',
		)}: Setting the subscription for creating services...`,
	)
	await exec(`az account set --subscription ${subsId}`)
	console.log(
		`${chalk.bold.green('Success')}: Subscription set to ${chalk.bold(subsId)}`,
	)

	const webPackages = localConfig.filter((pkg) => pkg.type === 'app')
	const funcPackages = localConfig.filter((pkg) => pkg.type === 'func-api')

	for (const pkg of webPackages) {
		await removeWebStagingDeployment(pkg, prNumber)
	}

	for (const pkg of funcPackages) {
		await removeFuncAppStagingDeployment(pkg, prNumber)
	}
}

const cleanDeployments = async (prNumber: number): Promise<void> => {
	const azureResourcesBySubId = groupBySubscription(packages)

	for (const subsId of Object.keys(azureResourcesBySubId)) {
		await removeResources(azureResourcesBySubId[subsId], subsId, prNumber)
	}
}

export default cleanDeployments
