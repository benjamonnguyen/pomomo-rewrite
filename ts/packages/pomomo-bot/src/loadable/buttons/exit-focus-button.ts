import sessionRepo from '../../db/session-repo';
import {
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
} from 'discord.js';
import * as focusMemberRepo from '../../db/focus-member-repo';
import { endAutoshush } from '../../autoshush';
import discordClient from '../../bot';

export const BUTTON_ID = 'exitFocusBtn';

export const exitFocusBtn = () => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Danger)
		.setLabel('Exit');
};

export const execute = async (interaction: ButtonInteraction) => {
	console.debug(BUTTON_ID);
	await interaction.deferUpdate();
	// TODO calculate stats and display in focus session end msg
	const focusMember = await focusMemberRepo.get(interaction.user.id);
	if ((await focusMemberRepo.del(interaction.user.id)) != 1) {
		console.warn('exit-focus-button.execute() ~ not found');
	}
	await Promise.allSettled([
		endFocus(focusMember.guildId, focusMember.channelId, interaction.user.id),
		interaction.message.delete(),
	]);
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
