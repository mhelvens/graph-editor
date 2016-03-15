import _, {pick, range, zip, sortBy, isFinite} from 'lodash';
import Kefir                                   from '../libs/kefir.es6.js';
import $                                       from '../libs/jquery.es6.js';

import {assert, boundBy} from '../util/misc.es6.js';
import Resources         from '../Resources.es6.js';

import {property}        from './ValueTracker.es6.js';
import SvgEntity         from './SvgEntity.es6.js';
import LayerTemplateBox  from './LayerTemplateBox.es6.js';
import RotateClicker     from './RotateClicker.es6.js';


export default class LyphTemplateBox extends SvgEntity {

	get axisThickness() { return 15                                                                   }
	get minWidth     () { return 2 * (this.axisThickness + 1)                                         }
	get minHeight    () { return this.axisThickness + (this.model ? this.model.layers.length * 2 : 5) }

	layerTemplateBoxes = [];


	@property({isValid: isFinite}) x;
	@property({isValid: isFinite}) y;
	@property({isValid: isFinite}) width;
	@property({isValid: isFinite}) height;
	@property({isValid: isFinite}) lx; // local (in percentages of parent size)
	@property({isValid: isFinite}) ly;
	@property({isValid: isFinite}) lwidth;
	@property({isValid: isFinite}) lheight;

	// TODO: rotation



	constructor(options) {
		super(options);

		Object.assign(this, pick(options, 'x', 'y', 'width', 'height'));

		/* create the layers */
		let resources = new Resources;
		this.layerTemplateBoxes = _(this.model.layers)
			.map(id => resources.getResource_sync('layerTemplates', id))
			.sortBy('position')
			.map(model => new LayerTemplateBox({ parent: this, model }))
			.value();
		this._setLayerTemplateBoxPositions();
	}

	setParent(newParent) {
		super.setParent(newParent);
		for (let plug of this._pluggedIntoParent || []) { plug.unplug() }
		const _px = this.parent.p('x');
		const _py = this.parent.p('y');
		const _pxd = _px.diff((prev, next) => next - prev, this.parent.x);
		const _pyd = _py.diff((prev, next) => next - prev, this.parent.y);
		const _pw = this.parent.p('width');
		const _ph = this.parent.p('height');
		const _x  = this.p('x');
		const _y  = this.p('y');
		const _w  = this.p('width');
		const _h  = this.p('height');
		const _lx = this.p('lx');
		const _ly = this.p('ly');
		const _lw = this.p('lwidth');
		const _lh = this.p('lheight');
		this._pluggedIntoParent = [
			_lx.plug(Kefir.combine([_x], [_pw, _px],   (x, pw, px) => (x - px) / pw)),
			_ly.plug(Kefir.combine([_y], [_ph, _py],   (y, ph, py) => (y - py) / ph)),

			_lw.plug(Kefir.combine([_w], [_pw], (w, pw) => 1.0 * w / pw)),
			_lh.plug(Kefir.combine([_h], [_ph], (h, ph) => 1.0 * h / ph)),

			_x .plug(Kefir.combine([_pxd], [_x], (pxd, x) => x + pxd)),
			_y .plug(Kefir.combine([_pyd], [_y], (pyd, y) => y + pyd)),

			_x .plug(Kefir.combine([_pw], [_px, _lx],  (pw, px, lx) => px + lx * pw)),
			_y .plug(Kefir.combine([_ph], [_py, _ly],  (ph, py, ly) => py + ly * ph)),

			_w .plug(Kefir.combine([_pw], [_lw],  (pw, lw) => pw * lw)),
			_h .plug(Kefir.combine([_ph], [_lh],  (ph, lh) => ph * lh)),
		];
	};

