import sessionRepo from '../../db/session-repo';
import {
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	GuildMemberManager,
} from 'discord.js';
import { update } from '../../message/session-message';
import { Session } from 'pomomo-common/src/model/session';
import { handleAutoshush } from '../../autoshush';

export const BUTTON_ID = 'skipBtn';

export const skipBtn = () => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Primary)
		.setLabel('Skip');
};

export const execute = async (interaction: ButtonInteraction) => {
	try {
		await interaction.deferUpdate();
		const session = await sessionRepo.get(
			interaction.guildId,
			interaction.channelId,
		);
		await skip(session, interaction.guild.members);
	} catch (e) {
		console.error('skip.execute() ~', e);
		interaction
			.reply({
				content: 'Something went wrong while skipping interval...',
			})
			.catch(console.error);
	}
};

export async function skip(
	session: Session,
	memberManager: GuildMemberManager,
): Promise<void> {
	session.goNextState(true);
	const res = await Promise.allSettled([
		sessionRepo.set(session),
		update(session),
		handleAutoshush(session, memberManager),
	]);
	res.forEach((r) => {
		if (r.status === 'rejected') {
			console.error('skip-button.skip() - error', r.reason);
		}
	});
}
