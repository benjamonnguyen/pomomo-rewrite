import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';

export const BUTTON_ID = 'exitFocusBtn';

export const exitFocusBtn = () => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Danger)
		.setLabel('Exit');
};

export const execute = async (interaction: ButtonInteraction) => {
	console.log(BUTTON_ID);
};
