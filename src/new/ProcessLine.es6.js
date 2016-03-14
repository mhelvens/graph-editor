import {pick, isFinite} from 'lodash';
import $                from '../libs/jquery.es6.js';
import Kefir            from '../libs/kefir.es6.js';

import SvgEntity     from './SvgEntity.es6.js';


export default class ProcessLine extends SvgEntity {

	source;
	target;

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'source', 'target'));
		this.source.e('destroy').take(1).onValue(() => { this.delete() });
		this.target.e('destroy').take(1).onValue(() => { this.delete() });
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
			stroke:        this.model.color,
			strokeWidth:    3,
			pointerEvents: 'none'
		});
		const hoverArea = result.children('line.hover-area').css({
			stroke:        'transparent',
			strokeWidth:    16,
			pointerEvents: 'all'
		});
		const lines = result.children('line');

		this.p('hovering')
		    .plug(hoverArea.asKefirStream('mouseenter').map(()=>true ))
		    .plug(hoverArea.asKefirStream('mouseleave').map(()=>false));
		lines
			.attrPlug('x1', this.source.p('x'))
			.attrPlug('y1', this.source.p('y'))
			.attrPlug('x2', this.target.p('x'))
			.attrPlug('y2', this.target.p('y'));

		/* delete button */
		let deleteClicker = this.createDeleteClicker();
		deleteClicker.element.appendTo(result.children('.delete-clicker'));

		(deleteClicker.element)
			.attrPlug('x', Kefir.combine([this.source.p('x'), this.target.p('x')]).map(([x1, x2]) => (x1 + x2) / 2) )
			.attrPlug('y', Kefir.combine([this.source.p('y'), this.target.p('y')]).map(([y1, y2]) => (y1 + y2) / 2) );

		(deleteClicker.element)
			.cssPlug('display', Kefir.combine([
				this.p('hovering'),
				deleteClicker.p('hovering')
			]).map(([a, b]) => (a || b) ? 'block' : 'none'));

		return result;
	}

}
