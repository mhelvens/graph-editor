import _, {isUndefined, isFunction, isPlainObject, isArray, set} from 'lodash';
import Kefir                                                     from '../libs/kefir.es6.js';
import {assert}                                                  from '../util/misc.es6.js';


/* symbols to private members */
const events     = Symbol('events');
const properties = Symbol('properties');
const initialize = Symbol('initialize');


/**
 * Use this as a subclass (or just mix it in) to provide support for
 * events and observable properties through Kefir.js.
 *
 * @export
 * @class ValueTracker
 */
export default class ValueTracker {

	[initialize]() {
		if (this[events]) { return }
		this[events]     = {};
		this[properties] = {};
		this.newEvent('delete');
		for (let [key, options] of Object.entries(this.constructor[events]     || {})) { this.newEvent   (key, options) }
		for (let [key, options] of Object.entries(this.constructor[properties] || {})) { this.newProperty(key, options) }
	}

	/**
	 * Declares a new event stream for this object.
	 *
	 * @public
	 * @method
	 * @param  {String}        name    - the name of the event, used to trigger or subscribe to it
	 * @param  {Kefir.Stream} [source] - another event stream to automatically trigger this event
	 * @return {Kefir.Bus} - the created event stream
	 */
	newEvent(name, {source} = {}) {
		this[initialize]();

		/* is the event name already taken? */
		assert(() => !this[events][name],
			`There is already an event '${name}' on this object.`);
		assert(() => !this[properties][name],
			`There is already a property '${name}' on this object.`);

		/* define the event stream */
		let bus = new Kefir.Bus();
		if (source) { bus.plug(source) }

		return this[events][name] = bus;

	}

	/**
	 * Retrieve an event stream by name. If the name of a property is given, a stream
	 * based on changes to that property is returned.
	 *
	 * @public
	 * @method
	 * @param  {String}  name - the name of the event stream to retrieve
	 * @return {Kefir.Stream} - the event stream associated with the given name
	 */
	e(name) {
		this[initialize]();

		/* does the event exist? */
		assert(() => this[events][name],
			`There is no event '${name}' on this object.`);

		/* return it */
		return this[events][name];

	}

	/**
	 * Retrieve a property by name.
	 *
	 * @public
	 * @method
	 * @param  {String} name - the name of the property to retrieve
	 * @return {Kefir.Property} - the property associated with the given name
	 */
	p(name) {
		this[initialize]();

		if (isArray(name)) {
			return Kefir.combine(name.map(n => this[properties][n]));
		} else {
			return this[properties][name];
		}
	}

	/**
	 * This method defines a new property on this object.
	 *
	 * @public
	 * @method
	 * @param  {String}                   name           - the name of the event stream to retrieve
	 * @param  {Boolean}                 [settable=true] - whether the value can be manually set
	 * @param  {function(*,*):Boolean}   [isEqual]       - a predicate function by which to test for duplicate values
	 * @param  {function(*):Boolean}     [isValid]       - a predicate function to validate a given value
	 * @param  {*}                       [initial]       - the initial value of this property
	 *
	 * @return {Kefir.Property} - the property associated with the given name
	 */
	newProperty(name, {
		settable = true,
		isEqual  = _.isEqual,
		isValid  = ()=>true,
		initial,
	} = {}) {
		this[initialize]();

		/* is the property name already taken? */
		assert(() => !this[events][name],
			`There is already an event '${name}' on this object.`);
		assert(() => !this[properties][name],
			`There is already a property '${name}' on this object.`);

		/* define the bus which manages the property */
		let bus = new Kefir.Bus();

		/* define the property itself, and give it additional methods */
		let hasInitial = (!isUndefined(initial) && isValid(initial));
		let property = this[events][name] = this[properties][name] =
			bus.toProperty(hasInitial ? (()=>initial) : undefined).skipDuplicates(isEqual);

		/* maintain current value */
		let currentValue;
		property.onValue((value) => { currentValue = value });

		/* additional property methods */
		let plugged = new Map;
		Object.assign(property, {

			plug(observable) {
				let filteredObservable = isValid ? observable.filter(isValid) : observable;
				plugged.set(observable, filteredObservable);
				bus.plug(filteredObservable);
				return {
					unplug: () => { property.unplug(observable) }
				};
			},

			unplug(observable) {
				bus.unplug(plugged.get(observable));
				plugged.delete(observable);
				return property;
			},

			get() { return currentValue }

		}, settable && {

			set(value) {
				if (!isValid || isValid(value)) {
					bus.emit(value);
				}
				return property;
			}

		});

		/* make the property active; it doesn't work if this isn't done (the nature of Kefir.js) */
		property.run();
		this.e('delete').onValue(bus.end);

		/* return the property */
		return property;

	}

	/**
	 * Trigger an event for all subscribers.
	 *
	 * @public
	 * @method
	 * @param {String} name  - the name of the event stream to trigger
	 * @param {*}      value - the value to attach to the event
	 */
	trigger(name, value) {
		this[initialize]();

		/* does the event stream exist? */
		assert(() => this[events][name],
			`There is no event '${name}' on this object.`);

		/* push the value to the stream */
		this[events][name].emit(value);

	}

	get(key) {
		this[initialize]();

		return isArray(key)
			? key.map(k => this.get(k))
			: this.p(key).get();
	}

	set(key, value) {
		this[initialize]();
		
		if (isPlainObject(key) && isUndefined(value)) {
			for (let [k, v] of Object.entries(key)) {
				this.set(k, v);
			}
		} else {
			this.p(key).set(value);
		}
	}

};

export const property = (options = {}) => (target, key) => {
	set(target, ['constructor', properties, key], options);
	let {settable = true} = options;
	return Object.assign({
		get() { return this.p(key).get() }
	}, settable && {
		set(value) { this.p(key).set(value) }
	});
};

export const event = (options = {}) => (target, key) => {
	set(target, ['constructor', events, key], options);
	return {
		get() { return this.e(key) }
	};
};
