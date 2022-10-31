import sessionRepo from '../../db/session-repo';
import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { update } from '../../message/session-message';
import { Session } from 'pomomo-common/src/model/session';

export const BUTTON_ID = 'skipBtn';

export const skipBtn = () => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Primary)
		.setLabel('Skip');
};

export const execute = async (interaction: ButtonInteraction) => {
	try {
		await interaction.deferUpdate();
		const session = await sessionRepo.get(
			interaction.guildId,
			interaction.channelId,
		);
		await skip(session);
	} catch (e) {
		console.error('skip.execute() ~', e);
		interaction
			.reply({
				content: 'Something went wrong while skipping interval...',
			})
			.catch(console.error);
	}
};

export async function skip(session: Session): Promise<void> {
	session.goNextState(true);
	try {
		await Promise.all([sessionRepo.set(session), update(session)]);
	} catch (e) {
		Promise.reject(`skip.skip() error ${e}`);
	}
}