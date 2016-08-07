import {Pipe} from '@angular/core';


@Pipe({ name: 'map' })
export default class MapPipe {
	transform(list, fn) {
		return list.map(fn);
	}
}
