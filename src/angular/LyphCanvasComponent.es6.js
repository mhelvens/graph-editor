import {Component, ChangeDetectorRef, ElementRef, EventEmitter} from '../../node_modules/angular2/core';
import $                                                        from '../libs/jquery.es6.js';
import join                                                     from 'lodash/fp/join';
import get                                                      from 'lodash/fp/get';
import defer                                                    from 'lodash/defer';
import interact                                                 from '../libs/interact.js';
import Kefir from '../libs/kefir.es6.js';

import {sw} from '../util/misc.es6.js';

import {property, event}  from '../canvas/ValueTracker.es6.js';
import SvgContainerEntity from '../canvas/SvgContainerEntity.es6.js';
import LyphTemplateBox    from '../canvas/LyphTemplateBox.es6.js';
import NodeCircle         from '../canvas/NodeCircle.es6.js';
import ProcessLine        from '../canvas/ProcessLine.es6.js';
import LayerBorderLine    from '../canvas/LayerBorderLine.es6.js';


@Component({
    selector: 'lyph-canvas',
	inputs: ['activeTool'],
	events: ['added'],
    template: `

		<svg id="svg-canvas">

			<g class="svg-lyph-template-boxes"></g>
			
			<g class="svg-layer-borders"></g>

			<g class="svg-process-edges"></g>

			<g class="svg-nodes"></g>

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

	added = new EventEmitter;

	@property({initial: false}) draggingSomething; // TODO: make this hierarchical; a property of SvgContainerEntity
	@property({initial: false}) resizingSomething;

	@event() canvasResizedOrMoved;

	constructor({nativeElement}: ElementRef, changeDetectorRef: ChangeDetectorRef) {
		super({ model: null, parent: null });
		Object.assign(this, { nativeElement, changeDetectorRef });
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

			let mouseCoords = this.pageToCanvas({ x: event.pageX, y: event.pageY });

			this.activeTool.result = await sw(this.activeTool.form)({
				'box':     ()=> this.deployTool_LyphTemplateBox(event, mouseCoords),
				'node':    ()=> this.deployTool_NodeCircle     (event, mouseCoords),
				'process': ()=> this.deployTool_ProcessLine    (event, mouseCoords)
			});

			this.added.next(this.activeTool);

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

	deployTool_NodeCircle(event, {x, y}) {
		let node = new NodeCircle({
			parent: this,
			model : { id: -1, name: 'test node' }, // TODO: real node models
			x, y
		});
		this.element.find('.svg-nodes').append(node.element);
		return node.startDraggingBy(event);
	};
	
	deployTool_ProcessLine(event, {x, y}) {
		let process = new ProcessLine({
			parent: this,
			model : this.activeTool.model, // TODO: real process models
			source: new NodeCircle({
				parent: this,
				model : { id: -1, name: 'test source node' }, // TODO: real node models
				x, y
			}),
			target: new NodeCircle({
				parent: this,
				model : { id: -1, name: 'test target node' }, // TODO: real node models
				x, y
			})
		});
		this.element.find('.svg-nodes').append(process.source.element).append(process.target.element);
		this.element.find('.svg-process-edges').append(process.element);
		return process.target.startDraggingBy(event);
	};

	deployTool_LyphTemplateBox(event, {x, y}) {
		let lyphTemplateBox = new LyphTemplateBox({
			parent: this,
			model : this.activeTool.model,
			x, y
		});
		this.element.find('.svg-lyph-template-boxes').append(lyphTemplateBox.element);
		return lyphTemplateBox.startResizingBy(event);
	};

	appendChildElement(newChild) {
		if (newChild instanceof LyphTemplateBox) {
			this.element.children('.svg-lyph-template-boxes').append(newChild.element);
		}
		if (newChild instanceof NodeCircle) {
			this.element.children('.svg-nodes').append(newChild.element);
		}
		if (newChild instanceof ProcessLine) {
			this.element.children('.svg-process-edges').append(newChild.element);
		}
		if (newChild instanceof LayerBorderLine) {
			this.element.children('.svg-layer-borders').append(newChild.element);
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
