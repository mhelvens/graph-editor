const model = Symbol('model');

export class ModelRepresentation {
	constructor({resources}) {
		console.log(resources);
		this.resources = resources;
	}
	onChanges({modelId}) {
		if (modelId) {
			this.model = this.resources.getResource_sync(this.constructor.endpoint, modelId.currentValue);

			if (!this.model) {
				console.dir(modelId);
			}
		}
	}
}
