import config from 'config';
import { Bridge } from 'discord-cross-hosting';

const bridge = new Bridge({
	port: config.get('port'),
	authToken: config.get('authToken'),
	totalMachines: config.get('totalMachines'),
	shardsPerCluster: config.get('shardsPerCluster'),
	token: config.get('botToken'),
});

bridge.on('debug', console.debug);
bridge.once('ready', (url) => console.info(`bridge ready at url: ${url}`));
bridge.on('clientMessage', console.debug);

bridge
	.start()
	.then((b) => console.info(`bridge started: ${JSON.stringify(b)}`));
const gracefulShutdown = () => {
	console.info('Starting graceful shutdown...');
	bridge
		.close()
		.then(() => console.info('bridge closed!'))
		.catch(console.error);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default bridge;
