import config from 'config';
import { Bridge, BridgeClient, BridgeOptions } from 'discord-cross-hosting';
import { CommandMessage } from '../../common/api/command';
import { shardIdForGuildId } from 'discord-hybrid-sharding';

class MyBridge extends Bridge {
	constructor(options: BridgeOptions) {
		super(options);
	}

	async sendCommands(messages: CommandMessage[]) {
		const clientIdToMessages: Map<string, CommandMessage[]> = new Map();
		this.clients.forEach((client, _) => clientIdToMessages.set(client.id, []));

		for (const msg of messages) {
			const internalShard = shardIdForGuildId(
				msg.targetGuildId,
				this.totalShards as number,
			);
			console.log(this.clients.values());
			const targetClient = Array.from(this.clients.values()).find((x) =>
				x?.shardList?.flat()?.includes(internalShard),
			);
			if (!targetClient) {
				console.error(
					'bridge.sendCommands() ~ no client found for internalShard',
					internalShard,
				);
				continue;
			}
			if (!msg.options) msg.options = {};
			msg.options.shard = internalShard;

			clientIdToMessages.get(targetClient.id).push(msg);
		}

		const promises: Promise<void>[] = [];
		this.clients.forEach((client) => {
			const msgs = clientIdToMessages.get(client.id);
			console.debug(
				`bridge.sendCommands() ~ sending ${msgs.length} commands to clientId ${client.id}`,
			);
			promises.push(client.send(msgs));
		});

		return Promise.allSettled(promises);
	}
}

const bridge = new MyBridge({
	port: config.get('bridge.port'),
	authToken: config.get('bridge.authToken'),
	totalMachines: config.get('bridge.totalMachines'),
	shardsPerCluster: config.get('bridge.shardsPerCluster'),
	token: config.get('bridge.botToken'),
});
bridge.on('debug', console.debug);
bridge.on('clientMessage', console.debug);

export default bridge;
