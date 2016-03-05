export const request = require('../libs/superagent.es6.js').default;
import {sw, withoutDuplicates} from '../util/misc.es6.js';

request.basePath = 'http://open-physiology.org:8889';

const fetchResources         = Symbol('fetchResources');
const fetchSpecificResources = Symbol('fetchSpecificResources');
const models                 = Symbol('models');
const modelLists             = Symbol('modelLists');

export default class Resources {

	constructor() {
		this[models]     = {};
		this[modelLists] = {};
	}

	async [fetchResources](type) {
		if (!this[models][type] && !this[modelLists][type]) {
			//this[modelLists][type] = await request.get(`/${type}`).then(v => v.body);
			if (type === 'layerTemplates') {
				this[modelLists][type] = require('../../layers.json');
			} else {
				this[modelLists][type] = require('../../lyphtemplates.json');
			}
			this[models][type] = {};
			for (let model of this[modelLists][type]) {
				this[models][type][model.id] = model;
			}
		}
	}

	async [fetchSpecificResources](type,ids) {
		if (!this[models][type] && !this[modelLists][type]) {
			//this[modelLists][type] = await request.get(`/${type}/${withoutDuplicates(ids).join(',')}`).then(v => v.body);
			if (type === 'layerTemplates') {
				this[modelLists][type] = require('../../layers.json');
			} else {
				this[modelLists][type] = require('../../lyphtemplates.json').filter((lt) => {
					return lt.layers.length > 0;
				});
			}
			this[models][type] = {};
			for (let model of this[modelLists][type]) {
				this[models][type][model.id] = model;
			}
		}
	}

	async preloadAllResources() {
		await this[fetchResources]('layerTemplates');
		await this[fetchSpecificResources]('lyphTemplates', this.getAllResources_sync().layerTemplates.map(lt => lt.lyphTemplate));
	}

	getAllResources_sync() {
		return this[modelLists];
	}

	getResource_sync(type, ids) {
		if (Array.isArray(ids)) {
			return ids.map(id => this[models][type][id]);
		} else {
			return this[models][type][ids];
		}
	}

	async updateResource(id, resource) {
		let endpoint = sw(resource.type)({
			'LyphTemplate':  'lyphTemplates',
			'LayerTemplate': 'layerTemplates'
		});
		let newResource = (await request.post(`/${endpoint}/${id}`).send(resource)).body[0];
		Object.assign(this[models][endpoint][id], newResource);
		return newResource;
	}

	async addNewResource(resource) {
		let endpoint = sw(resource.type)({
			'LyphTemplate':  'lyphTemplates',
			'LayerTemplate': 'layerTemplates'
		});
		let newResource = (await request.post(`/${endpoint}`).send(resource)).body[0];
		this[models][endpoint][newResource.id] = newResource;
		this[modelLists][endpoint] = [...this[modelLists][endpoint], newResource];
		return newResource;
	}

	async deleteResource(resource) {
		let endpoint = sw(resource.type)({
			'LyphTemplate':  'lyphTemplates',
			'LayerTemplate': 'layerTemplates'
		});

		this[modelLists][endpoint] = this[modelLists][endpoint].filter(({id}) => id !== resource.id);
		delete this[models][endpoint][resource.id];
		await request.delete(`/${endpoint}/${resource.id}`);
	}

}
