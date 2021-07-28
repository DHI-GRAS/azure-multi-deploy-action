export interface Package {
	name: string
	id: string
	resourceGroup: string
	type: 'app' | 'func-api' | 'lib'
	storageAccount?: string
}

export type Packages = Package[]

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

export interface PackageJSON {
	dependencies: Record<string, string>
	devDependencies: Record<string, string>
	private: boolean
	id: string
	resourceGroup: string
	storageAccount: string
}
