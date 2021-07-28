// import * as core from '@actions/core'
import * as github from '@actions/github'
import { exec, execSync } from 'child_process'
import deployToStag from './deploy-pr-staging'
import deployToProd from './deploy-main'
import cleanDeployments from './pr-close-cleanup'
import createServices from './create-services'

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

	await createServices()

	if (
		isPR &&
		payload.action === 'synchronize' &&
		payload.pull_request?.state === 'open'
	) {
		console.log('Deploying to staging')

		void deployToStag(prNumber)
	}

	if (branch === defaultBranch) {
		console.log('Deploying to production')
		void deployToProd()
	}

	if (payload.action === 'close' && isPR) {
		console.log('PR closed. Cleaning up deployments')
		cleanDeployments(prNumber)
	}
}

void run()