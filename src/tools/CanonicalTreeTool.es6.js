import $             from '../libs/jquery.es6.js';
import Kefir         from '../libs/kefir.es6.js';
import pick          from 'lodash/pick';
import isUndefined   from 'lodash/isUndefined';

import ProcessType   from '../resources/ProcessType.es6.js';
import CanonicalTree from '../resources/CanonicalTree.es6.js';

import ConveyedProcessTool from './ConveyedProcessTool.es6.js';


const setUpForCurrentLevel = Symbol('setUpForCurrentLevel');


export default class CanonicalTreeTool extends ConveyedProcessTool {

	static valid({ processType, canonicalTree }) {
		return (processType  instanceof ProcessType || isUndefined(processType)) &&
		       canonicalTree instanceof CanonicalTree                            &&
		       canonicalTree.getLevels().length > 0                              &&
		       canonicalTree.getLevels().every(level => level.getLyphTemplate().getLayerTemplates().length > 0);
	}

	constructor(options) {
		super(options);
		Object.assign(this, pick(options, 'processType', 'canonicalTree'));

		/* track level */
		this.currentLevel = 0;
		Kefir.merge([ Kefir.once(), this.stageFinished ]).onValue(() => {
			this.currentLevel += 1;
			if (this.currentLevel > this.canonicalTree.getLevels().length) {
				this.finish();
			}
		});

		/* tooltip of current state of the tree building process */
		$('body').powerTip({ followMouse: true, fadeInTime: 10, fadeOutTime: 10 });
		Kefir.merge([ Kefir.once(), this.stageFinished ]).onValue(() => {
			let toolTipText = `level ${this.currentLevel} of ${this.canonicalTree.getLevels().length}`;
			$('body').data('powertip', toolTipText);
			$('#powerTip').html(toolTipText);
			setTimeout(() => { $('body').powerTip('show') });
		});
		Kefir.merge([ this.finished, this.aborted ]).take(1).onValue(() => {
			$('body').powerTip('destroy');
		});
	}

	async onMouseDown(entity, event) {

		/* set the lyph template */
		this.lyphTemplate = this.canonicalTree.getLevels()[this.currentLevel-1].getLyphTemplate();

		/* run the ConveyedProcessTool logic */
		await super.onMouseDown(entity, event);

	}

}
