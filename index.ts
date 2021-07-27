// import * as core from '@actions/core'
import * as github from '@actions/github'
import { exec, execSync } from 'child_process'
// import deployToStag from './deploy-pr-staging'
// import deployToProd from './deploy-main'
// import cleanDeployments from './pr-close-cleanup'
// import createServices from './create-services'

const { context } = github
const { payload } = context

const branch = payload.pull_request?.head.ref
const defaultBranch = payload.repository?.default_branch

const isPR = context.eventName === 'pull_request'
const prNumber = payload.pull_request?.number ?? 0

console.log(branch, defaultBranch, context.eventName, payload.action)

const run = async () => {
	exec('ls', (err, out) => {
		console.log(err, out)
	})

	// Ensure instances
	// await createServices()

	// in api pkgjson id, resourceGroup, storageAccount
	// app excludes storageAccount

	// PR Staging deploy
	if (
		isPR &&
		payload.action === 'synchronize' &&
		payload.pull_request?.state === 'open'
	) {
		// void deployToStag(prNumber)
	}

	// Production deploy
	// won't work
	if (branch === defaultBranch) {
		// void deployToProd()
	}

	// Remove PR deployments on close
	if (payload.action === 'close' && isPR) {
		// cleanDeployments(prNumber)
	}
}

void run()
