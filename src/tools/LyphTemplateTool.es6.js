import Tool from './Tool.es6.js';
import pick from 'lodash/pick';

import LyphTemplateBox from '../canvas/LyphTemplateBox.es6.js';

export default class LyphTemplateTool extends Tool {

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'lyphTemplate'));
	}

	async onMouseDown(entity, event) {

		/* create lyph template entities */
		this.lyphTemplateBox = this.register(new LyphTemplateBox({
			parent: entity,
			model : this.lyphTemplate,
			x: event.clientX,
			y: event.clientY
		}));
		entity.appendChildElement(this.lyphTemplateBox);

		/* actually start the process of resizing it by dragging the mouse */
		let result = await this.startResizingLyphTemplate(event);

		/* process resizing result */
		switch (result.status) {
			case 'finished': this.finishStage(); break;
			case 'aborted':  this.abort();       break;
		}
		
	}

	async startResizingLyphTemplate(event) {
		return await this.lyphTemplateBox.startResizingBy(event)
	}

}
