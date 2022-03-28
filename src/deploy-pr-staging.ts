import { exec } from 'child-process-promise'
import path from 'path'
import fs from 'fs'
import getChangedPackages from './functions/get-changed-packages'
import deployWebApp from './functions/deploy-web-to-staging'
import deployFuncApp from './functions/deploy-func-to-staging'
import { Package } from './types'

const deployToStag = async (prNumber: number): Promise<void> => {
	const changedPackages = await getChangedPackages()

	const groupBySubscription = changedPackages.reduce(
		(acc: Record<string, Package[]>, item) => {
			acc[item.subscriptionId] = [...(acc[item.subscriptionId] || []), item]
			return acc
		},
		{},
	)

	const createAzureServicesPromise = Object.keys(groupBySubscription).map(
		async (subsId) => {
			console.log('\n')
			console.log('Setting the subscription for PR deployment...')
			await exec(`az account set --subscription ${subsId}`)
				.then(() => console.log(`subscription set to ${subsId}`))
				.catch((err) => {
					throw Error(err)
				})
			const localChangedPackages = groupBySubscription[subsId]
			const webPackages = localChangedPackages.filter(
				(pkg) => pkg.type === 'app',
			)
			const funcPackages = localChangedPackages.filter(
				(pkg) => pkg.type === 'func-api',
			)

			if (webPackages.length + funcPackages.length === 0) {
				const deployMsg = `ℹ️ No changed packages were detected`
				console.log(deployMsg)
				const msgFile = path.join('github_message.txt')
				fs.appendFileSync(msgFile, `\n${deployMsg}  `)
			}

			for (const webApp of webPackages) await deployWebApp(webApp, prNumber)
			for (const funcApp of funcPackages) await deployFuncApp(funcApp, prNumber)
		},
	)

	await Promise.all(createAzureServicesPromise)
}

export default deployToStag
