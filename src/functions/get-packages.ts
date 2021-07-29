import fs from 'fs'
import path from 'path'
import { Packages, Package, PackageJSON } from '../types'

const packageTypes = ['apps', 'func-apis'] as const

const appRequiredFields = ['name', 'id', 'resourceGroup']
const apiRequiredFields = [...appRequiredFields, 'storageAccount']

const getPackageObject = (
	pkgDir: string,
	pkgType: typeof packageTypes[number],
): Package => {
	const fullPath = path.resolve(path.join(pkgType, pkgDir))

	const packageFile = fs.readFileSync(
		path.join(fullPath, 'package.json'),
		'utf8',
	)
	const pkgObj = JSON.parse(packageFile) as PackageJSON

	const propertiesFromPkgJson = (
		pkgType === 'apps' ? appRequiredFields : apiRequiredFields
	).reduce((fieldAcc, field) => {
		const fieldValue = pkgObj[field]
		if (!fieldValue)
			throw Error(`"${field}" is required in ${fullPath}/package.json`)
		return { ...fieldAcc, [field]: fieldValue }
	}, {}) as Omit<Package, 'type'>

	// Enforce only lowecase letters for storage account syntax
	const lowercaseRe = /^[a-z]+$/
	if (
		pkgType === 'apps' &&
		lowercaseRe.exec(pkgObj.id)?.[0].length !== pkgObj.id?.length
	)
		throw Error(
			`"id" field in ${fullPath}/package.json must be all lowercase, only letters`,
		)
	return {
		...propertiesFromPkgJson,
		type: pkgType.substring(0, pkgType.length - 1) as Package['type'],
		path: fullPath,
	}
}

const getMonorepoPackages = () =>
	packageTypes.reduce((acc, pkgType) => {
		if (!fs.existsSync(path.join(pkgType))) return acc
		const pkgDirs = fs
			.readdirSync(path.join(pkgType), { withFileTypes: true })
			.filter((item) => item.isDirectory())
			.map((item) => item.name) // needs to be absolute - currently is app dir name like altimetry-app

		const packagesByType: Packages = pkgDirs.map((pkgDir) =>
			getPackageObject(pkgDir, pkgType),
		)
		return [...acc, ...packagesByType]
	}, [])

const isMonorepo = packageTypes
	.map((pkg) => fs.existsSync(path.join(pkg)))
	.includes(true)

console.log(
	isMonorepo ? 'Repository is monorepo' : 'Repository is single web app',
)
const packages = isMonorepo
	? getMonorepoPackages()
	: [getPackageObject('.', 'apps')]
export default packages
