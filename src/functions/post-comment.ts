import * as core from '@actions/core'
import * as github from '@actions/github'
import fs from 'fs'
import path from 'path'

const { context } = github
const { payload } = context

export default async (): Promise<void> => {
	const token = core.getInput('githubToken', { required: true })

	const octokit = github.getOctokit(token)

	const prNumber = payload.pull_request?.number
	const repo = payload.repository?.full_name
	const owner = payload.repository?.owner.name
	if (!prNumber || !repo || !owner) return

	// Writing to text file was a workaround, could now be done better (eventually)
	const body = String(fs.readFileSync(path.join('github_message.txt')))

	await octokit.rest.issues.createComment({
		issue_number: prNumber,
		repo,
		owner,
		body,
	})
}
