import includes      from 'lodash/includes';
import isUndefined   from 'lodash/isUndefined';
import isPlainObject from 'lodash/isPlainObject';
import isArray       from 'lodash/isArray';
import set           from 'lodash/set';
import isEqual       from 'lodash/isEqual';
import Kefir         from '../libs/kefir.es6.js';
import {assert}      from '../util/misc.es6.js';
import Fraction, {equals} from '../libs/fraction.es6.js';


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

		/* create the delete method and event (special type of event, easier to create this way) */
		this[events].delete = Kefir.stream((emitter) => {
			this.delete = () => {
				emitter.emit();
				emitter.end();
			};
		});

		/* add the events and properties added with ES7 annotations */
		for (let [key, options] of Object.entries(this.constructor[events]     || {})) { this.newEvent   (key, options) }
		for (let [key, options] of Object.entries(this.constructor[properties] || {})) { this.newProperty(key, options) }
	}

	/**
	 * Declares a new event stream for this object.
	 *
	 * @public
	 * @method
	 * @param  {String} name - the name of the event, used to trigger or subscribe to it
	 * @return {Kefir.Bus} - the created event stream
	 */
	newEvent(name, {} = {}) {
		this[initialize]();

		/* is the event name already taken? */
		assert(() => !this[events][name],
			`There is already an event '${name}' on this object.`);
		assert(() => !this[properties][name],
			`There is already a property '${name}' on this object.`);

		/* define the event stream */
		let bus = new Kefir.Bus();
		// this.e('delete').onValue(bus.end);
		this[events][name] = bus.takeUntilBy(this.e('delete'));
		Object.assign(this[events][name], {

			plug:   (observable) => {
				bus.plug(observable);
				return {
					unplug: () => {
						bus.unplug(observable);
					}
				};
			},

			unplug: bus.unplug,

			emit:   bus.emit,

			_name: name,
			name: name,

			owner: this
		});
		return this[events][name];
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
		isEqual  = equals,
		isValid  = ()=>true,
		initial
	} = {}) {
		this[initialize]();

		/* is the property name already taken? */
		assert(() => !this[events][name],
			`There is already an event '${name}' on this object.`);
		assert(() => !this[properties][name],
			`There is already a property '${name}' on this object.`);

		/* if isValid is an array, check for inclusion */
		if (isArray(isValid)) {
			let options = isValid;
			isValid = (v) => includes(options, v)
		}

		/* bind functions to their proper context */
		isValid = isValid.bind(this);
		isEqual = isEqual.bind(this);

		/* define the bus which manages the property */
		let bus = new Kefir.Bus();
		// this.e('delete').take(1).onValue(bus.end);

		/* define the property itself, and give it additional methods */
		let hasInitial = (!isUndefined(initial) && isValid(initial));
		let property = this[events][name] = this[properties][name] =
			bus.takeUntilBy(this.e('delete'))
			   .toProperty(hasInitial ? (()=>initial) : undefined)
			   .skipDuplicates(isEqual);

		/* maintain current value */
		let currentValue;
		property.onValue((value) => { currentValue = value });

		/* additional property methods */
		Object.assign(property, {

			plug(observable, passive, transform) {
				if (Array.isArray(observable)) {
					return this.plug(Kefir.combine(observable, passive, transform).skipDuplicates(equals));
				} else {
					let filteredObservable = observable.filter(isValid);
					bus.plug(filteredObservable);
					return {
						unplug: () => {
							bus.unplug(filteredObservable);
						}
					};
				}
			},

			get() { return currentValue },

			name: name,
			_name: name,

			owner: this

		}, settable && {

			set(value) {
				if (isValid(value)) {
					bus.emit(value);
				}
				return property;
			}

		});

		/* make the property active; it doesn't work if this isn't done (the nature of Kefir.js) */
		property.run(); // TODO: check if this is still needed

		/* return the property */
		return property;

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
		return this[events][name];
	}

	/**
	 * Retrieve a property by name.
	 *
	 * @public
	 * @method
	 * @param  {String|Array} nameOrActiveDeps    - the name of the property to retrieve, or a list of active dependencies for a derived property
	 * @param  {Array?}       optionalPassiveDeps - an optional list of passive dependencies for the derived property
	 * @param  {Function?}    optionalTransformer - an optional function to map the dependencies to a new value for the derived property
	 * @return {Kefir.Property} - the property associated with the given name
	 */
	p(nameOrActiveDeps, optionalPassiveDeps, optionalTransformer) {
		this[initialize]();
		if (isArray(nameOrActiveDeps)) {
			return Kefir.combine(nameOrActiveDeps.map(n => this[properties][n]), optionalPassiveDeps, optionalTransformer);
		} else {
			return this[properties][nameOrActiveDeps];
		}
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
