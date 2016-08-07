import ProcessTool  from './ProcessTool.es6.js';
import ProcessType  from '../resources/ProcessType.es6.js';
import LyphTemplate from '../resources/LyphTemplate.es6.js';
import pick         from 'lodash/pick';
import isUndefined  from 'lodash/isUndefined';
import Kefir        from '../libs/kefir.es6.js';

import LyphTemplateBox from '../canvas/LyphTemplateBox.es6.js';

const {abs} = Math;

const lastNodeTarget = Symbol('lastNodeTarget');

const CONVEYING_LYPH_RADIUS = 100;
const CONVEYING_LYPH_LENGTH = 100;


export default class ConveyedProcessTool extends ProcessTool {

	static valid({ processType, lyphTemplate }) {
		return (processType instanceof ProcessType || isUndefined(processType)) &&
		       lyphTemplate instanceof LyphTemplate                             &&
		       lyphTemplate.getLayerTemplates().length > 0;
	}

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'processType', 'lyphTemplate'));
	}

	async onMouseDown(entity, event) {

		/* run the ProcessTool logic */
		// NOTE: the synchronous actions of `super.onMouseDown` are
		//       performed immediately, like the creation of `this.process`;
		//       the returned promise just indicates the drop operation
		let resultPromise = super.onMouseDown(entity, event);

		/* create conveying lyph template */
		let lyphTemplateBox = this.register(new LyphTemplateBox({
			parent: entity,
			model : this.lyphTemplate,
			height: CONVEYING_LYPH_RADIUS
		}));
		entity.appendChildElement(lyphTemplateBox);

		/* force axis alignment */
		let source = this.process.source,
		    target = this.process.target;
		source.addAxisAlignmentAnchor(target);
		target.addAxisAlignmentAnchor(source);
		Kefir.merge([ source.e('delete'), lyphTemplateBox.e('delete') ]).take(1)
		    .onValue(() => { target.removeAxisAlignmentAnchor(source) });
		Kefir.merge([ target.e('delete'), lyphTemplateBox.e('delete') ]).take(1)
		    .onValue(() => { source.removeAxisAlignmentAnchor(target) });

		/* move conveying lyph template as the target node moves */
		Kefir.combine([
			source.p(['x', 'y']),
			target.p(['x', 'y'])
		]).onValue(([[x1, y1], [x2, y2]]) => {
			let {
			    axisThickness,
			    layerTemplateBoxes: [{ model: { representativeThickness: layer1Thickness } }],
			    model: { representativeThickness: lyphTemplateThickness }
		    } = lyphTemplateBox;
			const layer1Shift = axisThickness + (CONVEYING_LYPH_RADIUS - axisThickness) * (layer1Thickness / lyphTemplateThickness) / 2;
			if (x1 < x2) {
				lyphTemplateBox.rotation = 0;
				lyphTemplateBox.width    = Math.min(  abs(x2-x1),  CONVEYING_LYPH_LENGTH  );
				lyphTemplateBox.x        = x1 + (abs(x2-x1) - lyphTemplateBox.width) / 2;
				lyphTemplateBox.height   = CONVEYING_LYPH_RADIUS;
				lyphTemplateBox.y        = y2 - CONVEYING_LYPH_RADIUS + layer1Shift;
			} else if (y1 < y2) {
				lyphTemplateBox.rotation = 90;
				lyphTemplateBox.height   = Math.min(  abs(y2-y1),  CONVEYING_LYPH_LENGTH  );
				lyphTemplateBox.y        = y1 + (abs(y2-y1) - lyphTemplateBox.height) / 2;
				lyphTemplateBox.width    = CONVEYING_LYPH_RADIUS;
				lyphTemplateBox.x        = x2 - layer1Shift;
			} else if (x2 < x1) {
				lyphTemplateBox.rotation = 180;
				lyphTemplateBox.width    = Math.min(  abs(x1-x2),  CONVEYING_LYPH_LENGTH  );
				lyphTemplateBox.x        = x2 + (abs(x2-x1) - lyphTemplateBox.width) / 2;
				lyphTemplateBox.height   = CONVEYING_LYPH_RADIUS;
				lyphTemplateBox.y        = y2 - layer1Shift;
			} else if (y2 < y1) {
				lyphTemplateBox.rotation = 270;
				lyphTemplateBox.height   = Math.min(  abs(y1-y2),  CONVEYING_LYPH_LENGTH  );
				lyphTemplateBox.y        = y2 + (abs(y2-y1) - lyphTemplateBox.height) / 2;
				lyphTemplateBox.width    = CONVEYING_LYPH_RADIUS;
				lyphTemplateBox.x        = x2 - CONVEYING_LYPH_RADIUS + layer1Shift;
			}
		});

		return await resultPromise;
	}

	// startDraggingProcess(event) {
	// 	Object.assign(event.interaction, {
	// 		forceAxisAlignment: pick(this.process.source, 'x', 'y')
	// 	});
	// 	return super.startDraggingProcess(event);
	// }

}
