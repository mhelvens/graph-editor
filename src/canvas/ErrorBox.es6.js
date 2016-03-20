import $       from '../libs/jquery.es6.js';
import invokeMap from 'lodash/invokeMap';
import pick from 'lodash/pick';
import SvgEntity  from './SvgEntity.es6.js';


const pluggedIntoParent = Symbol('pluggedIntoParent');


export default class ErrorBox extends SvgEntity {

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'message'), {
			model: {
				type: 'Error',
				id:   -Infinity
			}
		});
	}

	setParent(newParent) {
		super.setParent(newParent);

		/* unplug any connections to the old parent */
		invokeMap(this[pluggedIntoParent] || [], 'unplug');
		this[pluggedIntoParent] = [];

		if (!newParent) { return }

		this.p('x')     .plug(this.parent.p('x')     );
		this.p('y')     .plug(this.parent.p('y')     );
		this.p('width') .plug(this.parent.p('width') );
		this.p('height').plug(this.parent.p('height'));
	};

	createElement() {
		/* main HTML */
		let result = $.svg(`
			<g>
				<rect class="error">
					<title>${this.model.message}</title>
				</rect>
			</g>
		`);

		/* extract and style important elements */
		const rect = result.children('rect.error').css({
			stroke:         'black',
			fill:           'white',
			shapeRendering: 'crispEdges',
			pointerEvents:  'all',
			strokeWidth:     2
		});

		/* alter DOM based on observed changes */
		rect.attrPlug({
			x:      this.p('x'),
			y:      this.p('y'),
			width:  this.p('width'),
			height: this.p('height')
		});

		return result;
	}

}
