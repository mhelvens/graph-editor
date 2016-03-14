import {Pipe} from '../../node_modules/angular2/core';

function escapeForRegex(s) {
	return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

@Pipe({ name: 'underlineSubstring' })
export default class UnderlineSubstringPipe {
	transform(string, [substring]) {
		if (!substring || substring.length === 0) { return string }
		return (string || "").replace(new RegExp('('+escapeForRegex(substring || "")+')', 'gi'), '<u>$1</u>');
	}
}