	createElement() {
		/* main HTML */
		let result = $.svg(`
			<g>
				<rect class="lyphTemplate"></rect>
				<rect class="axis" height="${this.axisThickness}"></rect>
				<defs>
					<clipPath id="name-space">
						<rect class="name-space" height="${this.axisThickness}"></rect>
					</clipPath>
				</defs>
				<text class="axis label" clip-path="url(#name-space)">${this.model.name}</text>
				<text class="axis minus"> − </text>
				<text class="axis plus "> + </text>
				
				<g class="child-container"></g>
				<g class="delete-clicker"></g>
				<g class="rotate-clicker"></g>
			</g>
		`);

		/* extract and style important elements */
		const lyphTemplate = result.find('.lyphTemplate').css({
			stroke:         'black',
			shapeRendering: 'crispEdges',
			pointerEvents:  'all'
		});
		const axis = result.find('rect.axis').css({
			stroke:         'black',
			fill:           'black',
			shapeRendering: 'crispEdges',
			pointerEvents:  'none'
		});
		const axisText = result.find('text.axis').css({
			stroke:           'white',
			fill:             'white',
			fontSize:         '14px',
			textRendering:    'geometricPrecision',
			pointerEvents:    'none',
			dominantBaseline: 'text-before-edge'
		});
		const axisMinus     = axisText.filter('.minus').css('text-anchor', 'start');
		const axisPlus      = axisText.filter('.plus') .css('text-anchor', 'end');
		const axisLabel     = axisText.filter('.label').css('text-anchor', 'middle').css({ stroke: 'none' });
		const nameSpacePath = result.find('defs > clipPath > rect.name-space');

		/* alter DOM based on observed changes */
		lyphTemplate.mouseenter(() => { this.hovering = true  });
		lyphTemplate.mouseleave(() => { this.hovering = false });
		for (let prop of ['x', 'y', 'width', 'height']) {
			this.p(prop).onValue((v) => { lyphTemplate.attr(prop, v) });
		}

		nameSpacePath
			.attrPlug('x',     this.p( 'x'           ).map(( x         ) => x + this.axisThickness)          )
			.attrPlug('y',     this.p(['y', 'height']).map(([y, height]) => y + height - this.axisThickness) )
			.attrPlug('width', this.p( 'width'       ).map(( width     ) => width - 2 * this.axisThickness)  );

		axis
			.attrPlug('x',     this.p( 'x'           )                                                       )
			.attrPlug('y',     this.p(['y', 'height']).map(([y, height]) => y + height - this.axisThickness) )
			.attrPlug('width', this.p( 'width'       )                                                       );

		axisMinus.attrPlug('x', this.p( 'x'           ).map(( x         ) => x + 1)                                 );
		axisPlus .attrPlug('x', this.p(['x', 'width' ]).map(([x, width ]) => x + width - 1)                         );
		axisLabel.attrPlug('x', this.p(['x', 'width' ]).map(([x, width ]) => x + width / 2)                         );
		axisText .attrPlug('y', this.p(['y', 'height']).map(([y, height]) => y + height - this.axisThickness - 0.5) );


		/* add layer elements and change their positioning based on observed changes */
		for (let lTBox of this.layerTemplateBoxes) {
			const layerHeight = (height) => (height - this.axisThickness) / (this.model ? this.model.layers.length : 5);
			result.children('.child-container').append(lTBox.element);
			lTBox.p('x')     .plug( this.p( 'x'           )                                                                                                         );
			lTBox.p('width') .plug( this.p( 'width'       )                                                                                                         );
			lTBox.p('y')     .plug( this.p(['y', 'height']).map(([y, height]) => y + (this.layerTemplateBoxes.length - lTBox.model.position) * layerHeight(height)) );
			lTBox.p('height').plug( this.p( 'height'      ).map(layerHeight)                                                                                        );
		}

		/* delete clicker */
		let deleteClicker = this.deleteClicker();
		deleteClicker.element.appendTo(result.children('.delete-clicker'));

		(deleteClicker.element)
			.attrPlug('x', this.p(['width',  'x']).map(([width, x]) => width + x) )
			.attrPlug('y', this.p( 'y'           )                                );

		(deleteClicker.element)
			.cssPlug('display', Kefir.combine([
				this.p('hovering'),
				deleteClicker.p('hovering'),
				this.root.p('draggingSomething')
			]).map(([h1, h2, d]) => (h1 || h2) && !d ? 'block' : 'none'));

		/* rotate clicker */
		let rotateClicker = new RotateClicker();
		rotateClicker.element.appendTo(result.children('.rotate-clicker'));

		(rotateClicker.element)
			.attrPlug('x', this.p('x'))
			.attrPlug('y', this.p('y'));

		(rotateClicker.element)
			.cssPlug('display', Kefir.combine([
				this.p('hovering'),
				rotateClicker.p('hovering'),
				this.root.p('draggingSomething')
			]).map(([h1, h2, d]) => (h1 || h2) && !d ? 'block' : 'none'));

		rotateClicker.clicks.onValue(() => {
			console.log('TODO: Rotate');
		});

		/* return result */
		return result;
	}

