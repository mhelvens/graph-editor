import {Component, EventEmitter, Inject} from 'angular2/core';
import $             from 'jquery';

import Resources, {request} from './util/Resources.es6.js';


@Component({
	selector: 'lyph-template-list',
	events: ['select'/*, 'add'*/],
	pipes: [
		require('./util/substring-pipe.es6.js').default
	],
	directives: [
		require('./LyphTemplateComponent.es6.js').default
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
				*ngFor      = " #model of allResources['lyphTemplates'] | fieldSubstring:filterText:filter "
				 class      = " list-group-item                                     "
				[model]     = " model                                               "
				[highlight] = " filter                                              "
				(select)    = " select.next($event)                                 "
				(dragging)  = " showTrashcan = !!$event                             ">
	        </lyph-template>

			<!--<div style="visibility: hidden; height: 34px"></div>-->

			<!--<button type="button" class="btn btn-default"-->
			        <!--style="position: absolute; bottom: -1px; left: 1px; border-radius: 0;"-->
			        <!--[style.width] = " 'calc(100% - '+scrollbarSize+'px)' "-->
			        <!--(click)       = " add.next() ">-->
				<!--<span class="glyphicon glyphicon-plus"></span> Add new Lyph Template-->
			<!--</button>-->
		</div>

	`,
	styles: [``]
})
export default class LyphTemplateList {

	select = new EventEmitter;
	//add    = new EventEmitter;

	constructor(resources: Resources) {
		this.resources = resources;
		this.allResources = resources.getAllResources_sync();
		this.models = resources.getAllResources_sync()['lyphTemplates'];
		this.showTrashcan = false;
	}

	async deleteResource(model) {
		this.showTrashcan = false;
		try {
			await this.resources.deleteResource(model);
		} catch (err) {
			console.dir(err); // TODO: create human readable message for this
		}
	}

	filterText(model) { return model.name }

}
