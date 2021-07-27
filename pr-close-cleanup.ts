import { exec } from 'child-process-promise'
import * as YAML from 'yaml'
import { readFileSync } from 'fs'
import { PackageConfig, Package } from './types'

const config = readFileSync('../../deploy-config.yml', 'utf8')

const removeWebStagingDeployment = async (pkg: Package, pullNumber: number) => {
	try {
		if (!pullNumber) throw Error('No PR number')
		const slotName = pullNumber
		const stagName = `${pkg.id}stag`

		await exec('az extension add --name storage-preview').catch()
		const { stdout: deleteOut } = await exec(
			`az storage blob directory delete --account-name ${pkg.id}stag --container-name \\$web --directory-path ${slotName} --auth-mode key --recursive`,
		)
		console.log(deleteOut)
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
		console.log(deleteOut, deleteErr)
		console.log(`Deleted function app: ${pkg.id}-${slotName}`)
	} catch (err) {
		throw Error(err)
	}
}

const cleanDeployments = (prNumber: number): void => {
	const configObj = YAML.parse(config) as PackageConfig
	const configArr = Object.values(configObj)

	const webPackages = configArr.filter((pkg) => pkg.type === 'app')
	const funcPackages = configArr.filter((pkg) => pkg.type === 'func-api')

	void Promise.all(webPackages.map(removeWebStagingDeployment, prNumber))
	void Promise.all(funcPackages.map(removeFuncAppStagingDeployment, prNumber))
}

export default cleanDeployments
