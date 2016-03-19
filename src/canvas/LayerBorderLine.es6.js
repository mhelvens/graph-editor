import pick     from 'lodash/pick';
import isFinite from 'lodash/isFinite';
import get      from 'lodash/fp/get';
import $        from '../libs/jquery.es6.js';
import Kefir    from '../libs/kefir.es6.js';
import {isNumber} from '../libs/fraction.es6.js';

import {sw, swf} from '../util/misc.es6.js';

import {property} from './ValueTracker.es6.js';
import SvgEntity  from './SvgEntity.es6.js';


const absoluteSide = Symbol('absoluteSide');


export default class LayerBorderLine extends SvgEntity {

	layer;
	side;
	handle;

	@property({isValid: ['horizontal', 'vertical']}) orientation;
	@property({isValid: isNumber                  }) position;

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'model', 'layer', 'side'));

		this.layer.e('delete').take(1).onValue(() => { this.delete() });

		/* track the absolute side of the layer that this border is on */
		this[absoluteSide] = this.layer.p('rotation').map(sw(this.side, {autoInvoke: false})({
			inner: swf({ 0: 'bottom', 90: 'left',   180: 'top',    270: 'right'  }),
			outer: swf({ 0: 'top',    90: 'right',  180: 'bottom', 270: 'left'   }),
			plus:  swf({ 0: 'right',  90: 'bottom', 180: 'left',   270: 'top'    }),
			minus: swf({ 0: 'left',   90: 'top',    180: 'right',  270: 'bottom' })
		}));

		/* auto-update orientation and position property */
		this.p('orientation').plug(this[absoluteSide].map(swf({
			bottom: 'horizontal',
			top:    'horizontal',
			left:   'vertical',
			right:  'vertical'
		})));
		this.p('position').plug([
			this[absoluteSide],
			this.layer.p('x'),
			this.layer.p('y'),
			this.layer.p('width'),
			this.layer.p('height')
		], (aSide, x, y, width, height) => sw(aSide)({
			bottom: y + height,
			right:  x + width,
			top:    y,
			left:   x
		}));
	}

	createElement() {
		/* main HTML */
		let result = $.svg(`
			<g>
				<line class="hover-area"></line>
				<line class="border"></line>
			</g>
		`);

		/* extract and style important elements */
		const line = result.children('line.border').css({
			stroke:        'transparent', // TODO: make invisible except for hover events
			strokeWidth:    1,
			pointerEvents: 'none'
		});
		this.handle = result.children('line.hover-area').css({
			stroke:        'transparent',
			strokeWidth:    11,
			pointerEvents: 'all'
		});
		const lines = result.children('line');

		/* alter DOM based on observed changes */
		this.p('hovering').plug(this.handle.asKefirStream('mouseenter').map(()=>true ).takeUntilBy(this.e('delete')));
		this.p('hovering').plug(this.handle.asKefirStream('mouseleave').map(()=>false).takeUntilBy(this.e('delete')));
		this.p('orientation').onValue((orientation) => {
			this.handle.toggleClass('horizontal-border', orientation === 'horizontal');
			this.handle.toggleClass('vertical-border',   orientation === 'vertical'  );
		});

		this.handle.cssPlug('cursor', this.p('orientation').map(swf({
			horizontal: 'row-resize',
			vertical:   'col-resize'
		})));

		let x1, y1, x2, y2;
		let positioning = Kefir.combine([
			this[absoluteSide],
			this.layer.p('x'),
			this.layer.p('y'),
			this.layer.p('width'),
			this.layer.p('height')
		], (aSide, x, y, width, height) => sw(aSide)({
			bottom: { y1: y + height, y2: y + height, x1: x,         x2: x + width },
			right:  { y1: y,          y2: y + height, x1: x + width, x2: x + width },
			top:    { y1: y,          y2: y,          x1: x + width, x2: x         },
			left:   { y1: y + height, y2: y,          x1: x,         x2: x         }
		}));
		lines.attrPlug({
		     x1: positioning.map(get('x1')),
		     y1: positioning.map(get('y1')),
		     x2: positioning.map(get('x2')),
		     y2: positioning.map(get('y2'))
		});

		/* return result */
		return result;
	}

}
