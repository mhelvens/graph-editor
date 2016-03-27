import {Component, EventEmitter} from '../../node_modules/angular2/core';

const LINE_ICON = require('../img/draw-line.png');


@Component({
	selector: 'canonical-tree',
	pipes: [
		require('./UnderlineSubstringPipe.es6.js').default,
		require('./EscapeHtmlPipe.es6.js')        .default
	],
	inputs: ['model', 'highlight', 'activeTool'],
	events: ['activeToolChange'],
	host: {
		'[class.resource-view]': ` true                                                    `,
		'[title]':               ` model.name                                              `,
		'[class.active]':        ` toolSelected('canonicalTreeProcess', 'any', activeTool) `
	},
	template: `

		<div class="icon icon-Correlation"></div>
		<div class="text-content" [innerHtml]="(model.name + ' ('+model.id+')') | escapeHTML | underlineSubstring:highlight"></div>

		<div class="buttons">
			<div class="button process" *ngIf="canDrawAsProcess() && !(toolSelected('process', 'any', activeTool) || toolSelected('canonicalTreeProcess', 'any', activeTool))"></div>
			<div class="button canonicalTreeProcess" *ngIf="canDrawAsProcess() && ( toolSelected('process', 'any', activeTool) || toolSelected('canonicalTreeProcess', 'any', activeTool) )" [class.active]="toolSelected('canonicalTreeProcess', 'this', activeTool)" (click)="setTool('canonicalTreeProcess')">
				<svg style="width: 32px; height: 32px">
					<line x1="5" y1="27" x2="27" y2="5" style="stroke-width: 3px" [style.stroke]="activeTool.model.color"></line>
					<circle r="3.5" cx="5"  cy="27" style="stroke: black; fill: white;"></circle>
					<circle r="3.5" cx="27" cy="5"  style="stroke: black; fill: white;"></circle>
				</svg>
			</div>
		</div>

	`,
	styles: [`

		:host {
			cursor: default;
			color: black !important;
		}

		:host        { background-color: #ffc !important }
		:host:hover  { background-color: #ff9 !important }
		:host.active { background-color: #ff6 !important; font-style: italic; }

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

		.button.process {
			background-image: url(${LINE_ICON});
			background-size: 17px;
		}

		.buttons > .button:not(:first-child) {
			margin-top: 5px;
		}

	`]
})
export default class CanonicalTreeButtonComponent {

	model;
	highlight;

	activeTool;
	activeToolChange = new EventEmitter;

	canDrawAsProcess() {
		return this.model.levels.length > 0 && this.model.getLevels().every(level => level.getLyphTemplate().getLayerTemplates().length > 0);
	}

	toolSelected(form, any) {
		if (!this.activeTool)              { return false }
		if (this.activeTool.form !== form) { return false }
		if (any === 'any')                 { return true  }
		if (form === 'canonicalTreeProcess') {
			return this.activeTool.canonicalTree === this.model;
		}
	}

	setTool(form) {
		this.activeToolChange.next({
			canonicalTree: this.model,
			model:         this.activeTool.model,
			form:          form
		});
	}

}
