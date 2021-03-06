import {Component, ChangeDetectorRef, ElementRef, EventEmitter} from '../../node_modules/angular2/core';
import $                                                        from '../libs/jquery.es6.js';
import join                                                     from 'lodash/fp/join';
import get                                                      from 'lodash/fp/get';
import defer                                                    from 'lodash/defer';
import interact                                                 from '../libs/interact.js';
import Kefir from '../libs/kefir.es6.js';

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
		/* using the current tool on mouse-down */
		interact(this.element[0]).on('down', (event) => {
			if (!this.activeTool) { return } // TODO: instead of this test, use the Null Object design pattern
			this.activeTool.onMouseDown(this, event)
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

}
