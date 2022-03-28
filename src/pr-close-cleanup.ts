import { exec } from 'child-process-promise'
import { Package } from './types'
import packages from './functions/get-packages'

const removeWebStagingDeployment = async (pkg: Package, pullNumber: number) => {
	try {
		if (!pullNumber) throw Error('No PR number')
		const slotName = pullNumber
		const stagName = `${pkg.id}stag`

		await exec('az extension add --name storage-preview').catch()
		await exec(
			`az storage blob directory delete --account-name ${pkg.id}stag --container-name \\$web --directory-path ${slotName} --auth-mode key --recursive`,
		)
		console.log(`Deleted web app: ${stagName}-${slotName}`)
	} catch (err) {
		throw Error(err)
	}
}

const removeFuncAppStagingDeployment = async (
	pkg: Package,
	pullNumber: number,
) => {
	try {
		if (!pullNumber) throw Error('No PR number')
		const slotName = `stag-${pullNumber}`

		const { stdout: deleteOut, stderr: deleteErr } = await exec(
			`az functionapp deployment slot delete -g ${pkg.resourceGroup} -n ${pkg.id} --slot ${slotName}`,
		)
		if (deleteErr) console.log(deleteOut, deleteErr)
		console.log(`Deleted function app: ${pkg.id}-${slotName}`)
	} catch (err) {
		throw Error(err)
	}
}

const removeResources = async (
	localConfig: Package[],
	subsId: string,
	prNumber: number,
) => {
	console.log('\nSetting the subscription for creating services...')
	await exec(`az account set --subscription ${subsId}`)
	console.log(`subscription set to ${subsId}`)

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
	const groupBySubscription = packages.reduce(
		(acc: Record<string, Package[]>, item) => {
			acc[item.subscriptionId] = [...(acc[item.subscriptionId] || []), item]
			return acc
		},
		{},
	)

	for (const subsId of Object.keys(groupBySubscription)) {
		await removeResources(groupBySubscription[subsId], subsId, prNumber)
	}
}

export default cleanDeployments
