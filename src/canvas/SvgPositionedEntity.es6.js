import {abstract} from 'core-decorators';
import pick       from 'lodash/pick';
import isFinite   from 'lodash/isFinite';
import invokeMap  from 'lodash/invokeMap';
import {isNumber} from '../libs/fraction.es6.js';

import {property} from './ValueTracker.es6.js';
import SvgEntity  from './SvgEntity.es6.js';


const pluggedIntoParent = Symbol('pluggedIntoParent');


@abstract export default class SvgPositionedEntity extends SvgEntity {


	@property({isValid: isNumber}) x; ////// global
	@property({isValid: isNumber}) y;
	@property({isValid: isNumber}) lx; ///// local (in percentages of parent size)
	@property({isValid: isNumber}) ly;


	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'x', 'y'));
		this.xy = this.p(['x', 'y']).map(([x, y]) => ({ x, y }));
	}

	setParent(newParent) {

		super.setParent(newParent);

		/* unplug any connections to the old parent */ // TODO: extract this feature to a superclass (SvgEntity)
		invokeMap(this[pluggedIntoParent] || [], 'unplug');
		this[pluggedIntoParent] = [];

		if (!newParent) { return }


		/* make connections to the new parent */
		const _px  = this.parent.p('cx')      || this.parent.p('x');
		const _py  = this.parent.p('cy')      || this.parent.p('y');
		const _pw  = this.parent.p('cwidth')  || this.parent.p('width');
		const _ph  = this.parent.p('cheight') || this.parent.p('height');
		const _pxd = _px.diff((prev, next) => next - prev, this.parent.cx);
		const _pyd = _py.diff((prev, next) => next - prev, this.parent.cy);
		const _x   = this.p('x');
		const _y   = this.p('y');
		const _lx  = this.p('lx');
		const _ly  = this.p('ly');
		this[pluggedIntoParent] = [
			_x .plug([_pxd], [_x],            (pxd, x) => x + pxd       ),
			_y .plug([_pyd], [_y],            (pyd, y) => y + pyd       ),
			_x .plug([_pw],  [_px, _lx],  (pw, px, lx) => px + (lx * pw)),
			_y .plug([_ph],  [_py, _ly],  (ph, py, ly) => py + (ly * ph)),
			_lx.plug([_x],   [_pw, _px],   (x, pw, px) => (x - px) / pw ),
			_ly.plug([_y],   [_ph, _py],   (y, ph, py) => (y - py) / ph ),
			_x .plug([_lx],  [_pw, _px],   (lx, pw, px) => lx * pw + px ),
			_y .plug([_ly],  [_ph, _py],   (ly, ph, py) => ly * ph + py ),
		];
	};

}
