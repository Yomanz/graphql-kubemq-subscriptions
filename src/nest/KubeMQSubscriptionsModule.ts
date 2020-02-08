import {DynamicModule, Module} from "@nestjs/common";
import {KubeMQPubSubOptions} from "../pubsub";
import {KUBEMQ_PUBSUB_SETTINGS} from "./constants";
import {KubeMQSubscriptionsService} from "./KubeMQSubscriptionsService";


@Module({
	providers: [KubeMQSubscriptionsService],
	exports: [KubeMQSubscriptionsService]
})
export class KubeMQSubscriptionsModule {
	static register(options: KubeMQPubSubOptions): DynamicModule {
		return {
			module: KubeMQSubscriptionsModule,
			providers: [
				{
					provide: KUBEMQ_PUBSUB_SETTINGS,
					useValue: options
				}
			]
		}
	}
}
