import sessionRepo from '../../db/session-repo';
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
	try {
		const session = await sessionRepo.get(
			interaction.guildId,
			interaction.channelId,
		);
		await Promise.all([editEnd(session), sessionRepo.delete(session.id)]).catch(
			(e) => console.error('end.execute()', e),
		);
	} catch (e) {
		console.error('end.execute() ~', e);
		interaction
			.reply({
				content: 'Error has occured while ending session...',
			})
			.catch(console.error);
	}
};
