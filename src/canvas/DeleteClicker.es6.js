import $ from '../libs/jquery.es6.js';

import {event} from './ValueTracker.es6.js';
import SvgObject from './SvgObject.es6.js';

export default class DeleteClicker extends SvgObject {

	static RADIUS = 10;

	@event() clicks;

	createElement() {
		
		/* main HTML */
		const r = DeleteClicker.RADIUS;
		let result = $.svg(`
			<svg style="overflow: visible">
				<circle cx="0" cy="0" r="${DeleteClicker.RADIUS}"></circle>
				<line   x1="${-r/2}" y1="${-r/2}" x2="${ r/2}" y2="${ r/2}"></line>
				<line   x1="${-r/2}" y1="${ r/2}" x2="${ r/2}" y2="${-r/2}"></line>
			</svg>
		`);

		/* extract and style important elements */
		const circle = result.children('circle').css({
			stroke: 'black',
			fill:   'red',
			cursor: 'pointer'
		});
		result.children('line').css({
			stroke: 'darkred',
			strokeWidth: '2.5',
			pointerEvents: 'none'
		});

		/* observables */
		this.clicks.plug(circle.asKefirStream('click'));
		this.p('hovering')
		    .plug(circle.asKefirStream('mouseenter').map(()=>true ))
		    .plug(circle.asKefirStream('mouseleave').map(()=>false));

		/* alter DOM based on observed changes */
		circle.attrPlug('r', this.p('hovering').map((hovering) => DeleteClicker.RADIUS + (hovering ? 1 : 0)));

		return result;

	}

}
