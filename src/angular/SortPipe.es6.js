import {Pipe} from '../../node_modules/angular2/core';


@Pipe({ name: 'sort' })
export default class SortPipe {
	transform(list, [compareFn]) {
		return list.slice().sort(compareFn);
	}
}
