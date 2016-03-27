import _ from 'lodash';

import Resource        from './Resource.es6.js';
import LyphTemplate    from './LyphTemplate.es6.js';
import ResourceFetcher from './ResourceFetcher.es6.js';


const levels = Symbol('levels');


export default class CanonicalTree extends Resource {

	static ENDPOINT = 'canonicalTrees';

	constructor(data) {
		super(data);

		let resourceFetcher = new ResourceFetcher;
		this[levels] = _(resourceFetcher.getResource_sync('canonicalTreeLevel', this.levels)).sortBy('position').map((level) => {
			level._template = LyphTemplate.get_sync([level.template])[0];
			level.getLyphTemplate = () => level._template;
			return level;
		}).value();
	}

	getLevels() {
		return this[levels];
	}

}

