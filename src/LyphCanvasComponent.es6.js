import {Component, ChangeDetectorRef, ElementRef, EventEmitter} from 'angular2/core';
import interact                                   from './libs/interact.js';
import $                                          from 'jquery';

import LyphTemplateBoxComponent from './LyphTemplateBoxComponent.es6.js';

import RectangleComponent from './RectangleComponent.es6.js';

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
	inputs: ['activeTool'],
	events: ['added'],
    template: `

		<svg id="canvas">

			<g lyphTemplateBox *ngFor="#t of lyphTemplates" [creation]="t" [activeTool]="activeTool"></g>

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

	added = new EventEmitter;

	constructor({nativeElement}: ElementRef, changeDetectorRef: ChangeDetectorRef) {
		super({
			nativeElement,
			changeDetectorRef
		});
	}

	ngOnInit() {

		super.initSVG({
			shell:     $(this.nativeElement),
			container: $(this.nativeElement).children('svg').css({ overflow: 'visible' })
		});

		/* creating new artefacts by clicking down the mouse */
		this.interactable.on('down', (event) => {

			if (!this.activeTool) { return }

			if (this.activeTool.form === 'box' && this.activeTool.model.type === 'LyphTemplate') {
				let canvasRect = this.rectangle[0].getBoundingClientRect();
				this.lyphTemplates.push(new BoxCreation({
					model: this.activeTool.model,
					x: event.clientX - canvasRect.left,
					y: event.clientY - canvasRect.top
				}, (boxComponent) => {
					event.interaction.start(
						{
							name:  'resize',
							edges: { bottom: true, right: true }
						},
						boxComponent.interactable,
						boxComponent.rectangle[0]
					);
					const onCreateEnd = () => {
						this.added.next(this.activeTool);
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
				let other = $(event.relatedTarget).data('component');
				other.setParent(this);

				console.log(`'${other.model.name}' (${other.model.id}) dropped into the main canvas`);
			}
		});

	}


}
