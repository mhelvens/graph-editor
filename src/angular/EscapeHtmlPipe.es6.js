import {Pipe} from '@angular/core';


@Pipe({ name: 'escapeHTML' })
export default class EscapeHtmlPipe {
	transform(html) {
		return html
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}
}
