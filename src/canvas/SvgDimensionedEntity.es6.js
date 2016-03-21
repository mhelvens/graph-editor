import {abstract} from 'core-decorators';
import pick      from 'lodash/pick';
import isFinite  from 'lodash/isFinite';
import invokeMap from 'lodash/invokeMap';
import {isNumber} from '../libs/fraction.es6.js';

import {sw, swf}      from '../util/misc.es6.js';
import {property} from './ValueTracker.es6.js';
import SvgEntity  from './SvgEntity.es6.js';


const pluggedIntoParent = Symbol('pluggedIntoParent');


const ROTATION_TO_ORIENTATION = swf({
	0:   'horizontal',
	90:  'vertical',
	180: 'horizontal',
	270: 'vertical'
});


@abstract export default class SvgDimensionedEntity extends SvgEntity {

	@property({isValid: isNumber                                         }) x; ////// global
	@property({isValid: isNumber                                         }) y;
	@property({isValid: isNumber                                         }) width;
	@property({isValid: isNumber                                         }) height;
	@property({isValid: [0, 90, 180, 270],          initial: 0           }) rotation;
	@property({isValid: ['horizontal', 'vertical'], initial: 'horizontal'}) orientation;

	@property({isValid: isNumber                                         }) lx; ///// local (in percentages of parent size)
	@property({isValid: isNumber                                         }) ly;
	@property({isValid: isNumber                                         }) lwidth;
	@property({isValid: isNumber                                         }) lheight;
	@property({isValid: [0, 90, 180, 270],          initial: 0           }) lrotation;
	@property({isValid: ['horizontal', 'vertical'], initial: 'horizontal'}) lorientation;

	@property({isValid: isNumber                                         }) lrx; ///// local and rotated
	@property({isValid: isNumber                                         }) lry;

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, [
			'x', 'y', 'width', 'height',
			'lx', 'ly', 'lwidth', 'lheight',
			'rotation'
		]));
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
		const _px = this.parent.p('cx'); // parent (container)
		const _py = this.parent.p('cy');
		const _pw = this.parent.p('cwidth');
		const _ph = this.parent.p('cheight');
		const _pr = this.parent.p('rotation');

		const _x  = this.p('x'); // global (set by, e.g., mouse events)
		const _y  = this.p('y');
		const _w  = this.p('width');
		const _h  = this.p('height');
		const _r  = this.p('rotation');

		const _lx = this.p('lx'); // local (w.r.t. parent)
		const _ly = this.p('ly');
		const _lw = this.p('lwidth');
		const _lh = this.p('lheight');
		const _lr = this.p('lrotation');

		const _lrx = this.p('lrx'); // local + rotated (to help set x and y)
		const _lry = this.p('lry');


		this[pluggedIntoParent] = [

			/* relate rotation with local version and parent rotation */
			_lr.plug([_r], [_pr], () => (_r .get() - _pr.get() + 360) % 360),
			_r .plug([_lr, _pr],  () => (_lr.get() + _pr.get() + 360) % 360),

			// /* maintain local rotated x and y */
			// _lrx.plug([_lx, _ly, _pr], () => sw(_pr.get())({
			// 	0:       _lx.get(),
			// 	90:  1 - _ly.get(),
			// 	180: 1 - _lx.get(),
			// 	270:     _ly.get(),
			// })),
			// _lry.plug([_ly, _lx, _pr], () => sw(_pr.get())({
			// 	0:       _ly.get(),
			// 	90:  1 - _lx.get(),
			// 	180: 1 - _ly.get(),
			// 	270:     _lx.get(),
			// })),


			/* relate x,y,w,h with local versions and parent dimensions (G --> L) */
			_lx.plug([_x], [_pw, _px], () => (_x.get()-_px.get()) / _pw.get()),
			_ly.plug([_y], [_ph, _py], () => (_y.get()-_py.get()) / _ph.get()),
			_lw.plug([_w], [_pw],      () => _w.get() / _pw.get()            ),
			_lh.plug([_h], [_ph],      () => _h.get() / _ph.get()            ), // TODO: fractions

			/* relate x,y,w,h with local versions and parent dimensions (L --> G) */
			_x .plug([_pw, _px, _lx], () => _px.get() + _lx.get() * _pw.get()),
			_y .plug([_ph, _py, _ly], () => _py.get() + _ly.get() * _ph.get()),
			_w .plug([_pw, _lw],      () => _lw.get() * _pw.get()            ),
			_h .plug([_ph, _lh],      () => _lh.get() * _ph.get()            ),

		];
	};

}
