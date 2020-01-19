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
	sub.subscribe('messageUpdate', console.log, console.error).then(() => {
		console.log('subbed')
		pub.publish('messageUpdate', {
			gang: 'lmao yeah'
		}).then(() => console.log('published'))
	});
}, 1000);