	_setLayerTemplateBoxPositions() {
		for (let lTBox of this.layerTemplateBoxes) {
			Object.assign(lTBox, {
				width:  this.width,
				height: this.layerHeight,
				x: this.x,
				y: this.y + (this.layerTemplateBoxes.length - lTBox.model.position) * this.layerHeight // from the axis upward
			});
		}
	}

	draggable() {
		let raw, rootRect;
		return {
			autoScroll: true,
			onstart: (event) => {
				event.stopPropagation();
				this.moveToFront();

				/* initialize interaction-local variables */
				raw      = pick(this, 'x', 'y');
				rootRect = this.root.boundingBox();
			},
			onmove: ({dx, dy}) => {
				/* update raw coordinates */
				raw.x += dx;
				raw.y += dy;

				/* initialize visible coordinates */
				let visible = { ...raw };

				// TODO: snapping

				/* restriction correction */
				visible.x = boundBy( rootRect.left, rootRect.left + rootRect.width  - this.width  )( visible.x );
				visible.y = boundBy( rootRect.top,  rootRect.top  + rootRect.height - this.height )( visible.y );

				/* set the actual visible coordinates */
				Object.assign(this, visible);

				// /* set visible (x, y) based on snapping and restriction */
				// let prev = pick(this, 'x', 'y');
				// this.traverse([], (entity) => {
				// 	// console.log(entity.);
				// 	entity.x += visible.x - prev.x;
				// 	entity.y += visible.y - prev.y;
				// });
			}
		};
	}

	resizable() {
		let raw;
		return {
			handle: '.lyphTemplate',
			edges: { left: true, right: true, bottom: true, top: true },
			onstart: (event) => {
				event.stopPropagation();
				this.moveToFront();

				/* initialize interaction-local variables */
				raw  = pick(this, 'x', 'y', 'width', 'height');
			},
			onmove: ({rect, edges}) => {

				let proposedRect = this.pageToCanvas(rect);

				/* update raw coordinates */
				raw.width  = Math.max(proposedRect.width,  this.minWidth );
				raw.height = Math.max(proposedRect.height, this.minHeight);
				if (edges.left) {
					raw.x = proposedRect.left - (raw.width - proposedRect.width);
				}
				if (edges.top) {
					raw.y = proposedRect.top  - (raw.height - proposedRect.height);
				}

				/* initialize visible coordinates */
				let visible = { ...raw };

				// TODO: snapping

				/* restriction correction */
				if (edges.left && visible.x < this.parent.x) {
					visible.width = (visible.x + visible.width) - this.parent.x;
					visible.x = this.parent.x;
				}
				if (edges.top && visible.y < this.parent.y) {
					visible.height = (visible.y + visible.height) - this.parent.y;
					visible.y = this.parent.y;
				}
				if (edges.right && visible.x + visible.width > this.parent.x + this.parent.width) {
					visible.width = (this.parent.x + this.parent.width) - visible.left;
				}
				if (edges.bottom && visible.y + visible.height > this.parent.y + this.parent.height) {
					visible.height = (this.parent.y + this.parent.height) - visible.y;
				}

				/* set visible (x, y) based on snapping and restriction */
				this.set(visible);
			}
		};
	}

}
