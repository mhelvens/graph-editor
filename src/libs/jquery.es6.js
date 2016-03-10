import $ from 'jquery';
export default $;

$.svg = function svg(creationString) {
	return this(`<svg>${creationString}</svg>`).children().detach();
};
