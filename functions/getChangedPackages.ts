import { readFileSync } from 'fs'
import path from 'path'
import * as YAML from 'yaml'
import { exec } from 'child-process-promise'
import { PackagesWithName, PackageWithName, PackageConfig } from '../types'

const configYML = readFileSync('../../deploy-config.yml', 'utf8')
const config = YAML.parse(configYML) as PackageConfig

interface PackageJSON {
	dependencies: Record<string, string>
	devDependencies: Record<string, string>
}

export default async (): Promise<PackagesWithName> => {
	try {
		const packagesWithName = Object.keys(config).map((packageName) => ({
			name: packageName,
			...config[packageName],
		}))

		const { stdout: branchName, stderr: branchErr } = await exec(
			`git branch --show-current`,
		)
		if (branchErr) throw Error(branchErr)

		// TODO TEMPORARY while diff checking is dumb
		const deployablePkgs = packagesWithName.filter(
			(pkg) => pkg.type === 'app' || pkg.type === 'func-api',
		)
		if (branchName.trim() === 'main') return deployablePkgs

		const checkChanged = async (pkg: PackageWithName) => {
			const { stdout: diffOut, stdout: diffErr } = await exec(
				`git diff --quiet origin/main HEAD -- ${path.join(
					'..',
					'..',
					`${pkg.type}s`,
					pkg.name,
				)} || echo changed`,
			)
			if (diffErr) console.log(diffErr)

			return diffOut.includes('changed') ? pkg : null
		}

		const changedPromises = packagesWithName.map(checkChanged)
		const changedDiffPackages = (await Promise.all(changedPromises)).filter(
			(item) => item,
		) as PackagesWithName

		const changedLibPackeges = changedDiffPackages.filter(
			(pkg) => pkg.type === 'lib',
		)

		const libDepPackages = packagesWithName.filter((pkg) => pkg.type === 'app')
		const changedPackagesWithLibDeps = libDepPackages.filter((pkg) => {
			const pkgPackageFile = readFileSync(
				path.join('..', '..', `${pkg.type}s`, pkg.name, 'package.json'),
				'utf8',
			)

			const pkgPackageJson = JSON.parse(pkgPackageFile) as PackageJSON
			const pkgDeps = [
				...Object.keys(pkgPackageJson.dependencies),
				...Object.keys(pkgPackageJson.devDependencies),
			]
			return changedLibPackeges
				.map((libPkg) => pkgDeps.includes(libPkg.name))
				.includes(true)
		})

		const changedPackages = [
			...new Set([...changedPackagesWithLibDeps, ...changedDiffPackages]),
		] as PackagesWithName

		const changedPackageIdString = changedPackages
			.map((pkg) => pkg.id)
			.join(', ')
		console.log(`Changed packages: ${changedPackageIdString}`)

		return changedPackages
	} catch (err) {
		throw Error(err)
	}
}
