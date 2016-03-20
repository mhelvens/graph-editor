import Fraction from '../libs/fraction.es6.js';

import Resource from './Resource.es6.js';


export default class LayerTemplate extends Resource {

	static ENDPOINT = 'layerTemplates';

	constructor(data) {
		super(data);
	}

	get representativeThickness() {
		if (!this.thickness) { return null }
		return Fraction(this.thickness.min+this.thickness.max).div(2);
	}

}
