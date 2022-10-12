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
		editEnd(session).catch(console.error);
		sessionRepo.delete(session.id).catch(console.error);
		setTimeout(async () => {
			interaction.channel.delete().catch(console.error);
			const channel = await interaction.guild.channels.fetch(session.voiceId);
			channel.delete().catch(console.error);
		}, 2000);
		interaction
			.reply({
				content: 'This channel will be deleted in a few seconds...',
			})
			.catch(console.error);
	} catch (e) {
		console.error('end.execute() ~', e);
		interaction
			.reply({
				content: 'Error has occured while ending session...',
			})
			.catch(console.error);
	}
};
