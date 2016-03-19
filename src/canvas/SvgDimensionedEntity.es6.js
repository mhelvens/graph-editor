import {abstract} from 'core-decorators';
import pick      from 'lodash/pick';
import isFinite  from 'lodash/isFinite';
import invokeMap from 'lodash/invokeMap';
import {isNumber} from '../libs/fraction.es6.js';

import {swf}               from '../util/misc.es6.js';
import {property}          from './ValueTracker.es6.js';
import SvgPositionedEntity from './SvgPositionedEntity.es6.js';


const pluggedIntoParent = Symbol('pluggedIntoParent');


const ROTATION_TO_ORIENTATION = swf({
	0:   'horizontal',
	90:  'vertical',
	180: 'horizontal',
	270: 'vertical'
});


@abstract export default class SvgDimensionedEntity extends SvgPositionedEntity {

	@property({isValid: isNumber                                         }) width;  //// global
	@property({isValid: isNumber                                         }) height;
	@property({isValid: [0, 90, 180, 270],          initial: 0           }) rotation;
	@property({isValid: ['horizontal', 'vertical'], initial: 'horizontal'}) orientation;

	@property({isValid: isNumber                                         }) lwidth; //// local (in percentages of parent size)
	@property({isValid: isNumber                                         }) lheight;
	@property({isValid: [0, 90, 180, 270],          initial: 0           }) lrotation;
	@property({isValid: ['horizontal', 'vertical'], initial: 'horizontal'}) lorientation;

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'width', 'height', 'rotation'));
		this.xywhr = this.p(['x', 'y', 'width', 'height', 'rotation'])
		                 .map(([x, y, width, height, rotation]) => ({ x, y, width, height, rotation }));

		this.p('orientation') .plug(this.p(['rotation'],  ROTATION_TO_ORIENTATION));
		this.p('lorientation').plug(this.p(['lrotation'], ROTATION_TO_ORIENTATION));
	}

	setParent(newParent) {
		super.setParent(newParent);

		/* unplug any connections to the old parent */
		invokeMap(this[pluggedIntoParent] || [], 'unplug');
		this[pluggedIntoParent] = [];

		if (!newParent) { return }

		/* make connections to the new parent */
		const _pw = this.parent.p('cwidth')  || this.parent.p('width');
		const _ph = this.parent.p('cheight') || this.parent.p('height');
		const _pr = this.parent.p('rotation');
		const _w  = this.p('width');
		const _h  = this.p('height');
		const _r  = this.p('rotation');
		const _lw = this.p('lwidth');
		const _lh = this.p('lheight');
		const _lr = this.p('lrotation');
		this[pluggedIntoParent] = [

			_lw.plug([_w], [_pw], (w,  pw)  => 1.0 * w / pw               ),
			_lh.plug([_h], [_ph], (h,  ph)  => 1.0 * h / ph               ),

			_w .plug([_lw, _pw],  (lw,  pw) => 1.0 * lw * pw              ),
			_h .plug([_lh, _ph],  (lh,  ph) => 1.0 * lh * ph              ),

			_r .plug([_pr, _lr],  (pr, lr)  => 1.0 * (pr + lr + 360) % 360),

		];
	};

}
