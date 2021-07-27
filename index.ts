import * as core from '@actions/core'
import * as github from '@actions/github'
import deployToStag from './deploy-pr-staging'

const { context } = github
const { payload } = context

const branch = payload.head.ref
const defaultBranch = payload.repository?.default_branch

console.log(branch, defaultBranch, context.eventName, payload.action)

console.log(JSON.stringify(context))

// Ensure instances

// in api pkgjson id, resourceGroup, storageAccount
// app excludes storageAccount

// PR Staging deploy
if (
	context.eventName === 'pull_request' &&
	payload.action === 'synchronize' &&
	payload.pull_request?.state === 'open'
) {
	const prNumber = payload.pull_request?.number ?? 0
	// void deployToStag(prNumber)
}

if (branch === defaultBranch) console.log('is main')
