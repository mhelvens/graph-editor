import {Component, ElementRef, ChangeDetectorRef, forwardRef, OptionalMetadata} from 'angular2/core';
import $                                                                        from 'jquery';
import interact                                                                 from './libs/interact.js';

import Resources                 from './util/Resources.es6.js';
import LyphCanvasComponent       from './LyphCanvasComponent.es6.js';
import LayerTemplateBoxComponent from './LayerTemplateBoxComponent.es6.js';
import RectangleComponent        from './SVGComponent.es6.js';
import DeleteClickerComponent    from './DeleteClickerComponent.es6.js';


/* the component */
@Component({
	selector: 'g[nodeCircle]',
	inputs:   ['creation', 'activeTool'],//, 'x', 'y'
	directives: [
		forwardRef(()=>DeleteClickerComponent)
	],
	host: {
		'(mouseenter)': ` mouseOver = true  `,
		'(mouseleave)': ` mouseOver = false `
	},
	template: `

		<svg:circle class="center" [attr.cx]="x" [attr.cy]="y" [attr.r]="0.5"></svg:circle>
		<svg:circle class="node"
			[attr.cx]   = " x                                        "
			[attr.cy]   = " y                                        "
			[attr.r]    = " RADIUS * (mouseOver || dragging ? 2 : 1) "
		></svg:circle>
		
		<svg:g deleteClicker
			*ngIf   = " mouseOver && !dragging "
			[x]     = " x + RADIUS             "
			[y]     = " y - RADIUS             "
			(click) = " console.log('clicked') "
		></svg:g>

	`,
	styles:  [`

		circle.node {
			stroke: black;
			fill:   white;
		}

	`]
})
@Reflect.metadata('parameters', [,,,
	[                        forwardRef(()=>LyphCanvasComponent      )],
	[new OptionalMetadata(), forwardRef(()=>LayerTemplateBoxComponent)]
])
export default class NodeCircleComponent extends RectangleComponent {

	RADIUS = 5.5;

	/* model */
	model;

	/* state */
	mouseOver = false;
	dragging  = false;
	resizing  = false;

	/* connected process line components */
	processStarts = new Set;
	processEnds   = new Set;

	/* origin */
	origin = { x: this.RADIUS, y: this.RADIUS };

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
	}

	ngOnInit() {

		super.initSVG({
			shell:               $(this.nativeElement),
			container:           $(this.nativeElement),
			shape:               $(this.nativeElement).children('.node'),
			interactableElement: $(this.nativeElement).children('.center')
		});

		/* Possibly unpack a creation object */
		if (this.creation) {
			this.model  = this.creation.model;
			this.x      = this.creation.x;
			this.y      = this.creation.y;
			this.width  = 0;
			this.height = 0;
		}

		/* draggable */
		interact(this.shape[0]).on('down', (event) => {
			event.interaction.start(
				{ name: 'drag' },
				this.interactable,
				this.interactableElement[0]
			);
		});
		let draggingX, draggingY;
		this.interactable.draggable({
			autoScroll: true,
			restrict: {
				restriction: this.root.shape[0],
				elementRect: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 }
			},
			onstart: (event) => {
				event.stopPropagation();
				this.moveToFront();
				this.dragging = true;
				this.refresh();

				/* to maintain unsnapped coordinates */
				draggingX = this.x;
				draggingY = this.y;
			},
			onmove: (event) => {
				draggingX += event.dx;
				draggingY += event.dy;

				/* snap to nearby borders */
				let dX = 99999;
				let dY = 99999;
				this.root.traverse(LayerTemplateBoxComponent, (layer) => {
					if (layer.y < draggingY && draggingY < layer.y + layer.height) {
						if (Math.abs(layer.x               - draggingX) < Math.abs(dX)) { dX = layer.x               - draggingX + 0.5 }
						if (Math.abs(layer.x + layer.width - draggingX) < Math.abs(dX)) { dX = layer.x + layer.width - draggingX - 0.5 }
					}
					if (layer.x < draggingX && draggingX < layer.x + layer.width) {
						if (                              Math.abs(layer.y                - draggingY) < Math.abs(dY)) { dY = layer.y                - draggingY + 0.5 }
						if (layer.model.position !== 1 && Math.abs(layer.y + layer.height - draggingY) < Math.abs(dY)) { dY = layer.y + layer.height - draggingY - 0.5 }
					}
				});
				if (Math.abs(dX) <= Math.abs(dY) && Math.abs(dX) <= 10) { this.x = draggingX + dX } else { this.x = draggingX }
				if (Math.abs(dY) <  Math.abs(dX) && Math.abs(dY) <= 10) { this.y = draggingY + dY } else { this.y = draggingY }

				this.refresh();
			},
			onend: (event) => {
				this.dragging = false;
				this.refresh();
			}
		});

		/* Possibly resolve this component to the creation object */
		if (this.creation) { this.creation.resolve(this) }

	}

	refresh() {
		super.refresh();
		/* move connected processes */
		for (let p of this.processStarts) {
			p.x1 = this.x;
			p.y1 = this.y;
			p.changeDetectorRef.detectChanges();
		}
		for (let p of this.processEnds) {
			p.x2 = this.x;
			p.y2 = this.y;
			p.changeDetectorRef.detectChanges();
		}
	}

}
