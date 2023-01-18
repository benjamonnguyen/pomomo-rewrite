import sessionRepo from '../../db/session-repo';
import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import * as focusMemberRepo from '../../db/focus-member-repo';
import { endAutoshush } from '../../autoshush';
import discordClient from '../../bot';
import { buildErrorEmbed } from '../../message/error-message';

export const BUTTON_ID = 'exitFocusBtn';

export const exitFocusBtn = () => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Danger)
		.setLabel('Exit');
};

export const execute = async (interaction: ButtonInteraction) => {
	console.debug(BUTTON_ID);
	// TODO calculate stats and display in focus session end msg
	try {
		const focusMember = await focusMemberRepo.get(interaction.user.id);
		await endFocus(
			focusMember.guildId,
			focusMember.channelId,
			interaction.user.id,
		);
	} catch (e) {
		console.error(BUTTON_ID, e);
		await interaction.reply({
			content: 'Try re-activating focus mode!',
			embeds: [buildErrorEmbed()],
		});
		return;
	} finally {
		Promise.allSettled([
			interaction.deferUpdate(),
			interaction.message.delete(),
		]);
	}
};

export async function endFocus(
	guildId: string,
	channelId: string,
	userId: string,
) {
	const guild = await discordClient.guilds.fetch(guildId);
	const session = await sessionRepo.get(guildId, channelId);
	await endAutoshush(session, guild.members, new Set([userId]));
}
