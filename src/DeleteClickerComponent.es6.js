import {Component, EventEmitter} from 'angular2/core';

/* the component */
@Component({
	selector: 'g[deleteClicker]',
	inputs:   ['x', 'y'],
	template: `

		<svg:circle
			[attr.cx]   = " x                            "
			[attr.cy]   = " y                            "
			[attr.r]    = " RADIUS + (mouseOver ? 1 : 0) "
			(mouseover) = " mouseOver = true  "
			(mouseout)  = " mouseOver = false ">
		</svg:circle>
		<svg:line   [attr.x1]="x-3.5" [attr.y1]="y-3.5" [attr.x2]="x+3.5" [attr.y2]="y+3.5"></svg:line>
		<svg:line   [attr.x1]="x-3.5" [attr.y1]="y+3.5" [attr.x2]="x+3.5" [attr.y2]="y-3.5"></svg:line>

	`,
	styles:  [`

		circle {
			stroke: black;
			fill:   red;
			cursor: pointer;
		}
		
		line {
			stroke: darkred;
			stroke-width: 2.5;
			pointer-events: none;
		}

	`]
})
export default class DeleteClickerComponent {

	RADIUS = 7;

	mouseOver = false;

}
