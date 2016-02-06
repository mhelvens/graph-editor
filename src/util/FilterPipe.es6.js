import {Pipe} from 'angular2/core';


@Pipe({ name: 'filter' })
export default class FilterPipe {
	transform(list, [pred]) {
		return list.filter(pred);
	}
}
