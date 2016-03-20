import Resource from './Resource.es6.js';


export default class CanonicalTree extends Resource {

	static ENDPOINT = 'canonicalTrees';

	constructor(data) {
		super(data);
	}

}
