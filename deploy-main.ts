import { exec } from 'child-process-promise'
import { join } from 'path'
import { PackageWithName } from './types'
import getChangedPackages from './functions/getChangedPackages'

const deployWebApp = async (pkg: PackageWithName) => {
	const path = join(__dirname, '../', '../', '../', `${pkg.type}s`, pkg.name)

	console.log(`Building webapp: ${pkg.name}`)
	const { stdout, stderr } = await exec(`cd ${path} && yarn ${pkg.name}:build`)
	if (stderr) console.log(stderr)

	console.log(stdout)
	console.log(`Build finished, uploading webapp: ${pkg.name}`)

	await exec('az extension add --name storage-preview').catch()
	const { stdout: uploadOut } = await exec(
		`cd ${path}/dist/ && az storage azcopy blob upload --container \\$web --account-name ${pkg.id} --source ./\\* --auth-mode key`,
	).catch((err) => {
		throw Error(err)
	})
	console.log(uploadOut)
}

const deployFuncApp = async (pkg: PackageWithName) => {
	try {
		const path = join(__dirname, '../', '../', '../', `${pkg.type}s`, pkg.name)

		console.log(`Deploying functionapp: ${pkg.name}`)
		await exec(`cd ${path} && yarn build && zip -r dist.zip *`)

		const { stdout: uploadOut, stderr: uploadErr } = await exec(
			`cd ${path} && az functionapp deployment source config-zip -g ${pkg.resourceGroup} -n ${pkg.id} --src dist.zip`,
		)

		if (uploadErr) console.log(uploadErr)
		console.log(uploadOut)

		console.log(`Deployed functionapp: ${pkg.id}`)
	} catch (err) {
		console.log(`ERROR: could not deploy ${pkg.id} - ${String(err)}`)
	}
}

const deployToProd = async () => {
	const changedPackages = await getChangedPackages()

	const webPackages = changedPackages.filter((pkg) => pkg.type === 'app')
	const funcPackages = changedPackages.filter((pkg) => pkg.type === 'func-api')

	const allPackages = [...webPackages, ...funcPackages]

	for (const pkg of allPackages) {
		if (pkg.type === 'app') await deployWebApp(pkg)
		if (pkg.type === 'func-api') await deployFuncApp(pkg)
	}
}

void deployToProd()
