import interact from './libs/interact.js';

import NodeCircleComponent from './NodeCircleComponent.es6.js';

export default class SVGComponent {

	/* hierarchy */
	root;
	parent;
	children = new Set;

	/* variant geometry */
	x; y;
	width;
	height;

	/* svg elements */
	shell;
	container;
	shape;

	constructor(options) {
		Object.assign(this, options, {
			root:           options.parent ? options.parent.root : this,
			parentSelector: options.parentSelector || null,

			/* system things */
			console,
			window,
			JSON
		});
	}

	initSVG({shell, container, shape, interactableElement, childContainer}) {
		Object.assign(this, {shell, container, shape, interactableElement, childContainer});
		if (!this.container)           { this.container           = this.shell     }
		if (!this.shape)               { this.shape               = this.container }
		if (!this.interactableElement) { this.interactableElement = this.shape     }
		if (!this.childContainer)      { this.childContainer      = this.container }
		this.shell              .data('component', this);
		this.container          .data('component', this);
		this.shape              .data('component', this);
		this.interactableElement.data('component', this);
		this.childContainer     .data('component', this);
		this.interactable = interact(this.interactableElement[0]);
		this.setParent(this.parent);
	}

	destroy() {
		this.interactable.unset();
	}

	putInParentElement() {
		if (!this.parent) { return }
		this.parent.childContainerElementFor(this).append(this.shell);
	}

	/**
	 * To override if necessary.
	 * @param childElement
	 * @returns {*}
	 */
	childContainerElementFor(childElement) {
		if (childElement instanceof NodeCircleComponent) {
			return this.root.shell.find('.svg-nodes');
		}
		return this.childContainer;
	}

	setParent(newParent) {
		if (!newParent) { return }
		if (this.parent) { this.parent.children.delete(this) }
		this.parent = newParent;
		this.parent.children.add(this);
		this.putInParentElement();
	}

	moveToFront() {
		for (let c = this; c !== c.root; c = c.parent) {
			c.putInParentElement();
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

	refresh() {
		this.changeDetectorRef.detectChanges();
		for (let child of this.children) {
			child.refresh();
		}
	}

}
