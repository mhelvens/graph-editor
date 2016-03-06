import {Component, ChangeDetectorRef, ElementRef, EventEmitter} from 'angular2/core';
import interact                                   from './libs/interact.js';
import $                                          from 'jquery';

import LyphTemplateBoxComponent from './LyphTemplateBoxComponent.es6.js';
import NodeCircleComponent      from './NodeCircleComponent.es6.js';
import ProcessComponent      from './ProcessComponent.es6.js';
import RectangleComponent from './SVGComponent.es6.js';



/* new non-Angular solution */
import NodeCircle from './new/NodeCircle.es6.js';



class BoxCreation {
	constructor(data, onResolved) {
		Object.assign(this, data);
		this.resolve = (createdComponent) => {
			onResolved(createdComponent);
			this.resolve = ()=>{ console.log('BoxCreation#resolve method called more than once!') };
		};
	}
}


@Component({
    selector:   'lyph-canvas',
    directives: [
	    LyphTemplateBoxComponent,
	    NodeCircleComponent,
	    ProcessComponent
    ],
	inputs: ['activeTool'],
	events: ['added'],
    template: `

		<svg id="svg-canvas">

			<g class="svg-lyph-template-boxes">
				<g lyphTemplateBox *ngFor="#t of lyphTemplates" [creation]="t" [activeTool]="activeTool"></g>
			</g>

			<g class="svg-process-edges">
				<g processLine *ngFor="#t of processes" [creation]="t"></g>
			</g>

			<g class="svg-nodes">
				<!--<g nodeCircle *ngFor="#t of nodes" [creation]="t" [activeTool]="activeTool"></g>--><!-- old Angular solution; TODO: remove when new solution works -->
			</g>

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
export default class LyphCanvasComponent extends RectangleComponent {

	lyphTemplates = [];
	nodes         = [];
	processes     = [];

	added = new EventEmitter;

	constructor({nativeElement}: ElementRef, changeDetectorRef: ChangeDetectorRef) {
		super({
			nativeElement,
			changeDetectorRef
		});
	}

	ngOnInit() {

		super.initSVG({
			shell: $(this.nativeElement).children('svg').css({ overflow: 'visible' })
		});

		/* creating new artefacts by clicking down the mouse */
		this.interactable.on('down', (event) => {

			if (!this.activeTool) { return }

			let canvasRect = this.shape[0].getBoundingClientRect();

			if (this.activeTool.form === 'box' && this.activeTool.model.type === 'LyphTemplate') {
				this.lyphTemplates.push(new BoxCreation({
					model:  this.activeTool.model,
					x:      event.clientX - canvasRect.left,
					y:      event.clientY - canvasRect.top,
					width:  100,
					height: 100
				}, (boxComponent) => {
					event.interaction.start(
						{
							name:  'resize',
							edges: { bottom: true, right: true }
						},
						boxComponent.interactable,
						boxComponent.shape[0]
					);
					const onCreateEnd = () => {
						this.added.next(this.activeTool);
						boxComponent.interactable.off('resizeend', onCreateEnd);
					};
					boxComponent.interactable.on('resizeend', onCreateEnd);
				}));
			} else if (this.activeTool.form === 'node') {
				/* commented out Angular solution */
				// this.nodes.push(new BoxCreation({
				// 	model:  { id: -1, name: 'test node' }, // TODO: real node models
				// 	x:      event.clientX - canvasRect.left,
				// 	y:      event.clientY - canvasRect.top
				// }, (nodeComponent) => {
				// 	event.interaction.start(
				// 		{ name: 'drag' },
				// 		nodeComponent.interactable,
				// 		nodeComponent.shape[0]
				// 	);
				// 	const onCreateEnd = () => {
				// 		this.added.next(this.activeTool);
				// 		nodeComponent.interactable.off('dragend', onCreateEnd);
				// 	};
				// 	nodeComponent.interactable.on('dragend', onCreateEnd);
				// }));

				/* new non-Angular solution */


				console.log('(1)');
				let node = new NodeCircle({
					parent: this,
					model:  { id: -1, name: 'test node' }, // TODO: real node models
					x:      event.clientX - canvasRect.left,
					y:      event.clientY - canvasRect.top
				});
				console.log('(2)', $(this.nativeElement).find('.svg-nodes'), node, node.element);
				$(this.nativeElement).find('.svg-nodes').append(node.element);
				console.log('(3)');
				node.startDraggingBy(event).then(() => {
					console.log('(3a)');
					this.added.next(this.activeTool);
					console.log('(3b)');
				});
				console.log('(4)');

			} else if (this.activeTool.form === 'process') {
				this.nodes.push(new BoxCreation({
					model:  { id: -1, name: 'test node: from' }, // TODO: real node models
					x:      event.clientX - canvasRect.left,
					y:      event.clientY - canvasRect.top
				}, (nodeComponent1) => {
					this.nodes.push(new BoxCreation({
						model:  { id: -1, name: 'test node: to' }, // TODO: real node models
						x:      event.clientX - canvasRect.left,
						y:      event.clientY - canvasRect.top
					}, (nodeComponent2) => {
						this.processes.push(new BoxCreation({
							model:  { id: -1, name: 'test process' }, // TODO: real process models
							x1:      event.clientX - canvasRect.left,
							y1:      event.clientY - canvasRect.top,
							x2:      event.clientX - canvasRect.left,
							y2:      event.clientY - canvasRect.top
						}, (processComponent) => {
							nodeComponent1.processStarts.add(processComponent);
							nodeComponent2.processEnds  .add(processComponent);
							event.interaction.start(
								{ name: 'drag' },
								nodeComponent2.interactable,
								nodeComponent2.shape[0]
							);
							const onCreateEnd = () => {
								this.added.next(this.activeTool);
								nodeComponent2.interactable.off('dragend', onCreateEnd);
							};
							nodeComponent2.interactable.on('dragend', onCreateEnd);
						}));
					}));
				}));
			}

		});

		/* dropping on the main canvas */
		this.interactable.dropzone({
			overlap: 'center',
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
				// let other = $(event.relatedTarget).data('component');
				// other.setParent(this);
				//
				// console.log(`'${other.model.name}' (${other.model.id}) dropped into the main canvas`);
			}
		});

	}

	childContainerElementFor(childComponent) {
		if (childComponent instanceof LyphTemplateBoxComponent) {
			return this.shell.children('.svg-lyph-template-boxes');
		}
		if (childComponent instanceof NodeCircleComponent) {
			return this.shell.children('.svg-nodes');
		}
		if (childComponent instanceof ProcessComponent) {
			return this.shell.children('.svg-process-edges');
		}
	}


}
