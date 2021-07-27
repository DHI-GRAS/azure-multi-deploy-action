import { join } from 'path'
import { exec } from 'child-process-promise'
import getChangedPackages from './functions/getChangedPackages'
import deployWebApp from './functions/deployWebToStaging'
import deployFuncApp from './functions/deployFuncToStaging'

const msgFile = join(__dirname, '../../../', 'github_message.txt')

const deployToStag = async () => {
	const changedPackages = await getChangedPackages()

	const webPackages = changedPackages.filter((pkg) => pkg.type === 'app')
	const funcPackages = changedPackages.filter((pkg) => pkg.type === 'func-api')

	if (webPackages.length + funcPackages.length === 0) {
		const deployMsg = `ℹ️ No changed packages were detected`
		console.log(deployMsg)
		await exec(`echo "${deployMsg} <br />" >> ${msgFile}`)
	}

	for (const webApp of webPackages) await deployWebApp(webApp)
	for (const funcApp of funcPackages) await deployFuncApp(funcApp)
}

void deployToStag()
