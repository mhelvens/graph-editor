import _, {pick, isFinite, identity, includes} from 'lodash';
import $                                       from '../libs/jquery.es6.js';
import {getHsvGolden}                          from 'golden-colors';
import chroma                                  from 'chroma-js';

import {uniqueId, sw} from '../util/misc.es6.js';
import {property}     from './ValueTracker.es6.js';
import SvgEntity      from './SvgEntity.es6.js';


const _color = Symbol('color');


function isRotation(v) { return _([0, 90, 180, 270]).includes(v) }


export default class LayerTemplateBox extends SvgEntity {

	@property({isValid: isFinite})               x;
	@property({isValid: isFinite})               y;
	@property({isValid: isFinite})               width;
	@property({isValid: isFinite})               height;
	@property({isValid: isRotation, initial: 0}) rotation;
	// TODO: l-versions of these four properties? For now, the LyphTemplateBox has full control.

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'x', 'y', 'width', 'height'));

		this.p('rotation').plug(this.parent.p('rotation'));
	}

	createElement() {
		/* create a random color (one per layer, stored in the model) */
		if (!this.model[_color]) {
			this.model[_color] = getHsvGolden(0.8, 0.8);
		}

		/* main HTML */
		let clipPathId = uniqueId('clip-path');
		let result = $.svg(`
			<g>
				<svg class="layerTemplateBounds">
					<rect class="layerTemplate" x="0" y="0" width="100%" height="100%"></rect>
					<defs>
						<clipPath id="${clipPathId}">
							<rect x="0" y="0" height="100%" width="100%"></rect>
						</clipPath>
					</defs>
					<text clip-path="url(#${clipPathId})"> ${this.model.name || ''} (${this.model.id}) </text>
				</svg>
				<g class="child-container"></g>
			</g>
		`);

		/* extract and style important elements */
		const layerTemplateBounds = result.children('svg');
		const layerTemplate = layerTemplateBounds.children('rect.layerTemplate').css({
			stroke:         'black',
			fill:           this.model[_color].toHexString(),
			shapeRendering: 'crispEdges',
			pointerEvents:  'none'
		});
		const layerText = layerTemplateBounds.children('text').css({
			stroke:           'none',
			fill:             chroma(this.model[_color].toHexString()).darken(2).hex(),
			fontSize:         '14px',
			pointerEvents:    'none',
			dominantBaseline: 'central'
		});

		/* alter DOM based on observed changes */
		layerTemplateBounds
			.attrPlug('x',      this.p('x'))
			.attrPlug('y',      this.p('y'))
			.attrPlug('width',  this.p('width'))
			.attrPlug('height', this.p('height'));
		
		let posObj = this.p(['x', 'y', 'width', 'height', 'rotation']) // TODO: un-duplicate this code
		                 .map(([x, y, width, height, rotation]) => ({ x, y, width, height, rotation }));
		let textPos = posObj.map(({width, rotation}) => sw(rotation)({
			0: {
				x:           7,
				y:           13,
				writingMode: 'horizontal-tb'
			},
			90: {
				x:           width - 13,
				y:           7,
				writingMode: 'vertical-rl'
			},
			180: {
				x:           7,
				y:           13,
				writingMode: 'horizontal-tb'
			},
			270: {
				x:           width - 13,
				y:           7,
				writingMode: 'vertical-rl'
			}
		}));
		layerText
			.attrPlug('x',            textPos.map(o=>o.x          ))
			.attrPlug('y',            textPos.map(o=>o.y          ))
			.attrPlug('writing-mode', textPos.map(o=>o.writingMode));

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
