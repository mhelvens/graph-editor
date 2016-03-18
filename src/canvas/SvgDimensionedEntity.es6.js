import pick      from 'lodash/pick';
import isFinite  from 'lodash/isFinite';
import invokeMap from 'lodash/invokeMap';

import {property}          from './ValueTracker.es6.js';
import SvgPositionedEntity from './SvgPositionedEntity.es6.js';


const pluggedIntoParent = Symbol('pluggedIntoParent');


export default class SvgDimensionedEntity extends SvgPositionedEntity {


	@property({isValid: isFinite                     }) width;  //// global
	@property({isValid: isFinite                     }) height;
	@property({isValid: [0, 90, 180, 270], initial: 0}) rotation;
	@property({isValid: isFinite                     }) lwidth; //// local (in percentages of parent size)
	@property({isValid: isFinite                     }) lheight;
	@property({isValid: [0, 90, 180, 270], initial: 0}) lrotation;


	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'width', 'height', 'rotation'));
		this.xywhr = this.p(['x', 'y', 'width', 'height', 'rotation'])
		                 .map(([x, y, width, height, rotation]) => ({ x, y, width, height, rotation }));
	}

	setParent(newParent) {
		super.setParent(newParent);

		if (!newParent) { return }

		/* unplug any connections to the old parent */
		invokeMap(this[pluggedIntoParent], 'unplug');

		/* make connections to the new parent */
		const _pw = this.parent.p('width');
		const _ph = this.parent.p('height');
		const _pr = this.parent.p('rotation');
		const _w  = this.p('width');
		const _h  = this.p('height');
		const _r  = this.p('rotation');
		const _lw = this.p('lwidth');
		const _lh = this.p('lheight');
		const _lr = this.p('lrotation');
		this[pluggedIntoParent] = [
			_lw.plug([_w], [_pw],  (w,  pw) => 1.0 * w / pw         ),
			_lh.plug([_h], [_ph],  (h,  ph) => 1.0 * h / ph         ),
			_w .plug([_pw], [_lw], (pw, lw) => pw * lw              ),
			_h .plug([_ph], [_lh], (ph, lh) => ph * lh              ),
			_r .plug([_pr, _lr],   (pr, lr) => (pr + lr + 360) % 360),
		];
	};

}
