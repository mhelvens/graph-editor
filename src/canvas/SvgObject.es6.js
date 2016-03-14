import {abstract}                 from 'core-decorators';
import {pick, identity, isFinite} from 'lodash';
import interact                   from '../libs/interact.js';

import ValueTracker, {property} from './ValueTracker.es6.js';


@abstract export default class SvgObject extends ValueTracker {

	// properties //////////////////////////////////////////////////////////////////////////////////

	@property({initial: false}) dragging;
	@property({initial: false}) resizing;
	@property({initial: false}) hovering;


	// public //////////////////////////////////////////////////////////////////////////////////////

	get element() {
		if (!this._element) {
			this._element = this.createElement();
			this._element.data('controller', this);
			this._element.attr('controller', true);
			this._makeInteractable(this._element);
		}
		return this._element;
	};

	pageToCanvas(positioning) {
		return this.root.pageToCanvas(positioning);
	}

	boundingBox() {
		return this.pageToCanvas(this.element[0].getBoundingClientRect());
	}

	moveToFront() {
		for (let c = this; c !== c.root; c = c.parent) {
			this.element.appendTo(this.element.parent());
		}
	}

	startDraggingBy(event) {
		let {handle, tracker} = this.draggable();
		if (!handle)  { handle = this.element                }
		else          { handle = this.element.find(handle)   }
		if (!tracker) { tracker = handle                     }
		else          { tracker = this.element.find(tracker) }
		interact(tracker[0]).rectChecker(element => element.getBoundingClientRect());
		event.interaction.start(
			{ name: 'drag' },
			interact(tracker[0]),
			tracker[0]
		);
		return new Promise((resolve) => {
			interact(tracker[0]).on('dragend', function onDragEnd() {
				interact(tracker[0]).off('dragend', onDragEnd);
				resolve(this);
			}.bind(this));
		});
	}

	startResizingBy(event, edges = { bottom: true, right: true }) {
		let {handle, tracker} = this.resizable();
		if (!handle)  { handle = this.element                }
		else          { handle = this.element.find(handle)   }
		if (!tracker) { tracker = handle                     }
		else          { tracker = this.element.find(tracker) }
		event.interaction.start(
			{ name: 'resize', edges },
			interact(tracker[0]),
			tracker[0]
		);
		return new Promise((resolve) => {
			interact(tracker[0]).on('resizeend', function onResizeEnd() {
				interact(tracker[0]).off('resizeend', onResizeEnd);
				resolve(this);
			}.bind(this));
		});
	}


	// private /////////////////////////////////////////////////////////////////////////////////////

	_makeInteractable(mainElement) {
		if (this.draggable) {
			let {handle, tracker, ...draggableOptions} = this.draggable();
			if (!handle)  { handle = mainElement                }
			else          { handle = mainElement.find(handle)   }
			if (!tracker) { tracker = handle                    }
			else          { tracker = mainElement.find(tracker) }
			interact(tracker[0]).draggable({
				...draggableOptions,
				onstart: (event) => {
					event.stopPropagation();
					this.dragging = true;
					(draggableOptions.onstart || identity)(event);
				},
				onend: (event) => {
					event.stopPropagation();
					(draggableOptions.onend || identity)(event);
					this.dragging = false;
				}
			});
		}
		if (this.resizable) {
			let {handle, tracker, ...resizableOptions} = this.resizable();
			if (!handle)  { handle = mainElement                }
			else          { handle = mainElement.find(handle)   }
			if (!tracker) { tracker = handle                    }
			else          { tracker = mainElement.find(tracker) }
			interact(handle[0]).resizable({
				...resizableOptions,
				onstart: (event) => {
					event.stopPropagation();
					this.resizing = true;
					(resizableOptions.onstart || identity)(event);
				},
				onend: (event) => {
					event.stopPropagation();
					(resizableOptions.onend || identity)(event);
					this.resizing = false;
				}
			});
			interact(tracker[0]).rectChecker(e => e.getBoundingClientRect());
		}
		if (this.dropzone) {
			let {handle, ...dropzoneOptions} = this.dropzone();
			if (!handle)  { handle = mainElement                }
			else          { handle = mainElement.find(handle)   }
			interact(handle[0]).dropzone(dropzoneOptions);
		}
	};

}
