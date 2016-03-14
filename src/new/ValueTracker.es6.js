import {abstract}                from 'core-decorators';
import {memoize, pick, identity} from 'lodash';
import $                         from 'jquery';

import ValueTracker2 from './ValueTracker2.es6.js';

@abstract export default class ValueTracker extends ValueTracker2 {

	// constructor() {
	// 	this._vt2 = new ValueTracker2();
	// }
	//
	// _eventTypes    = {};
	// _currentValues = {};
	//
	// _eventType(name) {
	// 	if (!this._eventTypes[name]) {
	// 		this._eventTypes[name] = $.Callbacks();
	//
	// 		this._vt2.newProperty(name);
	//
	// 	}
	// 	return this._eventTypes[name];
	// }
	//
	// on(name, cb) {
	//
	// 	this._eventType(name);
	//
	// 	this._vt2.p(name).onValue(cb);
	//
	// 	// this._eventType(name).add(cb);
	// 	return this;
	// }
	//
	// off(name, cb) {
	// 	debugger;
	// }
	//
	// one(name, cb) {
	// 	debugger;
	// }
	//
	// fire(name, val) {
	//
	// 	this._eventType(name);
	//
	// 	this._vt2.trigger(name, val);
	//
	// 	// this._eventType(name).fire(val);
	// }
	//
	// observe(name, cb) {
	//
	// 	this._vt2.p(name).onValue(cb);
	//
	// 	// this.on(name, cb);
	// 	// if (typeof this._currentValues[name] !== 'undefined') {
	// 	// 	cb(this._currentValues[name]);
	// 	// }
	// }
	//
	// getVal(name) {
	//
	// 	return this._vt2[name];
	//
	// 	// return this._currentValues[name];
	// }
	//
	// setVal(name, val) {
	//
	// 	return this._vt2[name] = val;
	//
	// 	// if (this._currentValues[name] !== val) {
	// 	// 	this._currentValues[name] = val;
	// 	// 	this.fire(name, this._currentValues[name]);
	// 	// 	setTimeout(() => { // TODO: fix stuttering
	// 	// 		this.fire(name, this._currentValues[name]);
	// 	// 	}, 100);
	// 	// }
	// }


	// setVals(obj) {
	// 	for (let [key, val] of Object.entries(obj)) {
	// 		this[key] = val;
	// 	}
	// }
	//
	// observeExpressions(dynamics, {setter, ready}) {
	// 	for (let [entity, rules] of dynamics) {
	// 		for (let [key, [paramNames, fn]] of Object.entries(rules)) {
	// 			for (let paramName of paramNames) {
	// 				this.observe(paramName, () => {
	// 					let paramValues = paramNames.map(p => this.getVal(p));
	// 					if (!paramValues.every(ready)) { return }
	// 					setter(entity, key, fn(...paramValues));
	// 				})
	// 			}
	// 		}
	// 	}
	// }

}
