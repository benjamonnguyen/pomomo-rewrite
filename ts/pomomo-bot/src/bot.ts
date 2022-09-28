import 'reflect-metadata';
import config from 'config';
import {
	Client,
	GatewayIntentBits,
	CommandInteraction,
	ClientOptions,
	Interaction,
	ButtonInteraction,
} from 'discord.js';
import crossHosting from 'discord-cross-hosting';
import Cluster from 'discord-hybrid-sharding';
import { sessionsClient } from './db/sessions-client';
import { loadCommands, loadButtons } from './loadable/loader';

export class DiscordClient extends Client {
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
}

// #region SETUP
let discordClient: DiscordClient;
console.info(`IS_CLUSTERED: ${process.env.IS_CLUSTERED}`);
const INTENTS = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates];
if (process.env.IS_CLUSTERED) {
	discordClient = new DiscordClient({
		intents: INTENTS,
		shards: Cluster.Client.getInfo().SHARD_LIST,
		shardCount: Cluster.Client.getInfo().TOTAL_SHARDS,
	});
} else {
	discordClient = new DiscordClient(
		{
			intents: INTENTS,
		},
		false,
	);
}
// discordClient.on('debug', console.debug);
discordClient.on('error', (data) =>
	console.error('discordClient error: ' + data),
);
discordClient.on('warn', (data) => console.warn('discordClient warn: ' + data));
discordClient.on('cacheSweep', (data) => console.info('cacheSweep: ' + data));
discordClient.once('ready', (client) => {
	console.info(
		'discordClient ready: ' +
			JSON.stringify(
				client,
				(k, v) =>
					new Set([
						'users',
						'guilds',
						'channels',
						'shard',
						'rest',
						'commands',
						'buttons',
						'user',
						'voice',
					]).has(k)
						? undefined
						: v,
				2,
			),
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
sessionsClient.connect();

const gracefulShutdown = () => {
	sessionsClient
		.quit()
		.then(() => console.info('sessionsClient quitted!'))
		.catch(console.error);
	try {
		discordClient.destroy();
		console.info('discordClient destroyed!');
	} catch (e) {
		console.error(e);
	}
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
// #endregion

// #region INTERACTION HANDLERS
const handleCommandInteraction = async (cmdInteraction: CommandInteraction) => {
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
		await btnInteraction.reply({
			// TODO better error message
			content: 'There was an error while executing this button interaction!',
			ephemeral: true,
		});
	}
};

discordClient.on('interactionCreate', (interaction: Interaction) => {
	if (interaction.isButton()) {
		handleButtonInteraction(interaction as ButtonInteraction);
	} else if (interaction.isCommand()) {
		handleCommandInteraction(interaction as CommandInteraction);
	}
});

// discordClient.on('voiceStateUpdate', (oldVS, newVS) => {
// TODO autoshush
// 	newVS.guild.voiceStates.cache.set(newVS.member.id, newVS);
// });
// #endregion

export {};
