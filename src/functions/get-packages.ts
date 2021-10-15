import fs from 'fs'
import path from 'path'
import { Packages, Package, PackageJSON } from '../types'

const packageTypes = ['apps', 'func-apis', 'libs'] as const

const appRequiredFields = ['name', 'id', 'resourceGroup']
const appNotRequiredFields = ['outputDir']
const apiRequiredFields = [...appRequiredFields, 'storageAccount']

const pkgTypeRequiredFieldMap = {
	apps: appRequiredFields,
	'func-apis': apiRequiredFields,
	libs: [],
}

const getPackageObject = (
	pkgDir: string,
	pkgType: typeof packageTypes[number],
): Package => {
	const fullPath = path.resolve(
		path.join(pkgDir === '.' ? '.' : pkgType, pkgDir),
	)

	const packageFile = fs.readFileSync(
		path.join(fullPath, 'package.json'),
		'utf8',
	)
	const pkgObj = JSON.parse(packageFile) as PackageJSON

	const pkgRequiredFields: string[] = pkgTypeRequiredFieldMap[pkgType]

	const requiredPropertiesFromPkgJson = pkgRequiredFields.reduce(
		(fieldAcc, field) => {
			const fieldValue = pkgObj.azureDeployConfig?.[field]
			if (!fieldValue)
				throw Error(
					`"${field}" is required in ${fullPath}/package.json under the "azureDeployConfig" key`,
				)
			return { ...fieldAcc, [field]: fieldValue }
		},
		{},
	) as Omit<Package, 'type'>

	const notReqPropertiesFromPckJson = appNotRequiredFields.reduce(
		(fieldAcc, field) => {
			const fieldValue = pkgObj.azureDeployConfig?.[field]
			if (!fieldValue) return { ...fieldAcc }
			return { ...fieldAcc, [field]: fieldValue }
		},
		{},
	) as Omit<Package, 'type'>

	const propertiesFromPckJson = {
		...requiredPropertiesFromPkgJson,
		...notReqPropertiesFromPckJson,
	}

	// Enforce only lowecase letters for storage account syntax
	const lowercaseRe = /^[a-z0-9]{1,17}$/
	if (
		pkgType === 'apps' &&
		lowercaseRe.exec(pkgObj.azureDeployConfig.id)?.[0].length !==
			pkgObj.azureDeployConfig.id?.length
	)
		throw Error(
			`"id" field in ${fullPath}/package.json under the "azureDeployConfig" key must be all lowercase, max 17 charachters.`,
		)
	return {
		...propertiesFromPckJson,
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
			.map((item) => item.name)

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
