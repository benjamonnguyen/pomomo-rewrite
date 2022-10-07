import client from '../../db/session-repo';
import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { editEnd } from '../../message/session-message';

export const BUTTON_ID = 'endBtn';

export const endBtn = () => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Danger)
		.setLabel('End');
};

export const execute = async (interaction: ButtonInteraction) => {
	const session = await client.get(interaction.guildId, interaction.channelId);
	if (session) {
		client.delete(session.id);
		const msg = await interaction.channel.messages.fetch(session.messageId);
		interaction.channel.messages.cache.delete(msg.id);
		editEnd(session, msg);
	} else {
		console.error(
			`end.execute() ~ did not find session for guildId ${interaction.guildId} - channelId ${interaction.channelId}`,
		);
	}

	interaction.reply({ content: 'See you again soon! 👋' });
};
