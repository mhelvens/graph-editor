import {Component, ChangeDetectorRef, ElementRef, EventEmitter} from '../../node_modules/angular2/core';
import $                                                        from '../libs/jquery.es6.js';
import join                                                     from 'lodash/fp/join';
import get                                                      from 'lodash/fp/get';
import defer                                                    from 'lodash/defer';
import pick                                                     from 'lodash/pick';
import interact                                                 from '../libs/interact.js';
import Kefir from '../libs/kefir.es6.js';

import {sw, abs} from '../util/misc.es6.js';

import {property, event}  from '../canvas/ValueTracker.es6.js';
import SvgContainerEntity from '../canvas/SvgContainerEntity.es6.js';
import LyphTemplateBox    from '../canvas/LyphTemplateBox.es6.js';
import NodeCircle         from '../canvas/NodeCircle.es6.js';
import ProcessLine        from '../canvas/ProcessLine.es6.js';


@Component({
    selector: 'lyph-canvas',
	inputs: ['activeTool'],
	events: ['resetTool'],
    template: `

		<svg id="svg-canvas">

			<g class="svg-lyph-template-boxes"></g>

			<g class="svg-process-edges"></g>

		</svg>

    `,
	styles: [`

		:host, :host > svg {
			position:   absolute;
			top:        0;
			left:       0;
			padding:    0;
			margin:     0;
			min-width:  100%;
			min-height: 100%;
			max-width:  100%;
			max-height: 100%;
		}

	`]
})
export default class LyphCanvasComponent extends SvgContainerEntity {

	resetTool = new EventEmitter;

	@property({initial: null }) activeTool;

	@property({initial: false}) draggingSomething; // TODO: make this hierarchical; a property of SvgContainerEntity
	@property({initial: false}) resizingSomething;

	@event() canvasResizedOrMoved;

	constructor({nativeElement}: ElementRef, changeDetectorRef: ChangeDetectorRef) {
		super({
			model:  { type: 'Canvas', id: -1 }, // TODO: real canvas models
			parent: null
		});
		Object.assign(this, { nativeElement, changeDetectorRef });
		this.p('activeTool').value(null).onValue(() => { this.resetTool.next() });
		this.p('activeTool').plug(
			$('body').asKefirStream('keyup').which(27)
			         .filterBy(this.p('draggingSomething').map(b=>!b))
			         .filterBy(this.p('resizingSomething').map(b=>!b))
			         .map(()=>null)
		);
	}

	createElement() {
		let result = $(this.nativeElement).find('#svg-canvas').css({ overflow: 'visible' });
		result.attrPlug('viewBox', this.p(['cx', 'cy', 'cwidth', 'cheight']).map(join(' ')));
		return result;
	}
	
	plugContainerPositioning() {
		defer(() => {
			let canvasRect = Kefir.merge([
				Kefir.once(),
				Kefir.later(1000),
				this.e('canvasResizedOrMoved')
			]).map(() => this.element.getBoundingClientRect());
			this.p('cx')     .plug(canvasRect.map(get('left'  )));
			this.p('cy')     .plug(canvasRect.map(get('top'   )));
			this.p('cwidth' ).plug(canvasRect.map(get('width' )));
			this.p('cheight').plug(canvasRect.map(get('height')));
		});
	}

	ngAfterViewInit() {

		/* creating new artefacts by clicking down the mouse */
		interact(this.element[0]).on('down', async (event) => {

			if (!this.activeTool) { return }

			let mouseCoords = { x: event.clientX, y: event.clientY };

			sw(this.activeTool.form)({
				'box':             ()=> this.deployTool_LyphTemplateBox(event, mouseCoords),
				// 'node':            ()=> this.deployTool_NodeCircle     (event, mouseCoords),
				'process':         ()=> this.deployTool_ProcessLine    (event, mouseCoords),
				'conveyedProcess': ()=> this.deployTool_ProcessLine    (event, mouseCoords)
			});

		});
	}

