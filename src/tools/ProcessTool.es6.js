import Tool from './Tool.es6.js';
import pick from 'lodash/pick';

import NodeCircle  from '../canvas/NodeCircle.es6.js';
import ProcessLine from '../canvas/ProcessLine.es6.js';


const lastNodeTarget = Symbol('lastNodeTarget');


export default class ProcessTool extends Tool {

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'processType'));
	}

	async onMouseDown(entity, event) {

		/* create node and process entities */
		this.process = this.register(new ProcessLine({
			parent: entity,
			model : this.processType,
			source: this[lastNodeTarget] || this.register(new NodeCircle({
				parent: entity,
				model : { id: -1, name: 'test source node' }, // TODO: real node models
				x: event.clientX,
				y: event.clientY
			})),
			target: this[lastNodeTarget] = this.register(new NodeCircle({
				parent: entity,
				model : { id: -1, name: 'test target node' }, // TODO: real node models
				x: event.clientX,
				y: event.clientY
			}))
		}));
		entity.appendChildElement(this.process.source);
		entity.appendChildElement(this.process.target);
		entity.appendChildElement(this.process       );

		/* actually start the process of dragging the target node */
		let result = await this.startDraggingProcess(event);

		/* process dragging result */
		switch (result.status) {
			case 'finished': this.finishStage(); break;
			case 'aborted':  this.abort();       break;
		}
		
	}

	startDraggingProcess(event) {
		return this.process.target.startDraggingBy(event);
	}
	
	
}
