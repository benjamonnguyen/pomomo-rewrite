import {
	ButtonBuilder,
	ButtonStyle,
	ButtonInteraction,
	TextChannel,
} from 'discord.js';
import { Session } from '../../model/session/Session';
import { getSession, setSession } from '../../db/sessions-client';
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
	const session = await getSession(interaction.guildId, interaction.channelId);
	session.timer.toggle();
	// TODO idleFlag reset
	session.idleFlag = false;
	session.lastUpdated = new Date();

	if (interaction.channel.isTextBased()) {
		const textChannel = interaction.channel as TextChannel;
		const msg = await textChannel.messages.fetch(session.messageId);
		edit(session, msg);
	}

	setSession(session);
};
