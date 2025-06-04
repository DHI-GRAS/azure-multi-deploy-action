import * as core from '@actions/core'
import * as github from '@actions/github'
import chalk from 'chalk'
import { exec } from 'child-process-promise'
import ora from 'ora'
import createServices from './create-services'
import deployToProd from './deploy-main'
import deployToStag from './deploy-pr-staging'
import azLogin from './functions/az-login'
import postComment from './functions/post-comment'
import cleanDeployments from './pr-close-cleanup'

const { context } = github
const { payload } = context

const defaultBranch = payload.repository?.default_branch
const splitRef = context.ref.split('/')
// may not be correct in PRs
const currentBranch = splitRef[splitRef.length - 1]

const isPR = context.eventName === 'pull_request'
const prNumber = payload.pull_request?.number ?? 0
chalk.level = 1

const run = async () => {
	const startTime = new Date()
	const AzureCliInstallSpinner = ora(
		`${chalk.bold.cyan('1. Installing azure CLI...'.toUpperCase())}`,
	).start()

	// await exec('curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash')
	// Use the below version in case specific version has to be installed
	await exec(`
		sudo apt-get update ;
		sudo apt-get install ca-certificates curl apt-transport-https lsb-release gnupg ;
		curl -sL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/microsoft.gpg > /dev/null ;
		AZ_REPO=$(lsb_release -cs) ;
		echo "deb [arch=amd64] https://packages.microsoft.com/repos/azure-cli/ $AZ_REPO main" | sudo tee /etc/apt/sources.list.d/azure-cli.list ;
		sudo apt-get update ;
		sudo apt-get install azure-cli=2.73.0-1~${AZ_REPO} --allow-downgrades
	`)
	AzureCliInstallSpinner.succeed()
	const AzureCliLoginSpinner = ora(
		`${chalk.bold.cyan('2. Logging into Azure CLI...'.toUpperCase())}`,
	).start()
	await azLogin()
	AzureCliLoginSpinner.succeed()

	if (payload.pull_request?.state !== 'closed') {
		const CreatingServicesSpinner = ora(
			`${chalk.bold.cyan('3. Creating missing services...'.toUpperCase())}`,
		).start()
		await createServices(prNumber)
		CreatingServicesSpinner.succeed()
	}
	// Deploy to stag
	if (isPR && payload.pull_request?.state === 'open') {
		console.log('\n')
		console.log(
			`${chalk.bold.cyan('4. Deploying to staging...'.toUpperCase())}`,
		)
		await deployToStag(prNumber)
	}

	// Deploy to prod
	const preventProdDeploy = core.getInput('preventProdDeploy')
	if (preventProdDeploy && currentBranch === defaultBranch) {
		const errorMsg = `${chalk.bold.yellow(
			'Info',
		)}: Production deployment skipped! Code quality checks have failed`
		console.error(errorMsg)
		core.setFailed(errorMsg)
	}

	if (
		!payload.pull_request &&
		currentBranch === defaultBranch &&
		!preventProdDeploy
	) {
		console.log('\n')
		console.log(
			`${chalk.bold.cyan('4. Deploying to production...').toUpperCase()}`,
		)
		await deployToProd()
	}

	if (isPR && payload.pull_request?.state === 'closed') {
		console.log(
			`${chalk.bold
				.cyan('3. PR closed. Cleaning up deployments...')
				.toUpperCase()}`,
		)
		await cleanDeployments(prNumber)
	}

	console.log(
		`${chalk.bold.green('Success')}: You are lucky, the action finished! 🍀`,
	)

	if (isPR) {
		await postComment(startTime)
	}
}

void run().catch((err) => {
	console.log('Global catch block', err)

	const message: string = err.message || JSON.stringify(err)
	core.setFailed(`Action failed, error: ${message}`)
})
