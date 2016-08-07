import {Component, EventEmitter} from '@angular/core';
import CanonicalTreeTool from '../tools/CanonicalTreeTool.es6.js';

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
		'[class.active]':        ` toolSelected('CanonicalTreeTool', activeTool) `
	},
	template: `

		<div class="icon icon-Correlation"></div>
		<div class="text-content" [innerHtml]="(model.name + ' ('+model.id+')') | escapeHTML | underlineSubstring:highlight"></div>

		<div class="buttons">
			<div class="button process" *ngIf="canDrawAsSomeProcess() && !canDrawAsCurrentProcess()"></div>
			<div class="button" *ngIf="canDrawAsCurrentProcess()" [class.active]="toolSelected('CanonicalTreeTool', activeTool)" (click)="setTool()">
				<svg style="width: 32px; height: 32px">
					<line x1="5" y1="27" x2="27" y2="5" style="stroke-width: 3px" [style.stroke]="activeTool.processType.color"></line>
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
	
	canDrawAsSomeProcess() {
		return CanonicalTreeTool.valid({
			canonicalTree: this.model
		});
	}

	canDrawAsCurrentProcess() {
		return CanonicalTreeTool.valid({
			canonicalTree: this.model,
			processType:   this.activeTool && (this.activeTool.processType || null)
		});
	}

	toolSelected(type) {
		if (!this.activeTool)              { return false }
		if (this.activeTool.type !== type) { return false }
		if (type === 'CanonicalTreeTool') {
			return this.activeTool.canonicalTree === this.model;
		}
	}

	setTool() {
		this.activeToolChange.next(new CanonicalTreeTool({
			canonicalTree: this.model,
			processType:   this.activeTool && this.activeTool.processType
		}));
	}

}
