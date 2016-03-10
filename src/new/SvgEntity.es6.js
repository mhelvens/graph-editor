import {abstract}                from 'core-decorators';
import {memoize, pick, identity} from 'lodash';

import {assert} from '../util/misc.es6.js';

import SvgObject     from './SvgObject.es6.js';
import DeleteClicker from '../DeleteClicker.es6.js';


@abstract export default class SvgEntity extends SvgObject {

	model;
	root;
	parent;
	children = new Set;

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'model'));
		this.setParent(options.parent);
	}

	setParent(newParent) {
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

	delete() {
		this.fire('destroy');
		this.parent.children.delete(this);
		this.element.remove();
	}

	createDeleteClicker() {
		return new DeleteClicker({
			onClick: (event) => {
				event.stopPropagation();
				this.delete();
			}
		});
	}

	// to override
	appendChildElement(newChild) { assert(false) }

	// // to override
	// innerToOuter(coords) {
	// 	return coords;
	// }
	//
	// // final
	// innerToWorld(coords) {
	// 	return this.outerToWorld(this.innerToOuter(coords));
	// }
	//
	// // final
	// outerToWorld(coords) {
	// 	return (this.parent ? this.parent.innerToWorld : identity)(coords);
	// }


}
