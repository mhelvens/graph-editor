import {Pipe} from '@angular/core';


@Pipe({ name: 'filter' })
export default class FilterPipe {
	transform(list, pred) {
		return list.filter(pred);
	}
}
