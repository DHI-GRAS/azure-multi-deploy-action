import * as core from '@actions/core'
import * as github from '@actions/github'
import { exec } from 'child-process-promise'
import deployToStag from './deploy-pr-staging'
import deployToProd from './deploy-main'
import cleanDeployments from './pr-close-cleanup'
import createServices from './create-services'
import azLogin from './functions/az-login'
import postComment from './functions/post-comment'

const { context } = github
const { payload } = context

const defaultBranch = payload.repository?.default_branch
const splitRef = context.ref.split('/')
// may not be correct in PRs
const currentBranch = splitRef[splitRef.length - 1]

const isPR = context.eventName === 'pull_request'
const prNumber = payload.pull_request?.number ?? 0

const run = async () => {
	const startTime = new Date()

	console.log('Installing azure CLI...')
	await exec('curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash')

	// Use the below version in case specific version has to be installed
	// await exec(`
	// 	sudo apt-get update ;

	// 	sudo apt-get install ca-certificates curl apt-transport-https lsb-release gnupg ;

	// 	curl -sL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/microsoft.gpg > /dev/null ;

	// 	AZ_REPO=$(lsb_release -cs) ;

	// 	echo "deb [arch=amd64] https://packages.microsoft.com/repos/azure-cli/ $AZ_REPO main" | sudo tee /etc/apt/sources.list.d/azure-cli.list ;

	// 	sudo apt-get update ;
	// 	sudo apt-get install azure-cli=2.28.0-1~focal --allow-downgrades

	// `)

	await azLogin()
	await createServices()
	// Deploy to stag
	if (isPR && payload.pull_request?.state === 'open') {
		console.log('Deploying to staging...')
		await deployToStag(prNumber)
	}

	// Deploy to prod
	const preventProdDeploy = core.getInput('preventProdDeploy')
	if (preventProdDeploy && currentBranch === defaultBranch) {
		const errorMsg =
			'Production deployment skipped! Code quality checks have failed'
		console.error(errorMsg)
		core.setFailed(errorMsg)
	}

	if (
		!payload.pull_request &&
		currentBranch === defaultBranch &&
		!preventProdDeploy
	) {
		console.log('Deploying to production...')
		await deployToProd()
	}

	if (isPR && payload.pull_request?.state === 'closed') {
		console.log('PR closed. Cleaning up deployments...')
		await cleanDeployments(prNumber)
	}

	if (isPR) await postComment(startTime)
}

void run()
