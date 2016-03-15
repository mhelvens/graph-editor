import _, {pick, isFinite, identity, includes} from 'lodash';
import $                                       from '../libs/jquery.es6.js';
import {getHsvGolden}                          from 'golden-colors';

import {property} from './ValueTracker.es6.js';
import SvgEntity  from './SvgEntity.es6.js';
import NodeCircle from './NodeCircle.es6.js';


const _color = Symbol('color');


export default class LayerTemplateBox extends SvgEntity {

	@property({isValid: isFinite}) x;
	@property({isValid: isFinite}) y;
	@property({isValid: isFinite}) width;
	@property({isValid: isFinite}) height;
	// TODO: l-versions of these four properties? For now, the LyphTemplateBox has full control.

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'x', 'y', 'width', 'height'));
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
		layerTemplate
			.attrPlug('x',      this.p('x'))
			.attrPlug('y',      this.p('y'))
			.attrPlug('width',  this.p('width'))
			.attrPlug('height', this.p('height'));

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

}
