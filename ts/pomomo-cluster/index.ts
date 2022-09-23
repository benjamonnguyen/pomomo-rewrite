import config from 'config';
import pkg from 'discord-cross-hosting';
const { Client } = pkg;
import Cluster from 'discord-hybrid-sharding';
import path from 'node:path';

const client = new Client({
	agent: config.get('agent'),
	host: config.get('bridge.host'),
	port: config.get('bridge.port'),
	authToken: config.get('bridge.authToken'),
	rollingRestarts: true,
});

const botPath = path.join(
	'..',
	'pomomo-bot',
	'dist',
	'index.js',
);
const manager = new Cluster.Manager(botPath);
manager.on('debug', console.debug);
manager.on('clusterCreate', (cluster) =>
	console.info(`Created cluster: ${cluster}`),
);

client.on('debug', console.debug);
client.on('error', console.error);
client.on('bridgeRequest', console.info);
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

const gracefulShutdown = () => {
	console.info('Starting graceful shutdown...');
	client
		.close()
		.then(() => console.info('clusterClient closed!'))
		.catch(console.error);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export {};
