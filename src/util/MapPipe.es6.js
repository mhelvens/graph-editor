import {Pipe} from 'angular2/core';


@Pipe({ name: 'map' })
export default class MapPipe {
	transform(list, [fn]) {
		return list.map(fn);
	}
}
