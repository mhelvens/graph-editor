import {Component, EventEmitter, Inject} from 'angular2/core';

import {ModelRepresentation}    from './util/model-representation.es6.js';
import Resources                from './util/Resources.es6.js';


@Component({
	selector: 'lyph-template',
	pipes: [
		require('./util/underline-substring-pipe.es6.js').default,
		require('./util/escape-html-pipe.es6.js')        .default
	],
	inputs: ['model', 'highlight'],
	host: {
		'[class.resource-view]': ` true               `,
		'[title]':               ` model.name         `,
		'(click)':               ` select.next(model) `
	},
	template: `

		<div class="icon icon-LyphTemplate"></div>
		<div class="text-content" [innerHtml]="model.name | escapeHTML | underlineSubstring:highlight"></div>

	`,
	styles: [`

		:host       { background-color: #fee !important }
		:host:hover { background-color: #fcc !important }

		:host .text-content {
			font-weight: bold;
		}

	`]
})
export default class LyphTemplate {

	static endpoint = 'lyphTemplates';

	//constructor(resources: Resources) {
	//
	//}

}
