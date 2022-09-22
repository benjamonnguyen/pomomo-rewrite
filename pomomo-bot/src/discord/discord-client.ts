import {
	Client,
	Collection,
	GatewayIntentBits,
	CommandInteraction,
	ClientOptions,
	Interaction,
} from 'discord.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'url';

export class DiscordClient extends Client {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	commands: Collection<
		string,
		(interaction: CommandInteraction) => Promise<void>
	>;

	constructor(options: ClientOptions) {
		super(options);
		this.commands = new Collection();
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const discordClient = new DiscordClient({
	intents: [GatewayIntentBits.Guilds],
});
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, '../commands');
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((p) => p.endsWith('.js'));

for (const file of commandFiles) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { command, execute } = await import(path.join(commandsPath, file));
	discordClient.commands.set(command.name, execute);
}

discordClient.once('ready', () => {
	console.info('discordClient ready!');
});

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

export default discordClient;
