import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import * as focusMemberRepo from '../../db/focus-member-repo';
import { buildErrorEmbed } from '../../message/error-message';
import { buildFocusMessage } from '../../message/focus-message';
import { handleAutoshush } from '../../autoshush';
import sessionRepo from '../../db/session-repo';
import discordClient from '../../bot';

export const BUTTON_ID = 'toggleDeafenBtn';

export const toggleDeafenBtn = (deafen: boolean) => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Primary)
		.setLabel('Deafen: ' + (deafen ? 'on' : 'off'));
};

export const execute = async (interaction: ButtonInteraction) => {
	console.debug(BUTTON_ID);

	const focusMember = await focusMemberRepo.get(interaction.user.id);
	if (!focusMember) {
		interaction.reply({ embeds: [buildErrorEmbed()], ephemeral: true });
		return;
	}

	const guild = await discordClient.guilds.fetch(focusMember.guildId);
	const session = await sessionRepo.get(guild.id, focusMember.channelId);
	const deafen = await focusMemberRepo.toggleDeafen(interaction.user.id);
	try {
		await Promise.all([
			handleAutoshush(session, guild.members, new Set([interaction.user.id])),
			,
			interaction.message.edit(
				buildFocusMessage(focusMember.channelName, deafen),
			),
		]);
	} catch (e) {
		console.error(BUTTON_ID, e);
		await interaction.reply({ content: 'Try re-activating focus mode!' });
		return;
	}
	await interaction.deferUpdate();
};
