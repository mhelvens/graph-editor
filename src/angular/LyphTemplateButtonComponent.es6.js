import {Component, EventEmitter, Inject} from '@angular/core';
import LyphTemplateTool    from '../tools/LyphTemplateTool.es6.js';
import ConveyedProcessTool from '../tools/ConveyedProcessTool.es6.js';

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
			<div class="button box " [class.active]="toolSelected('LyphTemplateTool', activeTool)" (click)=" setTool('LyphTemplateTool') "></div>
			<div class="button process"         *ngIf="canDrawAsSomeProcess() && !canDrawAsCurrentProcess()"></div>
			<div class="button conveyedProcess" *ngIf="canDrawAsCurrentProcess()" [class.active]="toolSelected('ConveyedProcessTool', activeTool)" (click)="setTool('ConveyedProcessTool')">
				<svg style="width: 32px; height: 32px">
					<line x1="5" y1="27" x2="27" y2="5" style="stroke-width: 3px" [style.stroke]="activeTool.processType.color"></line>
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
	
	canDrawAsSomeProcess() {
		return ConveyedProcessTool.valid({
			lyphTemplate: this.model
		});
	}
	
	canDrawAsCurrentProcess() {
		return ConveyedProcessTool.valid({
			lyphTemplate: this.model,
			processType:  this.activeTool && (this.activeTool.processType || null)
		});
	}

	toolSelected(type) {
		if (!this.activeTool)                              { return false }
		if (this.activeTool.type !== type && type !== '*') { return false }
		return this.activeTool.lyphTemplate === this.model;
	}

	setTool(type) {
		switch (type) {
			case 'LyphTemplateTool': {
				this.activeToolChange.next(new LyphTemplateTool({
					lyphTemplate: this.model
				}));
			} break;
			case 'ConveyedProcessTool': {
				this.activeToolChange.next(new ConveyedProcessTool({
					lyphTemplate: this.model,
					processType:  this.activeTool && this.activeTool.processType
				}));
			} break;
		}
	}

}
