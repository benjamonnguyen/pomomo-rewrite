import client from '../../db/session-repo';
import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { editEnd } from '../../message/session-message';
import { SessionNotFoundError } from 'pomomo-common/src/db/session-repo';

export const BUTTON_ID = 'endBtn';

export const endBtn = () => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Danger)
		.setLabel('End');
};

export const execute = async (interaction: ButtonInteraction) => {
	try {
		const session = await client.get(
			interaction.guildId,
			interaction.channelId,
		);
		client.delete(session.id);
		const msg = await interaction.channel.messages.fetch(session.messageId);
		interaction.channel.messages.cache.delete(msg.id);
		await editEnd(session, msg);
	} catch (e) {
		console.error('end.execute() ~', e);
	}
	interaction.reply({ content: 'See you again soon! 👋' });
};
