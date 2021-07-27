export interface Package {
	label: string
	id: string
	resourceGroup: string
	type: 'app' | 'func-api' | 'lib'
	storageAccount?: string
}

export type Packages = Package[]
export type PackageConfig = Record<string, Package>

export interface PackageWithName extends Package {
	name: string
}
export type PackagesWithName = PackageWithName[]

export interface FunctionApp {
	name: string
	defaultHostName: string
}
export type FunctionApps = FunctionApp[]

export interface StorageAccount {
	name: string
	resourceGroup: string
	primaryEndpoints: {
		web: string
		blob: string
	}
}

export type StorageAccounts = StorageAccount[]
