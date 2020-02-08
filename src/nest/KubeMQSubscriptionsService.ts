import {Inject, Injectable, Optional} from "@nestjs/common";
import {KubeMQPubSubOptions, KubeMQPubSub} from "../pubsub";
import {KUBEMQ_PUBSUB_SETTINGS} from "./constants";

@Injectable()
export class KubeMQSubscriptionsService extends KubeMQPubSub {
	constructor(
		@Optional() @Inject(KUBEMQ_PUBSUB_SETTINGS) settings: KubeMQPubSubOptions
	) {
		super(settings)
	}
}
