import pick       from 'lodash/pick';
import isFinite   from 'lodash/isFinite';
import invokeMap  from 'lodash/invokeMap';
import {isNumber} from '../libs/fraction.es6.js';

import {property}           from './ValueTracker.es6.js';
import SvgDimensionedEntity from './SvgDimensionedEntity.es6.js';


const pluggedIntoParent = Symbol('pluggedIntoParent');


export default class SvgContainerEntity extends SvgDimensionedEntity {

	@property({isValid: isNumber}) cx; ///////  container positioning (global)
	@property({isValid: isNumber}) cy;
	@property({isValid: isNumber}) cwidth;
	@property({isValid: isNumber}) cheight;

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'cx', 'cy', 'cwidth', 'cheight'));
		this.plugContainerPositioning();
	}

	// can be overwritten
	plugContainerPositioning() {
		this.p('cx')     .plug(this.p('x')     );
		this.p('cy')     .plug(this.p('y')     );
		this.p('cwidth') .plug(this.p('width') );
		this.p('cheight').plug(this.p('height'));
	}

}
