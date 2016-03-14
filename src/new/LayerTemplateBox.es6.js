import _, {pick, isFinite, identity} from 'lodash';
import $                             from '../libs/jquery.es6.js';
import {getHsvGolden}                from 'golden-colors';

import SvgEntity from './SvgEntity.es6.js';
import NodeCircle from "./NodeCircle.es6.js";


const _color = Symbol('color');


export default class LyphTemplateBox extends SvgEntity {

	// get x()  { return this.getVal('x') }
	// set x(v) { this.setVal('x', v)  }
	//
	// get y()  { return this.getVal('y') }
	// set y(v) { this.setVal('y', v)  }
	//
	// get width()  { return this.getVal('width') }
	// set width(v) { this.setVal('width', v) }
	//
	// get height()  { return this.getVal('height') }
	// set height(v) { this.setVal('height', v)  }

	constructor(options) {
		super(options);
		// Object.assign(this, pick(options, 'x', 'y', 'width', 'height'));

		this.newProperty('x',        { initial: options.x,      isValid: isFinite });
		this.newProperty('y',        { initial: options.y,      isValid: isFinite });
		this.newProperty('width',    { initial: options.width,  isValid: isFinite });
		this.newProperty('height',   { initial: options.height, isValid: isFinite });

	}

	createElement() {
		/* main HTML */
		let result = $.svg(`
			<g>
				<rect class="layerTemplate"></rect>
				<g class="child-container"></g>
			</g>
		`);

		/* create a random color (one per layer, stored in the model) */
		if (!this.model[_color]) {
			this.model[_color] = getHsvGolden(0.8, 0.8);
		}

		/* extract and style important elements */
		const layerTemplate = result.children('rect.layerTemplate').css({
			stroke:         'black',
			fill:           this.model[_color].toHexString(),
			shapeRendering: 'crispEdges',
			pointerEvents:  'none'
		});

		/* alter DOM based on observed changes */
		for (let prop of ['x', 'y', 'width', 'height']) {
			this.p(prop).onValue((v) => { layerTemplate.attr(prop, v) });
		}

		// this.observeExpressions([[layerTemplate, {
		// 	x:      [['x'],      (x)      => x      ],
		// 	y:      [['y'],      (y)      => y      ],
		// 	width:  [['width'],  (width)  => width  ],
		// 	height: [['height'], (height) => height ]
		// }]], {
		// 	setter(element, key, val) { element.attr(key, val) },
		// 	ready: isFinite
		// });

		// TODO: react to things being dragged in the canvas by making pointerEvents be 'all'

		return result;
	}

	dropzone() {
		return {
			overlap: 1, // require whole rectangle to be inside
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
				other.setParent(this);
				this.appendChildElement(other);
				console.log(`'${other.model.name}' (${other.model.id}) dropped into '${this.parent.model.name}[${this.model.position}]' (${this.model.id})`);
			}
		};
	}

	appendChildElement(newChild) {
		this.element.children('.child-container').append(newChild.element);
	}

	innerToOuter({x, y}) {
		return super.innerToOuter({
			x: this.x + x,
			y: this.y + y
		});
	}

}
