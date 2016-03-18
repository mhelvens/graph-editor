import pick     from 'lodash/pick';
import clone    from 'lodash/fp/clone';
import clamp    from 'lodash/fp/clamp';
import get      from 'lodash/fp/get';
import _        from 'lodash/core';
import Kefir    from '../libs/kefir.es6.js';
import $        from '../libs/jquery.es6.js';
import interact from '../libs/interact.js';

import {sw, uniqueId, inbetween} from '../util/misc.es6.js';
import Resources                 from '../Resources.es6.js';

import LayerTemplateBox     from './LayerTemplateBox.es6.js';
import RotateClicker        from './RotateClicker.es6.js';
import LayerBorderLine      from './LayerBorderLine.es6.js';
import SvgDimensionedEntity from './SvgDimensionedEntity.es6.js';


const pluggedIntoParent = Symbol('pluggedIntoParent');


export default class LyphTemplateBox extends SvgDimensionedEntity {

	get axisThickness() { return 15                                                                   }
	get minWidth     () { return 2 * (this.axisThickness + 1)                                         }
	get minHeight    () { return this.axisThickness + (this.model ? this.model.layers.length * 2 : 5) }

	layerTemplateBoxes = [];

	constructor(options) {
		super(options);

		/* create the layers */
		let resources = new Resources;
		this.layerTemplateBoxes = _(this.model.layers)
			.map(id => resources.getResource_sync('layerTemplates', id))
			.sortBy('position')
			.map(model => new LayerTemplateBox({ parent: this, model }))
			.value();
		this._setLayerTemplateBoxPositions(); // TODO: let the template boxes do this for themselves
	}

	createElement() {
		/* main HTML */
		let clipPathId = uniqueId('clip-path');
		let result = $.svg(`
			<g>
				<rect class="lyphTemplate"></rect>
				<svg class="axis">
					<defs>
						<clipPath id="${clipPathId}">
							<rect x="0" y="0" height="100%" width="100%"></rect>
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
		this.p('hovering').plug(Kefir.merge([
			lyphTemplate.asKefirStream('mouseenter').map(()=>true ),
			lyphTemplate.asKefirStream('mouseleave').map(()=>false)
		]));

		lyphTemplate.attrPlug({
			x:      this.p('x'),
			y:      this.p('y'),
			width:  this.p('width'),
			height: this.p('height')
		});

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

		let axisPos = this.xywhr.map(({x, y, width, height, rotation}) => sw(rotation)({
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
		axis.attrPlug({
			x:      axisPos.map(get('x')),
			y:      axisPos.map(get('y')),
			width:  axisPos.map(get('width')),
			height: axisPos.map(get('height'))
		});
		axisText.attrPlug('writing-mode', axisPos.map(get('writingMode')));
		axisText.filter('.minus').attrPlug({
			x:             axisPos.map(get('minusX')),
			y:             axisPos.map(get('minusY')),
			'text-anchor': axisPos.map(get('minusAnchor'))
		});
		axisText.filter('.label').attrPlug({
			x:             axisPos.map(get('labelX')),
			y:             axisPos.map(get('labelY')),
			'text-anchor': axisPos.map(get('labelAnchor'))
		});
		axisText.filter('.plus').attrPlug({
			x:             axisPos.map(get('plusX')),
			y:             axisPos.map(get('plusY')),
			'text-anchor': axisPos.map(get('plusAnchor'))
		});


		/* add layer elements and change their positioning based on observed changes */
		// TODO: make layers 'independent' like the other entities;
		//     : give them lwidth, lheight, etc.
		//     : those can be used for the 'required' layer thickness, rather than an even divide
		//     : make sure to create a 'container rectangle' concept, so that the layers can ignore the lyph-template axis
		for (let lTBox of this.layerTemplateBoxes) {
			const layerThickness = (height) => (height - this.axisThickness) / (this.model ? this.model.layers.length : 5);
			result.children('.child-container').append(lTBox.element);
			let layerPos = this.xywhr.map(({x, y, width, height, rotation}) => layerRot(rotation)({
				x: x,
				y: y + (this.layerTemplateBoxes.length - lTBox.model.position) * layerThickness(height),
				width:  width,
				height: layerThickness(height)
			}));
			lTBox.p('x')     .plug(layerPos.map(get('x')));
			lTBox.p('y')     .plug(layerPos.map(get('y')));
			lTBox.p('width') .plug(layerPos.map(get('width')));
			lTBox.p('height').plug(layerPos.map(get('height')));
		}


		/* draggable layer dividers */
		// TODO: put these borders everywhere (not just in between layers),
		//     : and they can act as snap-targets too.
		for (let [ltBox, joiningLtBox] of inbetween(this.layerTemplateBoxes)) {
			let border = new LayerBorderLine({
				parent: this,
				layer : ltBox,
				side  : 'outer',
				model : { type: 'Border', id: -1 } // TODO: real border model
			});
			this.root.appendChildElement(border);

			interact(border.handle[0]).draggable({
				onstart: (event) => {
					event.stopPropagation();
					this.moveToFront();
				},
				onmove: ({dx, dy}) => {

					switch (border.orientation) {
						case 'horizontal': {

							console.log('TODO: horizontal border dragging:', border.position);

						} break;
						case 'vertical': {

							console.log('TODO: vertical border dragging', border.position);

						} break;
					}

					// /* restriction correction */
					// visible.x = boundBy( rootRect.left, rootRect.left + rootRect.width  - this.width  )( visible.x );
					// visible.y = boundBy( rootRect.top,  rootRect.top  + rootRect.height - this.height )( visible.y );

				}
			});
		}



		/* delete clicker (not rotated) */
		let deleteClicker = this.deleteClicker();
		deleteClicker.element.appendTo(result.children('.delete-clicker'));
		(deleteClicker.element).attrPlug({
			x: this.p(['width',  'x']).map(([width, x]) => width + x),
			y: this.p( 'y'           )
		});
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
		(rotateClicker.element).attrPlug({
			x: this.p('x'),
			y: this.p('y')
		});
			// .attrPlug('x', this.p('x'))
			// .attrPlug('y', this.p('y'));
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
				let visible = clone(raw);

				// TODO: snapping

				/* restriction correction */
				visible.x = clamp( rootRect.left, rootRect.left + rootRect.width  - this.width  )( visible.x );
				visible.y = clamp( rootRect.top,  rootRect.top  + rootRect.height - this.height )( visible.y );

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
				if (edges.left) { raw.x = proposedRect.left - (raw.width  - proposedRect.width ) }
				if (edges.top)  { raw.y = proposedRect.top  - (raw.height - proposedRect.height) }

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
					visible.width = (this.parent.x + this.parent.width) - visible.x;
				}
				console.log(this.parent);
				console.log(edges.bottom, visible.y, visible.height, this.parent.y, this.parent.height);
				if (edges.bottom && visible.y + visible.height > this.parent.y + this.parent.height) {
					console.log('   ---');
					visible.height = (this.parent.y + this.parent.height) - visible.y;
				}

				/* set visible (x, y) based on snapping and restriction */
				this.set(visible);
			}
		};
	}

}
