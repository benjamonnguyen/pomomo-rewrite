import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import * as focusMemberRepo from '../../db/focus-member-repo';
import { buildErrorEmbed } from '../../message/error-message';
import { buildFocusMessage } from '../../message/focus-message';

export const BUTTON_ID = 'toggleDeafenBtn';

export const toggleDeafenBtn = (deafen: boolean) => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Primary)
		.setLabel('Deafen: ' + (deafen ? 'on' : 'off'));
};

export const execute = async (interaction: ButtonInteraction) => {
  console.debug(BUTTON_ID);
  await interaction.deferUpdate();

	const focusMember = await focusMemberRepo.get(interaction.user.id);
	if (!focusMember) {
		interaction.reply({ embeds: [buildErrorEmbed()], ephemeral: true });
		return;
	}

	const deafen = await focusMemberRepo.toggleDeafen(interaction.user.id);
	await interaction.message.edit(buildFocusMessage(focusMember.channelName, deafen));
};
