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

const cleanDeployments = (prNumber: number): void => {
	const webPackages = packages.filter((pkg) => pkg.type === 'app')
	const funcPackages = packages.filter((pkg) => pkg.type === 'func-api')

	void Promise.all(webPackages.map(removeWebStagingDeployment, prNumber))
	void Promise.all(funcPackages.map(removeFuncAppStagingDeployment, prNumber))
}

export default cleanDeployments
