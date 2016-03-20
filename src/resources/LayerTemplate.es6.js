import Fraction from '../libs/fraction.es6.js';

import Resource     from './Resource.es6.js';
import LyphTemplate from './LyphTemplate.es6.js';


export default class LayerTemplate extends Resource {

	static ENDPOINT = 'layerTemplates';

	constructor(data) {
		super(data);
	}

	getLyphTemplate() {
		return LyphTemplate.get_sync(this.lyphTemplate);
	}

	getMaterials() {
		return LyphTemplate.get_sync(this.materials);
	}

	get representativeThickness() {
		if (!this.thickness) { return null }
		return Fraction(this.thickness.min+this.thickness.max).div(2);
	}

}
