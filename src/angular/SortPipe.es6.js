import {Pipe} from '@angular/core';


@Pipe({ name: 'sort' })
export default class SortPipe {
	transform(list, compareFn) {
		return list.slice().sort(compareFn);
	}
}
