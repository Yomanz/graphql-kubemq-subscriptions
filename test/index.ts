import {KubeMQPubSub} from "../src";
import {SubscribeType} from "kubets/compiled";

const pub = new KubeMQPubSub({
	connectionOptions: {
		host: '127.0.0.1',
		port: 50000,
		channel: 'apollo',
		client: 'discord',
		type: SubscribeType.Events
	}
});

const sub = new KubeMQPubSub({
	connectionOptions: {
		host: '127.0.0.1',
		port: 50000,
		channel: 'apollo',
		client: 'server',
		type: SubscribeType.Events
	}
});

setTimeout(() => {
	sub.subscribe('exampleEvent', console.log, console.error).then(() => {
		console.log('successfully subscribed.')
		pub.publish('exampleEvent', {
			data: 'example'
		}).then(() => console.log('published'))
	});
}, 1000);
