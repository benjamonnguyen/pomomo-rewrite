import 'reflect-metadata';
import config from 'config';
import {
	Client,
	Collection,
	GatewayIntentBits,
	CommandInteraction,
	ClientOptions,
	Interaction,
} from 'discord.js';
import crossHosting from 'discord-cross-hosting';
import Cluster from 'discord-hybrid-sharding';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'url';
import { sessionsClient } from './db/redis-clients';

export class DiscordClient extends Client {
	commands: Collection<
		string,
		(interaction: CommandInteraction) => Promise<void>
	>;
	cluster: Cluster.Client;
	machine: crossHosting.Shard;

	constructor(options: ClientOptions) {
		super(options);
		this.commands = new Collection();
		this.cluster = new Cluster.Client(this);
		this.machine = new crossHosting.Shard(this.cluster);
	}
}

const discordClient = new DiscordClient({
	intents: [GatewayIntentBits.Guilds],
	shards: Cluster.Client.getInfo().SHARD_LIST,
	shardCount: Cluster.Client.getInfo().TOTAL_SHARDS,
});
discordClient.on('debug', console.debug);
discordClient.on('error', console.error);
discordClient.on('warn', console.warn);

// Load up commands
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((p) => p.endsWith('.js'));
for (const file of commandFiles) {
	const { command, execute } = await import(path.join(commandsPath, file));
	discordClient.commands.set(command.name, execute);
}

discordClient.on('interactionCreate', async (interaction: Interaction) => {
	if (!interaction.isCommand) return;
	const cmdInteraction = interaction as CommandInteraction;

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
});

await discordClient.login(config.get('bot.token'));
await sessionsClient.connect();

const gracefulShutdown = () => {
	console.info('Starting graceful shutdown...');
	sessionsClient
		.disconnect()
		.then(() => console.info('sessionsClient disconnected!'))
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

export {};
