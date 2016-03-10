import {Component, EventEmitter} from 'angular2/core';
import $                         from 'jquery';

import ProcessTypeButtonComponent from './ProcessTypeButtonComponent.es6.js';
import Resources, {request} from './util/Resources.es6.js';


@Component({
	selector: 'process-type-button-list',
	inputs: ['activeTool'      ],
	events: ['activeToolChange'],
	pipes: [
		require('./util/substring-pipe.es6.js').default
	],
	directives: [
		ProcessTypeButtonComponent
	],
	template: `

		<div class="list-group" style="margin: 0">
			<div class        = "form-group has-feedback"
	             style        = "padding: 0; margin: 0; width: 100%; z-index: 9;">
				<input
					type        = "text"
					class       = "form-control"
					style       = "border-radius: 0"
			        placeholder = "Filter Process Types"
					(input)     = "filter = $event.target.value"
					(paste)     = "filter = $event.target.value">
				<span class="glyphicon glyphicon-filter form-control-feedback"></span>
			</div>

			<!--<div style="visibility: hidden; height: 34px"></div>-->

			<process-type
				*ngFor             = " #model of models | fieldSubstring:filterText:filter "
				 class             = " list-group-item                                     "
				[model]            = " model                                               "
				[activeTool]       = " activeTool                                          "
				(activeToolChange) = " activeToolChange.next($event)                       "
				[highlight]        = " filter                                              ">
	        </process-type>
		</div>

	`,
	styles: [`

		:host {
			display: block;
		}

		process-type.selected {
			border-left : solid 3px black !important;
			border-right: solid 3px black !important;
		}

	`]
})
export default class ProcessTypeButtonListComponent {

	activeTool;
	activeToolChange = new EventEmitter;

	constructor(resources: Resources) {
		this.models = resources.getAllResources_sync()['processTypes'];
	}

	filterText(model) { return model.name }

}
