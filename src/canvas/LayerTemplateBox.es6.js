import $       from '../libs/jquery.es6.js';
import chroma  from '../libs/chroma.es6.js';
import get     from 'lodash/fp/get';
import invokeMap from 'lodash/invokeMap';
import pick from 'lodash/pick';
import toPairs from 'lodash/toPairs';
import defer from 'lodash/defer';
import Kefir from '../libs/kefir.es6.js';
import interact from '../libs/interact.js';
import Fraction, {isNumber, sum, equals} from '../libs/fraction.es6.js';

import {property}          from './ValueTracker.es6.js';
import {uniqueId, sw, swf} from '../util/misc.es6.js';
import SvgContainerEntity  from './SvgContainerEntity.es6.js';
import LyphTemplateBox     from './LyphTemplateBox.es6.js';
import ErrorBox            from './ErrorBox.es6.js';


const pluggedIntoParent = Symbol('pluggedIntoParent');
const backgroundColor   = Symbol('backgroundColor');


const TEXT_PADDING = 6;


export default class LayerTemplateBox extends SvgContainerEntity {


	@property({isValid: isNumber})  thickness;
	@property({isValid: (v) => isNumber(v) && 0 <= v && v <= 1}) lthickness;


	constructor(options) {
		super(options);

		Object.assign(this, pick(options, 'thickness', 'lthickness'));

		this.p('width') .plug(this.p('thickness').filterBy(this.p('orientation').value('vertical')  ));
		this.p('height').plug(this.p('thickness').filterBy(this.p('orientation').value('horizontal')));

		/* create the material boxes*/
		this.materialBoxes = [];
		this.materialBoxes = _(this.model.getMaterials()).map(lyph => {
			if (this.hasAncestor(entity => entity.model === lyph)) {
				return new ErrorBox({
					model: {
						type: 'Error',
						message: "nesting"
					}
				});
			} // nesting cycle
			return new LyphTemplateBox({
				parent:      this,
				model:       lyph,
				interactive: false
			});
		}).filter().value();

		/* event binding to keep the material boxes properly positioned */
		if (this.materialBoxes.length > 0) {
			const margin = Fraction(1).div(50);
			let widthPerBox  = Fraction(1 - margin).div(this.materialBoxes.length + 1);
			let boxWidth     = widthPerBox.sub(margin);
			let heightPerBox = Fraction(1 - margin).div(3);
			let boxHeight    = heightPerBox.sub(margin);
			let lxywh = Kefir.combine([this.p('orientation'), this.p('x'), this.p('y'), this.p('width'), this.p('height')], (o, x, y, width, height) => sw(o)({
				horizontal: { lx: i=>Fraction(1).sub(widthPerBox.mul(i+1)), ly: i=>Fraction(1).sub(heightPerBox),         lwidth: boxWidth,  lheight: boxHeight },
				vertical:   { lx: i=>margin,                                ly: i=>Fraction(1).sub(widthPerBox.mul(i+1)), lwidth: boxHeight, lheight: boxWidth  }
			}));

			for (let [mb, i] of this.materialBoxes.map(Array.of)) {
				mb.p('lx')     .plug(lxywh.map(({lx})=>lx(i) ));
				mb.p('ly')     .plug(lxywh.map(({ly})=>ly(i) ));
				mb.p('lwidth') .plug(lxywh.map(get('lwidth') ));
				mb.p('lheight').plug(lxywh.map(get('lheight')));
			}
		}

	}


