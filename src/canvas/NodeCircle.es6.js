import pick     from 'lodash/pick';
import clamp    from 'lodash/fp/clamp';
import clone    from 'lodash/fp/clone';
import $        from '../libs/jquery.es6.js';
import interact from '../libs/interact.js';
import Kefir    from '../libs/kefir.es6.js';
import Fraction, {isNumber, equals} from '../libs/fraction.es6.js';

import {property} from './ValueTracker.es6.js';

import SvgDimensionedEntity from './SvgDimensionedEntity.es6.js';
import LayerTemplateBox     from './LayerTemplateBox.es6.js';
import ProcessLine          from './ProcessLine.es6.js';


const {abs} = Math;


export default class NodeCircle extends SvgDimensionedEntity {

	static IDLE_RADIUS     = 10;
	static DRAGGING_RADIUS = 16;
	static SNAP_DISTANCE   = 20;

	@property({isValid: isNumber}) r;

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'x', 'y'));

		this.width = this.height = 0;

		this.p('r').plug(this.p('dragging').map((dragging) => dragging
			? NodeCircle.DRAGGING_RADIUS
			: NodeCircle.IDLE_RADIUS
		));
	}

	createElement() {
		/* main HTML */
		let result = $.svg(`
			<g>
				<circle class="node center" r="0.1"></circle>
				<circle class="node shape"></circle>
				<g class="delete-clicker"></g>
			</g>
		`);

		/* extract and style important elements */
		const center = result.children('.node.center');
		const shape  = result.children('.node.shape').css({
			stroke: 'black',
			fill:   'white'
		});

		/* observe values and alter view accordingly */
		this.p('hovering').plug(shape.asKefirStream('mouseenter').map(()=>true ));
		this.p('hovering').plug(shape.asKefirStream('mouseleave').map(()=>false));
		center.attrPlug({
			cx: this.p('x'),
			cy: this.p('y')
		});
		shape.attrPlug({
			cx: this.p('x'),
			cy: this.p('y'),
			r:  this.p('r')
		});

		/* delete button */
		let deleteClicker = this.deleteClicker();
		deleteClicker.element.appendTo(result.children('.delete-clicker'));

		(deleteClicker.element).attrPlug({
			x: this.p('x').map(x => x + 12),
			y: this.p('y').map(y => y - 12)
		});

		(deleteClicker.element).cssPlug('display', Kefir.combine([
			this.p('hovering'),
			deleteClicker.p('hovering'),
			this.root.p('draggingSomething')
		]).map(([h1, h2, d]) => (h1 || h2) && !d ? 'block' : 'none'));

		/* drawing process with a tool */
		interact(shape[0]).on('down', async (event) => {

			if (!this.root.activeTool) { return }

			switch (this.root.activeTool.form) {
				case 'ProcessTool': {
					event.stopPropagation();
					this.root.deployTool_ProcessLine(event, {
						x: event.pageX,
						y: event.pageY,
						source: this
					})
				} break;
			}

		});
		Kefir.combine([this.p('dragging'), this.root.p('activeTool')]).onValue(([dragging, activeTool]) => {
			let drawingProcess = activeTool && activeTool.form === 'ProcessTool';
			shape.toggleClass('pointer',   drawingProcess             );
			shape.toggleClass('grab',     !drawingProcess && !dragging);
			shape.toggleClass('grabbing', !drawingProcess &&  dragging);
		});

		return result;
	}

	deployTool_ProcessLine(event, {x, y}) {
		let process = new ProcessLine({
			parent: this.root,
			model : this.root.activeTool.processType,
			source: this,
			target: new NodeCircle({
				parent: this.parent,
				model : { id: -1, name: 'test target node' }, // TODO: real node models
				x, y
			})
		});
		this.parent.appendChildElement(process.target);
		this.root.appendChildElement(process);
		return process.target.startDraggingBy(event);
	};

	draggable() {
		let raw;
		return {
			handle:  'circle.node.shape',
			// tracker: '.node.center',
			autoScroll: true,
			onstart: (event) => {

				event.stopPropagation();

				/* dragged things stay in front of other things */
				this.moveToFront();

				/* initialize interaction-local variables */
				raw  = pick(this, 'x', 'y');

			},
			onmove: ({interaction, dx, dy}) => {

				/* update raw coordinates */
				raw.x += dx;
				raw.y += dy;

				/* initialize visible coordinates */
				let visible = clone(raw);

				/* snapping correction */
				let snap = { x: Infinity, y: Infinity };
				this.root.traverse(LayerTemplateBox, (layer) => {
					if (layer.y < raw.y && raw.y < layer.y + layer.height) {
						if (abs(layer.x                - raw.x) < abs(snap.x)) { snap.x = layer.x                - raw.x + 1 }
						if (abs(layer.x + layer.width  - raw.x) < abs(snap.x)) { snap.x = layer.x + layer.width  - raw.x - 1 }
					}
					if (layer.x < raw.x && raw.x < layer.x + layer.width) {
						if (abs(layer.y                - raw.y) < abs(snap.y)) { snap.y = layer.y                - raw.y + 1 }
						if (abs(layer.y + layer.height - raw.y) < abs(snap.y)) { snap.y = layer.y + layer.height - raw.y - 1 }
					}
				});
				if (abs(snap.x) <= abs(snap.y) && abs(snap.x) <= NodeCircle.SNAP_DISTANCE) { visible.x += snap.x }
				if (abs(snap.y) <  abs(snap.x) && abs(snap.y) <= NodeCircle.SNAP_DISTANCE) { visible.y += snap.y }

				/* restriction correction */
				visible.x = clamp( this.root.cx, this.root.cx + this.root.cwidth  )( visible.x );
				visible.y = clamp( this.root.cy, this.root.cy + this.root.cheight )( visible.y );

				/* correction for forced axis alignment */
				visible = this._applyAxisAlignmentRestrictions(visible);

				/* set visible (x, y) based on snapping and restriction */
				this.set(visible);

			}
		};
	}


	_axisAlignmentsAnchors = new Set;
	_axisAlignmentRestrictions = { type: 'all' };
	// { type: 'all'                          }
	// { type: 'cross', x, y                  }
	// { type: 'xLine', x                     }
	// { type: 'yLine', y                     }
	// { type: 'points', 1: {x, y}, 2: {x, y} }
	// { type: 'point',  x, y                 }
	// { type: 'nothing'                      }
	_processAxisAlignmentRestrictions({x, y}) {

		console.log(JSON.stringify(this._axisAlignmentRestrictions), JSON.stringify({x, y}));

		switch (this._axisAlignmentRestrictions.type) {
			case 'all': {
				this._axisAlignmentRestrictions = { type: 'cross', x, y };
			} break;
			case 'cross': {
				let xe = equals(this._axisAlignmentRestrictions.x, x),
				    ye = equals(this._axisAlignmentRestrictions.y, y);
				if (xe && !ye) {
					this._axisAlignmentRestrictions = { type: 'xLine', x };
				} else if (!xe && ye) {
					this._axisAlignmentRestrictions = { type: 'yLine', y };
				} else if (!xe && !ye) {
					this._axisAlignmentRestrictions = { type: 'points', 1: { x: this._axisAlignmentRestrictions.x, y }, 2: { x, y: this._axisAlignmentRestrictions.y } };
				}
			} break;
			case 'xLine': {
				if (!equals(x, this._axisAlignmentRestrictions.x)) {
					this._axisAlignmentRestrictions = { type: 'point', x, y };
				}
			} break;
			case 'yLine': {
				if (!equals(y, this._axisAlignmentRestrictions.y)) {
					this._axisAlignmentRestrictions = { type: 'point', x, y };
				}
			} break;
			case 'points': {
				if (!equals(this._axisAlignmentRestrictions[1].x, x) && !equals(this._axisAlignmentRestrictions[1].y, y)) { delete this._axisAlignmentRestrictions[1] }
				if (!equals(this._axisAlignmentRestrictions[2].x, x) && !equals(this._axisAlignmentRestrictions[2].y, y)) { delete this._axisAlignmentRestrictions[2] }
				if      ( this._axisAlignmentRestrictions[1] && !this._axisAlignmentRestrictions[2]) { this._axisAlignmentRestrictions = { type: 'point', ...this._axisAlignmentRestrictions[1]} }
				else if (!this._axisAlignmentRestrictions[1] &&  this._axisAlignmentRestrictions[2]) { this._axisAlignmentRestrictions = { type: 'point', ...this._axisAlignmentRestrictions[2]} }
				else if (!this._axisAlignmentRestrictions[1] && !this._axisAlignmentRestrictions[2]) { this._axisAlignmentRestrictions = { type: 'nothing'             } }
			} break;
			case 'point': {
				if (!equals(this._axisAlignmentRestrictions.x, x) && !equals(this._axisAlignmentRestrictions.y, y)) {
					this._axisAlignmentRestrictions = { type: 'nothing' }
				}
			} break;
		}

		console.log(JSON.stringify(this._axisAlignmentRestrictions));

	}
	_applyAxisAlignmentRestrictions({x, y}) {
		let result = {x, y};
		switch (this._axisAlignmentRestrictions.type) {
			case 'cross': {
				let dim = abs(result.x - this._axisAlignmentRestrictions.x) < abs(result.y - this._axisAlignmentRestrictions.y) ? 'x' : 'y';
				result[dim] = this._axisAlignmentRestrictions[dim];
			} break;
			case 'xLine': {
				result.x = this._axisAlignmentRestrictions.x
			} break;
			case 'yLine': {
				result.y = this._axisAlignmentRestrictions.y
			} break;
			case 'points': {
				let d1 = (result.x - this._axisAlignmentRestrictions[1].x)**2 + (result.y - this._axisAlignmentRestrictions[1].y)**2,
				    d2 = (result.x - this._axisAlignmentRestrictions[2].x)**2 + (result.y - this._axisAlignmentRestrictions[2].y)**2;
				if (d1 < d2) {
					result.x = this._axisAlignmentRestrictions[1].x;
					result.y = this._axisAlignmentRestrictions[1].y;
				} else {
					result.x = this._axisAlignmentRestrictions[2].x;
					result.y = this._axisAlignmentRestrictions[2].y;
				}
			} break;
			case 'point': {
				result.x = this._axisAlignmentRestrictions.x;
				result.y = this._axisAlignmentRestrictions.y;
			} break;
		}
		return result;
	}
	addAxisAlignmentAnchor(anchor) {
		this._axisAlignmentsAnchors.add(anchor);
		Kefir.merge([
			Kefir.once(),
			anchor.p('x').changes(),
			anchor.p('y').changes(),
		    anchor.e('delete')
		]).debounce(200).onValue(() => {
			this._refreshAxisAlignmentRestrictions();
		});
	}
	removeAxisAlignmentAnchor(anchor) {
		this._axisAlignmentsAnchors.delete(anchor);
		this._refreshAxisAlignmentRestrictions();
	}
	_refreshAxisAlignmentRestrictions() {
		this._axisAlignmentRestrictions = { type: 'all' };
		for (let a of this._axisAlignmentsAnchors) {
			this._processAxisAlignmentRestrictions(a);
		}
	}

}
