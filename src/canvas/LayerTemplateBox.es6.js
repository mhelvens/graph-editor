import $       from '../libs/jquery.es6.js';
import chroma  from '../libs/chroma.es6.js';
import get     from 'lodash/fp/get';

import {uniqueId, sw}      from '../util/misc.es6.js';
import SvgPositionedEntity from './SvgPositionedEntity.es6.js';


const pluggedIntoParent = Symbol('pluggedIntoParent');
const backgroundColor   = Symbol('backgroundColor');


const TEXT_PADDING = 6;


export default class LayerTemplateBox extends SvgPositionedEntity {

	constructor(options) {
		super(options);
		this.p('rotation').plug(this.parent.p('rotation')); // TODO: this should be automatic by SvgDimensionedEntity
	}

	createElement() {
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

		/* create a random color (one per layer, stored in the model) */
		if (!this.model[backgroundColor]) {
			this.model[backgroundColor] = chroma.randomHsvGolden(0.8, 0.8);
		}

		/* extract and style important elements */
		const layerTemplateBounds = result.children('svg');
		const layerTemplate = layerTemplateBounds.children('rect.layerTemplate').css({
			stroke:         'black',
			fill:           this.model[backgroundColor],
			shapeRendering: 'crispEdges',
			pointerEvents:  'none'
		});
		const layerText = layerTemplateBounds.children('text').css({
			stroke:           'none',
			fill:             this.model[backgroundColor].darken(2.5),
			fontSize:         '14px',
			pointerEvents:    'none',
			dominantBaseline: 'text-before-edge'
		});

		/* alter DOM based on observed changes */
		layerTemplateBounds.attrPlug({
			x:      this.p('x'),
			y:      this.p('y'),
			width:  this.p('width'),
			height: this.p('height')
		});
		let textPos = this.p(['width', 'rotation']).map(([width, rotation]) => sw(rotation)({
			0:   { x: TEXT_PADDING,         y: TEXT_PADDING, writingMode: 'horizontal-tb' },
			90:  { x: width - TEXT_PADDING, y: TEXT_PADDING, writingMode: 'vertical-rl'   },
			180: { x: TEXT_PADDING,         y: TEXT_PADDING, writingMode: 'horizontal-tb' },
			270: { x: width - TEXT_PADDING, y: TEXT_PADDING, writingMode: 'vertical-rl'   }
		}));
		layerText.attrPlug({
			x:              textPos.map(get('x')),
			y:              textPos.map(get('y')),
			'writing-mode': textPos.map(get('writingMode'))
		});

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
