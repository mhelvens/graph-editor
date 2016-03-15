import $ from 'jquery';
export default $;

Object.assign($, {
	svg(creationString) {
		return this(`<svg>${creationString}</svg>`).children().detach();
	}
});

Object.assign($.fn, {
	getBoundingClientRect() {
		return this[0].getBoundingClientRect();
	}
});
