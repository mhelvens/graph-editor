import {Component, EventEmitter, Inject} from '../../node_modules/angular2/core';

const RECTANGLE_ICON = require('../img/draw-rectangle.png');
const LINE_ICON      = require('../img/draw-line.png');


@Component({
	selector: 'lyph-template',
	pipes: [
		require('./UnderlineSubstringPipe.es6.js').default,
		require('./EscapeHtmlPipe.es6.js')        .default
	],
	inputs: ['model', 'highlight', 'activeTool'],
	events: ['activeToolChange'],
	host: {
		'[class.resource-view]': ` true                          `,
		'[title]':               ` model.name                    `,
		'[class.active]':        ` toolSelected('*', activeTool) `
	},
	template: `

		<div class="icon icon-LyphTemplate"></div>
		<div class="text-content" [innerHtml]="(model.name + ' ('+model.id+')') | escapeHTML | underlineSubstring:highlight"></div>

		<div class="buttons">
			<div class="button box " [class.active]="toolSelected('box', activeTool)" (click)=" setTool('box') "></div>
			<div class="button process" *ngIf="model.layers.length > 0 && !(toolSelected('process', 'any', activeTool) || toolSelected('conveyedProcess', 'any', activeTool))"></div>
			<div class="button conveyedProcess" *ngIf="model.layers.length > 0 && toolSelected('process', 'any', activeTool) || toolSelected('conveyedProcess', 'any', activeTool)" [class.active]="toolSelected('conveyedProcess', activeTool)" (click)="setTool('conveyedProcess')">
				<svg style="width: 32px; height: 32px">
					<line x1="5" y1="27" x2="27" y2="5" style="stroke-width: 3px" [style.stroke]="activeTool.model.color"></line>
					<circle r="3.5" cx="5" cy="27" style="stroke: black; fill: white;"></circle>
					<circle r="3.5" cx="27" cy="5" style="stroke: black; fill: white;"></circle>
				</svg>
			</div>
		</div>

	`,
	styles: [`

		:host {
			cursor: default;
			color: black !important;
		}

		:host        { background-color: #fee !important                      }
		:host:hover  { background-color: #fcc !important                      }
		:host.active { background-color: #fcc !important; font-style: italic; }

		.text-content {
			font-weight: bold;
		}

		.buttons {
			margin: -5px -5px -5px 0;
		}

		.buttons > .button {
			cursor: pointer;
			border-style: solid;
			border-width: 1px;
			border-color: transparent;
			width:  34px !important;
			height: 34px !important;
			background-repeat: no-repeat;
			background-position: center center;
		}

		.button:hover {
			border-style: dotted !important;
			border-color: gray   !important;
		}

		.button.active {
			border-style:     solid !important;
			border-color:     black !important;
			background-color: white !important;
		}

		.button.box {
			background-image: url(${RECTANGLE_ICON});
		}
		.button.process {
			background-image: url(${LINE_ICON});
			background-size: 17px;
		}

		.buttons > .button:not(:first-child) {
			margin-top: 5px;
		}

	`]
})
export default class LyphTemplateButtonComponent {

	model;
	// processModel = null;
	highlight;

	activeTool;
	activeToolChange = new EventEmitter;

	toolSelected(form, any) {
		if (!this.activeTool)              { return false }
		if (this.activeTool.form !== form) { return false }
		if (form === 'box') {
			return this.activeTool.model === this.model;
		} else if (form === 'conveyedProcess') {
			return any === 'any' || this.activeTool.lyphTemplate === this.model;
		}
		return true;
	}

	setTool(form) {
		if (form === 'box') {
			this.activeToolChange.next({
				model: this.model,
				form:  form
			});
		} else if (form === 'conveyedProcess') {
			this.activeToolChange.next({
				lyphTemplate: this.model,
				model:        this.activeTool.model,
				form:         form
			});
		}
	}

}
