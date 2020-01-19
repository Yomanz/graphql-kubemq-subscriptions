import {PubSubEngine} from "graphql-subscriptions";
import {$$asyncIterator} from "iterall";

export class PubSubAsyncIterator<T> implements AsyncIterator<T> {
	private subscriptionIds?: Promise<number[]>;
	private listening: boolean = true;
	private pullQueue: any[] = [];
	private pushQueue: any[] = [];
	private eventsArray: string[];

	constructor(private pubsub: PubSubEngine, eventNames: string | string[], private options: Object = {}) {
		this.eventsArray = typeof eventNames === 'string' ? [eventNames] : eventNames;
	}
	public async next(): Promise<IteratorResult<T>> {
		await this.emptyQueue();
		return this.listening ? this.pullValue() : this.return()
	}

	public async return(value?: any) {
		await this.emptyQueue();
		return { value: value, done: true };
	}

	public async throw(error: any) {
		await this.emptyQueue();
		return Promise.reject(error);
	}

	private pullValue(): Promise<IteratorResult<any>> {
		return new Promise(((resolve, reject) => {
			if (this.pushQueue.length !== 0) return resolve({value: this.pushQueue.shift(), done: false});
			this.pullQueue.push(resolve);
		}))
	}

	private async pushValue(event: any) {
		await this.subscribeAll();
		if (this.pullQueue.length !== 0) {
			this.pullQueue.shift()({ value: event, done: false });
		} else {
			this.pushQueue.push(event);
		}
	}


	[$$asyncIterator]() {
		return this;
	}

	private async emptyQueue() {
		if (this.listening) {
			this.listening = false;
			if (this.subscriptionIds) this.unsubscribeAll(await this.subscriptionIds);
			this.pullQueue.forEach(resolve => resolve({ value: undefined, done: true }));
			this.pullQueue.length = 0;
			this.pushQueue.length = 0;
		}
	}

	private subscribeAll() {
		if (!this.subscriptionIds) {
			this.subscriptionIds = Promise.all(this.eventsArray.map(
				eventName => this.pubsub.subscribe(eventName, this.pushValue.bind(this), this.options),
			));
		}
		return this.subscriptionIds
	}

	private unsubscribeAll(subscriptionIds: number[]) {
		for (const subscriptionId of subscriptionIds) {
			this.pubsub.unsubscribe(subscriptionId);
		}
	}
}
