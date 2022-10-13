import 'reflect-metadata';
import path from 'node:path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env['NODE_CONFIG_DIR'] = path.join(__dirname, '..', '..', 'config');
import config from 'config';
import {
	Client,
	CommandInteraction,
	ClientOptions,
	Interaction,
	ButtonInteraction,
	GatewayIntentBits,
	TextBasedChannel,
} from 'discord.js';
import crossHosting from 'discord-cross-hosting';
import Cluster from 'discord-hybrid-sharding';
import { loadCommands, loadButtons } from './loadable/loader';
import handle from './handler/bridgecommand/bridge-command';
import sessionRepo from './db/session-repo';
import { Session } from 'pomomo-common/src/model/session';

export class MyDiscordClient extends Client {
	commands: Map<string, (interaction: CommandInteraction) => Promise<void>>;
	buttons: Map<string, (interaction: ButtonInteraction) => Promise<void>>;
	cluster?: Cluster.Client;
	machine?: crossHosting.Shard;

	constructor(options: ClientOptions, isClustered = true) {
		super(options);
		this.commands = new Map();
		this.buttons = new Map();
		if (isClustered) {
			this.cluster = new Cluster.Client(this);
			this.machine = new crossHosting.Shard(this.cluster);
		}
	}

	public async fetchMessage(
		guildId: string,
		channelId: string,
		messageId: string,
	) {
		try {
			const guild = await this.guilds.fetch(guildId);
			const channel = (await guild.channels.fetch(
				channelId,
			)) as TextBasedChannel;
			return channel.messages.fetch(messageId);
		} catch (e) {
			console.error('MyDiscordClient.fetchTimerMsg()', e);
			Promise.reject(e);
		}
	}

	// public async fetchInitalMsg(session: Session) {
	// 	const guild = await this.guilds.fetch(session.guildId);
	// 	const thread = (await guild.channels.fetch(
	// 		session.channelId,
	// 	)) as AnyThreadChannel;
	// 	return thread.parent.messages.fetch(session.initialMsgId);
	// }

	public toJSON(): unknown {
		return { application: this.application, options: this.options };
	}
}

// #region SETUP
let discordClient: MyDiscordClient;
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
} else {
	discordClient = new MyDiscordClient(
		{
			intents: INTENTS,
		},
		false,
	);
}
discordClient.on('error', (data) =>
	console.error('discordClient error: ' + data),
);
discordClient.on('warn', (data) => console.warn('discordClient warn: ' + data));
discordClient.on('cacheSweep', (data) => console.info('cacheSweep: ' + data));
discordClient.once('ready', (client) => {
	console.info(
		'discordClient ready: ' + JSON.stringify(client.options, null, 2),
	);
});
discordClient.on('shardReady', (data) => console.info('shardReady: ' + data));
discordClient.on('shardDisconnect', () => console.info('shardDisconnected'));
discordClient.on('shardReconnecting', (data) =>
	console.info('shardReconnecting: ' + data),
);
discordClient.on('shardResume', (data) => console.info('shardResume: ' + data));
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
	} catch (e) {
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

// TODO move to handler/
// #region INTERACTION HANDLERS
const handleCommandInteraction = async (cmdInteraction: CommandInteraction) => {
	const allowedGuilds = config.get('allowedGuilds') as string;
	if (
		!allowedGuilds.includes('*') &&
		!allowedGuilds.includes(cmdInteraction.guildId)
	) {
		cmdInteraction.reply(
			'This server does not have permission to use this bot',
		);
		return;
	}
	const execute = discordClient.commands.get(cmdInteraction.commandName);
	if (!execute) {
		console.error(
			`Error: Command not registered: ${cmdInteraction.commandName}`,
		);
		return;
	}

	try {
		await execute(cmdInteraction);
	} catch (e) {
		console.error(e);
		await cmdInteraction.reply({
			// TODO better error message
			content: 'There was an error while executing this command!',
			ephemeral: true,
		});
	}
};

const handleButtonInteraction = async (btnInteraction: ButtonInteraction) => {
	const execute = discordClient.buttons.get(btnInteraction.customId);
	if (!execute) {
		console.error(`Error: Button not registered: ${btnInteraction.customId}`);
		return;
	}

	try {
		await execute(btnInteraction);
	} catch (e) {
		console.error(e);
		btnInteraction
			.reply({
				// TODO better error message
				content: 'There was an error while executing this button interaction!',
				ephemeral: true,
			})
			.catch(console.error);
	}
};

discordClient.on('interactionCreate', (interaction: Interaction) => {
	if (interaction.isButton()) {
		handleButtonInteraction(interaction as ButtonInteraction).catch(
			console.error,
		);
	} else if (interaction.isCommand()) {
		handleCommandInteraction(interaction as CommandInteraction).catch(
			console.error,
		);
	}
});

// discordClient.on('voiceStateUpdate', (oldVS, newVS) => {
// TODO autoshush
// 	newVS.guild.voiceStates.cache.set(newVS.member.id, newVS);
// });
// #endregion

if (discordClient.cluster) {
	discordClient.cluster.on('message', (msg) => {
		if (!msg._sRequest) return;
		if (msg.commands) {
			handle(msg.commands)
				.then((e) => msg.reply({}))
				.catch((e) => msg.reply({ error: e }));
		}
	});
}

export default discordClient;
