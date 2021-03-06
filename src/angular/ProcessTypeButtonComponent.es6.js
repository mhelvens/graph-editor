import {Component, EventEmitter, Inject} from '../../node_modules/angular2/core';
import ProcessTool from '../tools/ProcessTool.es6.js';

@Component({
	selector: 'process-type',
	pipes: [
		require('./UnderlineSubstringPipe.es6.js').default,
		require('./EscapeHtmlPipe.es6.js')        .default
	],
	inputs: ['model', 'highlight', 'activeTool'],
	events: ['activeToolChange'],
	host: {
		'[class.resource-view]': ` true                                    `,
		'[title]':               ` model.name                              `,
		'[class.active]':        ` toolSelected('ProcessTool', activeTool) `
	},
	template: `

		<div class="icon icon-draw-line"></div>
		<div class="text-content" [innerHtml]="model.name | escapeHTML | underlineSubstring:highlight"></div>

		<div class="buttons">
			<div class="button line" [class.active]=" toolSelected('ProcessTool', activeTool) " (click)=" setTool() ">
				<svg style="width: 32px; height: 32px">
					<line x1="5" y1="27" x2="27" y2="5" style="stroke-width: 3px" [style.stroke]="model.color"></line>
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

		:host        { background-color: #fff !important }                       
		:host:hover  { background-color: #ddd !important }                       
		:host.active { background-color: #ddd !important; font-style: italic; }  

		.text-content {
			font-weight: bold;
		}

		.buttons {
			margin: -5px -5px -5px 0;
		}

		.buttons > .button {
			cursor: pointer;
			border-width: 1px;
			border-color: transparent;
			width:  34px !important;
			height: 34px !important;
			padding: 1px;
		}

		.button:hover {
			border-style: dotted !important;
			border-color: gray   !important;
			padding: 0px !important;
		}

		.button.active {
			border-style:     solid !important;
			border-color:     black !important;
			background-color: white !important;
			padding: 0px !important;
		}

		

		.buttons > .button:not(:first-child) {
			margin-top: 5px;
		}

	`]
})
export default class ProcessTypeButtonComponent {

	model;
	highlight;

	activeTool;
	activeToolChange = new EventEmitter;

	toolSelected(type) {
		return  this.activeTool                            &&
		        this.activeTool.processType === this.model &&
		       (this.activeTool.type  === type || Array.isArray(type) && (this.activeTool.type === type[0] || this.activeTool.type === type[1]));
	}

	setTool() {
		this.activeToolChange.next(new ProcessTool({
			processType: this.model
		}));
	}

}
