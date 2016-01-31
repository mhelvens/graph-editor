import {Component, ElementRef, ChangeDetectorRef, EventEmitter} from 'angular2/core';
import interact                                                 from './libs/interact.js';
import $                                                        from 'jquery';

import {ModelRepresentation} from './util/model-representation.es6.js';
import Resources             from './util/Resources.es6.js';

@Component({
	selector: 'g[layerTemplate]',
	inputs:   ['model', 'x', 'y', 'width', 'height'],
	template: `


		<svg [attr.x]="x" [attr.y]="y">
			<rect class="layerTemplate"
			      [attr.x]      = " 0      "
			      [attr.y]      = " 0      "
			      [attr.width]  = " width  "
			      [attr.height] = " height ">
			</rect>
		</svg>

	`,
	styles:  [`

		rect {
			stroke: black;
			shape-rendering: crispEdges;
			pointer-events: none;
			fill: white;
		}

	`]
})
export default class LayerTemplateBoxComponent {

	model;

	constructor({nativeElement}: ElementRef, changeDetectorRef: ChangeDetectorRef) {
		Object.assign(this, { nativeElement, changeDetectorRef });
	}

	ngOnInit() {

		// TODO: color

		/* set references */
		this.element = $(this.nativeElement);
		this.svg     = this.element.children('svg').css('overflow', 'visible');
		this.rect    = this.svg.children('rect.layerTemplate');

		/* set back-references */
		this.svg .data('component', this);
		this.rect.data('component', this);

		/* interact.js setup */
		this.interactable = interact(this.rect[0]).dropzone({
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
				console.log(`'${other.model}' dropped into '${this.model}'`);

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
