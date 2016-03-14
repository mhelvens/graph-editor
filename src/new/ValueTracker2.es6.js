import $ from 'jquery';
import Kefir from '../libs/kefir.es6.js';
import {isUndefined, isFunction, isPlainObject, isArray} from 'lodash';
import {assert} from '../util/misc.es6.js';




/** {@export}{@class KefirSignalHandler}
 * Use this as a subclass (or just mix it in) to provide support for
 * events and observable properties through Kefir.js.
 */
export default class KefirSignalHandler {

	constructor() {
		this._events = {};
		this._properties = {};
		this.newEvent('destroy');
	}

	/** {@public}{@method}
	 * Declares a new event stream for this object.
	 *
	 * @param  {String}        name    - the name of the event, used to trigger or subscribe to it
	 * @param  {Kefir.Stream} [source] - another event stream to automatically trigger this event
	 *
	 * @return {Kefir.Bus} - the created event stream
	 */
	newEvent(name, {source} = {}) {

		/* is the event name already taken? */
		assert(() => !this._events[name],
			`There is already an event '${name}' on this object.`);
		assert(() => !this._properties[name],
			`There is already a property '${name}' on this object.`);

		/* define the event stream */
		let bus = new Kefir.Bus();
		if (source) { bus.plug(source) }
		return this._events[name] = bus;

	}


	/** {@public}{@method}
	 * Retrieve an event stream by name. If the name of a property is given, a stream
	 * based on changes to that property is returned.
	 *
	 * @param  {String}  name - the name of the event stream to retrieve
	 * @return {Kefir.Stream} - the event stream associated with the given name
	 */
	e(name) {

		/* does the event exist? */
		assert(() => this._events[name],
			`There is no event '${name}' on this object.`);

		/* return it */
		return this._events[name];

	}


	/** {@public}{@method}
	 * Retrieve a property by name.
	 *
	 * @param  {String} name - the name of the property to retrieve
	 * @return {Kefir.Property} - the property associated with the given name
	 */
	p(name) {
		if (isArray(name)) {
			return Kefir.combine(name.map(n => this._properties[n]));
		} else {
			return this._properties[name];
		}
	}


	/** {@public}{@method}
	 * This method defines a new property on this object.
	 *
	 * @param  {String}                   name           - the name of the event stream to retrieve
	 * @param  {Boolean}                 [settable=true] - whether the value can be manually set
	 * @param  {*}                       [initial]       - the initial value of this property
	 * @param  {function(*,*):Boolean}   [isEqual]       - a predicate function by which to test for duplicate values
	 * @param  {function(*):Boolean}     [isValid]       - a predicate function to validate a given value
	 *
	 * @return {Kefir.Property} - the property associated with the given name
	 */
	newProperty(name, {settable, initial, isEqual, isValid = ()=>true} = {}) {

		/* is the property name already taken? */
		assert(() => !this._events[name],
			`There is already an event '${name}' on this object.`);
		assert(() => !this._properties[name],
			`There is already a property '${name}' on this object.`);

		/* default value for 'settable' */
		if (isUndefined(settable)) { settable = true }

		/* define the bus which manages the property */
		let bus = new Kefir.Bus();

		/* define the property itself, and give it additional methods */
		let hasInitial = (!isUndefined(initial) && isValid(initial));
		let property = this._properties[name] = bus.toProperty(hasInitial ? (()=>initial) : undefined).skipDuplicates(isEqual);

		/* maintain current value */
		let currentValue;
		property.onValue((value) => { currentValue = value });

		/* additional property methods */
		let plugged = new Map;
		property.plug = (observable) => {
			let filteredObservable = isValid ? observable.filter(isValid) : observable;
			plugged.set(observable, filteredObservable);
			bus.plug(filteredObservable);
			return property;
		};
		property.unplug = (observable) => {
			bus.unplug(plugged.get(observable));
			plugged.delete(observable);
			return property;
		};
		property.get = () => currentValue;
		if (settable) {
			property.set = (value) => {
				if (!isValid || isValid(value)) {
					bus.emit(value);
				}
				return property;
			};
		}

		/* add the property to the object interface */
		Object.defineProperty(this, name, {
			get: property.get,
			set: settable ? property.set : undefined
		});

		/* make the property active; it doesn't work if this isn't done (the nature of Kefir.js) */
		property.run();
		this.e('destroy').onValue(bus.end);

		/* return the property */
		return property;

	}


	/** {@public}{@method}
	 * Trigger an event for all subscribers.
	 *
	 * @param {String} name  - the name of the event stream to trigger
	 * @param {*}      value - the value to attach to the event
	 */
	trigger(name, value) {

		/* does the event stream exist? */
		assert(() => this._events[name],
			`There is no event '${name}' on this object.`);

		/* push the value to the stream */
		this._events[name].emit(value);

	}
	
	get(key) {
		return isArray(key)
			? key.map(k => this.get(k))
			: this.p(key).get();
	}

	set(key, value) {
		if (isPlainObject(key) && isUndefined(value)) {
			for (let [k, v] of Object.entries(key)) {
				this.set(k, v);
			}
		} else {
			this.p(key).set(value);
		}
	}

};
