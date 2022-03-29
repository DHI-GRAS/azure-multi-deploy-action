import { Package, Packages } from '../types'

export default (config: Packages): Record<string, Package[]> =>
	config
		// exclude libs as libs aren't an azure resource
		.filter((item: Package) => item.type !== 'lib')
		// group resources by subscription
		.reduce((acc: Record<string, Package[]>, item) => {
			acc[item.subscriptionId] = [...(acc[item.subscriptionId] || []), item]
			return acc
		}, {})
