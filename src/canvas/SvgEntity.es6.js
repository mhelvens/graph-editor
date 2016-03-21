import {abstract} from 'core-decorators';
import pick       from 'lodash/pick';
import interact   from '../libs/interact.js';
import Kefir      from '../libs/kefir.es6.js';
import $          from '../libs/jquery.es6.js';

import {assert} from '../util/misc.es6.js';

import SvgObject     from './SvgObject.es6.js';
import DeleteClicker from './DeleteClicker.es6.js';


const deleteClicker = Symbol('deleteClicker');
const deleted       = Symbol('deleted');


@abstract export default class SvgEntity extends SvgObject {

	model;
	root;
	parent;
	children = new Set;

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'model'));

		this.setParent(options.parent);
		this.root.p('draggingSomething').plug(this.p('dragging'));
		this.root.p('resizingSomething').plug(this.p('resizing'));

		if (this.parent && this.parent.interactive === false) { this.interactive = false }

		this.e('delete').onValue(() => {
			for (let child of this.children) { child.delete() }
			this.parent.children.delete(this);
		});
	}

	hasAncestor(pred) {
		return pred(this) || this.parent && this.parent.hasAncestor(pred);
	}

	setParent(newParent) {
		// /* check for nesting of model-sharing svg entities */
		// let entity = newParent;
		// while (entity) {
		// 	if (entity.model === this.model) {
		// 		throw new Error(`Nesting Error: Cannot set the parent of this entity to an entity that has a model that is a descendant of the model of this one.`);
		// 	}
		// 	entity = entity.parent;
		// }

		/* actually set parent */
		if (this.parent) { this.parent.children.delete(this) }
		this.parent = newParent;
		if (this.parent) {
			this.parent.children.add(this);
			this.root = this.parent.root;
		} else {
			this.root = this;
		}
	}

	traverse(types, fn) {
		if (!fn) { [types, fn] = [null, types] }
		if (types && !Array.isArray(types)) { types = [types] }
		if (!types || types.some(type => this instanceof type)) {
			fn(this);
		}
		for (let child of this.children) {
			child.traverse(types, fn);
		}
	}

	moveToFront() {
		for (let c = this; c !== c.root; c = c.parent) {
			c.element.appendTo(c.element.parent());
		}
	}

	deleteClicker() {
		if (!this[deleteClicker]) {
			this[deleteClicker] = new DeleteClicker();
			this[deleteClicker].clicks.onValue((event) => {
				event.stopPropagation();
				this.delete();
			});
		}
		return this[deleteClicker];
	}

	startDraggingBy(event) {
		let {handle, tracker} = this.draggable();
		if (!handle)  { handle = this.element                }
		else          { handle = this.element.find(handle)   }
		if (!tracker) { tracker = handle                     }
		else          { tracker = this.element.find(tracker) }

		let interactable = interact(tracker[0]);

		interactable.rectChecker(element => element.getBoundingClientRect());
		event.interaction.start(
			{ name: 'drag' },
			interactable,
			tracker[0]
		);

		return new Promise((resolve) => {
			Kefir.merge([
				Kefir.fromEvents(interactable, 'dragend') .map(()=>({ status: 'finished' })),
				$('body').asKefirStream('keyup').which(27).map(()=>({ status: 'aborted'  }))
			]).take(1).onValue(resolve);
		});
	}

	startResizingBy(event, edges = { bottom: true, right: true }) {
		let {handle, tracker} = this.resizable();
		if (!handle)  { handle = this.element                }
		else          { handle = this.element.find(handle)   }
		if (!tracker) { tracker = handle                     }
		else          { tracker = this.element.find(tracker) }

		let interactable = interact(tracker[0]);

		event.interaction.start(
			{ name: 'resize', edges },
			interactable,
			tracker[0]
		);

		return new Promise((resolve) => {
			Kefir.merge([
				Kefir.fromEvents(interactable, 'resizeend').map(()=>({ status: 'finished' })),
				$('body').asKefirStream('keyup').which(27) .map(()=>({ status: 'aborted'  }))
			]).take(1).onValue(resolve);
		});
		// return new Promise((resolve) => {
		// 	interact(tracker[0]).on('resizeend', function onResizeEnd() {
		// 		interact(tracker[0]).off('resizeend', onResizeEnd);
		// 		resolve(this);
		// 	}.bind(this));
		// });
	}

	// to override
	appendChildElement(newChild) { assert(()=>false) }


}
