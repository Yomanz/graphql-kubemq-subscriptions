import {PubSubEngine} from 'graphql-subscriptions';
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
	private readonly triggerTransform: TriggerTransform;
	private readonly subscriber: Subscriber;
	private readonly publisher: Publisher;

	private subscriptionMap: {[subId: number]: [string, Function]} = {};
	private subsRefsMap: {[trigger: string]: number[]} = {};
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
	}

	private onMessage(event: EventReceive) {
		const message = event.getMetadata();
		const body = event.getBody();
		if (!message || !body) return; // Not from PubSub or invalid body.

		const subscribers = this.subsRefsMap[message];
		if (!subscribers) return; // No subs for this event.

		let parsedBody;
		try {
			parsedBody = typeof body === 'string' ? JSON.parse(body) : JSON.parse(new TextDecoder().decode(body));
		} catch (e) {
			parsedBody = body;
		}

		for (const subId of subscribers) {
			const [, cb] = this.subscriptionMap[subId];
			cb(parsedBody);
		}
	}

	private onError(e: Error) {
		console.error(e);
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
		this.subscriptionMap[id] = [triggerName, onMessage];
		let refs = this.subsRefsMap[triggerName];

		if (refs && refs.length > 0) {
			this.subsRefsMap[triggerName] = [...refs, id];
			return id;
		} else {
			this.subsRefsMap[triggerName] = [
				...(this.subsRefsMap[triggerName] || []),
				id,
			];
			return id;
		}
	}

	unsubscribe(subId: number): any {
		const [triggerName] = this.subscriptionMap[subId] || [];
		const refs = this.subsRefsMap[triggerName];

		if (!refs) throw new Error(`There is no subscription of id: ${subId}`);

		if (refs.length === 1) {
			delete this.subsRefsMap[triggerName]
		} else {
			const index = refs.indexOf(subId);
			this.subsRefsMap[triggerName] =
				index === -1 ? refs : [...refs.slice(0, index), ...refs.slice(index + 1)];
		}
		delete this.subscriptionMap[subId]
	}
}
