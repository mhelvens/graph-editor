import {Component, ElementRef, ChangeDetectorRef, forwardRef, OptionalMetadata} from 'angular2/core';
import $                                                                        from 'jquery';

import Resources                 from './util/Resources.es6.js';

import LyphCanvasComponent       from './LyphCanvasComponent.es6.js';
import LayerTemplateBoxComponent from './LayerTemplateBoxComponent.es6.js';
import DeleteClickerComponent    from './DeleteClickerComponent.es6.js';
import MapPipe                   from './util/MapPipe.es6.js';
import SortPipe                  from './util/SortPipe.es6.js';

import SVGComponent from './SVGComponent.es6.js';

@Component({
	selector: 'g[lyphTemplateBox]',
	inputs:   ['creation', 'activeTool'],//, 'x', 'y', 'width', 'height'
	directives: [
		forwardRef(()=>LayerTemplateBoxComponent),
		DeleteClickerComponent
	],
	pipes: [
		MapPipe,
		SortPipe
	],
	host: {
		'(mouseenter)': ` mouseOver = true  `,
		'(mouseleave)': ` mouseOver = false `
	},
	template: `

		<svg:rect class="lyphTemplate"
		      [attr.x]      = " x                 "
		      [attr.y]      = " y                 "
		      [attr.width]  = " width             "
		      [attr.height] = " height            "
	 	></svg:rect>
		<svg:rect class="axis"
		      [attr.x]      = " x                          "
		      [attr.y]      = " y + height - axisThickness "
		      [attr.width]  = " width                      "
		      [attr.height] = " axisThickness              "
		></svg:rect>
		<svg:defs>
			<clipPath id="name-space">
				<rect
					[attr.x]      = " x + axisThickness              "
					[attr.y]      = " y + height -     axisThickness "
					[attr.width]  = " width  - 2 * axisThickness     "
					[attr.height] = " axisThickness                  "
				></rect>
			</clipPath>
		</svg:defs>
		<svg:text class="axis minus" [attr.x]="x + 1        " [attr.y]="y + height - axisThickness - 0.5"> − </svg:text>
		<svg:text class="axis plus " [attr.x]="x + width - 1" [attr.y]="y + height - axisThickness - 0.5"> + </svg:text>
		<svg:text class="axis label" [attr.x]="x + width / 2" [attr.y]="y + height - axisThickness - 0.5" clip-path="url(#name-space)">{{ model.name }}</svg:text>

		<svg:g class="child-container">
			<g layerTemplateBox class="layerTemplate"
			      *ngFor       = " #layer of model.layers | map:layerById | sort:byPosition; #i = index "
			      [model]      = " layer                                                                "
			      [x]          = " x                                                                    "
			      [y]          = " y + (model.layers.length - i - 1) * layerHeight                      "
			      [width]      = " width                                                                "
			      [height]     = " layerHeight                                                          "
			      [activeTool] = " activeTool                                                           "
			></g>
		</svg:g>
		
		<svg:g deleteClicker
			*ngIf   = " mouseOver && !dragging && !resizing       "
			[x]     = " x + width                                 "
			[y]     = " y                                         "
			(click) = " console.log('TODO: Delete lyph template') "
		></svg:g>

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
@Reflect.metadata('parameters', [,,,
	[                        forwardRef(()=>LyphCanvasComponent      )],
	[new OptionalMetadata(), forwardRef(()=>LayerTemplateBoxComponent)]
])
export default class LyphTemplateBoxComponent extends SVGComponent {

	/* model */
	model;

	/* state */
	mouseOver = false;
	dragging  = false;
	resizing  = false;

	/* invariant geometry */
	axisThickness = 15;

	/* constructor */
	constructor(
		{nativeElement}:           ElementRef,
		changeDetectorRef:         ChangeDetectorRef,
		resources:                 Resources,
		lyphCanvasComponent:       LyphCanvasComponent,
		layerTemplateBoxComponent: LayerTemplateBoxComponent
	) {
		super({
			nativeElement,
			changeDetectorRef,
			resources,
			parent: layerTemplateBoxComponent || lyphCanvasComponent
		});
		this.layerById = this.layerById.bind(this);
	}

	get minWidth()    { return 2 * (this.axisThickness + 1)                                                     }
	get minHeight()   { return this.axisThickness + (this.model ? this.model.layers.length * 2 : 5)             }
	get layerHeight() { return (this.height - this.axisThickness) / (this.model ? this.model.layers.length : 5) }

	// TODO: way to resize layers

	ngOnInit() {

		super.initSVG({
			shell:     $(this.nativeElement),
			container: $(this.nativeElement),
			shape:     $(this.nativeElement).children('.lyphTemplate'),
			childContainer: $(this.nativeElement).children('.child-container')
		});

		/* Possibly unpack a creation object */
		if (this.creation) {
			this.model  = this.creation.model;
			this.x      = this.creation.x;
			this.y      = this.creation.y;
			this.width  = Math.max(this.creation.width,  this.minWidth);
			this.height = Math.max(this.creation.height, this.minHeight);
		}

		/* draggable */
		this.interactable.draggable({
			autoScroll: true,
			restrict: {
				restriction: this.root.shape[0],
				elementRect: { left: 0, right: 1, top: 0, bottom: 1 }
			},
			onstart: (event) => {
				event.stopPropagation();
				this.moveToFront();
			},
			onmove: (event) => {
				this.traverse((c) => {
					c.x += event.dx;
					c.y += event.dy;
				});
				this.refresh();
			}
		});

		/* resizable */
		this.interactable.resizable({
			edges: { left: true, right: true, bottom: true, top: true },
			onstart: (event) => {
				event.stopPropagation(); // TODO: necessary?
			},
			onmove: (event) => {
				let {rect, edges} = event;

				let parentRect = this.parent.shape[0].getBoundingClientRect();

				this.width  = Math.max(rect.width,  this.minWidth );
				this.height = Math.max(rect.height, this.minHeight);
				if (edges.left || edges.top) {
					this.x = rect.left - (edges.left ? this.width  - rect.width  : 0) - parentRect.left;
					this.y = rect.top  - (edges.top  ? this.height - rect.height : 0) - parentRect.top;
				}

				// Manual 'restrict', because the builtin resize+restrict is a bit buggy; TODO
				if (edges.left && this.x < 0) {
					this.width += this.x;
					this.x = 0;
				}
				if (edges.top && this.y < 0) {
					this.height += this.y;
					this.y = 0;
				}
				if (edges.right && this.x + this.width > parentRect.width) {
					this.width = parentRect.width - this.x;
				}
				if (edges.bottom && this.y + this.height > parentRect.height) {
					this.height = parentRect.height - this.y;
				}

				this.refresh();
			}
		});

		/* Possibly resolve this component to the creation object */
		if (this.creation) { this.creation.resolve(this) }

	}

	layerById(id) {
		return this.resources.getResource_sync('layerTemplates', id);
	}

	byPosition(layer1, layer2) {
		return layer1.position - layer2.position;
	}

}
