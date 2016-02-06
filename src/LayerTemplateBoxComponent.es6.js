import {Component, ElementRef, ChangeDetectorRef, EventEmitter, forwardRef} from 'angular2/core';
import interact                                                 from './libs/interact.js';
import $                                                        from 'jquery';
import {getHsvGolden}                                           from 'golden-colors';

import LyphCanvasComponent      from './LyphCanvasComponent.es6.js';
import LyphTemplateBoxComponent from './LyphTemplateBoxComponent.es6.js';
import Resources                from './util/Resources.es6.js';

import RectangleComponent from './RectangleComponent.es6.js';

@Component({
	selector: 'g[layerTemplateBox]',
	inputs:   ['model', 'x', 'y', 'width', 'height', 'activeTool'],
	template: `

		<svg [attr.x]="x" [attr.y]="y">

			<rect class="layerTemplate"
			      [attr.x]      = " 0                   "
			      [attr.y]      = " 0                   "
			      [attr.width]  = " width               "
			      [attr.height] = " height              "
			      [style.fill]  = " color.toHexString() ">
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
@Reflect.metadata('parameters', [,,
	[forwardRef(()=>LyphTemplateBoxComponent)]
])
export default class LayerTemplateBoxComponent extends RectangleComponent {

	/* model */
	model;

	/* constructor */
	constructor(
		{nativeElement}:          ElementRef,
		changeDetectorRef:        ChangeDetectorRef,
		lyphTemplateBoxComponent: LyphTemplateBoxComponent
	) {
		super({
			nativeElement,
			changeDetectorRef,
			parent: lyphTemplateBoxComponent
		});
	}

	ngOnInit() {

		super.initSVG({
			shell:     $(this.nativeElement),
			container: $(this.nativeElement).children('svg').css({ overflow: 'visible' }),
			rectangle: $(this.nativeElement).children('svg').children('rect.layerTemplate')
		});

		/* color */
		this.color = getHsvGolden(0.8, 0.8); // TODO: retrieve these from the server

		/* dropzone */
		this.interactable.dropzone({
			overlap: 1, // require whole rectangle to be inside
			ondropactivate: (event) => {
				// add active dropzone feedback
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
				console.log(`'${other.model.name}' (${other.model.id}) dropped into '${this.parent.model.name}' (${this.model.id})`);
			},
			ondropdeactivate: (event) => {
				// remove active dropzone feedback
			}
		});

	}

}
