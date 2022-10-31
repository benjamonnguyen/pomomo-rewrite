import { ActionRowBuilder, BaseMessageOptions } from 'discord.js';
import { toggleDeafenBtn } from '../loadable/buttons/toggle-deafen-button';
import { exitFocusBtn } from '../loadable/buttons/exit-focus-button';

export function buildFocusMessage(deafen: boolean): BaseMessageOptions {
	return {
		content: 'Focus mode activated!',
		components: [buildActionRow(deafen)],
	} as BaseMessageOptions;
}

function buildActionRow(deafen: boolean): ActionRowBuilder {
	return new ActionRowBuilder().addComponents([
		toggleDeafenBtn(deafen),
		exitFocusBtn(),
	]);
}
