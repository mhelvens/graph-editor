import $ from './libs/jquery.es6.js';

import SvgObject from './new/SvgObject.es6.js';

export default class DeleteClicker extends SvgObject {

	static RADIUS = 10;

	get hovering()  { return this.getVal('hovering') }
	set hovering(v) { this.setVal('hovering', v)  }

	constructor(options) {
		super(options);
		this.onClick = options.onClick;
		this.hovering = false;
	}

	createElement() {
		/* main HTML */
		const r = DeleteClicker.RADIUS;
		let result = $.svg(`
			<svg style="overflow: visible">
				<circle cx="0" cy="0"></circle>
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

		circle.mouseenter(() => { this.hovering = true  });
		circle.mouseleave(() => { this.hovering = false });
		circle.click((e) => { this.onClick(e) });

		/* alter DOM based on observed changes */
		this.observeExpressions([
			[circle, { r:  [['hovering'],  (hovering) => DeleteClicker.RADIUS + (hovering ? 1 : 0) ] }]
		], {
			setter(element, key, val) { element.attr(key, val) },
			ready: isFinite
		});

		return result;

	}

}
