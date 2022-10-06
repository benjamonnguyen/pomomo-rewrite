import config from 'config';
import pkg from 'discord-cross-hosting';
const { Client } = pkg;
import Cluster from 'discord-hybrid-sharding';
import path from 'node:path';

// Client setup
const client = new Client({
	agent: config.get('app.name'),
	host: config.get('bridge.host'),
	port: config.get('bridge.port'),
	authToken: config.get('bridge.authToken'),
	rollingRestarts: true,
});
client.on('debug', console.debug);
client.on('error', console.error);
client.on('bridgeRequest', console.info);

// Manager setup
const botPath = path.join('dist', 'bot.js');
const manager = new Cluster.Manager(botPath, {
	execArgv: ['--experimental-modules', '--es-module-specifier-resolution=node'],
});
manager.on('debug', console.debug);

client.connect();
client
	.requestShardData()
	.then((data) => {
		if (!data || !data.shardList) return;
		manager.totalShards = data.totalShards;
		manager.shardList = data.shardList;
		manager.clusterList = data.clusterList;
		manager.spawn();
	})
	.catch(console.error);

client.listen(manager);

const gracefulShutdown = async () => {
	console.info('Starting graceful shutdown...');

	await client.close();
	console.info('clusterClient closed!');

	setTimeout(() => {
		console.info('Shutting down');
		process.exit();
	}, 5000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export {};