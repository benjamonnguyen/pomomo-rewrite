import config from 'config';
import 'reflect-metadata';
import discordClient from './discord/discord-client';
import { sessionsClient } from './db/redis-clients';

await discordClient.login(config.get('botToken'));
console.info('discordClient logged in!');

await sessionsClient.connect();
console.info('sessionsClient connected!');

const gracefulShutdown = () => {
	console.info('Starting graceful shutdown...');
	sessionsClient
		.disconnect()
		.then(() => console.info('sessionsClient disconnected!'))
		.catch((e) => console.error(e));
	try {
		discordClient.destroy();
		console.info('discordClient destroyed!');
	} catch (e) {
		console.error(e);
	}
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export {};
