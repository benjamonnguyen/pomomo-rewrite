import { handleAutoshush } from '../../autoshush';
import { instanceToPlain } from 'class-transformer';
import { ButtonBuilder, ButtonStyle, ButtonInteraction } from 'discord.js';
import { Session } from 'pomomo-common/src/model/session';
import sessionRepo from '../../db/session-repo';
import { update } from '../../message/session-message';

export const BUTTON_ID = 'playPauseBtn';

export const pauseResumeBtn = (s: Session) => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(s.timer.isRunning ? ButtonStyle.Success : ButtonStyle.Secondary)
		.setLabel(s.timer.isRunning ? 'Pause' : 'Resume');
};

export const execute = async (interaction: ButtonInteraction) => {
	try {
		await interaction.deferUpdate();
		const session = await sessionRepo.get(
			interaction.guildId,
			interaction.channelId,
		);
		session.timer.toggle();
		session.lastInteracted = new Date();

		if (interaction.channel.isTextBased()) {
			update(session);
		}

		await Promise.all([
			sessionRepo.client.json.set(session.id, '.lastInteracted', new Date()),
			sessionRepo.client.json
				.set(session.id, '.timer', instanceToPlain(session.timer))
				.then(() => handleAutoshush(session, interaction.guild.members)),
		]);
	} catch (e) {
		console.error('pause-resume.execute() error', e);
	}
};
