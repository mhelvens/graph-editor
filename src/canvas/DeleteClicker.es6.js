import $ from '../libs/jquery.es6.js';

import Clicker from './Clicker.es6.js';

export default class DeleteClicker extends Clicker {

	decorateCircle(circle) {
		let r = circle.attr('r');
		let lines = $.svg(`
			<line   x1="${-r/2}" y1="${-r/2}" x2="${ r/2}" y2="${ r/2}"></line>
			<line   x1="${-r/2}" y1="${ r/2}" x2="${ r/2}" y2="${-r/2}"></line>
		`).insertAfter(circle);
		circle.css({
			stroke: 'black',
			fill:   'red'
		});
		lines.css({
			stroke: 'darkred',
			strokeWidth: '2.5',
			pointerEvents: 'none'
		});
	}

}
