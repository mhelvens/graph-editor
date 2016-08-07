import $ from '../libs/jquery.es6.js';

import {event} from './ValueTracker.es6.js';
import SvgObject from './SvgObject.es6.js';

export default class Clicker extends SvgObject {

	static RADIUS = 11;

	@event() clicks;

	decorateCircle(circle) {}

	createElement() {
		
		/* main HTML */
		const r = Clicker.RADIUS;
		let result = $.svg(`
			<svg style="overflow: visible">
				<circle cx="0" cy="0" r="${r}"></circle>
			</svg>
		`);

		/* extract and style important elements */
		const circle = result.children('circle').css({ cursor: 'pointer' });
		this.decorateCircle(circle);

		/* observables */
		circle.mousedown((e) => { e.preventDefault() });
		this.clicks.plug(circle.asKefirStream('click'));
		this.p('hovering').plug(circle.asKefirStream('mouseenter').map(()=>true ));
		this.p('hovering').plug(circle.asKefirStream('mouseleave').map(()=>false));

		/* alter DOM based on observed changes */
		circle.attrPlug('r', this.p('hovering').map((hovering) => r + (hovering ? 1 : 0)));

		/* return result */
		return result;

	}

}
