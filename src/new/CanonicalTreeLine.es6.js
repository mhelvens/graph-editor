import {pick, isFinite} from 'lodash';
import $                from '../libs/jquery.es6.js';

import SvgEntity     from './SvgEntity.es6.js';


export default class CanonicalTreeLine extends SvgEntity {

	source;
	target;

	get hovering()  { return this.getVal('hovering') }
	set hovering(v) { this.setVal('hovering', v)     }

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'source', 'target'));
		this.source.one('destroy', () => { this.delete() });
		this.target.one('destroy', () => { this.delete() });
	}

	createElement() {
		let result = $.svg(`
			<g>
				<line class="hover-area"></line>
				<line class="process"></line>
				<g    class="delete-clicker"></g>
			</g>
		`);
		const line = result.children('line.process').css({
			stroke:        '#cc0',
			strokeWidth:    5,
			pointerEvents: 'none'
		});
		const hoverArea = result.children('line.hover-area').css({
			stroke:        'transparent',
			strokeWidth:    16,
			pointerEvents: 'all'
		});
		const lines = result.children('line');

		hoverArea.mouseenter(() => { this.hovering = true  });
		hoverArea.mouseleave(() => { this.hovering = false });
		this.source.observe('x', (x) => { lines.attr('x1', x) });
		this.source.observe('y', (y) => { lines.attr('y1', y) });
		this.target.observe('x', (x) => { lines.attr('x2', x) });
		this.target.observe('y', (y) => { lines.attr('y2', y) });

		/* delete button */
		let deleteClicker = this.createDeleteClicker();
		deleteClicker.element.appendTo(result.children('.delete-clicker'));

		const positionDeleteClicker = () => {
			if (!isFinite(this.source.x)) { return }
			if (!isFinite(this.source.y)) { return }
			if (!isFinite(this.target.x)) { return }
			if (!isFinite(this.target.y)) { return }
			deleteClicker.element.attr('x', (this.source.x + this.target.x) / 2);
			deleteClicker.element.attr('y', (this.source.y + this.target.y) / 2);
		};
		this.source.observe('x', positionDeleteClicker);
		this.source.observe('y', positionDeleteClicker);
		this.target.observe('x', positionDeleteClicker);
		this.target.observe('y', positionDeleteClicker);
		const showHideDeleteClicker = () => {
			if (this.hovering || deleteClicker.hovering) {
				deleteClicker.element.show();
			} else {
				deleteClicker.element.hide();
			}
		};
		this         .observe('hovering', showHideDeleteClicker);
		deleteClicker.observe('hovering', showHideDeleteClicker);

		return result;
	}

}
