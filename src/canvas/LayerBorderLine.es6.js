import {pick, isFinite} from 'lodash';
import $                from '../libs/jquery.es6.js';
import Kefir            from '../libs/kefir.es6.js';

import {sw, swf} from '../util/misc.es6.js';

import SvgEntity  from './SvgEntity.es6.js';


const absoluteSide = Symbol('absoluteSide');


export default class LayerBorderLine extends SvgEntity {

	layer;
	side;

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
			stroke:        'darkgreen', // TODO: make invisible except for hover events
			strokeWidth:    3,
			pointerEvents: 'none'
		});
		const hoverArea = result.children('line.hover-area').css({
			stroke:        'transparent',
			strokeWidth:    11,
			pointerEvents: 'all'
		});
		const lines = result.children('line');

		/* alter DOM based on observed changes */
		this.p('hovering').plug(hoverArea.asKefirStream('mouseenter').map(()=>true ));
		this.p('hovering').plug(hoverArea.asKefirStream('mouseleave').map(()=>false));

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
		lines
			.attrPlug('x1', positioning.map(o=>o.x1))
			.attrPlug('y1', positioning.map(o=>o.y1))
			.attrPlug('x2', positioning.map(o=>o.x2))
			.attrPlug('y2', positioning.map(o=>o.y2));

		/* return result */
		return result;
	}

	// resizable() { // TODO: write resizable method to only allow up-and-down
	// 	let raw;
	// 	return {
	// 		handle: '.lyphTemplate',
	// 		edges: { left: true, right: true, bottom: true, top: true },
	// 		onstart: (event) => {
	// 			event.stopPropagation();
	// 			this.moveToFront();
	//
	// 			/* initialize interaction-local variables */
	// 			raw  = pick(this, 'x', 'y', 'width', 'height');
	// 		},
	// 		onmove: ({rect, edges}) => {
	//
	// 			let proposedRect = this.pageToCanvas(rect);
	//
	// 			/* update raw coordinates */
	// 			raw.width  = Math.max(proposedRect.width,  this.minWidth );
	// 			raw.height = Math.max(proposedRect.height, this.minHeight);
	// 			if (edges.left) {
	// 				raw.x = proposedRect.left - (raw.width - proposedRect.width);
	// 			}
	// 			if (edges.top) {
	// 				raw.y = proposedRect.top  - (raw.height - proposedRect.height);
	// 			}
	//
	// 			/* initialize visible coordinates */
	// 			let visible = { ...raw };
	//
	// 			// TODO: snapping
	//
	// 			/* restriction correction */
	// 			if (edges.left && visible.x < this.parent.x) {
	// 				visible.width = (visible.x + visible.width) - this.parent.x;
	// 				visible.x = this.parent.x;
	// 			}
	// 			if (edges.top && visible.y < this.parent.y) {
	// 				visible.height = (visible.y + visible.height) - this.parent.y;
	// 				visible.y = this.parent.y;
	// 			}
	// 			if (edges.right && visible.x + visible.width > this.parent.x + this.parent.width) {
	// 				visible.width = (this.parent.x + this.parent.width) - visible.left;
	// 			}
	// 			if (edges.bottom && visible.y + visible.height > this.parent.y + this.parent.height) {
	// 				visible.height = (this.parent.y + this.parent.height) - visible.y;
	// 			}
	//
	// 			/* set visible (x, y) based on snapping and restriction */
	// 			this.set(visible);
	// 		}
	// 	};
	// }

}
