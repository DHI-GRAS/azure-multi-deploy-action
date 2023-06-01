import { exec } from 'child-process-promise'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'
import { Package } from '../types'

chalk.level = 1
const msgFile = path.join('github_message.txt')

interface DeploymentSlot {
	name: string
}
type DeploymentSlots = DeploymentSlot[]

export default async (pkg: Package, pullNumber: number): Promise<void> => {
	try {
		const { stdout: listOut, stderr: listErr } = await exec(
			`az functionapp deployment slot list -g ${pkg.resourceGroup} -n ${pkg.id}`,
		)
		if (listErr) {
			throw new Error(listErr)
		}

		const slots = JSON.parse(listOut) as DeploymentSlots

		if (!pullNumber) {
			throw new Error(
				`${chalk.bold.red(
					'Error',
				)}: The environment variable GITHUB_PR_NUMBER must be defined`,
			)
		}

		const slotName = `stag-${pullNumber}`
		const slotNames = slots.map((slot) => slot.name)
		const slotExists = slotNames.includes(slotName)

		if (!slotExists) {
			const { stderr: createErr } = await exec(
				`az functionapp deployment slot create -g ${pkg.resourceGroup} -n ${pkg.id} --slot ${slotName}`,
			)

			if (createErr) {
				throw new Error(createErr)
			}
		}

		const pkgPathSplit = pkg.path.split('/')
		const pkgDirname = pkgPathSplit[pkgPathSplit.length - 1]

		// Has to be built with dev deps, then zipped with unhoisted prod deps
		const { stderr: buildErr } = await exec(`
		cd ${pkg.path} &&
		yarn build ;
		cp -r -L ../${pkgDirname} ../../../ &&
		cd ../../../${pkgDirname} &&
		rm -rf node_modules &&
		yarn install --production ;
		zip -r -b ../ ${pkg.path}/dist.zip . > /dev/null ; echo "zipped to ${pkg.path}/dist.zip"`)

		// We don't throw error here because err could include warnings
		if (buildErr) {
			console.log(buildErr)
		}

		const { stdout: uploadOut, stderr: uploadErr } = await exec(
			`cd ${pkg.path} && az functionapp deployment source config-zip -g ${pkg.resourceGroup} -n ${pkg.id} --src dist.zip --slot ${slotName}`,
		)
		if (uploadErr) {
			console.log(uploadErr, uploadOut)
			throw new Error(uploadErr)
		}

		console.log(
			`${chalk.bold.green('Success')}: Deployed functionapp ${chalk.bold(
				`${pkg.id}-${slotName}`,
			)}`,
		)

		// I don't think the deployment url gets returned from upload - hopefully this stays static?
		const deployMsg = `\n✅ Deployed functions app **${pkg.id}** on: https://${pkg.id}-${slotName}.azurewebsites.net/api/`
		console.log(deployMsg)
		fs.appendFileSync(msgFile, deployMsg)
	} catch (err) {
		const deployMsg = `\n❌ Deployment of functions app **${pkg.id}** failed. See CI output for details  `
		fs.appendFileSync(msgFile, deployMsg)
		console.error(err)
	}
}
