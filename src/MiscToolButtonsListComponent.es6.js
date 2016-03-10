import {Component, EventEmitter} from 'angular2/core';

import Resources, {request} from './util/Resources.es6.js';

const RECTANGLE_ICON = require('./img/draw-rectangle.png');
const LINE_ICON      = require('./img/draw-line.png');
const NODE_ICON      = require('./img/draw-node.png');

@Component({
	selector: 'misc-tool-buttons-list',
	inputs: ['activeTool'      ],
	events: ['activeToolChange'],
	template: `

		<div class="list-group" style="margin: 0">

			<div class="list-group-item resource-view" (click)=" activeToolChange.next({form:'node'}) ">
				<div class="text-content" style="text-align: left">Node</div>
				<div class="buttons">
					<div class="button node" [class.active]=" toolSelected('node', activeTool) " (click)=" activeToolChange.next({form:'node'}) "></div>
				</div>
	        </div>

			<!--<div class="list-group-item resource-view" [class.active]=" toolSelected('process', activeTool) ">
				<div class="text-content" style="text-align: left">Process</div>
				<div class="buttons">
					<div class="button line" [class.active]=" toolSelected('process', activeTool) " (click)=" activeToolChange.next({form:'process'}) "></div>
				</div>
	        </div>-->

		</div>

	`,
	styles: [`

		:host {
			display: block;
		}

		.resource-view {
			cursor: default;
			color: black !important;
		}

		.resource-view        { background-color: #fff !important }
		.resource-view:hover  { background-color: #ddd !important }
		.resource-view.active { background-color: #ddd !important; font-style: italic; }

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
		.button.node { background-image: url(${NODE_ICON})      }

		.buttons > .button:not(:first-child) {
			margin-top: 5px;
		}

	`]
})
export default class MiscToolButtonsListComponent {

	activeTool;
	activeToolChange = new EventEmitter;

	constructor(resources: Resources) {
		this.models = resources.getAllResources_sync()['lyphTemplates'];
	}

	filterText(model) { return model.name }

	toolSelected(form) {
		return (!form && !this.activeTool) || (this.activeTool && this.activeTool.form  === form);
	}

	setTool(form) {
		this.activeToolChange.next({
			model: this.model,
			form:  form
		});
	}

}
