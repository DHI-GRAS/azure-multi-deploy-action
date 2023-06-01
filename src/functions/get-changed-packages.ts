import fs from 'fs'
import path from 'path'
import { exec } from 'child-process-promise'
import chalk from 'chalk'
import { Packages, Package, PackageJSON } from '../types'
import packages from './get-packages'

chalk.level = 1
// Would be better to determine changed packages by imports, not changed dirs - to be implemented
export default async (): Promise<Packages> => {
	const { stdout: branchName, stderr: branchErr } = await exec(
		`git branch --show-current`,
	)

	if (branchErr) {
		throw new Error(branchErr)
	}

	const deployablePkgs = packages.filter(
		(pkg) => (pkg.type === 'app' || pkg.type === 'func-api') && !pkg.ignore,
	)

	if (branchName.trim() === 'main') {
		return deployablePkgs
	}

	await exec('git fetch --all')

	const checkChanged = async (pkg: Package) => {
		const { stdout: diffOut, stdout: diffErr } = await exec(
			`git diff --quiet origin/main HEAD -- ${path.join(pkg.path)} || echo ${pkg.id
			} changed`,
		)

		if (diffErr) {
			console.log('git diff errored', diffErr)
		}

		return diffOut.includes(`${pkg.id} changed`) ? pkg : null
	}

	const changedPromises = packages
		.filter((pckg) => !pckg.ignore)
		.map(checkChanged)
	const changedDiffPackages = (await Promise.all(changedPromises)).filter(
		(item) => item,
	) as Packages

	const changedLibPackeges = changedDiffPackages.filter(
		(pkg) => pkg.type === 'lib',
	)

	const libDepPackages = packages.filter((pkg) => pkg.type === 'app')
	const changedPackagesWithLibDeps = libDepPackages.filter((pkg) => {
		const pkgPackageFile = fs.readFileSync(
			path.join(pkg.path, 'package.json'),
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
	] as Packages

	const changedPackageIdString = changedPackages.map((pkg) => pkg.id).join(', ')

	console.log(
		`${chalk.bold.blue('Info')}: Changed packages: ${chalk.bold(
			changedPackageIdString,
		)}`,
	)

	return changedPackages
}
