import { exec } from 'child-process-promise'
import * as github from '@actions/github'
import { Package } from './types'
import getChangedPackages from './functions/get-changed-packages'

const commitSha = github.context.sha.substr(0, 7)

const deployWebApp = async (pkg: Package) => {
	console.log(`Building webapp: ${pkg.name}`)
	const { stdout, stderr } = await exec(
		`cd ${pkg.path} && COMMIT_SHA=${commitSha} yarn ${pkg.name}:build`,
	)
	const outputDir = pkg.outputDir ?? './dist'
	if (stderr) console.log(stderr, stdout)

	console.log(`Build finished, uploading webapp: ${pkg.name}`)

	await exec('az extension add --name storage-preview').catch()
	await exec(
		`cd ${pkg.path}/ && az storage blob upload-batch --source ${outputDir} --destination \\$web --account-name ${pkg.id} --auth-mode key --overwrite`,
	)
		.then(() => console.log(`Deployed storage account ${pkg.id}`))
		.catch((err) => {
			throw Error(err)
		})
}

const deployFuncApp = async (pkg: Package) => {
	try {
		const pkgPathSplit = pkg.path.split('/')
		const pkgDirname = pkgPathSplit[pkgPathSplit.length - 1]

		console.log(`Deploying functionapp: ${pkg.name}`)
		await exec(`
		cd ${pkg.path} &&
		yarn build ;
		cp -r -L ../${pkgDirname} ../../../ &&
		cd ../../../${pkgDirname} &&
		rm -rf node_modules &&
		yarn install --production &&
		zip -r ${pkg.path}/dist.zip . > /dev/null`)

		const { stderr: uploadErr } = await exec(
			`cd ${pkg.path} && az functionapp deployment source config-zip -g ${pkg.resourceGroup} -n ${pkg.id} --src dist.zip`,
		)

		if (uploadErr) console.log(uploadErr)
		console.log(`Deployed functionapp: ${pkg.id}`)
	} catch (err) {
		console.log(`ERROR: could not deploy ${pkg.id} - ${String(err)}`)
	}
}

const createMissingResources = async (
	localConfig: Package[],
	subscriptionId: string,
) => {
	console.log('\nSetting the subscription for production deployment...')
	await exec(`az account set --subscription ${subscriptionId}`)
	console.log(`subscription set to ${subscriptionId}`)
	const webPackages = localConfig.filter((pkg) => pkg.type === 'app')
	const funcPackages = localConfig.filter((pkg) => pkg.type === 'func-api')

	const allPackages = [...webPackages, ...funcPackages]

	for (const pkg of allPackages) {
		if (pkg.type === 'app') await deployWebApp(pkg)
		if (pkg.type === 'func-api') await deployFuncApp(pkg)
	}
}

const deployToProd = async (): Promise<void> => {
	const changedPackages = await getChangedPackages()

	const groupBySubscription = changedPackages.reduce(
		(acc: Record<string, Package[]>, item) => {
			acc[item.subscriptionId] = [...(acc[item.subscriptionId] || []), item]
			return acc
		},
		{},
	)

	for (const subsId of Object.keys(groupBySubscription)) {
		await createMissingResources(groupBySubscription[subsId], subsId)
	}
}

export default deployToProd
