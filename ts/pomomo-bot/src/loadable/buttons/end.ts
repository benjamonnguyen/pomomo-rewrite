import { getSession, sessionsClient } from '../../db/sessions-client';
import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { editEnd, END_BUTTON_ID } from '../../message/session-message';

export const BUTTON_ID = 'endBtn';

export const endBtn = () => {
	return new ButtonBuilder()
		.setCustomId(END_BUTTON_ID)
		.setStyle(ButtonStyle.Danger)
		.setLabel('End');
};

export const execute = async (interaction: ButtonInteraction) => {
	const session = await getSession(interaction.guildId, interaction.channelId);
	sessionsClient
		.del(session.id)
		.then(() => console.info('end.execute() ~ Deleted', session.id));
	const msg = await interaction.channel.messages.fetch(session.messageId);
	interaction.channel.messages.cache.delete(msg.id);
	editEnd(session, msg);
	interaction.reply({ content: 'See you again soon! 👋' });
};
