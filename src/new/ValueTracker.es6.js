import {abstract}                from 'core-decorators';
import {memoize, pick, identity} from 'lodash';
import $                         from 'jquery';

@abstract export default class ValueTracker {

	_eventTypes    = {};
	_currentValues = {};

	_eventType(name) {
		if (!this._eventTypes[name]) {
			this._eventTypes[name] = $.Callbacks();
		}
		return this._eventTypes[name];
	}

	on(name, cb) {
		this._eventType(name).add(cb);
		return this;
	}

	off(name, cb) {
		this._eventType(name).remove(cb);
		return this;
	}

	one(name, cb) {
		return this.on(name, function oneCb(val) {
			this.off(name, oneCb);
			cb(val);
		}.bind(this));
	}

	fire(name, val) {
		this._eventType(name).fire(val);
	}

	observe(name, cb) {
		this.on(name, cb);
		if (typeof this._currentValues[name] !== 'undefined') {
			cb(this._currentValues[name]);
		}
	}

	getVal(name) {
		return this._currentValues[name];
	}

	setVal(name, val) {
		if (this._currentValues[name] !== val) {
			this._currentValues[name] = val;
			this.fire(name, this._currentValues[name]);
			setTimeout(() => { // TODO: fix stuttering
				this.fire(name, this._currentValues[name]);
			}, 100);
		}
	}

	getVals(...keys) {
		return pick(this._currentValues, ...keys);
	}

	setVals(obj) {
		for (let [key, val] of Object.entries(obj)) {
			this.setVal(key, val);
		}
	}

	observeExpressions(dynamics, {setter, ready}) {
		for (let [entity, rules] of dynamics) {
			for (let [key, [paramNames, fn]] of Object.entries(rules)) {
				for (let paramName of paramNames) {
					this.observe(paramName, () => {
						let paramValues = paramNames.map(p => this.getVal(p));
						if (!paramValues.every(ready)) { return }
						setter(entity, key, fn(...paramValues));
					})
				}
			}
		}
	}

}
