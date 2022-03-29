import { exec } from 'child-process-promise'
import path from 'path'
import fs from 'fs'
import getChangedPackages from './functions/get-changed-packages'
import deployWebApp from './functions/deploy-web-to-staging'
import deployFuncApp from './functions/deploy-func-to-staging'
import { Package } from './types'
import groupBySubscription from './functions/group-by-subscription'

const createMissingResources = async (
	localConfig: Package[],
	subsId: string,
	prNumber: number,
) => {
	console.log('\nSetting the subscription for PR deployment...')
	await exec(`az account set --subscription ${subsId}`)
	console.log(`subscription set to ${subsId}`)

	const webPackages = localConfig.filter((pkg) => pkg.type === 'app')
	const funcPackages = localConfig.filter((pkg) => pkg.type === 'func-api')

	if (webPackages.length + funcPackages.length === 0) {
		const deployMsg = `ℹ️ No changed packages were detected`
		console.log(deployMsg)
		const msgFile = path.join('github_message.txt')
		fs.appendFileSync(msgFile, `\n${deployMsg}  `)
	}

	for (const webApp of webPackages) await deployWebApp(webApp, prNumber)
	for (const funcApp of funcPackages) await deployFuncApp(funcApp, prNumber)

	console.log(`Completed for subscriptionID ${subsId}`)
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
