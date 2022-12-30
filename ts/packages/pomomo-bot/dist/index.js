import config from 'config';
import pkg from 'discord-cross-hosting';
const { Client } = pkg;
import Cluster from 'discord-hybrid-sharding';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { bridgeHealthCheck } from './health-check';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Client setup
const client = new Client({
    agent: config.get('app.name'),
    host: config.get('bridge.host'),
    port: config.get('bridge.port'),
    authToken: config.get('bridge.authToken'),
    rollingRestarts: true,
});
client.on('debug', console.debug);
client.on('error', (e) => console.error('clusterClient error:', e));
// Manager setup
const botPath = path.join(__dirname, 'bot.js');
const manager = new Cluster.Manager(botPath, {
    execArgv: ['--experimental-modules', '--es-module-specifier-resolution=node'],
});
manager.on('debug', console.debug);
client.listen(manager);
const gracefulShutdown = () => {
    console.info('Starting graceful shutdown...');
    client.close();
    console.info('clusterClient closed!');
};
client.connect();
client
    .requestShardData()
    .then((data) => {
    if (!data || !data.shardList)
        return;
    manager.totalShards = data.totalShards;
    manager.totalClusters = data.shardList.length;
    manager.shardList = data.shardList;
    manager.clusterList = data.clusterList;
    manager.spawn();
})
    .catch(console.error);
// client.on('bridgeMessage', (message) => {
// 	if (!message._sCustom) return;
// 	console.log('bridgeMessage', message);
// });
// client.on('bridgeRequest', (message) => {
// 	if (!message._sCustom && !message._sRequest) return;
// 	console.log('bridgeRequest', message);
// 	message.reply({ data: 'Hello World' });
// });
bridgeHealthCheck.start();
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
export { client };
//# sourceMappingURL=index.js.map