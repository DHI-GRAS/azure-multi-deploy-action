import { exec } from 'child-process-promise'
import * as github from '@actions/github'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'
import { Package } from '../types'

const msgFile = path.join('github_message.txt')

const commitSha = github.context.sha.substr(0, 7)
chalk.level = 1
export default async (pkg: Package, pullNumber: number): Promise<void> => {
	try {
		if (!pullNumber)
			throw Error(`${chalk.bold.red('Error')}: PR number is undefined`)
		const slotName = pullNumber
		const stagName = `${pkg.id}stag`

		console.log(
			`${chalk.bold.blue('Info')}: Building webapp: ${chalk.bold(pkg.name)}`,
		)
		const { stdout, stderr } = await exec(
			`cd ${pkg.path} && STAG_SLOT=${slotName} COMMIT_SHA=${commitSha} yarn ${pkg.name}:build`,
		)
		if (stderr) console.log(stderr, stdout)

		console.log(
			`${chalk.bold.blue(
				'Info',
			)}: Build finished, uploading webapp: ${chalk.bold(pkg.name)}`,
		)

		await exec('az extension add --name storage-preview').catch()

		const outputDir = pkg.outputDir ?? './dist'

		const { stdout: uploadOut, stderr: uploadErr } = await exec(
			`cd ${pkg.path}/ && az storage blob upload-batch --source ${outputDir} --destination \\$web/${slotName} --account-name ${stagName} --auth-mode key --overwrite`,
		).catch((err) => {
			throw Error(err)
		})
		if (stdout) console.log(uploadOut, uploadErr)

		// Don't think the deployment url gets returned from upload - hopefully this stays static?
		const deployMsg = `\n✅ Deployed web app **${pkg.name}** on: https://${stagName}.z16.web.core.windows.net/${slotName}  `
		fs.appendFileSync(msgFile, deployMsg)

		console.log(deployMsg)
	} catch (err) {
		const deployMsg = `\n❌ Deployment of web app **${pkg.id}** failed. See CI output for details  `
		fs.appendFileSync(msgFile, deployMsg)
		console.log(deployMsg, err)
	}
}
