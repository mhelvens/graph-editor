import pick     from 'lodash/pick';
import isFinite from 'lodash/isFinite';
import get      from 'lodash/fp/get';
import $        from '../libs/jquery.es6.js';
import Kefir    from '../libs/kefir.es6.js';
import {isNumber} from '../libs/fraction.es6.js';
import interact from '../libs/interact.js';

import {sw, swf} from '../util/misc.es6.js';

import {property} from './ValueTracker.es6.js';
import SvgEntity  from './SvgEntity.es6.js';
import NodeCircle from './NodeCircle.es6.js';


const absoluteSide = Symbol('absoluteSide');


export default class LayerBorderLine extends SvgEntity {

	layer;
	side;
	handle;

	@property({isValid: ['horizontal', 'vertical']}) orientation;
	@property({isValid: isNumber                  }) position;

	@property({isValid: isNumber}) cx; ///////  container positioning (global)
	@property({isValid: isNumber}) cy;
	@property({isValid: isNumber}) cwidth;
	@property({isValid: isNumber}) cheight;


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
				<rect class="hover-area"></rect>
				<line class="border"></line>
				<g class="child-container"></g>
			</g>
		`);

		/* extract and style important elements */
		const line = result.children('line.border').css({
			stroke:        'transparent', // TODO: make invisible except for hover events
			strokeWidth:    1,
			pointerEvents: 'none'
		});
		this.handle = result.children('rect.hover-area').css({
			stroke:        'transparent',
			fill:          'transparent',
			pointerEvents: 'all'
		});

		/* alter DOM based on observed changes */
		this.p('hovering').plug(this.handle.asKefirStream('mouseenter').map(()=>true ).takeUntilBy(this.e('delete')));
		this.p('hovering').plug(this.handle.asKefirStream('mouseleave').map(()=>false).takeUntilBy(this.e('delete')));
		this.p('orientation').onValue((orientation) => {
			this.handle.toggleClass('horizontal-border', orientation === 'horizontal');
			this.handle.toggleClass('vertical-border',   orientation === 'vertical'  );
		});

		this.handle.cssPlug('cursor', Kefir.combine([this.root.p('activeTool'), this.p('orientation')], (activeTool, orientation) => {
			if (activeTool) {
				return 'pointer';
			} else {
				return sw(orientation)({
					horizontal: 'row-resize',
					vertical:   'col-resize'
				})
			}
		}));

		let x1, y1, x2, y2;
		let positioning = Kefir.combine([
			this[absoluteSide],
			this.layer.p('x'),
			this.layer.p('y'),
			this.layer.p('width'),
			this.layer.p('height')
		], (aSide, x, y, width, height) => sw(aSide)({
			bottom: { y1: y + height , y2: y + height , x1: x         , x2: x + width , x                  , y: y - 5.5 + height , width     , height: 11 },
			right:  { y1: y          , y2: y + height , x1: x + width , x2: x + width , x: x - 5.5 + width , y                   , width: 11 , height     },
			top:    { y1: y          , y2: y          , x1: x + width , x2: x         , x                  , y: y - 5.5          , width     , height: 11 },
			left:   { y1: y + height , y2: y          , x1: x         , x2: x         , x: x - 5.5         , y                   , width: 11 , height     }
		}));
		line.attrPlug({
		     x1: positioning.map(get('x1')),
		     y1: positioning.map(get('y1')),
		     x2: positioning.map(get('x2')),
		     y2: positioning.map(get('y2'))
		});
		this.handle.attrPlug({
			x:      positioning.map(get('x')),
			y:      positioning.map(get('y')),
			width:  positioning.map(get('width')),
			height: positioning.map(get('height'))
		});
		this.p('cx')     .plug(positioning.map(get('x')));
		this.p('cy')     .plug(positioning.map(get('y')));
		this.p('cwidth') .plug(positioning.map(get('width')));
		this.p('cheight').plug(positioning.map(get('height')));

		/* using the current tool on mouse-down */
		// this.handle.cssPlug('cursor', this.root.p('activeTool').map(at => at?'pointer':'auto').takeUntilBy(this.e('delete')));
		interact(this.handle[0]).on('down', (event) => {
			if (!this.root.activeTool) { return } // TODO: instead of this test, use the Null Object design pattern
			event.preventDefault();
			event.stopPropagation();
			this.root.activeTool.onMouseDown(this, event);
		});

		/* return result */
		return result;
	}

	dropzone() {
		return {
			overlap: 'center',
			ondropactivate: (event) => {
				// add active dropzone feedback
			},
			ondropdeactivate: (event) => {
				// remove active dropzone feedback
			},
			ondragenter: (event) => {
				// feedback the possibility of a drop
			},
			ondragleave: (event) => {
				// remove the drop feedback style
			},
			ondrop: (event) => {
				let element = $(event.relatedTarget);
				while (!element.data('controller')) {
					element = element.parent();
				}
				let other = element.data('controller');
				if (other instanceof NodeCircle) {
					other.setParent(this);
					this.appendChildElement(other);
					console.log(`'${other.model.name}' (${other.model.id}) dropped onto border of (${this.parent.model.id})`);
				} else {
					// TODO
					console.log('TODO: find proper drop target when non-node is dropped over layer border');
				}
			}
		};
	}

	appendChildElement(newChild) {
		if (newChild instanceof NodeCircle) {
			this.parent.parent.element.children('.child-container').append(newChild.element);
			if (this.orientation === 'horizontal') {
				newChild.y = this.y;
			} else {
				newChild.x = this.x;
			}
		} else {
			this.root.appendChildElement(newChild);
		}
	}

}
