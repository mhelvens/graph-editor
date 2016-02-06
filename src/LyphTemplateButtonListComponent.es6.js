import {Component, EventEmitter} from 'angular2/core';
import $                         from 'jquery';

import LyphTemplateButtonComponent from './LyphTemplateButtonComponent.es6.js';
import Resources, {request} from './util/Resources.es6.js';


@Component({
	selector: 'lyph-template-button-list',
	inputs: ['model'],
	events: ['modelChange'],
	pipes: [
		require('./util/substring-pipe.es6.js').default
	],
	directives: [
		LyphTemplateButtonComponent
	],
	template: `

		<div class="list-group" style="margin: 0">
			<div class        = "form-group has-feedback"
	             style        = "padding: 0; margin: 0; width: 100%; z-index: 9;">
				<input
					type        = "text"
					class       = "form-control"
					style       = "border-radius: 0"
			        placeholder = "Filter Lyph Templates"
					(input)     = "filter = $event.target.value"
					(paste)     = "filter = $event.target.value">
				<span class="glyphicon glyphicon-filter form-control-feedback"></span>
			</div>

			<!--<div style="visibility: hidden; height: 34px"></div>-->

			<lyph-template
				*ngFor      = " #lt of allResources['lyphTemplates'] | fieldSubstring:filterText:filter "
				 class      = " list-group-item                                     "
				[class.selected] = " model === lt "
				[model]     = " lt                                               "
				[highlight] = " filter                                              "
				(click)     = " modelChange.next(lt)                           ">
	        </lyph-template>
		</div>

	`,
	styles: [`

		lyph-template.selected {
			border-left : solid 3px black !important;
			border-right: solid 3px black !important;
		}

	`]
})
export default class LyphTemplateButtonListComponent {

	model       = null;
	modelChange = new EventEmitter;

	constructor(resources: Resources) {
		this.resources = resources;
		this.allResources = resources.getAllResources_sync();
		this.models = resources.getAllResources_sync()['lyphTemplates'];
	}

	filterText(model) { return model.name }

}
