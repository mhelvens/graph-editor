import $            from 'jquery';
import Kefir        from 'kefir';
import {isFunction} from 'lodash'


/* Kefir jQuery plugin ********************************************************************************************/

Object.assign($.fn, {

	asKefirStream(eventName) {
		return Kefir.fromEvents(this, eventName);
	},

	attrPlug(key, property) {
		property.onValue((value) => {
			this.attr(key, value);
		});
		return this;
	},

	propPlug(key, property) {
		property.onValue((value) => {
			this.prop(key, value);
		});
		return this;
	},

	cssPlug(key, property) {
		property.onValue((value) => {
			this.css(key, value);
		});
		return this;
	}

});


/* EventStream generators *****************************************************************************************/

Object.assign(Kefir, {

	keyPress(keyCode) {
		return $(window).asKefirStream('keypress').filter(e => (e.keyCode === keyCode));
	},

	once(value) {
		return Kefir.fromCallback((fn) => { fn(value) });
	},

	fromArray(array) {
		return Kefir.stream((emitter) => {
			array.forEach(emitter.emit);
			emitter.end();
		});
	}

});


/* Bus ************************************************************************************************************/

const emit = Symbol('emit');
Kefir.Bus = class Bus extends Kefir.Pool {

	constructor() {
		super();
		this.plug(Kefir.stream((emitter) => {
			this[emit] = emitter.emit;
			this.end = emitter.end;
		}));
	}

	emit(value) {
		this[emit](value);
	}

};



/* EventStream converters *****************************************************************************************/

Object.assign(Kefir.Observable.prototype, {

	// This filters an observable to only let through values equal to the given value.
	value(value, comparator = (e => e === value)) {
		return this.skipDuplicates().filter(comparator);
	},

	// This makes a subscription to an observable that doesn't do anything
	run() {
		const doNothing = ()=>{};
		this.onValue(doNothing);
		return () => { this.offValue(doNothing) };
	}

});

Object.assign(Kefir.Stream.prototype, {

	// Filter events to only certain keys / buttons. Can be a predicate function or single number.
	which(buttonId) {
		const pred = isFunction(buttonId) ? buttonId : (b => b === buttonId);
		return this.filter(e => pred(e.which));
	}

});


/* Export Kefir ***************************************************************************************************/

export default Kefir;
