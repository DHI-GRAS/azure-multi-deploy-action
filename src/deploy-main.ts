import { exec } from 'child-process-promise'
import * as github from '@actions/github'
import chalk from 'chalk'
import { Package } from './types'
import getChangedPackages from './functions/get-changed-packages'
import groupBySubscription from './functions/group-by-subscription'

const commitSha = github.context.sha.substr(0, 7)
chalk.level = 1

const deployWebApp = async (pkg: Package) => {
	console.log(
		`${chalk.bold.blue('Info')}: Building webapp: ${chalk.bold(pkg.name)}`,
	)
	const { stdout, stderr } = await exec(
		`cd ${pkg.path} && COMMIT_SHA=${commitSha} yarn ${pkg.name}:build`,
	)
	const outputDir = pkg.outputDir ?? './dist'
	if (stderr) {
		console.log(stderr, stdout)
	}

	console.log(
		`${chalk.bold.blue('Info')}: Build finished, uploading webapp: ${chalk.bold(
			pkg.name,
		)}`,
	)

	await exec('az extension add --name storage-preview')

	await exec(
		`cd ${pkg.path}/ && az storage blob upload-batch --source ${outputDir} --destination \\$web --account-name ${pkg.id} --auth-mode key --overwrite`,
	)

	console.log(
		`${chalk.bold.green('Success')}: Deployed storage account ${chalk.bold(
			pkg.id,
		)} on https://${pkg.id}.z16.web.core.windows.net`,
	)
}

const deployFuncApp = async (pkg: Package) => {
	try {
		const pkgPathSplit = pkg.path.split('/')
		const pkgDirname = pkgPathSplit[pkgPathSplit.length - 1]

		console.log(
			`${chalk.bold.blue('Info')}: Deploying functionapp: ${chalk.bold(
				pkg.name,
			)}`,
		)
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

		if (uploadErr) {
			console.log(uploadErr)
			throw new Error(uploadErr)
		}

		console.log(
			`${chalk.bold.green('Success')}: Deployed functionapp: ${chalk.bold(
				pkg.id,
			)}`,
		)
	} catch (err) {
		console.log(
			`${chalk.bold.red('Error')}: Could not deploy ${pkg.id} - ${String(err)}`,
		)
	}
}

const createMissingResources = async (
	localConfig: Package[],
	subscriptionId: string,
) => {
	console.log('\n')
	console.log(
		`${chalk.bold.blue(
			'Info',
		)}: Setting the subscription for production deployment...`,
	)
	const { stderr } = await exec(
		`az account set --subscription ${subscriptionId}`,
	)

	if (stderr) {
		throw new Error(stderr)
	}

	console.log(
		`${chalk.bold.green('Success')}: subscription set to ${chalk.bold(
			subscriptionId,
		)}`,
	)

	const webPackages = localConfig.filter((pkg) => pkg.type === 'app')
	const funcPackages = localConfig.filter((pkg) => pkg.type === 'func-api')

	const allPackages = [...webPackages, ...funcPackages]

	for (const pkg of allPackages) {
		if (pkg.type === 'app') {
			await deployWebApp(pkg)
		}

		if (pkg.type === 'func-api') {
			await deployFuncApp(pkg)
		}
	}
}

const deployToProd = async (): Promise<void> => {
	const changedPackages = await getChangedPackages()

	const azureResourcesBySubId = groupBySubscription(changedPackages)

	for (const subsId of Object.keys(azureResourcesBySubId)) {
		await createMissingResources(azureResourcesBySubId[subsId], subsId)
	}
}

export default deployToProd
