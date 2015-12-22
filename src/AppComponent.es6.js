import {Component, View, Inject, ChangeDetectorRef, ElementRef} from 'angular2/core';


@Component({
    selector:   'app',
    directives: [
	    require('./LyphTemplateListComponent.es6.js')
    ],
    template: `

		<div class="container-fluid">
			<div class="row">
				<aside class="col-xs-0 col-sm-3 col-md-2">

					<div class="tool-panel">
						<div class="header">Toolbox</div>

						<lyph-template-list></lyph-template-list>

					</div>

				</aside>
				<main class="col-xs-12 col-sm-9 col-sm-offset-3 col-md-10 col-md-offset-2">

					<div class="row">
						<!--TODO-->
					</div>

				</main>
			</div>
		</div>

    `,
	styles: [`

		:host {
			padding:    0;
			margin:     0;
			min-width:  100%;
			min-height: 100%;
			overflow:   hidden;
		}

		:host > .container-fluid {
			position: relative;
			margin: 10px;
			min-height: 100%;
		}

		:host > .container-fluid > .row {
			margin: 0;
		}

		aside { display: none }
		@media (min-width: 768px) {
			aside {
				position: fixed;
				top:      0;
				bottom:   0;
				left:     0;
				z-index:  100;
				display:  block;
				overflow-x: visible;
				overflow-y: visible;
			}
		}

		aside > .tool-panel {
			position: absolute;
			top:     10px;
			left:    10px;
			bottom:  10px;
			right:   10px;
			padding: 0;
			background-color: #f5f5f5;
			border: 1px solid gray;
			border-radius: 4px;
			overflow-x: hidden;
			overflow-y: scroll;
		}

		aside > .tool-panel > .header {
			cursor:           default;
			background-color: gray;
			color:            white;
			text-align:       center;
			font-weight:      bold;
			display:          block;
			padding:          10px 15px;
		}

		main {
			padding: 0;
		}

		main .page-header {
			margin-top: 0;
		}


	`]
})
export default class AppComponent {

	constructor() {



	}



}
