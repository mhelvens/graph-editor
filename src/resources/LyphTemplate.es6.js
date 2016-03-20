import Fraction, {sum} from '../libs/fraction.es6.js';
import get             from 'lodash/fp/get';
import identity        from 'lodash/fp/identity';

import Resource      from './Resource.es6.js';
import LayerTemplate from './LayerTemplate.es6.js';


const layerModels = Symbol('layerModels');


export default class LyphTemplate extends Resource {

	static ENDPOINT = 'lyphTemplates';

	constructor(data) {
		super(data);
	}

	getLayerTemplates() {
		if (!this[layerModels]) {
			this[layerModels] = LayerTemplate.get_sync(this.layers);
		}
		return this[layerModels];
	}

	get representativeThickness() {
		return this.averageLayerThickness * this.getLayerTemplates().length;
	}
	
	get averageLayerThickness() {
		let thicknessValues = this[layerModels].map(get('representativeThickness')).filter(identity);
		return Fraction(sum(thicknessValues)).div(thicknessValues.length);
	}

	get representativeLength() {
		if (!this.length) { return null }
		return Fraction(this.length.min+this.length.max).div(2);
	}

	maintainRepresentativeAspectRatio({width, height}) {
		if (!this.representativeLength || !this.representativeThickness) { return null }
		let aspectRatio = this.representativeLength / this.representativeThickness;
		let compare = Fraction(width, height).compare(aspectRatio);
		if (compare > 0) {
			width = Fraction(height).mul(aspectRatio);
		} else if (compare < 0) {
			height = Fraction(width).div(aspectRatio);
		}
		return {width, height};
	}

}
