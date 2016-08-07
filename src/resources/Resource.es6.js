import fromPairs  from 'lodash/fromPairs';
import at         from 'lodash/at';

import Resources from './ResourceFetcher.es6.js';
const resources = new Resources;

const cache = Symbol('cache');

export default class Resource {
	
	static get_sync(ids) {
		if (!this[cache]) { this[cache] = {} }
		let missingInCache = ids.filter(id => !this[cache][id]);
		if (missingInCache.length > 0) {
			let newResources = resources.getResource_sync(this.ENDPOINT, missingInCache)
			                       .map(data => [data.id, new this(data)]);
			Object.assign(this[cache], fromPairs(newResources));
		}
		return at(this[cache], ids);
	}

	static getAll_sync() {
		if (!this[cache]) { this[cache] = {} }
		let newResources = resources.getAllResources_sync()[this.ENDPOINT]
		                            .filter(({id}) => !this[cache][id])
		                            .map(data => [data.id, new this(data)]);
		Object.assign(this[cache], fromPairs(newResources));
		return Object.values(this[cache]);
	}

	constructor(data) {
		Object.assign(this, data);
	}

}
