/* library imports */
import {bootstrap}                          from 'angular2/bootstrap';
import {Component, provide, enableProdMode} from 'angular2/core';
import $                         from 'jquery';
import scrollbarSize from 'scrollbar-size';
import GoldenLayout  from './libs/golden-layout.es6.js';

/* local imports */
import AppComponent from './AppComponent.es6.js';
import Resources    from './util/Resources.es6.js';

/* styling */
import './index.scss';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
(async () => { try {
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	/* golden layout setup */
	let layout = new GoldenLayout({
		settings: { hasHeaders: false },
		dimensions: {
			minItemWidth:  200,
			minItemHeight: 200
		},
		content: [{
			type: 'row',
			content: [{
				type:          'component',
				componentName: 'leftPanel',
				width: 16
			}, {
				type:          'component',
				componentName: 'mainPanel',
				width: 84
			}]
		}]
	});

	/* get the jQuery panel elements */
	let [ leftPanel , mainPanel ] = await Promise.all(layout.components
	/**/('leftPanel','mainPanel'));


	/* pre-load all resources */
	console.info("Downloading resources...");
	let resources = new Resources;
	await resources.preloadAllResources();


	/* AngularJS 2 app component */
	console.info("Bootstrapping application...");
	await new Promise((resolve, reject) => {
		try {
			@Component({
				selector: 'bootstrap',
				directives: [
					AppComponent,
				    require('./LyphTemplateListComponent.es6.js').default
				],
				template: `
					<lyph-template-list></lyph-template-list>
					<app></app>
				`
			})
			class BootstrapComponent { ngOnInit() { resolve() } }
			$('<bootstrap>').appendTo('body');
			enableProdMode();
			bootstrap(BootstrapComponent, [
				provide(Resources, { useValue: resources })
			]);
		} catch (err) { reject(err) }
	});


	/* populating the panels */
	$('bootstrap > lyph-template-list').detach().appendTo(leftPanel);
	$('bootstrap > app')               .detach().appendTo(mainPanel);


	/* Done */
	console.info("Done.");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
} catch (err) { console.log('Error:', err) } })();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
