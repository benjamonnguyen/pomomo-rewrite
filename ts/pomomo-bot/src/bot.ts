import 'reflect-metadata';
import config from 'config';
import {
	Client,
	CommandInteraction,
	ClientOptions,
	Interaction,
	ButtonInteraction,
	GatewayIntentBits,
} from 'discord.js';
import crossHosting from 'discord-cross-hosting';
import Cluster from 'discord-hybrid-sharding';
import { sessionsClient } from './db/sessions-client';
import { loadCommands, loadButtons } from './loadable/loader';
import handle from './handler/command';

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

	public toJSON(): unknown {
		return { application: this.application, options: this.options };
	}
}

// #region SETUP
let discordClient: MyDiscordClient;
const INTENTS = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates];
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
// TODO can just do this in sessions-client.ts
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

discordClient.cluster.on('message', (msg) => {
	if (!msg._sRequest) return;
	if (msg.commands) {
		handle(msg.commands)
			.then((e) => msg.reply({}))
			.catch((e) => msg.reply({ error: e }));
	}
});

export {};
