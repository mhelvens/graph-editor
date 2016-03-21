export const request = require('../libs/superagent.es6.js').default;
import {sw, withoutDuplicates} from '../util/misc.es6.js';
import flatten                 from 'lodash/flatten';
import uniq                    from 'lodash/uniq';
import get                     from 'lodash/fp/get';

// TODO: integrate this functionality with Resource.es6.js

request.basePath = 'http://open-physiology.org:8889';

const fetchResources         = Symbol('fetchResources');
const fetchSpecificResources = Symbol('fetchSpecificResources');
const models                 = Symbol('models');
const modelLists             = Symbol('modelLists');

let soleInstance = null;

export default class Resources {

	constructor() {
		if (soleInstance) { return soleInstance }
		soleInstance     = this;
		this[models]     = {};
		this[modelLists] = {};
	}

	async [fetchResources](type) {
		if (!this[models][type] && !this[modelLists][type]) {

			if (type === 'processTypes') {
				this[modelLists][type] = require('../../process-types.json');
			} else {
				this[modelLists][type] = await request.get(`/${type}`).then(v => v.body);
			}
			// if (type === 'layerTemplates') {
			// 	this[modelLists][type] = require('../../layers.json');
			// } else {
			// 	this[modelLists][type] = require('../../lyphtemplates.json');
			// }


			console.log(type, this[modelLists][type]); // TODO: remove


			this[models][type] = {};
			for (let model of this[modelLists][type]) {
				this[models][type][model.id] = model;
			}
		}
	}

	async [fetchSpecificResources](type,ids) {
		if (!this[models][type] && !this[modelLists][type]) {

			// TODO: put ProcessType as a resource on the server
			if (type === 'processTypes') {
				this[modelLists][type] = require('../../process-types.json');
			} else {
				this[modelLists][type] = await request.get(`/${type}/${withoutDuplicates(ids).join(',')}`).then(v => v.body);
			}
			// if (type === 'layerTemplates') {
			// 	this[modelLists][type] = require('../../layers.json');
			// } else {
			// 	this[modelLists][type] = require('../../lyphtemplates.json').filter((lt) => {
			// 		return lt.layers.length > 0;
			// 	});
			// }

			this[models][type] = {};
			for (let model of this[modelLists][type]) {
				this[models][type][model.id] = model;
			}
		}
	}

	async preloadAllResources() {
		await this[fetchResources]('canonicalTrees');
		await this[fetchResources]('canonicalTreeLevel');
		await this[fetchResources]('layerTemplates');
		let layerTemplates = this.getAllResources_sync().layerTemplates;
		let treeLevels = this.getAllResources_sync().canonicalTreeLevel;
		await this[fetchSpecificResources]('lyphTemplates', uniq([
			...        layerTemplates.map(get('lyphTemplate')),
			...flatten(layerTemplates.map(get('materials'   ))),
			...            treeLevels.map(get('template'))
		]));
		await this[fetchResources]('processTypes');
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
			'LayerTemplate': 'layerTemplates',
			'CanonicalTree': 'canonicalTrees',
			'ProcessType':   'processTypes'
		});
		let newResource = (await request.post(`/${endpoint}/${id}`).send(resource)).body[0];
		Object.assign(this[models][endpoint][id], newResource);
		return newResource;
	}

	async addNewResource(resource) {
		let endpoint = sw(resource.type)({
			'LyphTemplate':  'lyphTemplates',
			'LayerTemplate': 'layerTemplates',
			'CanonicalTree': 'canonicalTrees',
			'ProcessType': 'processTypes'
		});
		let newResource = (await request.post(`/${endpoint}`).send(resource)).body[0];
		this[models][endpoint][newResource.id] = newResource;
		this[modelLists][endpoint] = [...this[modelLists][endpoint], newResource];
		return newResource;
	}

	async deleteResource(resource) {
		let endpoint = sw(resource.type)({
			'LyphTemplate':  'lyphTemplates',
			'LayerTemplate': 'layerTemplates',
			'CanonicalTree': 'canonicalTrees',
			'ProcessType': 'processTypes'
		});

		this[modelLists][endpoint] = this[modelLists][endpoint].filter(({id}) => id !== resource.id);
		delete this[models][endpoint][resource.id];
		await request.delete(`/${endpoint}/${resource.id}`);
	}

}
