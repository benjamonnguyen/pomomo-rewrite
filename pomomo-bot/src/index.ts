import config from 'config';
import 'reflect-metadata';
import { Client, GatewayIntentBits } from 'discord.js';
import { sessionsClient } from './db/redisClient';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
	console.log('Ready!');
});

await client.login(config.get('botToken'));

const gracefulShutdown = () => {
	console.log('Starting graceful shutdown');
	sessionsClient
		.disconnect()
		.then(() => console.log('Disconnected from redisClient'));

	console.log('Graceful shutdown completed');
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export {};
