import _, {pick, range, zip, sortBy, isFinite, clone} from 'lodash';
import Kefir                                          from '../libs/kefir.es6.js';
import $                                              from '../libs/jquery.es6.js';

import {boundBy, sw, uniqueId} from '../util/misc.es6.js';
import Resources               from '../Resources.es6.js';

import {property}        from './ValueTracker.es6.js';
import SvgEntity         from './SvgEntity.es6.js';
import LayerTemplateBox  from './LayerTemplateBox.es6.js';
import RotateClicker     from './RotateClicker.es6.js';
import LayerBorderLine   from './LayerBorderLine.es6.js';


function isRotation(v) { return _([0, 90, 180, 270]).includes(v) }


export default class LyphTemplateBox extends SvgEntity {

	get axisThickness() { return 15                                                                   }
	get minWidth     () { return 2 * (this.axisThickness + 1)                                         }
	get minHeight    () { return this.axisThickness + (this.model ? this.model.layers.length * 2 : 5) }

	layerTemplateBoxes = [];

	@property({isValid: isFinite              }) x;  ////////// global
	@property({isValid: isFinite              }) y;
	@property({isValid: isFinite              }) width;
	@property({isValid: isFinite              }) height;
	@property({isValid: isRotation, initial: 0}) rotation;
	@property({isValid: isFinite              }) lx; ////////// local (in percentages of parent size)
	@property({isValid: isFinite              }) ly;
	@property({isValid: isFinite              }) lwidth;
	@property({isValid: isFinite              }) lheight;
	@property({isValid: isRotation, initial: 0}) lrotation;


