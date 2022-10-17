import config from 'config';
import discordClient from '../../bot';
import { CommandInteraction } from 'discord.js';

const ALLOWED_GUILDS = config.get('allowedGuilds') as string;

const handle = async (cmdInteraction: CommandInteraction) => {
	if (
		!ALLOWED_GUILDS.includes('*') &&
		!ALLOWED_GUILDS.includes(cmdInteraction.guildId)
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

	await execute(cmdInteraction);
};

export default handle;
