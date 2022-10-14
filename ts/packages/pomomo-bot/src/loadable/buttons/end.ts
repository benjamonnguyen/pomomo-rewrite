import sessionRepo from '../../db/session-repo';
import {
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
} from 'discord.js';
import { editEnd } from '../../message/session-message';
import { Session } from 'pomomo-common/src/model/session';
import { getVoiceConnection } from '@discordjs/voice';

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
		await end(session);
	} catch (e) {
		console.error('end.execute() ~', e);
		interaction
			.reply({
				content: 'Something went wrong while ending session...',
			})
			.catch(console.error);
	}
};

export async function end(session: Session): Promise<void> {
	Promise.all([editEnd(session), sessionRepo.delete(session.id)]).catch((e) =>
		console.error('end.end()', e),
	);
	try {
		const conn = getVoiceConnection(session.guildId);
		if (conn) {
			conn.destroy();
		}
	} catch (e) {
		console.error('end.end()', e);
	}
}
