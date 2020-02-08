import { PubSubEngine } from 'graphql-subscriptions';
import {Event, EventReceive, Publisher, PubSubSettings, Subscriber} from "kubets/compiled";
import {PubSubAsyncIterator} from "./iterator";
import {TextDecoder} from "util";

export type TriggerTransform = (
	trigger: string,
	channelOptions?: Object,
) => string;

export interface KubeMQPubSubOptions {
	triggerTransform?: TriggerTransform
	connectionOptions?: PubSubSettings
	kubeSubscriber?: Subscriber,
	kubePublisher?: Publisher,
}

export class KubeMQPubSub implements PubSubEngine {
	private triggerTransform: TriggerTransform;
	private subscriber: Subscriber;
	private publisher: Publisher;

	private subscriptions: { [message: string]: Function[] } = {};
	private currentSubscriptionId: number = 0;

	constructor(settings: KubeMQPubSubOptions) {
		if (!settings.kubePublisher || !settings.kubeSubscriber) {
			if (settings.connectionOptions) {
				this.subscriber = new Subscriber(settings.connectionOptions);
				this.publisher = new Publisher(settings.connectionOptions)
			} else {
				throw new Error(`You haven't supplied a valid connectionOptions.`)
			}
		} else {
			this.subscriber = settings.kubeSubscriber;
			this.publisher = settings.kubePublisher;
		}

		this.triggerTransform = settings.triggerTransform || ((trigger: string) => trigger);
		this.subscriber.subscribe(e => this.onMessage(e), err => this.onError(err));

		console.log('setup');
	}

	private onMessage(event: EventReceive) {
		const message = event.getMetadata();
		const body = event.getBody();
		if (!message || !body) return; // Not from PubSub or invalid body.

		const subscriptionCBs = this.subscriptions[message];
		if (!subscriptionCBs) return; // No subs for this event.

		let parsedBody;
		try {
			parsedBody = typeof body === 'string' ? JSON.parse(body) : JSON.parse(new TextDecoder().decode(body));
		} catch (e) {
			parsedBody = body;
		}

		for (const cb of subscriptionCBs) cb(parsedBody)
	}

	private onError(e: Error) {
		console.log(e)
		console.error(`pubsub errored`) // TODO:
	}

	asyncIterator<T>(triggers: string | string[], options?: Object): AsyncIterator<T> {
		return new PubSubAsyncIterator<T>(this, triggers, options);
	}

	async publish<T>(triggerName: string, payload: T): Promise<void> {
		const event = new Event();
		event.setMetadata(triggerName);
		event.setBody(Buffer.from(JSON.stringify(payload)));

		await this.publisher.send(event);
	}

	async subscribe(trigger: string, onMessage: Function, options: Object = {}): Promise<number> {
		const triggerName = this.triggerTransform(trigger, options);
		const id = this.currentSubscriptionId += 1;

		if (!this.subscriptions[triggerName]) this.subscriptions[triggerName] = [];
		this.subscriptions[triggerName].push(onMessage);

		return id;
	}

	unsubscribe(subId: number): any {
		// const [triggerName, onMessage] = this.subscriptions[subId];
		// delete this.subscriptions[subId];
	}
}
