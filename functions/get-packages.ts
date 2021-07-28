import fs from 'fs'
import path from 'path'
import { Packages, Package, PackageJSON } from '../types'

const packageTypes = ['apps', 'func-apis'] as const

const appRequiredFields = ['name', 'id', 'resourceGroup']
const apiRequiredFields = [...appRequiredFields, 'storageAccount']

const isMonorepo = packageTypes
	.map((pkg) => fs.existsSync(path.join(pkg)))
	.includes(true)

const getPackageObject = (
	pkgDir: string,
	pkgType: typeof packageTypes[number],
) => {
	const packageFile = fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')
	const pkgObj = JSON.parse(packageFile) as PackageJSON
	if (pkgObj?.private === true)
		throw Error(
			'Excluding publishable packages with the "private" field is not yet supported. Remove it to run the action.',
		)

	const propertiesFromPkgJson = (
		pkgType === 'apps' ? appRequiredFields : apiRequiredFields
	).reduce((fieldAcc, field) => {
		const fieldValue = pkgObj[field]
		if (!fieldValue)
			throw Error(`"${field}" is required in ${pkgDir}/package.json`)
		return { ...fieldAcc, [field]: fieldValue }
	}, {}) as Omit<Package, 'type'>

	const lowercaseRe = /[a-z]/
	if (lowercaseRe.exec(pkgObj.id)?.length !== pkgObj.id?.length)
		throw Error(
			`"id" field in ${pkgType}/package.json must be all lowercase, only letters`,
		)

	return [
		{
			type: pkgType.substring(0, pkgType.length - 1) as Package['type'],
			...propertiesFromPkgJson,
		},
	]
}

const getMonorepoPackages = () =>
	packageTypes.reduce((acc, pkgType) => {
		if (!fs.existsSync(path.join(pkgType))) return acc
		const pkgDirs = fs
			.readdirSync(path.join(pkgType), { withFileTypes: true })
			.filter((item) => item.isDirectory())
			.map((item) => item.name)

		const packagesByType: Packages[] = pkgDirs.map((pkgDir) =>
			getPackageObject(pkgDir, pkgType),
		)
		return [...acc, ...packagesByType.join()] as unknown as Packages
	}, [])

console.log(
	isMonorepo ? 'Repository is monorepo' : 'Repository is single web app',
)
const packages = isMonorepo
	? getMonorepoPackages()
	: [getPackageObject('.', 'apps')]
export default packages
