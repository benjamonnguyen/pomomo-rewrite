import config from 'config';
import { logger, ELogLevel } from 'pomomo-common/src/logger';
import { Bridge, BridgeOptions, IPCMessage } from 'discord-cross-hosting';
import { CommandMessage } from 'pomomo-common/src/command';
import { shardIdForGuildId } from 'discord-hybrid-sharding';

class MyBridge extends Bridge {
	constructor(options: BridgeOptions) {
		super(options);
		this.on('debug', (log) => {
			logger.logger.info(log);
		});
		this.on('clientMessage', (msg, client) => {
			// TODO centralized logging [Client0] ...
			if (!msg._sCustom) return;
			logger.logger.debug(`Received msg from client ${client}: ${msg}`);
			if (Object.hasOwn(msg, 'log')) {
				const logMsg = msg as IPCMessage & { log: string; logLvl: ELogLevel };
				logger.log(logMsg.logLvl, logMsg.log);
			}
		});
		this.on('clientRequest', (message, _) => {
			if (!message._sCustom && !message._sRequest) return;
			if (Object.hasOwn(message, 'bridgeHealthCheck')) {
				message
					.reply({})
					.catch((e) => logger.logger.error('checkBridgeUp reply error: ' + e));
			}
		});
	}

	async sendCommands(commands: CommandMessage[]) {
		const clientIdToCommands: Map<string, CommandMessage[]> = new Map();
		this.clients.forEach((client, _) => clientIdToCommands.set(client.id, []));

		for (const msg of commands) {
			const internalShard = shardIdForGuildId(
				msg.targetGuildId,
				this.totalShards as number,
			);
			const targetClient = Array.from(this.clients.values()).find((x) =>
				x?.shardList?.flat()?.includes(internalShard),
			);
			if (!targetClient) {
				logger.logger.error(
					'bridge.sendCommands() - no client found for internalShard',
					internalShard,
					'- unsent commandMessage:',
					msg,
				);
				process.kill(0, 'SIGINT');
			}
			if (!msg.options) msg.options = {};
			msg.options.shard = internalShard;

			clientIdToCommands.get(targetClient.id).push(msg);
		}

		const promises: Promise<any>[] = [];
		this.clients.forEach((client) => {
			const cmds = clientIdToCommands.get(client.id);
			if (cmds.length == 0) {
				return;
			}
			logger.logger.debug(
				`bridge.sendCommands() ~ sending commands to clientId ${client.id}: ${cmds}`,
			);
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

export default bridge;
