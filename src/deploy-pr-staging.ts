import path from 'path'
import fs from 'fs'
import getChangedPackages from './functions/get-changed-packages'
import deployWebApp from './functions/deploy-web-to-staging'
import deployFuncApp from './functions/deploy-func-to-staging'

const deployToStag = async (prNumber: number): Promise<void> => {
	const changedPackages = await getChangedPackages()

	const webPackages = changedPackages.filter((pkg) => pkg.type === 'app')
	const funcPackages = changedPackages.filter((pkg) => pkg.type === 'func-api')

	if (webPackages.length + funcPackages.length === 0) {
		const deployMsg = `ℹ️ No changed packages were detected`
		console.log(deployMsg)
		const msgFile = path.join('github_message.txt')
		fs.appendFileSync(msgFile, `\n${deployMsg}  `)
	}

	for (const webApp of webPackages) await deployWebApp(webApp, prNumber)
	for (const funcApp of funcPackages) await deployFuncApp(funcApp, prNumber)
}

export default deployToStag
