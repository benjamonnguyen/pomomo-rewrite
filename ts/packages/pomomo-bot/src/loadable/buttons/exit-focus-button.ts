import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import * as focusMemberRepo from '../../db/focus-member-repo';

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
	if ((await focusMemberRepo.del(interaction.user.id)) != 1) {
		console.warn('exit-focus-button.execute() ~ not found');
	}
	interaction.message.delete();
};
