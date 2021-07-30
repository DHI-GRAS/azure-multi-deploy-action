import * as core from '@actions/core'
import * as github from '@actions/github'
import fs from 'fs'
import path from 'path'

const {
	context: {
		issue: { number },
		repo: { repo, owner },
	},
} = github

export default async (): Promise<void> => {
	const token = core.getInput('githubToken', { required: true })

	const octokit = github.getOctokit(token)

	// Writing to text file was a workaround, could now be done better (eventually)
	const body = String(fs.readFileSync(path.join('github_message.txt')))

	await octokit.rest.issues.createComment({
		issue_number: number,
		repo,
		owner,
		body,
	})
}
