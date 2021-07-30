// import * as core from '@actions/core'
import * as github from '@actions/github'
import { exec } from 'child-process-promise'
import fs from 'fs'
import path from 'path'
import { intervalToDuration } from 'date-fns'
import deployToStag from './deploy-pr-staging'
import deployToProd from './deploy-main'
import cleanDeployments from './pr-close-cleanup'
import createServices from './create-services'
import azLogin from './functions/az-login'
import postComment from './functions/post-comment'

const { context } = github
const { payload } = context

const branch = payload.pull_request?.head.ref
const defaultBranch = payload.repository?.default_branch

const isPR = context.eventName === 'pull_request'
const prNumber = payload.pull_request?.number ?? 0

console.log(branch, defaultBranch, context.eventName, payload.action)

const run = async () => {
	const start = new Date()

	console.log('Installing azure CLI...')
	await exec('curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash')

	await azLogin()
	await createServices()

	if (
		isPR &&
		payload.action === 'synchronize' &&
		payload.pull_request?.state === 'open'
	) {
		console.log('Deploying to staging...')
		await deployToStag(prNumber)
	}

	if (branch === defaultBranch) {
		console.log('Deploying to production...')
		await deployToProd()
	}

	// Append run stats to comment file
	const end = new Date()
	const { minutes, seconds } = intervalToDuration({
		start,
		end,
	})
	const durationMessage = `\n#### Stats  \n🕐 Took ${String(minutes)}m${String(
		seconds,
	)}s`
	console.log(durationMessage)

	fs.appendFileSync(path.join('github_message.txt'), durationMessage)

	if (isPR) await postComment()

	if (payload.action === 'close' && isPR) {
		console.log('PR closed. Cleaning up deployments...')
		cleanDeployments(prNumber)
	}
}

void run()
