import {
	ButtonBuilder,
	ButtonStyle,
	ButtonInteraction,
	TextChannel,
} from 'discord.js';
import { Session } from 'pomomo-common/src/model/session';
import client from '../../db/session-repo';
import { edit } from '../../message/session-message';

export const BUTTON_ID = 'playPauseBtn';

export const pauseResumeBtn = (s: Session) => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(s.timer.isRunning ? ButtonStyle.Success : ButtonStyle.Secondary)
		.setLabel(s.timer.isRunning ? 'Pause' : 'Resume');
};

export const execute = async (interaction: ButtonInteraction) => {
	interaction.deferUpdate();
	const session = await client.get(interaction.guildId, interaction.channelId);
	session.timer.toggle();
	session.lastUpdated = new Date();

	if (interaction.channel.isTextBased()) {
		const textChannel = interaction.channel as TextChannel;
		const msg = await textChannel.messages.fetch(session.messageId);
		edit(session, msg);
	}

	await client.set(session);
};
