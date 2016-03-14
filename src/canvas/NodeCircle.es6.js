import {pick, isFinite} from 'lodash';
import $                from 'jquery';
import interact         from '../libs/interact.js';
import Kefir            from '../libs/kefir.es6.js';

import {boundBy, abs, sw} from '../util/misc.es6.js';

import {property}       from './ValueTracker.es6.js';
import SvgEntity        from './SvgEntity.es6.js';
import LayerTemplateBox from './LayerTemplateBox.es6.js';
import ProcessLine       from './ProcessLine.es6.js';


export default class NodeCircle extends SvgEntity {

	static IDLE_RADIUS     = 10;
	static DRAGGING_RADIUS = 16;
	static SNAP_DISTANCE   = 20;

	@property({isValid: isFinite}) x;
	@property({isValid: isFinite}) y;

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'x', 'y'));
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
		this.p('hovering')
		    .plug(shape.asKefirStream('mouseenter').map(()=>true ))
		    .plug(shape.asKefirStream('mouseleave').map(()=>false));
		center.attrPlug('cx', this.p('x')).attrPlug('cy', this.p('y'));
		shape .attrPlug('cx', this.p('x')).attrPlug('cy', this.p('y'));
		shape .attrPlug('r', this.p('dragging').map((dragging) =>
			dragging
			? NodeCircle.DRAGGING_RADIUS
			: NodeCircle.IDLE_RADIUS)
		);

		/* delete button */
		let deleteClicker = this.createDeleteClicker();
		deleteClicker.element.appendTo(result.children('.delete-clicker'));

		(deleteClicker.element)
			.attrPlug('x', this.p('x').map(x => x + 12) )
			.attrPlug('y', this.p('y').map(y => y - 12) );

		(deleteClicker.element)
			.cssPlug('display', Kefir.combine([
				this.p('hovering'),
				deleteClicker.p('hovering'),
				this.root.p('draggingSomething')
			]).map(([h1, h2, d]) => (h1 || h2) && !d ? 'block' : 'none'));

		/* drawing process with a tool */
		interact(shape[0]).on('down', async (event) => {

			if (!this.root.activeTool) { return }

			event.stopPropagation();

			let mouseCoords = this.pageToCanvas({ x: event.pageX, y: event.pageY});

			this.root.activeTool.result = await sw(this.root.activeTool.form)({
				'process': ()=> this.deployTool_ProcessLine(event, mouseCoords)
				// 'canonical-tree-line': ()=> this.deployTool_CanonicalTree  (event, mouseCoords)
			});

			this.root.added.next(this.activeTool);

		});
		this.p('hovering').onValue(() => {
			if (this.root.activeTool) {
				shape.css('cursor', 'pointer');
			} else {
				shape.css('cursor', 'grab');
				shape.css('cursor', 'grabbing');
				shape.css('cursor', 'hand');
			}
		});

		return result;
	}

	deployTool_ProcessLine(event, {x, y}) {
		let process = new ProcessLine({
			parent: this.root,
			model : { id: -1, name: 'test process' }, // TODO: real process models
			source: this,
			target: new NodeCircle({
				parent: this.parent,
				model : { id: -1, name: 'test target node' }, // TODO: real node models
				x, y
			})
		});
		this.root.element.find('.svg-nodes').append(process.target.element);
		this.root.element.find('.svg-process-edges').append(process.element);
		return process.target.startDraggingBy(event);
	};

	// deployTool_CanonicalTree(event, {x, y}) {
	// 	let process = new CanonicalTreeLine({
	// 		parent: this.root,
	// 		model : { id: -1, name: 'test canonical tree' }, // TODO: real process models
	// 		source: this,
	// 		target: new NodeCircle({
	// 			parent: this.parent,
	// 			model : { id: -1, name: 'test target node' }, // TODO: real node models
	// 			x, y
	// 		})
	// 	});
	// 	this.root.element.find('.svg-nodes').append(process.target.element);
	// 	this.root.element.find('.svg-process-edges').append(process.element);
	// 	return process.target.startDraggingBy(event);
	// };

	draggable() {
		let raw, parentRect;
		return {
			handle:  'circle.node.shape',
			// tracker: '.node.center',
			autoScroll: true,
			onstart: (event) => {

				event.stopPropagation();

				/* dragged things stay in front of other things */
				this.moveToFront();

				/* initialize interaction-local variables */
				raw        = pick(this, 'x', 'y');
				parentRect = this.parent.boundingBox();

			},
			onmove: ({dx, dy}) => {

				/* update raw coordinates */
				raw.x += dx;
				raw.y += dy;

				/* initialize visible coordinates */
				let visible = { ...raw };

				/* snapping correction */
				let snap = { x: Infinity, y: Infinity };
				this.root.traverse(LayerTemplateBox, (layer) => {
					if (layer.y < raw.y && raw.y < layer.y + layer.height) {
						if (abs(layer.x                - raw.x) < abs(snap.x)) { snap.x = layer.x                - raw.x + 0.5 }
						if (abs(layer.x + layer.width  - raw.x) < abs(snap.x)) { snap.x = layer.x + layer.width  - raw.x - 0.5 }
					}
					if (layer.x < raw.x && raw.x < layer.x + layer.width) {
						if (abs(layer.y                - raw.y) < abs(snap.y)) { snap.y = layer.y                - raw.y + 0.5 }
						if (abs(layer.y + layer.height - raw.y) < abs(snap.y)) { snap.y = layer.y + layer.height - raw.y - 0.5 }
					}
				});
				if (abs(snap.x) <= abs(snap.y) && abs(snap.x) <= NodeCircle.SNAP_DISTANCE) { visible.x += snap.x }
				if (abs(snap.y) <  abs(snap.x) && abs(snap.y) <= NodeCircle.SNAP_DISTANCE) { visible.y += snap.y }

				/* restriction correction */
				visible.x = boundBy( parentRect.left, parentRect.left + parentRect.width  )( visible.x );
				visible.y = boundBy( parentRect.top,  parentRect.top  + parentRect.height )( visible.y );

				/* set visible (x, y) based on snapping and restriction */
				this.set(visible);

			}
		};
	}

	innerToOuter({x, y}) {
		return super.innerToOuter({
			x: this.x + x,
			y: this.y + y
		});
	}

}
