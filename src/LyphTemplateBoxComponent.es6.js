import {Component, ElementRef, ChangeDetectorRef, EventEmitter} from 'angular2/core';
import interact                                                 from './libs/interact.js';
import $                                                        from 'jquery';

import {ModelRepresentation} from './util/model-representation.es6.js';
import Resources             from './util/Resources.es6.js';

import LayerTemplateBoxComponent from './LayerTemplateBoxComponent.es6.js';

@Component({
	selector: 'g[lyphTemplate]',
	inputs:   ['model', 'creation'],//, 'x', 'y', 'width', 'height'
	events:   ['dragging'],
	directives: [
		LayerTemplateBoxComponent
	],
	template: `

		<svg [attr.x]="x" [attr.y]="y">
			<rect class         = " lyphTemplate "
			      [attr.x]      = " 0            "
			      [attr.y]      = " 0            "
			      [attr.width]  = " width        "
			      [attr.height] = " height       ">
			</rect>
			<g layerTemplate class="layerTemplate"
			      *ngFor   = " #layer of layers; #i = index          "
			      [model]  = " layer.model                           "
			      [x]      = " 0                                     "
			      [y]      = " (layers.length - i - 1) * layerHeight "
			      [width]  = " width                                 "
			      [height] = " layerHeight                           ">
			</g>
			<rect class         = " axis                   "
			      [attr.x]      = " 0                      "
			      [attr.y]      = " height - axisThickness "
			      [attr.width]  = " width                  "
			      [attr.height] = " axisThickness          ">
			</rect>
			<text class="axis minus" [attr.x]="1        " [attr.y]="height - axisThickness - 0.5">    −    </text>
			<text class="axis plus " [attr.x]="width - 1" [attr.y]="height - axisThickness - 0.5">    +    </text>
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
			font-size: 14px;
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
export default class LyphTemplateBoxComponent {

	/* model */
	model;
	layers = [];

	/* variant geometry */
	x;
	y;
	width;
	height;

	get minWidth()  { return 4                                           }
	get minHeight() { return this.axisThickness + this.layers.length * 2 }

	/* events */
	init     = new EventEmitter;
	dragging = new EventEmitter;

	/* invariant geometry */
	axisThickness = 15;

	get layerHeight() { return (this.height - this.axisThickness) / this.layers.length }

	constructor({nativeElement}: ElementRef, changeDetectorRef: ChangeDetectorRef) {
		Object.assign(this, { nativeElement, changeDetectorRef });
	}

	ngOnInit() {

		// TODO: resize layers

		/* Possibly unpack a creation object */
		if (this.creation) {
			/* starting geometry */
			this.x      = this.creation.x;
			this.y      = this.creation.y;
			this.width  = this.minWidth;
			this.height = this.minHeight;
			this.model  = this.creation.model;
		}

		/* set references */
		this.element = $(this.nativeElement);
		this.svg     = this.element.children('svg').css('overflow', 'visible');
		this.rect    = this.svg.children('rect.lyphTemplate');

		/* set back-references */
		this.svg .data('component', this);
		this.rect.data('component', this);

		/* interact.js setup */
		this.interactable = interact(this.rect[0]).draggable({
			autoScroll: true,
			onstart: (event) => {
				event.stopPropagation();
				this.dragging.next(true);
				this.element.appendTo(this.element.parent()); // move to front
			},
			onend: () => {
				this.dragging.next(false);
			},
			onmove: (event) => {
				this.x += event.dx;
				this.y += event.dy;
				this.changeDetectorRef.detectChanges();
			}
		}).resizable({
			edges: { left: true, right: true, bottom: true, top: true },
			onstart: (event) => {
				event.stopPropagation();
			},
			onmove: ({rect, edges}) => {
				this.width  = Math.max(rect.width,  this.minWidth );
				this.height = Math.max(rect.height, this.minHeight);
				if (edges.left || edges.top) {
					this.x      = rect.left - (edges.left ? this.width  - rect.width  : 0);
					this.y      = rect.top  - (edges.top  ? this.height - rect.height : 0);
				}
				this.changeDetectorRef.detectChanges();
			}
		});

		/* Possibly resolve this component to the creation object */
		if (this.creation) { this.creation.resolve(this) }


		this.layers = [
			{ model: '1' },
			{ model: '2' },
			{ model: '3' }
		];

	}

	ngOnDestroy() {
		this.interactable.unset();
	}

}
