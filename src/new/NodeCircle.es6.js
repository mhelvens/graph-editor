import {abstract, decorate, override} from 'core-decorators';
import {memoize, pick, identity}      from 'lodash';
import $                              from 'jquery';
import interact                       from '../libs/interact.js';


function getElementRect(element) {
	return element.getBoundingClientRect();
}


@abstract export class ValueTracker {

	_eventTypes    = {};
	_currentValues = {};

	_eventType(name) {
		if (!this._eventTypes[name]) {
			this._eventTypes[name] = $.Callbacks();
		}
		return this._eventTypes[name];
	}

	on(name, cb) {
		this._eventType(name).add(cb);
		return this;
	}

	off(name, cb) {
		this._eventType(name).remove(cb);
		return this;
	}

	one(name, cb) {
		return this.on(name, function oneCb(...args) {
			this.off(name, oneCb);
			cb(...args);
		}.bind(this));
	}

	fire(name, ...args) {
		this._currentValues[name] = args;
		this._eventType(name).fire(...args);
	}

	observe(name, cb) {
		this.on(name, cb);
		if (typeof this._currentValues[name] !== 'undefined') {
			cb(...this._currentValues[name]);
		}
	}

	getVal(name) {
		return this._currentValues[name];
	}

	setVal(name, ...args) {
		this.fire(name, ...args);
	}

}


@abstract export class SvgObject extends ValueTracker {

	dragging = false;
	resizing = false;

	/* public */

	get element() {
		if (!this._element) {
			this._element = this.createElement();
			this._makeInteractable(this._element);
		}
		return this._element;
	};

	moveToFront() {
		// for (let c = this; c !== c.root; c = c.parent) {
		// 	this.element.detach().append(this.element.parent());
		// } // TODO
	}

	startDraggingBy(event) {
		let {handle, tracker} = this.draggable();
		if (!handle) { handle = this.element              }
		else         { handle = this.element.find(handle) }
		if (!tracker) { tracker = handle                     }
		else          { tracker = this.element.find(tracker) }
		interact(tracker[0]).rectChecker(getElementRect);
		event.interaction.start(
			{ name: 'drag' },
			interact(tracker[0]),
			tracker[0]
		);
		return new Promise((resolve) => {
			interact(tracker[0]).on('dragend', function onCreateEnd() {
				interact(tracker[0]).off('dragend', onCreateEnd);
				resolve();
			});
		});
	}

	/* private */

	_makeInteractable(mainElement) {
		// TODO: set dragging and resizing flags here, not in the subclasses
		if (this.resizable) {
			let {handle, ...resizableOptions} = this.resizable();
			if (!handle) { handle = mainElement              }
			else         { handle = mainElement.find(handle) }
			interact(handle[0]).resizable(resizableOptions);
		}
		if (this.draggable) {
			let {handle, tracker, ...draggableOptions} = this.draggable();
			if (!handle) { handle = mainElement              }
			else         { handle = mainElement.find(handle) }
			if (!tracker) { tracker = handle                    }
			else          { tracker = mainElement.find(tracker) }
			interact(handle[0]).on('down', (event) => {
				event.interaction.start(
					{ name: 'drag' },
					interact(tracker[0]),
					tracker[0]
				);
			});
			interact(tracker[0]).draggable(draggableOptions);
		}
	};

}


@abstract export class SvgEntity extends SvgObject {

	model;
	root;
	parent;

	constructor(options) {
		super(options);
		Object.assign(this,
			{ root: options.parent ? options.parent.root : this },
			pick(options, ['model', 'parent'])
		);
	}

}


export default class NodeCircle extends SvgEntity {

	get x()  { return this.getVal('x') }
	set x(v) { this.setVal('x', parseInt(v, 10))  }

	get y()  { return this.getVal('y') }
	set y(v) { this.setVal('y', parseInt(v, 10))  }

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, ['x', 'y']));
	}

	createElement() {
		let result = $(`
			<svg x="0" y="0" style="overflow: visible">
				<circle class="center" cx="0" cy="0" r="0.5"></circle>
				<circle class="node"   cx="0" cy="0" r="4"></circle>
				<g      class="deleter"></g><!-- TODO -->
			</svg>
		`);
		this.observe('x', (x) => { result.attr('x', x) });
		this.observe('y', (y) => { result.attr('y', y) });
		return result;
	}

	draggable() {
		let draggingX,
		    draggingY;
		return {
			handle:  '.node',
			tracker: '.center',
			autoScroll: true,
			restrict: {
				restriction: this.root.shape[0],
				elementRect: { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 }
			},
			onstart: (event) => {
				event.stopPropagation();
				this.moveToFront();
				this.dragging = true;

				/* to maintain unsnapped coordinates */
				draggingX = parseInt(this.x, 10);
				draggingY = parseInt(this.y, 10);
			},
			onmove: (event) => {
				draggingX += event.dx;
				draggingY += event.dy;

				/* commented out snapping solution; TODO: fix for new non-Angular approach */
				// /* snap to nearby borders */
				// let dX = 99999;
				// let dY = 99999;
				// this.root.traverse(LayerTemplateBoxComponent, (layer) => {
				// 	if (layer.y < draggingY && draggingY < layer.y + layer.height) {
				// 		if (Math.abs(layer.x               - draggingX) < Math.abs(dX)) { dX = layer.x               - draggingX + 0.5 }
				// 		if (Math.abs(layer.x + layer.width - draggingX) < Math.abs(dX)) { dX = layer.x + layer.width - draggingX - 0.5 }
				// 	}
				// 	if (layer.x < draggingX && draggingX < layer.x + layer.width) {
				// 		if (                              Math.abs(layer.y                - draggingY) < Math.abs(dY)) { dY = layer.y                - draggingY + 0.5 }
				// 		if (layer.model.position !== 1 && Math.abs(layer.y + layer.height - draggingY) < Math.abs(dY)) { dY = layer.y + layer.height - draggingY - 0.5 }
				// 	}
				// });
				// if (Math.abs(dX) <= Math.abs(dY) && Math.abs(dX) <= 10) { this.x = draggingX + dX } else { this.x = draggingX }
				// if (Math.abs(dY) <  Math.abs(dX) && Math.abs(dY) <= 10) { this.y = draggingY + dY } else { this.y = draggingY }

				/* temporary no-snapping solution */
				this.x = draggingX;
				this.y = draggingY;
			},
			onend: (event) => {
				this.dragging = false;
			}
		};
	}

}
