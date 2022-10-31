import sessionRepo from '../../db/session-repo';
import {
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	GuildMember,
	InteractionReplyOptions,
} from 'discord.js';
import { buildSessionInfoKey } from 'pomomo-common/src/db/session-repo';
import {
	buildFocusMemberKey,
	FocusMember,
} from 'pomomo-common/src/model/focus-member';
import { buildFocusMessage } from '../../message/focus-message';
import { instanceToPlain } from 'class-transformer';

export const BUTTON_ID = 'focusBtn';

export const focusBtn = () => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Primary)
		.setLabel('Focus');
};

export const execute = async (interaction: ButtonInteraction) => {
	const errorMsg = await _validate(interaction);
	if (errorMsg) {
		await interaction.reply({ content: errorMsg });
		return;
	}

	const member = interaction.member as GuildMember;
	const sessionInfoKey = buildSessionInfoKey(
		interaction.guildId,
		interaction.channelId,
	);
	const focusMemberKey = buildFocusMemberKey(
		interaction.guildId,
		interaction.channelId,
		interaction.user.id,
	);
	const focusMember: FocusMember = {
		serverDeaf: member.voice.serverDeaf ? true : null,
		serverMute: member.voice.serverMute ? true : null,
	};
	if (
		!(await sessionRepo.client.sIsMember(
			sessionInfoKey + 'focusMembers',
			focusMemberKey,
		))
	) {
		console.info('Adding ' + focusMemberKey);
		sessionRepo.client
			.multi()
			.sAdd(sessionInfoKey + 'focusMembers', focusMemberKey)
			.json.set(focusMemberKey, '.', instanceToPlain(focusMember))
			.exec();
	}

	const msg = buildFocusMessage(focusMember.deafen) as InteractionReplyOptions;
	msg.ephemeral = true;
	await interaction.reply(msg);
};

async function _validate(interaction: ButtonInteraction): Promise<string> {
	return null;
}
