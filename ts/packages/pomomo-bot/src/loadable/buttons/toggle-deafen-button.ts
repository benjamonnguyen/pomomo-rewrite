import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';

export const BUTTON_ID = 'toggleDeafenBtn';

export const toggleDeafenBtn = (deafen: boolean) => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Primary)
		.setLabel('Deafen: ' + (deafen ? 'on' : 'off'));
};

export const execute = async (interaction: ButtonInteraction) => {
	console.log(BUTTON_ID);
};
