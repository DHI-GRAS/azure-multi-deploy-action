import * as core from '@actions/core'
import * as github from '@actions/github'
import fs from 'fs'
import path from 'path'
import { intervalToDuration } from 'date-fns'

const {
	context: {
		issue: { number },
		repo: { repo, owner },
	},
} = github

const messageFile = 'github_message.txt'

export default async (startTime: Date): Promise<void> => {
	try {
		const token = core.getInput('githubToken', { required: true })
		const octokit = github.getOctokit(token)
		// Append run stats to comment file
		fs.appendFileSync(path.join(messageFile), '\n##### Stats')
		const endTime = new Date()
		const { minutes, seconds } = intervalToDuration({
			start: startTime,
			end: endTime,
		})
		const durationMessage = `\n🕐 Took ${String(minutes)}m${String(seconds)}s`
		console.log(durationMessage)

		const preventProdDeploy = core.getInput('preventProdDeploy')
		if (preventProdDeploy)
			fs.appendFileSync(
				messageFile,
				'\n⚠️ Code quality checks have failed - see CI for details. Production deployment may be skipped.',
			)
		fs.appendFileSync(path.join(messageFile), durationMessage)

		// Writing to text file was a workaround, could now be done better (eventually)
		const body = String(fs.readFileSync(path.join(messageFile)))

		await octokit.rest.issues.createComment({
			issue_number: number,
			repo,
			owner,
			body,
		})
	} catch (err) {
		throw Error(err)
	}
}
