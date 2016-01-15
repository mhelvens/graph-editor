import {Component, ElementRef, ChangeDetectorRef} from 'angular2/core';
import interact                                   from 'interact.js';
import $                                          from 'jquery';

import {ModelRepresentation} from './util/model-representation.es6.js';
import Resources             from './util/Resources.es6.js';

@Component({
	selector: 'g[lyphTemplate]',
	pipes:    [],
	inputs:   ['model: lyphTemplate'],
	host:     {},
	template: `

		<svg [attr.x]="x" [attr.y]="y">
			<rect class         = " lyphTemplate "
			      [attr.x]      = " 0            "
			      [attr.y]      = " 0            "
			      [attr.width]  = " width        "
			      [attr.height] = " height       ">
			</rect>
			<rect class         = " layerTemplate                         "
			      *ngFor        = " #layer of layers; #i = index          "
			      [attr.x]      = " 0                                     "
			      [attr.y]      = " (layers.length - i - 1) * layerHeight "
			      [attr.width]  = " width                                 "
			      [attr.height] = " layerHeight                           ">
			</rect>
			<rect class         = " axis                   "
			      [attr.x]      = " 0                      "
			      [attr.y]      = " height - axisThickness "
			      [attr.width]  = " width                  "
			      [attr.height] = " axisThickness          ">
			</rect>
			<text class="axis minus" [attr.x]="1        " [attr.y]="height - axisThickness - 0.5">−</text>
			<text class="axis plus " [attr.x]="width - 1" [attr.y]="height - axisThickness - 0.5">+</text>
			<text class="axis label" [attr.x]="width / 2" [attr.y]="height - axisThickness - 0.5">{{model}}</text>
		</svg>

	`,
	styles:  [`

		rect {
			stroke: black;
			shape-rendering: crispEdges;
			pointer-events: none;
		}

		rect.axis {
			fill: black;
		}

		rect.lyphTemplate {
			pointer-events: all;
		}

		rect.layerTemplate {
			fill: white;
		}

		svg.dragging > rect.layerTemplate {
			pointer-events: visibleFill;
		}

		text.axis {
			fill: white;
			font-size: 10px;
			text-rendering: geometricPrecision;
			pointer-events: none;
			/*noinspection CssInvalidPropertyValue*/
			dominant-baseline: text-before-edge;
		}

		text.axis.minus {
			text-anchor: start;
		}

		text.axis.plus {
			text-anchor: end;
		}

		text.axis.label {
			text-anchor: middle;
		}

	`]
})
export default class LyphTemplateBox {

	/* model */
	model;

	/* variant geometry */
	x      = 400 * Math.random();
	y      = 400 * Math.random();
	width  = 80;
	height = 80;

	/* invariant geometry */
	axisThickness = 10;

	get layerHeight() { return (this.height - this.axisThickness) / this.layers.length }

	constructor({nativeElement}: ElementRef, changeDetectorRef: ChangeDetectorRef) {
		Object.assign(this, { nativeElement, changeDetectorRef });
		this.layers = [{}, {}, {}];
	}

	ngOnInit() {

		/* set references */
		this.element = $(this.nativeElement);
		this.svg     = this.element.children('svg').css('overflow', 'visible');
		this.rect    = this.svg.children('rect.lyphTemplate');

		/* set back-references */
		this.svg .data('component', this);
		this.rect.data('component', this);

		/* interact.js setup */
		interact(this.rect[0]).draggable({
			autoScroll: true,
			onstart: () => {
				this.element.appendTo(this.element.parent()); // move to front
			},
			onmove: (event) => {
				this.x += event.dx;
				this.y += event.dy;
				this.changeDetectorRef.detectChanges();
			}
		}).resizable({
			edges: { left: true, right: true, bottom: true, top: true },
			onmove: ({rect, edges}) => {
				this.width  = Math.max(rect.width, 4);
				this.height = Math.max(rect.height, this.axisThickness + this.layers.length * 2);
				this.x      = rect.left - (edges.left ? this.width  - rect.width  : 0);
				this.y      = rect.top  - (edges.top  ? this.height - rect.height : 0);
				this.changeDetectorRef.detectChanges();
			}
		}).dropzone({
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
			},
			ondropdeactivate: (event) => {
				//// remove active dropzone feedback
				//event.target.classList.remove('drop-active');
				//event.target.classList.remove('drop-target');
			}
		});

	}

}
