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
			<div class="button box " [class.active]=" toolSelected('box',  activeTool) " (click)=" setTool('box' ) "></div>
			<div class="button line" [class.active]=" toolSelected('line', activeTool) " (click)=" setTool('line') "></div>
		</div>

	`,
	styles: [`

		:host {
			cursor: default;
			color: black !important;
		}

		:host        { background-color: #fee !important }
		:host:hover  { background-color: #fcc !important }
		:host.active { background-color: #fcc !important; font-style: italic; }

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

		.button.box  { background-image: url(${RECTANGLE_ICON}) }
		.button.line { background-image: url(${LINE_ICON})      }

		.buttons > .button:not(:first-child) {
			margin-top: 5px;
		}

	`]
})
export default class LyphTemplateButtonComponent {

	model;
	highlight;

	activeTool;
	activeToolChange = new EventEmitter;

	toolSelected(form) {
		return  this.activeTool                      &&
		        this.activeTool.model === this.model &&
		       (this.activeTool.form  === form || form === '*');
	}

	setTool(form) {
		this.activeToolChange.next({
			model: this.model,
			form:  form
		});
	}

}
