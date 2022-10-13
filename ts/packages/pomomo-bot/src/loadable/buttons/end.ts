import sessionRepo from '../../db/session-repo';
import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { editEnd } from '../../message/session-message';
import { Session } from 'pomomo-common/src/model/session';

export const BUTTON_ID = 'endBtn';

export const endBtn = () => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Danger)
		.setLabel('End');
};

export const execute = async (interaction: ButtonInteraction) => {
	try {
		const session = await sessionRepo.get(
			interaction.guildId,
			interaction.channelId,
		);
		await end(session);
	} catch (e) {
		console.error('end.execute() ~', e);
		interaction
			.reply({
				content: 'Error has occured while ending session...',
			})
			.catch(console.error);
	}
};

export async function end(session: Session): Promise<void> {
	try {
		await Promise.all([editEnd(session), sessionRepo.delete(session.id)]);
	} catch (e) {
		return console.error('end.end()', e);
	}
}
