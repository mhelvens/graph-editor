import interact from './libs/interact.js';


export default class RectangleComponent {

	/* hierarchy */
	root;
	parent;

	/* variant geometry */
	x; y;
	width;
	height;

	/* svg elements */
	shell;
	container;
	rectangle;

	constructor(options) {
		Object.assign(this, options, {
			root:   options.parent ? options.parent.root : this,
			parent: options.parent || null
		});
	}

	initSVG({shell, container, rectangle}) {
		Object.assign(this, {shell, container, rectangle});
		if (!this.container) { this.container = this.shell     }
		if (!this.rectangle) { this.rectangle = this.container }
		this.shell    .data('component', this);
		this.container.data('component', this);
		this.rectangle.data('component', this);
		this.interactable = interact(this.rectangle[0]);
	}

	destroy() {
		this.interactable.unset();
	}

	setParent(newParent) {
		this.parent = newParent;

		let newParentRect = this.parent.rectangle[0].getBoundingClientRect();
		let thisRect      = this       .rectangle[0].getBoundingClientRect();

		this.shell.detach().appendTo(this.parent.container);
		this.x = thisRect.left - newParentRect.left;
		this.y = thisRect.top  - newParentRect.top;
	}

	moveToFront() {
		for (let c = this; c !== c.root; c = c.parent) {
			c.shell.appendTo(c.shell.parent());
		}
	}

	// TODO: define minimal size based on content (template method pattern)

}
