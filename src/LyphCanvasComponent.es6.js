import {Component, ChangeDetectorRef, ElementRef, EventEmitter} from 'angular2/core';
import $                                                        from 'jquery';
import interact                                                 from './libs/interact.js';

import {sw} from './util/misc.es6.js';

import SVGEntity         from './new/SvgEntity.es6.js';
import LyphTemplateBox   from './new/LyphTemplateBox.es6.js';
import NodeCircle        from './new/NodeCircle.es6.js';
import ProcessLine       from './new/ProcessLine.es6.js';
import CanonicalTreeLine from './new/CanonicalTreeLine.es6.js';


@Component({
    selector: 'lyph-canvas',
	inputs: ['activeTool'],
	events: ['added'],
    template: `

		<svg id="svg-canvas">

			<g class="svg-lyph-template-boxes"></g>

			<g class="svg-process-edges"></g>

			<g class="svg-nodes"></g>

		</svg>

    `,
	styles: [`

		:host, :host > svg {
			position:   absolute;
			top:        0;
			left:       0;
			min-width:  100%;
			min-height: 100%;
			padding:    0;
			margin:     0;
		}

	`]
})
export default class LyphCanvasComponent extends SVGEntity {

	added = new EventEmitter;

	constructor({nativeElement}: ElementRef, changeDetectorRef: ChangeDetectorRef) {
		super({
			model:  null,
			parent: null
		});
		Object.assign(this, {
			nativeElement,
			changeDetectorRef
		});
	}

	createElement() {
		return $(this.nativeElement).find('#svg-canvas').css({ overflow: 'visible' });
	}

	ngAfterViewInit() {

		/* creating new artefacts by clicking down the mouse */
		interact(this.element[0]).on('down', async (event) => {

			if (!this.activeTool) { return }

			let mouseCoords = this.pageToCanvas({ x: event.pageX, y: event.pageY});

			this.activeTool.result = await sw(this.activeTool.form)({
				'box':                 ()=> this.deployTool_LyphTemplateBox(event, mouseCoords),
				'node':                ()=> this.deployTool_NodeCircle     (event, mouseCoords),
				'process':             ()=> this.deployTool_ProcessLine    (event, mouseCoords),
				'canonical-tree-line': ()=> this.deployTool_CanonicalTree  (event, mouseCoords)
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
		$(this.nativeElement).find('.svg-nodes').append(node.element);
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
		$(this.nativeElement).find('.svg-nodes').append(process.source.element).append(process.target.element);
		$(this.nativeElement).find('.svg-process-edges').append(process.element);
		return process.target.startDraggingBy(event);
	};
	
	deployTool_CanonicalTree(event, {x, y}) {
		let process = new CanonicalTreeLine({
			parent: this,
			model : { id: -1, name: 'test canonicalTree' }, // TODO: real process models
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
		$(this.nativeElement).find('.svg-nodes').append(process.source.element).append(process.target.element);
		$(this.nativeElement).find('.svg-process-edges').append(process.element);
		return process.target.startDraggingBy(event);
	};

	deployTool_LyphTemplateBox(event, {x, y}) {
		let lyphTemplateBox = new LyphTemplateBox({
			parent: this,
			model : this.activeTool.model,
			x, y
		});
		$(this.nativeElement).find('.svg-lyph-template-boxes').append(lyphTemplateBox.element);
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
	}

	pageToCanvas({x, y, left, right, top, bottom, width, height}) {
		let r = this.element[0].getBoundingClientRect();
		if (isFinite(x))      { x      -= r.left }
		if (isFinite(left))   { left   -= r.left }
		if (isFinite(right))  { right  -= r.left }
		if (isFinite(y))      { y      -= r.top  }
		if (isFinite(top))    { top    -= r.top  }
		if (isFinite(bottom)) { bottom -= r.top  }
		return {x, y, left, right, top, bottom, width, height};
	}

	// boundingBox() { // TODO: remove after inheriting SVGEntity
	// 	return this.pageToCanvas(this.element[0].getBoundingClientRect());
	// }

}