	dropzone() {
		return {
			overlap: 'center', // not 1, because we need a fallback drop target
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
				console.log(`'${other.model.name}' (${other.model.id}) dropped into the main canvas`);
			}
		};
	}

	// deployTool_NodeCircle(event, {x, y}) {
	// 	let node = new NodeCircle({
	// 		parent: this,
	// 		model : { id: -1, name: 'test node' }, // TODO: real node models
	// 		x, y
	// 	});
	// 	this.element.find('.svg-nodes').append(node.element);
	// 	return node.startDraggingBy(event);
	// };
	
	async deployTool_ProcessLine(event, {source = this._lastNodeTarget, target, x, y}) {
		let process = new ProcessLine({
			parent: this,
			model : this.activeTool.model,
			source: source || new NodeCircle({
				parent: this,
				model : { id: -1, name: 'test source node' }, // TODO: real node models
				x, y
			}),
			target: target || new NodeCircle({
				parent: this,
				model : { id: -1, name: 'test target node' }, // TODO: real node models
				x, y
			})
		});
		this.appendChildElement(process.source);
		this.appendChildElement(process.target);
		this.appendChildElement(process);



		let lyphTemplateBox = null;
		if (this.activeTool.form === 'conveyedProcess') {

			const RADIUS  = 100;

			lyphTemplateBox = new LyphTemplateBox({
				parent: this,
				model : this.activeTool.lyphTemplate,
				height: RADIUS
			});
			this.appendChildElement(lyphTemplateBox);

			process.target.p(['x', 'y']).takeUntilBy(
				process.target.p('dragging').value(false).skipUntilBy(process.target.p('dragging').value(true))
			).onValue(([x, y]) => {
				const src = process.source;
				let ltb = lyphTemplateBox;
				let {
				    axisThickness,
				    layerTemplateBoxes: [{ model: { representativeThickness: layer1Thickness } }],
				    model: { representativeThickness: lyphTemplateThickness }
			    } = lyphTemplateBox;
				const layer1Shift = axisThickness + (RADIUS - axisThickness) * (layer1Thickness / lyphTemplateThickness) / 2;
				if (src.x < x) {
					ltb.rotation = 0;
					ltb.width    = Math.min(  abs(x-src.x),  100  );
					ltb.x        = src.x + (abs(x-src.x) - ltb.width) / 2;
					ltb.height   = RADIUS;
					ltb.y        = y - RADIUS + layer1Shift;
				} else if (src.y < y) {
					ltb.rotation = 90;
					ltb.height   = Math.min(  abs(y-src.y),  100  );
					ltb.y        = src.y + (abs(y-src.y) - ltb.height) / 2;
					ltb.width    = RADIUS;
					ltb.x        = x - layer1Shift;
				} else if (x < src.x) {
					ltb.rotation = 180;
					ltb.width    = Math.min(  abs(src.x-x),  100  );
					ltb.x        = x + (abs(x-src.x) - ltb.width) / 2;
					ltb.height   = RADIUS;
					ltb.y        = y - layer1Shift;
				} else if (y < src.y) {
					ltb.rotation = 270;
					ltb.height   = Math.min(  abs(src.y-y),  100  );
					ltb.y        = y + (abs(y-src.y) - ltb.height) / 2;
					ltb.width    = RADIUS;
					ltb.x        = x - RADIUS + layer1Shift;
				}
			});

		}



		let result = await process.target.startDraggingBy(event, {
			forceAxisAlignment: (this.activeTool.form === 'conveyedProcess') ? pick(process.source, 'x', 'y') : null
		});
		switch (result.status) {
			case 'finished': {
				this._lastNodeTarget = process.target;
				this.p('activeTool').value(null).take(1).onValue(() => {
					delete this._lastNodeTarget;
				});
			} break;
			case 'aborted': {
				let {source: s, target: t} = process;
				process.delete();
				if (!source) { s.delete() }
				if (!target) { t.delete() }
				this.activeTool = null;
			} break;
		}
	};

	async deployTool_LyphTemplateBox(event, {x, y}) {
		let lyphTemplateBox = new LyphTemplateBox({
			parent: this,
			model : this.activeTool.model,
			x, y
		});
		this.appendChildElement(lyphTemplateBox);
		let result = await lyphTemplateBox.startResizingBy(event);
		if (result.status === 'aborted') {
			lyphTemplateBox.delete();
		}
		this.activeTool = null;
	};

	appendChildElement(newChild) {
		if (newChild instanceof LyphTemplateBox) {
			this.element.children('.svg-lyph-template-boxes').append(newChild.element);
		}
		if (newChild instanceof ProcessLine) {
			this.element.children('.svg-process-edges').append(newChild.element);
		}
		if (newChild instanceof NodeCircle) {
			this.element.children('.svg-process-edges').append(newChild.element);
		}
	}

	pageToCanvas({x, y, left, right, top, bottom, width, height}) {

		// TODO: remove function and function uses

		// let r = this.element.getBoundingClientRect();
		// if (isFinite(x))      { x      -= r.left }
		// if (isFinite(left))   { left   -= r.left }
		// if (isFinite(right))  { right  -= r.left }
		// if (isFinite(y))      { y      -= r.top  }
		// if (isFinite(top))    { top    -= r.top  }
		// if (isFinite(bottom)) { bottom -= r.top  }
		return {x, y, left, right, top, bottom, width, height};
	}

}