	setParent(newParent) {
		super.setParent(newParent);

		/* unplug any connections to the old parent */
		invokeMap(this[pluggedIntoParent] || [], 'unplug');
		this[pluggedIntoParent] = [];


		if (!newParent) { return }


		/* thickness change triggers */
		let manualTrigger;
		let triggers = [
			this.p('orientation'),
			this.parent.p('cheight'),
			this.parent.p('cwidth'),
		    Kefir.stream((emitter) => { manualTrigger = emitter.emit })
		];

		/* mutual dependency: lthickness -> thickness */
		this.p('thickness').plug(
			Kefir.combine([
				this.p('lthickness'),
				...triggers
			], (lthickness) => sw(this.orientation)({
				horizontal: ()=> lthickness.mul(this.parent.cheight),
				vertical:   ()=> lthickness.mul(this.parent.cwidth)
			}))
		);

		/* mutual dependency: thickness -> lthickness */
		this.p('lthickness').plug(
			Kefir.combine([
				this.p('thickness'),
				...triggers
			], (thickness) => sw(this.orientation)({
				horizontal: ()=> thickness.div(this.parent.cheight),
				vertical:   ()=> thickness.div(this.parent.cwidth)
			}))
		);


		defer(() => { // TODO: how to get rid of this defer (i.e., why can the below not be done synchronously?)

			/* make connections to the new parent */
			const _px = this.parent.p('cx');
			const _py = this.parent.p('cy');
			const _pw = this.parent.p('cwidth');
			const _ph = this.parent.p('cheight');
			const _r  = this.p('rotation'); // TODO: just take own rotation, since it's there
			const _t  = this.p('thickness');

			let allLayers = this.parent.layerTemplateBoxes;

			let _thicknessInward  = Kefir.combine([Kefir.constant(Fraction(0)), ...allLayers.filter(l => l.model.position < this.model.position).map(lTBox => lTBox.p('thickness'))]).map(sum);
			let _thicknessOutward = Kefir.combine([Kefir.constant(Fraction(0)), ...allLayers.filter(l => l.model.position > this.model.position).map(lTBox => lTBox.p('thickness'))]).map(sum);

			let xywh = Kefir.combine([_px, _py, _pw, _ph, _r, _t, _thicknessInward, _thicknessOutward]).map(([px, py, pw, ph, r, t, tIn, tOut]) => sw(r)({
				0:   { x: px,        y: py + tOut, width: pw, height: t  },
				90:  { x: px + tIn,  y: py,        width: t,  height: ph },
				180: { x: px,        y: py + tIn,  width: pw, height: t  },
				270: { x: px + tOut, y: py,        width: t,  height: ph },
			}));

			this.p('x')     .plug(xywh.map(get('x')     ));
			this.p('y')     .plug(xywh.map(get('y')     ));
			this.p('width') .plug(xywh.map(get('width') ));
			this.p('height').plug(xywh.map(get('height')));

			manualTrigger();

		});
	};

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
				<g class="material-container"></g>
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
			fontSize:         `${this.interactive ? 14 : 9}px`,
			pointerEvents:    'none',
			dominantBaseline: 'text-before-edge'
		});
		const materialContainer = result.children('.material-container');
		if (!this.interactive) {
			layerTemplate.css({ strokeDasharray: '3,3' });
		}

		/* alter DOM based on observed changes */
		layerTemplateBounds.attrPlug({
			x:      this.p('x'),
			y:      this.p('y'),
			width:  this.p('width'),
			height: this.p('height')
		});
		let textPos = this.p(['width', 'orientation']).map(([width, orientation]) => sw(orientation)({
			horizontal: { x: TEXT_PADDING,         y: TEXT_PADDING, writingMode: 'horizontal-tb' },
			vertical:   { x: width - TEXT_PADDING, y: TEXT_PADDING, writingMode: 'vertical-rl'   }
		}));
		layerText.attrPlug({
			x:              textPos.map(get('x')),
			y:              textPos.map(get('y')),
			'writing-mode': textPos.map(get('writingMode'))
		});

		/* put materials */
		for (let mb of this.materialBoxes) { materialContainer.append(mb.element) }

		/* using the current tool on mouse-down */
		layerTemplate.cssPlug('pointer-events', this.root.p('activeTool').map(at => at?'all':'none').takeUntilBy(this.e('delete')));
		layerTemplate.cssPlug('cursor', this.root.p('activeTool').map(at => at?'pointer':'auto').takeUntilBy(this.e('delete')));
		interact(layerTemplate[0]).on('down', (event) => {
			if (!this.root.activeTool) { return } // TODO: instead of this test, use the Null Object design pattern
			event.preventDefault();
			event.stopPropagation();
			this.root.activeTool.onMouseDown(this, event);
		});

		return result;
	}

	dropzone() {
		return {
			overlap: 1, // TODO: put 'center' and correct for incomplete coverage
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
