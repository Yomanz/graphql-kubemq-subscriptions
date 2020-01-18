import { PubSubEngine } from 'graphql-subscriptions';
import {Event, EventReceive, Publisher, Subscriber} from "kubets/compiled";

export type TriggerTransform = (
	trigger: string,
	channelOptions?: Object,
) => string;

interface KubeMQPubSubOptions {
	kubeSubscriber: Subscriber,
	kubePublisher: Publisher,
	triggerTransform?: TriggerTransform
}

export class KubeMQPubSub implements PubSubEngine {
	private triggerTransform: TriggerTransform;
	private subscriber: Subscriber;
	private publisher: Publisher;

	private subscriptionMap: { [subId: number]: [string, Function] } = {};
	private subsRefsMap: { [trigger: string]: number[] } = {};
	private currentSubscriptionId: number = 0;

	constructor(settings: KubeMQPubSubOptions) {
		this.subscriber = settings.kubeSubscriber; // TODO: Create Subscriber if not given.
		this.publisher = settings.kubePublisher; // TODO: Create Publisher if not given.

		this.triggerTransform = settings.triggerTransform || ((trigger: string) => trigger);
		this.subscriber.subscribe(this.onMessage.bind(this), this.onError.bind(this));
	}

	private onMessage(event: EventReceive) {
		console.log(event.toObject())
	}
	private onError() {
		console.error(`pubsub errored`) // TODO:
	}

	asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
		return undefined;
	}

	async publish<T>(triggerName: string, payload: T): Promise<void> {
		const event = new Event();
		event.setMetadata(triggerName);
		event.setBody(Buffer.from(JSON.stringify(payload)));

		await this.publisher.send(event);
	}

	async subscribe(triggerName: string, onMessage: Function, options: Object = {}): Promise<number> {
		return undefined;
	}

	unsubscribe(subId: number): any {
	}
}
