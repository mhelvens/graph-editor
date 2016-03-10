import _, {pick, range, zip, sortBy} from 'lodash';
import $                             from '../libs/jquery.es6.js';

import {assert, boundBy} from '../util/misc.es6.js';
import Resources         from '../util/Resources.es6.js';
import SvgEntity         from './SvgEntity.es6.js';
import LayerTemplateBox  from './LayerTemplateBox.es6.js';


export default class LyphTemplateBox extends SvgEntity {

	get axisThickness() { return 15 }

	get x()  { return this.getVal('x') }
	set x(v) { this.setVal('x', v)  }

	get y()  { return this.getVal('y') }
	set y(v) { this.setVal('y', v)  }

	get width()  { return this.getVal('width') }
	set width(v) { this.setVal('width', Math.max(this.minWidth, parseInt(v, 10))) }

	get height()  { return this.getVal('height') }
	set height(v) { this.setVal('height', Math.max(this.minHeight, parseInt(v, 10)))  }

	get minWidth ()   { return 2 * (this.axisThickness + 1)                                         }
	get minHeight()   { return this.axisThickness + (this.model ? this.model.layers.length * 2 : 5) }

	get hovering()  { return this.getVal('hovering') }
	set hovering(v) { this.setVal('hovering', v)     }

	layerTemplateBoxes = [];

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
				<text class="axis minus"> − </text>
				<text class="axis plus "> + </text>
				<text class="axis label" clip-path="url(#name-space)">${this.model.name}</text>
				
				<g class="child-container"></g>
				<g class="delete-clicker"></g><!-- TODO -->
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
			stroke:         'black',
			fill: 'white',
			fontSize: '14px',
			textRendering: 'geometricPrecision',
			pointerEvents: 'none',
			dominantBaseline: 'text-before-edge'
		});
		const axisMinus = axisText.filter('.minus').css('text-anchor', 'start');
		const axisPlus  = axisText.filter('.plus') .css('text-anchor', 'end');
		const axisLabel = axisText.filter('.label').css('text-anchor', 'middle');
		const nameSpacePath = result.find('defs > clipPath > rect.name-space');

		/* alter DOM based on observed changes */
		lyphTemplate.mouseenter(() => { this.hovering = true  });
		lyphTemplate.mouseleave(() => { this.hovering = false });
		this.observeExpressions([
			[lyphTemplate, {
				x:      [['x'],      (x)      => x      ],
				y:      [['y'],      (y)      => y      ],
				width:  [['width'],  (width)  => width  ],
				height: [['height'], (height) => height ]
			}],
			[nameSpacePath, {
				x:      [['x'],           (x)         => x + this.axisThickness          ],
				y:      [['y', 'height'], (y, height) => y + height - this.axisThickness ],
				width:  [['width'],       (width)     => width - 2 * this.axisThickness  ]
			}],
			[axis, {
				x:      [['x'],           (x)         => x                               ],
				y:      [['y', 'height'], (y, height) => y + height - this.axisThickness ],
				width:  [['width'],       (width)     => width                           ]
			}],
			[axisMinus, { x: [['x'],           (x)         => x + 1                                 ] }],
			[axisPlus,  { x: [['x', 'width'],  (x, width)  => x + width - 1                         ] }],
			[axisLabel, { x: [['x', 'width'],  (x, width)  => x + width / 2                         ] }],
			[axisText,  { y: [['y', 'height'], (y, height) => y + height - this.axisThickness - 0.5 ] }]
		], {
			setter(element, key, val) { element.attr(key, val) },
			ready: isFinite
		});

		/* add layer elements and change their positioning based on observed changes */
		const layerHeight = (height) => (height - this.axisThickness) / (this.model ? this.model.layers.length : 5);
		for (let lTBox of this.layerTemplateBoxes) {
			result.children('.child-container').append(lTBox.element);
			this.observeExpressions([[lTBox, {
				x:      [['x'],           (x)         => x                                                                                 ],
				y:      [['height', 'y'], (height, y) => y + (this.layerTemplateBoxes.length - lTBox.model.position) * layerHeight(height) ],
				width:  [['width'],       (width)     => width                                                                             ],
				height: [['height'],      (height)    => layerHeight(height)                                                               ]
			}]], {
				setter(element, key, val) { element[key] = val },
				ready: isFinite
			});
		}

		/* delete button */
		let deleteClicker = this.createDeleteClicker();
		deleteClicker.element.appendTo(result.children('.delete-clicker'));
		this.observeExpressions([[deleteClicker.element, {
			x: [['width',  'x'], (width,  x) => width + x ],
			y: [['y'],           (y)         => y         ]
		}]], {
			setter(element, key, val) { element.attr(key, val) },
			ready: isFinite
		});
		const showHideDeleteClicker = () => {
			if (this.hovering || deleteClicker.hovering) {
				deleteClicker.element.show();
			} else {
				deleteClicker.element.hide();
			}
		};
		this         .observe('hovering', showHideDeleteClicker);
		deleteClicker.observe('hovering', showHideDeleteClicker);

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
				raw      = this.getVals('x', 'y');
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

				/* difference in visible (x, y) */
				dx = visible.x - this.x;
				dy = visible.y - this.y;

				/* set visible (x, y) based on snapping and restriction */
				this.traverse((entity) => {
					entity.x += dx;
					entity.y += dy;
				});
				// this.setVals(visible);
			}
		};
	}

	resizable() {
		let raw, parentRect;
		return {
			handle: '.lyphTemplate',
			edges: { left: true, right: true, bottom: true, top: true },
			onstart: (event) => {
				event.stopPropagation();
				this.moveToFront();

				/* initialize interaction-local variables */
				raw        = this.getVals('x', 'y', 'width', 'height');
				parentRect = this.parent.boundingBox();
			},
			onmove: ({rect, edges}) => {

				let proposedRect = this.pageToCanvas(rect);

				/* update raw coordinates */
				raw.width  = Math.max(proposedRect.width,  this.minWidth );
				raw.height = Math.max(proposedRect.height, this.minHeight);
				if (edges.left || edges.top) {
					raw.x = proposedRect.left - (edges.left ? raw.width  - proposedRect.width  : 0) - parentRect.left;
					raw.y = proposedRect.top  - (edges.top  ? raw.height - proposedRect.height : 0) - parentRect.top;
				}

				/* initialize visible coordinates */
				let visible = { ...raw };

				/* restriction correction */
				if (edges.left && visible.x < parentRect.left) {
					visible.width += visible.x;
					visible.x = parentRect.left;
				}
				if (edges.top && visible.y < parentRect.left) {
					visible.height += visible.y;
					visible.y = parentRect.top;
				}
				if (edges.right && visible.x + visible.width > parentRect.left + parentRect.width) {
					visible.width = parentRect.left + parentRect.width - visible.left;
				}
				if (edges.bottom && visible.y + visible.height > parentRect.top + parentRect.height) {
					visible.height = parentRect.top + parentRect.height - visible.y;
				}

				/* set visible (x, y) based on snapping and restriction */
				this.setVals(visible);
			}
		};
	}

	innerToOuter({x, y}) {
		return super.innerToOuter({
			x: this.x + x,
			y: this.y + y
		});
	}

}
