import { exec } from 'child-process-promise'
import { join } from 'path'
import { PackageWithName } from '../types'

const mdLinebreak = '<br/>'
const msgFile = join(__dirname, '../../../../', 'github_message.txt')

interface DeploymentSlot {
	name: string
}
type DeploymentSlots = DeploymentSlot[]

export default async (
	pkg: PackageWithName,
	pullNumber: number,
): Promise<void> => {
	try {
		const { stdout: listOut, stderr: listErr } = await exec(
			`az functionapp deployment slot list -g ${pkg.resourceGroup} -n ${pkg.id}`,
		)
		if (listErr) throw Error(listErr)
		const slots = JSON.parse(listOut) as DeploymentSlots

		if (!pullNumber)
			throw Error('The environment variable GITHUB_PR_NUMBER must be defined')

		const slotName = `stag-${pullNumber}`

		const slotNames = slots.map((slot) => slot.name)
		const slotExists = slotNames.includes(slotName)

		if (!slotExists) {
			await exec(
				`az functionapp deployment slot create -g ${pkg.resourceGroup} -n ${pkg.id} --slot ${slotName}`,
			)
		}

		console.log('func', slotExists, slots)

		const path = join(
			__dirname,
			'../',
			'../',
			'../',
			'../',
			`${pkg.type}s`,
			pkg.name,
		)
		await exec(`cd ${path} && yarn build ; zip -r dist.zip *`)

		const { stdout: uploadOut, stderr: uploadErr } = await exec(
			`cd ${path} && az functionapp deployment source config-zip -g ${pkg.resourceGroup} -n ${pkg.id} --src dist.zip --slot ${slotName}`,
		)
		if (uploadErr) console.log(uploadErr)

		console.log(uploadOut)
		console.log(`Deployed functionapp ${pkg.id}-${slotName}`)

		// Don't think the deployment url gets returned from upload - hopefully this stays static?
		const deployMsg = `✅ Deployed functions app **${pkg.id}** on: https://${pkg.id}-${slotName}.azurewebsites.net/api/ ${mdLinebreak}`
		console.log(msgFile)
		await exec(`echo "${deployMsg}" >> ${msgFile}`)
	} catch (err) {
		const deployMsg = `❌ Deployment of functions app **${pkg.id}** failed. See CI output for details ${mdLinebreak}`
		await exec(`echo "${deployMsg}" >> ${msgFile}`)
		console.error(err)
	}
}
