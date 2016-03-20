import Resource from './Resource.es6.js';


export default class ProcessType extends Resource {

	static ENDPOINT = 'processTypes';

	constructor(data) {
		super(data);
	}

}
