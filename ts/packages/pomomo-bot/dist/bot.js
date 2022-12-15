import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env['NODE_CONFIG_DIR'] = path.join(__dirname, '..', '..', 'config');
import config from 'config';
import { Client, GatewayIntentBits, } from 'discord.js';
import crossHosting from 'discord-cross-hosting';
import Cluster from 'discord-hybrid-sharding';
import { loadCommands, loadButtons } from './loadable/loader';
import handleBridgeCommands from './handler/bridgecommand/bridge-command-handler';
import sessionRepo from './db/session-repo';
import handleInteraction from './handler/interaction/interaction-handler';
export class MyDiscordClient extends Client {
    commands;
    buttons;
    cluster;
    machine;
    constructor(options, isClustered = true) {
        super(options);
        this.commands = new Map();
        this.buttons = new Map();
        if (isClustered) {
            this.cluster = new Cluster.Client(this);
            this.machine = new crossHosting.Shard(this.cluster);
        }
    }
    async fetchMessage(guildId, channelId, messageId) {
        try {
            const guild = await this.guilds.fetch(guildId);
            const channel = (await guild.channels.fetch(channelId));
            return channel.messages.fetch(messageId);
        }
        catch (e) {
            console.error('MyDiscordClient.fetchTimerMsg()', e);
            return Promise.reject(e);
        }
    }
    toJSON() {
        return { application: this.application, options: this.options };
    }
}
// #region SETUP
let discordClient;
const INTENTS = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
];
if (process.env.IS_CLUSTERED) {
    discordClient = new MyDiscordClient({
        intents: INTENTS,
        shardCount: Cluster.Client.getInfo().TOTAL_SHARDS,
        shards: Cluster.Client.getInfo().SHARD_LIST,
    });
}
else {
    discordClient = new MyDiscordClient({
        intents: INTENTS,
    }, false);
}
discordClient.on('error', (data) => console.error('discordClient error: ' + data));
discordClient.on('warn', (data) => console.warn('discordClient warn: ' + data));
discordClient.on('cacheSweep', (data) => console.info('cacheSweep: ' + data));
discordClient.on('shardError', (data) => console.error('shardError: ' + data));
loadCommands(discordClient);
loadButtons(discordClient);
discordClient.login(config.get('bot.token'));
const gracefulShutdown = () => {
    sessionRepo.client
        .quit()
        .then(() => console.info('sessionsClient quitted!'))
        .catch(console.error);
    try {
        discordClient.destroy();
        console.info('discordClient destroyed!');
    }
    catch (e) {
        console.error(e);
    }
    setTimeout(() => {
        console.info('Shutting down');
        process.exit();
    }, 2000);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// #endregion
discordClient.on('interactionCreate', async (interaction) => {
    await handleInteraction(interaction).catch(console.error);
});
if (discordClient.cluster) {
    discordClient.cluster.on('message', (msg) => {
        if (!msg._sRequest)
            return;
        if (msg.commands) {
            handleBridgeCommands(msg.commands)
                .then(() => msg.reply({}))
                .catch((e) => msg.reply({ error: e }));
        }
    });
}
export default discordClient;
//# sourceMappingURL=bot.js.map