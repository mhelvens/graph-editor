/* library imports */
import {bootstrap}               from 'angular2/platform/browser';
import {enableProdMode, provide} from 'angular2/core';
import $                         from 'jquery';

/* local imports */
import AppComponent from './AppComponent.es6.js';
import Resources    from './util/Resources.es6.js';

/* styling */
import './index.scss';

/* run the application */
(async () => {

	/* pre-load all resources */
	let resources = new Resources;
	await resources.preloadAllResources();

	/* bootstrap Angular 2 */
	$('<app>').appendTo('body');
	enableProdMode();
	bootstrap(AppComponent, [
		provide(Resources, {useValue: resources})
	]);

})();
