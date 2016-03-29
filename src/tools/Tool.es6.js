import Kefir from '../libs/kefir.es6.js';

import ValueTracker, {event} from '../canvas/ValueTracker.es6.js';


const stageEntities = Symbol('stageEntities');


export default class Tool extends ValueTracker {

	@event() stageFinished;
	@event() aborted;
	@event() finished;

	abort      () { this.aborted      .emit() }
	finish     () { this.finished     .emit() }
	finishStage() { this.stageFinished.emit() }

	constructor(options) {
		super(options);

		/* tracking svg entities that may be aborted */
		this[stageEntities] = [];
		this.aborted.onValue(() => {
			while (this[stageEntities].length > 0) {
				this[stageEntities].pop().delete();
			}
		});
		this.stageFinished.onValue(() => {
			this[stageEntities] = [];
		});

		/* delete this tool when aborted or finished */
		Kefir.merge([ this.aborted, this.finished ]).onValue(this.delete);
	}
	
	register(entity) {
		this[stageEntities].push(entity);
		return entity;
	}

	get type() { return this.constructor.name }

}
