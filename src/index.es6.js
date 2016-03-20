/* library imports */
import {bootstrap}                          from 'angular2/bootstrap';
import {Component, provide, enableProdMode} from 'angular2/core';
import $                                    from './libs/jquery.es6.js';
import GoldenLayout                         from './libs/golden-layout.es6.js';
import Kefir                                from './libs/kefir.es6.js';
import get                                  from 'lodash/fp/get';

/* local imports */
import LyphCanvasComponent              from './angular/LyphCanvasComponent.es6.js';
import MiscToolButtonsListComponent     from './angular/MiscToolButtonsListComponent.es6.js';
import ProcessTypeButtonListComponent   from './angular/ProcessTypeButtonListComponent.es6.js';
import LyphTemplateButtonListComponent  from './angular/LyphTemplateButtonListComponent.es6.js';
import CanonicalTreeButtonListComponent from './angular/CanonicalTreeButtonListComponent.es6.js';
import Resources                        from 'resources/ResourceFetcher.es6.js';

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
				width: 20
			}, {
				type:          'component',
				componentName: 'mainPanel',
				width: 80
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

				ngAfterViewInit() {
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
	$('bootstrap > misc-tool-buttons-list')      .detach().appendTo(leftPanel).wrap(`<div class="inner-panel">`).parent().css('margin', '10px');
	$('bootstrap > process-type-button-list')    .detach().appendTo(leftPanel).wrap(`<div class="inner-panel">`).parent().css('margin', '10px');
	$('bootstrap > lyph-template-button-list')   .detach().appendTo(leftPanel).wrap(`<div class="inner-panel">`).parent().css('margin', '10px');
	$('bootstrap > canonical-tree-button-list')  .detach().appendTo(leftPanel).wrap(`<div class="inner-panel">`).parent().css('margin', '10px');
	let lyphCanvas = $('bootstrap > lyph-canvas').detach().appendTo(mainPanel).children().data('controller');

	/* propagating resize events */
	let sizing = Kefir.merge([
		Kefir.once(), Kefir.later(1000),
		$(window).asKefirStream('resize')
	]).map(() => ({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }));
	lyphCanvas.p('x')      .plug(sizing.map(get('window.left'  )));
	lyphCanvas.p('y')      .plug(sizing.map(get('window.top'   )));
	lyphCanvas.p('width' ) .plug(sizing.map(get('window.width' )));
	lyphCanvas.p('height') .plug(sizing.map(get('window.height')));

	lyphCanvas.e('canvasResizedOrMoved').plug(Kefir.merge([
		Kefir.once(), Kefir.later(1000),
		Kefir.fromEvents(mainPanel.data('container'), 'resize')
	]));

	/* Done */
	console.info("Done.");


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
} catch (err) { console.log('Error:', err) } })();
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
