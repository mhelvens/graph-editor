import $ from 'jquery';
export default $;

/* convenience static methods */
Object.assign($, {
	svg(creationString) {
		return this(`<svg>${creationString}</svg>`).children().detach();
	}
});

/* convenience instance methods */
Object.assign($.fn, {
	getBoundingClientRect() {
		return this[0].getBoundingClientRect();
	}
});

/* fix strange bug where case-sensitive attribute name is not used properly */
$.attrHooks['viewbox'] = {
	set: function(elem, value, name) {
		elem.setAttributeNS(null, 'viewBox', value + '');
		return value;
	}
};
