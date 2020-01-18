import {PubSubEngine} from "graphql-subscriptions";

export class PubSubAsyncIterator<T> implements AsyncIterator<T> {
	private pullQueue: any[] = [];
	private pushQueue: any[] = [];
	private listening: boolean = true;

	constructor(private pubsub: PubSubEngine, eventNames: string | string[], private options?: Object) {

	}

	next(value?: any): Promise<IteratorResult<T>> {
		return undefined;
	}
}
