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
		'[class.resource-view]': ` true                          `,
		'[title]':               ` model.name                    `,
		'[class.active]':        ` toolSelected('*', activeTool) `
	},
	template: `

		<div class="icon icon-Correlation"></div>
		<div class="text-content" [innerHtml]="(model.name + ' ('+model.id+')') | escapeHTML | underlineSubstring:highlight"></div>

		<div class="buttons">
			<div class="button line" [class.active]=" toolSelected('canonical-tree-line', activeTool) " (click)=" setTool('canonical-tree-line') "></div>
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

		.button.line { background-image: url(${LINE_ICON})      }

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