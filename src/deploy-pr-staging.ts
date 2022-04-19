import { exec } from 'child-process-promise'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'
import getChangedPackages from './functions/get-changed-packages'
import deployWebApp from './functions/deploy-web-to-staging'
import deployFuncApp from './functions/deploy-func-to-staging'
import { Package } from './types'
import groupBySubscription from './functions/group-by-subscription'

chalk.level = 1
const createMissingResources = async (
	localConfig: Package[],
	subsId: string,
	prNumber: number,
) => {
	console.log('\n')
	console.log(
		`${chalk.bold.blue('Info')}: Setting the subscription for PR deployment...`,
	)
	await exec(`az account set --subscription ${subsId}`)
	console.log(
		`${chalk.bold.green('Success')}: subscription set to ${chalk.bold(subsId)}`,
	)

	const webPackages = localConfig.filter((pkg) => pkg.type === 'app')
	const funcPackages = localConfig.filter((pkg) => pkg.type === 'func-api')

	if (webPackages.length + funcPackages.length === 0) {
		const deployMsg = `${chalk.bold.yellow(
			'Warning',
		)}: No changed packages were detected`
		console.log(deployMsg)
		const msgFile = path.join('github_message.txt')
		fs.appendFileSync(msgFile, `\n${deployMsg}  `)
	}

	for (const webApp of webPackages) await deployWebApp(webApp, prNumber)
	for (const funcApp of funcPackages) await deployFuncApp(funcApp, prNumber)

	console.log(
		`${chalk.bold.green('Success')}: Completed for subscriptionID ${chalk.bold(
			subsId,
		)}`,
	)
}

const deployToStag = async (prNumber: number): Promise<void> => {
	const changedPackages = await getChangedPackages()

	const azureResourcesBySubId = groupBySubscription(changedPackages)

	for (const subsId of Object.keys(azureResourcesBySubId)) {
		await createMissingResources(
			azureResourcesBySubId[subsId],
			subsId,
			prNumber,
		)
	}
}

export default deployToStag
