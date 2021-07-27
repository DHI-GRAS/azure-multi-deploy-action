import { exec } from 'child-process-promise'
import { join } from 'path'
import { PackageWithName } from '../types'

const mdLinebreak = '<br/>'
const msgFile = join(__dirname, '../../../../', 'github_message.txt')

export default async (
	pkg: PackageWithName,
	pullNumber: number,
): Promise<void> => {
	try {
		if (!pullNumber) throw Error('PR number is undefined')
		const slotName = pullNumber
		const stagName = `${pkg.id}stag`

		const path = join(__dirname, `${pkg.type}s`, pkg.name)

		console.log(`Building webapp: ${pkg.name}`)
		const { stdout, stderr } = await exec(
			`cd ${path} && STAG_SLOT=${slotName} yarn ${pkg.name}:build`,
		)
		if (stderr) console.log(stderr)

		console.log(stdout)
		console.log(`Build finished, uploading webapp: ${pkg.name}`)

		await exec('az extension add --name storage-preview').catch()
		const { stdout: uploadOut } = await exec(
			`cd ${path}/dist/ && az storage azcopy blob upload --container \\$web --account-name ${stagName} --source ./\\* --destination ${slotName} --auth-mode key`,
		).catch((err) => {
			throw Error(err)
		})
		console.log(uploadOut)

		// Don't think the deployment url gets returned from upload - hopefully this stays static?
		const deployMsg = `✅ Deployed web app **${pkg.name}** on: https://${stagName}.z16.web.core.windows.net/${slotName} ${mdLinebreak}`
		await exec(`echo "${deployMsg}" >> ${msgFile}`)

		console.log(deployMsg)
	} catch (err) {
		const deployMsg = `❌ Deployment of web app **${pkg.id}** failed. See CI output for details ${mdLinebreak}`
		await exec(`echo "${deployMsg}" >> ${msgFile}`)
		console.log(err)
	}
}
