import {Component, ElementRef, ChangeDetectorRef, forwardRef, OptionalMetadata} from 'angular2/core';
import interact                                                 from './libs/interact.js';
import $                                                        from 'jquery';

import Resources                 from './util/Resources.es6.js';

import LyphCanvasComponent       from './LyphCanvasComponent.es6.js';
import LayerTemplateBoxComponent from './LayerTemplateBoxComponent.es6.js';
import MapPipe                   from './util/MapPipe.es6.js';
import SortPipe                  from './util/SortPipe.es6.js';

import RectangleComponent from './RectangleComponent.es6.js';

@Component({
	selector: 'g[lyphTemplateBox]',
	inputs:   ['creation', 'activeTool'],//, 'x', 'y', 'width', 'height'
	directives: [
		forwardRef(()=>LayerTemplateBoxComponent)
	],
	pipes: [
		MapPipe,
		SortPipe
	],
	template: `

		<svg [attr.x]="x" [attr.y]="y">

			<rect class         = " lyphTemplate "
			      [attr.x]      = " 0            "
			      [attr.y]      = " 0            "
			      [attr.width]  = " width        "
			      [attr.height] = " height       ">
			</rect>
			<g layerTemplateBox class="layerTemplate"
			      *ngFor       = " #layer of model.layers | map:layerById | sort:byPosition; #i = index "
			      [model]      = " layer                                                                "
			      [x]          = " 0                                                                    "
			      [y]          = " (model.layers.length - i - 1) * layerHeight                          "
			      [width]      = " width                                                                "
			      [height]     = " layerHeight                                                          "
			      [activeTool] = " activeTool                                                           ">
			</g>
			<rect class         = " axis                   "
			      [attr.x]      = " 0                      "
			      [attr.y]      = " height - axisThickness "
			      [attr.width]  = " width                  "
			      [attr.height] = " axisThickness          ">
			</rect>
			<defs>
				<clipPath id="name-space">
					<rect
						[attr.x]      = " axisThickness              "
						[attr.y]      = " height -     axisThickness "
						[attr.width]  = " width  - 2 * axisThickness "
						[attr.height] = " axisThickness              ">
					</rect>
				</clipPath>
			</defs>
			<text class="axis minus" [attr.x]="1        " [attr.y]="height - axisThickness - 0.5">                                     −       </text>
			<text class="axis plus " [attr.x]="width - 1" [attr.y]="height - axisThickness - 0.5">                                     +       </text>
			<text class="axis label" [attr.x]="width / 2" [attr.y]="height - axisThickness - 0.5" clip-path="url(#name-space)">{{ model.name }}</text>

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
export default class LyphTemplateBoxComponent extends RectangleComponent {

	/* model */
	model;

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
			root:   lyphCanvasComponent,
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
			container: $(this.nativeElement).children('svg').css({ overflow: 'visible' }),
			rectangle: $(this.nativeElement).children('svg').children('rect.lyphTemplate')
		});

		/* Possibly unpack a creation object */
		if (this.creation) {
			this.model  = this.creation.model;
			this.x      = this.creation.x;
			this.y      = this.creation.y;
			this.width  = this.minWidth;
			this.height = this.minHeight;
		}

		/* draggable */
		this.interactable.draggable({
			autoScroll: true,
			restrict: {
				restriction: this.root.rectangle[0],
				elementRect: { left: 0, right: 1, top: 0, bottom: 1 }
			},
			onstart: (event) => {
				event.stopPropagation();
				this.moveToFront();
			},
			onmove: (event) => {
				this.x += event.dx;
				this.y += event.dy;
				this.changeDetectorRef.detectChanges();
			}
		});

		/* resizable */
		this.interactable.resizable({
			edges: { left: true, right: true, bottom: true, top: true },
			invert: 'reposition',
			onstart: (event) => {
				event.stopPropagation(); // TODO: necessary?
			},
			onmove: (event) => {
				let {rect, edges} = event;

				let parentRect = this.parent.rectangle[0].getBoundingClientRect();

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

				this.changeDetectorRef.detectChanges();
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
