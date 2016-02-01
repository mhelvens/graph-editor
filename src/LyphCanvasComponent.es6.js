import {Component, ChangeDetectorRef, ElementRef, EventEmitter} from 'angular2/core';
import interact                                   from './libs/interact.js';
import $                                          from 'jquery';

import LyphTemplateBoxComponent from './LyphTemplateBoxComponent.es6.js';

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
	    LyphTemplateBoxComponent
    ],
	inputs: ['tool'],
	events: ['added'],
    template: `

		<svg id="canvas">

			<g lyphTemplate *ngFor="#t of lyphTemplates" [creation]="t"></g>

		</svg>

    `,
	styles: [`

		:host, :host > svg {
			position: absolute;
			top: 0;
			left: 0;
			min-width:  100%;
			min-height: 100%;
			padding:    0;
			margin:     0;
		}

		:host > .container-fluid {
			position: relative;
			margin: 10px;
			min-height: 100%;
		}

		:host > .container-fluid > .row {
			margin: 0;
		}

		aside { display: none }
		@media (min-width: 768px) {
			aside {
				position: fixed;
				top:      0;
				bottom:   0;
				left:     0;
				z-index:  100;
				display:  block;
				overflow-x: visible;
				overflow-y: visible;
			}
		}

		aside > .tool-panel {
			position: absolute;
			top:     10px;
			left:    10px;
			bottom:  10px;
			right:   10px;
			padding: 0;
			background-color: #f5f5f5;
			border: 1px solid gray;
			border-radius: 4px;
			overflow-x: hidden;
			overflow-y: scroll;
		}

		aside > .tool-panel > .header {
			cursor:           default;
			background-color: gray;
			color:            white;
			text-align:       center;
			font-weight:      bold;
			display:          block;
			padding:          10px 15px;
		}

		main {
			padding: 0;
		}

		main .page-header {
			margin-top: 0;
		}


	`]
})
export default class LyphCanvasComponent {

	lyphTemplates = [];

	added = new EventEmitter;

	constructor({nativeElement}: ElementRef, changeDetectorRef: ChangeDetectorRef) {
		Object.assign(this, { nativeElement, changeDetectorRef });
	}

	ngOnInit() {

		/* set references */
		this.element = $(this.nativeElement);
		this.svg     = this.element.children('svg').css('overflow', 'visible');

		/* interact.js setup */
		this.interactable = interact($(this.nativeElement).children('svg')[0]);

		/* creating new artefacts by clicking down the mouse */
		this.interactable.on('down', (event) => {

			if (!this.tool) { return }

			if (this.tool.form === 'box' && this.tool.type === 'LyphTemplate') {
				let canvasRect = this.element[0].getBoundingClientRect();
				this.lyphTemplates.push(new BoxCreation({
					model: 'a',
					x: event.clientX - canvasRect.left,
					y: event.clientY - canvasRect.top
				}, (boxComponent) => {
					event.interaction.start(
						{
							name:  'resize',
							edges: { bottom: true, right: true }
						},
						boxComponent.interactable,
						boxComponent.rect[0]
					);
					let onCreateEnd = () => {
						this.added.next(this.tool);
						boxComponent.interactable.off(onCreateEnd);
					};
					boxComponent.interactable.on('resizeend', onCreateEnd);
				}));
			}

		});

		/* dropping on the main canvas */
		this.interactable.dropzone({
			overlap: 1, // require whole rectangle to be inside
			ondropactivate: (event) => {
				//// add active dropzone feedback
				//event.target.classList.add('drop-active');
			},
			ondragenter: (event) => {
				//var draggableElement = event.relatedTarget,
				//    dropzoneElement = event.target;
				//
				//// feedback the possibility of a drop
				//dropzoneElement.classList.add('drop-target');
				//draggableElement.classList.add('can-drop');
				//draggableElement.textContent = 'Dragged in';
			},
			ondragleave: (event) => {
				//// remove the drop feedback style
				//event.target.classList.remove('drop-target');
				//event.relatedTarget.classList.remove('can-drop');
				//event.relatedTarget.textContent = 'Dragged out';
			},
			ondrop: (event) => {
				//event.relatedTarget.textContent = 'Dropped';
				let other = $(event.relatedTarget).data('component');
				console.log(`'${other.model}' dropped into the main canvas`);

				let thisRect  = this .svg[0].getBoundingClientRect();
				let otherRect = other.svg[0].getBoundingClientRect();

				other.element.appendTo(this.svg);
				other.x = otherRect.left - thisRect.left;
				other.y = otherRect.top  - thisRect.top;

			},
			ondropdeactivate: (event) => {
				//// remove active dropzone feedback
				//event.target.classList.remove('drop-active');
				//event.target.classList.remove('drop-target');
			}
		});

	}


}
