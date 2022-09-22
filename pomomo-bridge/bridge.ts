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

export default bridge;
