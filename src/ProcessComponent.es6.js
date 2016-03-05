import {Component, ElementRef, ChangeDetectorRef, forwardRef, OptionalMetadata} from 'angular2/core';
import $                                                                        from 'jquery';
import interact                                                                 from './libs/interact.js';

import Resources                 from './util/Resources.es6.js';
import LyphCanvasComponent       from './LyphCanvasComponent.es6.js';
import LayerTemplateBoxComponent from './LayerTemplateBoxComponent.es6.js';
import RectangleComponent        from './SVGComponent.es6.js';


/* local settings */
const RADIUS = 4.5;

/* the component */
@Component({
	selector: 'g[processLine]',
	inputs:   ['creation'],
	template: `

		<svg x="0" y="0">
			<line class="process"
				[attr.x1]="x1"
				[attr.y1]="y1"
				[attr.x2]="x2"
				[attr.y2]="y2"
				stroke="red"
				stroke-width="3">
			</line>
		</svg>

	`,
	styles:  [`

		line.process {
			stroke: red;
			stroke-width: 3px;
		}

	`]
})
@Reflect.metadata('parameters', [,,,
	[forwardRef(()=>LyphCanvasComponent)]
])
export default class ProcessLineComponent {

	/* model */
	model;

	/* constructor */
	constructor(
		{nativeElement}:           ElementRef,
		changeDetectorRef:         ChangeDetectorRef,
		resources:                 Resources,
		lyphCanvasComponent:       LyphCanvasComponent
	) {
		Object.assign(this, {
			nativeElement,
			changeDetectorRef,
			resources,
			parent: lyphCanvasComponent,
			root:   lyphCanvasComponent
		});
	}

	ngOnInit() {

		/* Possibly unpack a creation object */
		if (this.creation) {
			this.model = this.creation.model;
			this.x1    = this.creation.x1;
			this.y1    = this.creation.y1;
			this.x2    = this.creation.x2;
			this.y2    = this.creation.y2;
		}

		/* Possibly resolve this component to the creation object */
		if (this.creation) { this.creation.resolve(this) }

	}

}
