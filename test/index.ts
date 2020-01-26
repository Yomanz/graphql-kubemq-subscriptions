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

setTimeout(async () => {
	await sub.subscribe('exampleEvent', console.log, console.error).then(() => {
		console.log('successfully subscribed.')
	});
	await sub.subscribe('exampleEvent', console.log, console.error).then(() => {
		console.log('successfully subbed xx2')
	})

	await pub.publish('exampleEvent', {
		data: 'example'
	}).then(() => console.log('published'))
}, 1000);
