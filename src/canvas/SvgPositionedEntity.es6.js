import pick      from 'lodash/pick';
import isFinite  from 'lodash/isFinite';
import invokeMap from 'lodash/invokeMap';

import {property} from './ValueTracker.es6.js';
import SvgEntity  from './SvgEntity.es6.js';


const pluggedIntoParent = Symbol('pluggedIntoParent');


export default class SvgPositionedEntity extends SvgEntity {


	@property({isValid: isFinite}) x; ////// global
	@property({isValid: isFinite}) y;
	@property({isValid: isFinite}) lx; ///// local (in percentages of parent size)
	@property({isValid: isFinite}) ly;


	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'x', 'y'));
		this.xy = this.p(['x', 'y']).map(([x, y]) => ({ x, y }));
	}

	setParent(newParent) {
		super.setParent(newParent);

		if (!newParent) { return }

		/* unplug any connections to the old parent */
		invokeMap(this[pluggedIntoParent], 'unplug');

		/* make connections to the new parent */
		const _px  = this.parent.p('x');
		const _py  = this.parent.p('y');
		const _pxd = _px.diff((prev, next) => next - prev, this.parent.x);
		const _pyd = _py.diff((prev, next) => next - prev, this.parent.y);
		const _pw  = this.parent.p('width');
		const _ph  = this.parent.p('height');
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
		];
	};

}