	constructor(options) {
		super(options);

		Object.assign(this, pick(options, 'x', 'y', 'width', 'height', 'rotation'));

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

		// TODO: put (most of) the following in a (new) superclass to share it with sibling classes
		const _px  = this.parent.p('x');
		const _py  = this.parent.p('y');
		const _pxd = _px.diff((prev, next) => next - prev, this.parent.x);
		const _pyd = _py.diff((prev, next) => next - prev, this.parent.y);
		const _pw  = this.parent.p('width');
		const _ph  = this.parent.p('height');
		const _x   = this.p('x');
		const _y   = this.p('y');
		const _w   = this.p('width');
		const _h   = this.p('height');
		const _lx  = this.p('lx');
		const _ly  = this.p('ly');
		const _lw  = this.p('lwidth');
		const _lh  = this.p('lheight');
		const _r   = this.p('rotation');
		const _lr  = this.p('lrotation');
		const _pr  = this.parent.p('rotation');
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

		    _r .plug(Kefir.combine([_pr, _lr], (pr, lr) => (pr + lr + 360) % 360)),
		];
	};

	createElement() {
		/* main HTML */
		let clipPathId = uniqueId('clip-path');
		let result = $.svg(`
			<g>
				<rect class="lyphTemplate"></rect>
				<svg class="axis">
					<defs>
						<clipPath id="${clipPathId}">
							<rect class="name-space" x="0" y="0" height="100%" width="100%"></rect>
						</clipPath>
					</defs>
					<text class="minus" stroke="white"> − </text>
					<text class="label" stroke="none" clip-path="url(#${clipPathId})"> ${this.model.name} </text>
					<text class="plus " stroke="white"> + </text>
				</svg>
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
		const axis = result.find('svg.axis').css({
			stroke:         'black',
			fill:           'black',
			shapeRendering: 'crispEdges',
			pointerEvents:  'none',
			overflow:       'visible'
		});
		const axisText = axis.find('text').css({
			fill:             'white',
			fontSize:         '14px',
			textRendering:    'geometricPrecision',
			pointerEvents:    'none',
			dominantBaseline: 'central'
		});


		/* alter DOM based on observed changes */

		lyphTemplate.mouseenter(() => { this.hovering = true  });
		lyphTemplate.mouseleave(() => { this.hovering = false });
		for (let prop of ['x', 'y', 'width', 'height']) {
			lyphTemplate.attrPlug(prop, this.p(prop));
		}

		let layerRot = (rotation) => ({x, y, width, height}) => {
			let w2h = this.height / this.width;
			let h2w = (this.width - this.axisThickness) / (this.height - this.axisThickness);
			x -= this.x;
			y -= this.y;
			switch (rotation) {
				case 90: {
					[x, y, width, height] = [
						this.width - h2w * (y + height),
						x      * w2h,
						height * h2w,
						width  * w2h
					]
				} break;
				case 180: {
					[x, y, width, height] = [
						x,
						this.height - y - height,
						width,
						height
					]
				} break;
				case 270: {
					[x, y, width, height] = [
						h2w * y,
						x      * w2h,
						height * h2w,
						width  * w2h
					]
				} break;
			}
			x += this.x;
			y += this.y;
			return {x, y, width, height};
		};

		let posObj = this.p(['x', 'y', 'width', 'height', 'rotation'])
             .map(([x, y, width, height, rotation]) => ({ x, y, width, height, rotation }));

		let axisPos = posObj.map(({x, y, width, height, rotation}) => sw(rotation)({
			0: {
				x:           x+2,
				y:           y + height - this.axisThickness,
				width:       width-4,
				height:      this.axisThickness,
				minusX:      '0',
				minusY:      '50%',
				labelX:      '50%',
				labelY:      '50%',
				plusX:       '100%',
				plusY:       '50%',
				minusAnchor: 'start',
				labelAnchor: 'middle',
				plusAnchor:  'end',
				writingMode: 'horizontal-tb'
			},
			90: {
				x:           x+1,
				y:           y+5, // TODO: why is +5 (and other small corrections) needed?
				width:       this.axisThickness,
				height:      height,
				minusX:      '50%',
				minusY:      '0',
				labelX:      '50%',
				labelY:      '50%',
				plusX:       '50%',
				plusY:       '100%',
				minusAnchor: 'start',
				labelAnchor: 'middle',
				plusAnchor:  'end',
				writingMode: 'vertical-rl'
			},
			180: {
				x:           x+2,
				y:           y,
				width:       width-4,
				height:      this.axisThickness,
				minusX:      '100%',
				minusY:      '50%',
				labelX:      '50%',
				labelY:      '50%',
				plusX:       '0',
				plusY:       '50%',
				minusAnchor: 'end',
				labelAnchor: 'middle',
				plusAnchor:  'start',
				writingMode: 'horizontal-tb'
			},
			270: {
				x:           x + width - this.axisThickness + 1,
				y:           y+5,
				width:       this.axisThickness,
				height:      height,
				minusX:      '50%',
				minusY:      '100%',
				labelX:      '50%',
				labelY:      '50%',
				plusX:       '50%',
				plusY:       '0',
				minusAnchor: 'end',
				labelAnchor: 'middle',
				plusAnchor:  'start',
				writingMode: 'vertical-rl'
			}
		}));
		axis
			.attrPlug('x',      axisPos.map(o => o.x     ))
			.attrPlug('y',      axisPos.map(o => o.y     ))
			.attrPlug('width',  axisPos.map(o => o.width ))
			.attrPlug('height', axisPos.map(o => o.height));
		axisText
			.attrPlug('writing-mode', axisPos.map(o => o.writingMode));
		axisText.filter('.minus')
	        .attrPlug('x',           axisPos.map(o => o.minusX     ))
            .attrPlug('y',           axisPos.map(o => o.minusY     ))
            .attrPlug('text-anchor', axisPos.map(o => o.minusAnchor));
		axisText.filter('.label')
	        .attrPlug('x',           axisPos.map(o => o.labelX     ))
	        .attrPlug('y',           axisPos.map(o => o.labelY     ))
            .attrPlug('text-anchor', axisPos.map(o => o.labelAnchor));
		axisText.filter('.plus')
	        .attrPlug('x',           axisPos.map(o => o.plusX      ))
	        .attrPlug('y',           axisPos.map(o => o.plusY      ))
            .attrPlug('text-anchor', axisPos.map(o => o.plusAnchor ));

		/* add layer elements and change their positioning based on observed changes */
		for (let lTBox of this.layerTemplateBoxes) {
			const layerHeight = (height) => (height - this.axisThickness) / (this.model ? this.model.layers.length : 5);
			result.children('.child-container').append(lTBox.element);
			let layerPos = posObj.map(({x, y, width, height, rotation}) => layerRot(rotation)({
				x: x,
				y: y + (this.layerTemplateBoxes.length - lTBox.model.position) * layerHeight(height),
				width:  width,
				height: layerHeight(height)
			}));
			lTBox.p('y')     .plug(layerPos.map(o => o.y     ));
			lTBox.p('x')     .plug(layerPos.map(o => o.x     ));
			lTBox.p('width') .plug(layerPos.map(o => o.width ));
			lTBox.p('height').plug(layerPos.map(o => o.height));
		}

		/* draggable layer dividers */
		// TODO: put these borders everywhere (not just in between layers),
		//     : and they can act as snap-targets too.
		for (let ltBox of _(this.layerTemplateBoxes).initial()) {
			let border = new LayerBorderLine({
				parent: this,
				layer: ltBox,
				side: 'outer',
				model: { type: 'Border', id: -1 } // TODO: real border model
			});
			this.root.appendChildElement(border);

		}


		/* delete clicker (not rotated) */
		let deleteClicker = this.deleteClicker();
		deleteClicker.element.appendTo(result.children('.delete-clicker'));
		(deleteClicker.element)
			.attrPlug('x', this.p(['width',  'x']).map(([width, x]) => width + x) )
			.attrPlug('y', this.p( 'y'           )                                );
		(deleteClicker.element)
			.cssPlug('display', Kefir.combine([
				this.p('hovering'),
				deleteClicker.p('hovering'),
				this.root.p('draggingSomething'),
				this.root.p('resizingSomething')
			], (h1, h2, d, r) => (h1 || h2) && !d && !r ? 'block' : 'none'));

		/* rotate clicker (not rotated) */
		let rotateClicker = new RotateClicker();
		rotateClicker.element.appendTo(result.children('.rotate-clicker'));
		(rotateClicker.element)
			.attrPlug('x', this.p('x'))
			.attrPlug('y', this.p('y'));
		(rotateClicker.element)
			.cssPlug('display', Kefir.combine([
				this.p('hovering'),
				rotateClicker.p('hovering'),
				this.root.p('draggingSomething'),
				this.root.p('resizingSomething')
			], (h1, h2, d, r) => (h1 || h2) && !d && !r ? 'block' : 'none'));
		rotateClicker.clicks.onValue(() => {
			this.lrotation = (this.lrotation + 90) % 360;
		});

		/* return result */
		return result;
	}

	_setLayerTemplateBoxPositions() {
		for (let lTBox of this.layerTemplateBoxes) {
			Object.assign(lTBox, {
				width:  this.width,
				height: this.layerHeight,
				x:      this.x,
				y:      this.y + (this.layerTemplateBoxes.length - lTBox.model.position) * this.layerHeight // from the axis upward
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
				let visible = clone(raw);

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
