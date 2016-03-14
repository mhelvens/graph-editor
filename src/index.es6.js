/* library imports */
import {bootstrap}                          from 'angular2/bootstrap';
import {Component, provide, enableProdMode} from 'angular2/core';
import $                                    from 'jquery';
import GoldenLayout                         from './libs/golden-layout.es6.js';

/* local imports */
import LyphCanvasComponent              from './angular/LyphCanvasComponent.es6.js';
import MiscToolButtonsListComponent     from './angular/MiscToolButtonsListComponent.es6.js';
import ProcessTypeButtonListComponent   from './angular/ProcessTypeButtonListComponent.es6.js';
import LyphTemplateButtonListComponent  from './angular/LyphTemplateButtonListComponent.es6.js';
import CanonicalTreeButtonListComponent from './angular/CanonicalTreeButtonListComponent.es6.js';
import Resources                        from './Resources.es6.js';

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
	await new Promise((resolve) => {
		try {
			@Component({
				selector: 'bootstrap',
				directives: [
					LyphCanvasComponent,
					MiscToolButtonsListComponent,
					ProcessTypeButtonListComponent,
					LyphTemplateButtonListComponent,
					CanonicalTreeButtonListComponent
				],
				template: `

					<misc-tool-buttons-list     [(activeTool)]=" activeTool "></misc-tool-buttons-list>
					<process-type-button-list   [(activeTool)]=" activeTool "></process-type-button-list>
					<lyph-template-button-list  [(activeTool)]=" activeTool "></lyph-template-button-list>
					<canonical-tree-button-list [(activeTool)]=" activeTool "></canonical-tree-button-list>
					<lyph-canvas [activeTool]=" activeTool " (added)=" onArtefactAdded() "></lyph-canvas>
					
				`
			})
			class BootstrapComponent {

				activeTool = null;

				onArtefactAdded() {
					this.activeTool = null;
				}

				ngOnInit() {
					resolve();
				}

			}
			$('<bootstrap>').appendTo('body');
			enableProdMode();
			bootstrap(BootstrapComponent, [
				provide(Resources, { useValue: resources })
			]);
		} catch (err) { reject(err) }
	});


	/* populating the panels */
	leftPanel.css('overflow-y', 'scroll');
	$('bootstrap > misc-tool-buttons-list')    .detach().appendTo(leftPanel).wrap(`<div class="inner-panel">`).parent().css('margin', '10px');
	$('bootstrap > process-type-button-list')  .detach().appendTo(leftPanel).wrap(`<div class="inner-panel">`).parent().css('margin', '10px');
	$('bootstrap > lyph-template-button-list') .detach().appendTo(leftPanel).wrap(`<div class="inner-panel">`).parent().css('margin', '10px');
	$('bootstrap > canonical-tree-button-list').detach().appendTo(leftPanel).wrap(`<div class="inner-panel">`).parent().css('margin', '10px');
	$('bootstrap > lyph-canvas')               .detach().appendTo(mainPanel);


	/* Done */
	console.info("Done.");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
} catch (err) { console.log('Error:', err) } })();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
