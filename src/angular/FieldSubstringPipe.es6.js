import {Pipe} from '@angular/core';


@Pipe({ name: 'fieldSubstring' })
export default class FieldSubstringPipe {
	transform(list, filterText, string, flags = {}) {
		return list.filter(item =>
			(filterText(item, flags) || "")
				.toLowerCase()
				.includes((string || "").trim().toLowerCase())
		);
	}
}
