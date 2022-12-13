import config from 'config';
import logger from 'pomomo-common/src/logger';
import { Bridge } from 'discord-cross-hosting';
import { shardIdForGuildId } from 'discord-hybrid-sharding';
class MyBridge extends Bridge {
    constructor(options) {
        super(options);
    }
    async sendCommands(commands) {
        const clientIdToCommands = new Map();
        this.clients.forEach((client, _) => clientIdToCommands.set(client.id, []));
        for (const msg of commands) {
            const internalShard = shardIdForGuildId(msg.targetGuildId, this.totalShards);
            const targetClient = Array.from(this.clients.values()).find((x) => x?.shardList?.flat()?.includes(internalShard));
            if (!targetClient) {
                logger.error('bridge.sendCommands() - no client found for internalShard', internalShard, '- unsent commandMessage:', msg);
                continue;
            }
            if (!msg.options)
                msg.options = {};
            msg.options.shard = internalShard;
            clientIdToCommands.get(targetClient.id).push(msg);
        }
        const promises = [];
        this.clients.forEach((client) => {
            const cmds = clientIdToCommands.get(client.id);
            logger.debug(`bridge.sendCommands() ~ sending commands to clientId ${client.id}: ${cmds}`);
            const payload = { guildId: cmds[0].targetGuildId, commands: cmds };
            promises.push(this.requestToGuild(payload));
        });
        return Promise.allSettled(promises);
    }
}
const bridge = new MyBridge({
    port: config.get('bridge.port'),
    authToken: config.get('bridge.authToken'),
    totalShards: config.get('bridge.totalShards'),
    totalMachines: config.get('bridge.totalMachines'),
    shardsPerCluster: config.get('bridge.shardsPerCluster'),
    token: config.get('bot.token'),
});
bridge.on('debug', logger.info);
bridge.on('clientMessage', (msg, client) => logger.debug(`Received msg from client ${client}: ${msg}`));
export default bridge;
//# sourceMappingURL=bridge.js.map