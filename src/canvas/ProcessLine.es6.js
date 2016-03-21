import pick  from 'lodash/pick';
import $     from '../libs/jquery.es6.js';
import Kefir from '../libs/kefir.es6.js';
import Fraction, {isNumber} from '../libs/fraction.es6.js';

import {property} from './ValueTracker.es6.js';

import SvgEntity  from './SvgEntity.es6.js';

const {abs, sqrt} = Math;


export default class ProcessLine extends SvgEntity {

	source;
	target;

	@property({isValid: isNumber}) lengthSq;
	@property({isValid: isNumber}) xSq;
	@property({isValid: isNumber}) ySq;
	@property({isValid: isNumber}) x1;
	@property({isValid: isNumber}) y1;
	@property({isValid: isNumber}) x2;
	@property({isValid: isNumber}) y2;

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'source', 'target'));
		this.source.e('delete').take(1).onValue(() => { this.delete() });
		this.target.e('delete').take(1).onValue(() => { this.delete() });

		this.p('xSq')     .plug([this.source.p('x'), this.target.p('x')], (x1, x2)   => abs(x1-x2)**2);
		this.p('ySq')     .plug([this.source.p('y'), this.target.p('y')], (y1, y2)   => abs(y1-y2)**2);
		this.p('lengthSq').plug([this.p('xSq'), this.p('ySq')],           (xSq, ySq) => xSq + ySq    );

		this.p('x1').plug([
			this.source.p('x'),
			this.target.p('x'),
			this.source.p('r'),
		    this.p('xSq'),
		    this.p('lengthSq')
		], (sx, tx, r, xSq, lSq) => Fraction(r).mul(sx < tx ? +1 : -1).div(sqrt(lSq) || 0.1).mul(sqrt(xSq)).add(sx));
		this.p('y1').plug([
			this.source.p('y'),
			this.target.p('y'),
			this.source.p('r'),
			this.p('ySq'),
			this.p('lengthSq')
		], (sy, ty, r, ySq, lSq) => Fraction(r).mul(sy < ty ? +1 : -1).div(sqrt(lSq) || 0.1).mul(sqrt(ySq)).add(sy));
		this.p('x2').plug([
			this.target.p('x'),
			this.source.p('x'),
			this.target.p('r'),
			this.p('xSq'),
			this.p('lengthSq')
		], (tx, sx, r, xSq, lSq) => Fraction(r).mul(tx < sx ? +1 : -1).div(sqrt(lSq) || 0.1).mul(sqrt(xSq)).add(tx));
		this.p('y2').plug([
			this.target.p('y'),
			this.source.p('y'),
			this.target.p('r'),
			this.p('ySq'),
			this.p('lengthSq')
		], (ty, sy, r, ySq, lSq) => Fraction(r).mul(ty < sy ? +1 : -1).div(sqrt(lSq) || 0.1).mul(sqrt(ySq)).add(ty));

	}

	createElement() {
		/* main HTML */
		let result = $.svg(`
			<g>
				<line class="hover-area"></line>
				<line class="process"></line>
				<g    class="delete-clicker"></g>
			</g>
		`);
		
		/* extract and style important elements */
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

		/* alter DOM based on observed changes */
		this.p('hovering').plug(hoverArea.asKefirStream('mouseenter').map(()=>true ));
		this.p('hovering').plug(hoverArea.asKefirStream('mouseleave').map(()=>false));
		lines.attrPlug({
			x1: this.p('x1'),
			y1: this.p('y1'),
			x2: this.p('x2'),
			y2: this.p('y2')
		});

		/* delete button */
		let deleteClicker = this.deleteClicker();
		deleteClicker.element.appendTo(result.children('.delete-clicker'));
		(deleteClicker.element).attrPlug({
			x: Kefir.combine([this.source.p('x'), this.target.p('x')], (x1, x2) => (x1 + x2) / 2),
			y: Kefir.combine([this.source.p('y'), this.target.p('y')], (y1, y2) => (y1 + y2) / 2)
		});
		(deleteClicker.element)
			.cssPlug('display', Kefir.combine([
				this.p('hovering'),
				deleteClicker.p('hovering'),
				this.root.p('draggingSomething')
			]).map(([h1, h2, d]) => (h1 || h2) && !d ? 'block' : 'none'));

		/* return result */
		return result;
	}

}
