import {
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	GuildMember,
	Message,
} from 'discord.js';
import * as focusMemberRepo from '../../db/focus-member-repo';
import { FocusMember } from 'pomomo-common/src/model/focus-member';
import { buildFocusMessage } from '../../message/focus-message';

export const BUTTON_ID = 'focusBtn';

export const focusBtn = () => {
	return new ButtonBuilder()
		.setCustomId(BUTTON_ID)
		.setStyle(ButtonStyle.Primary)
		.setLabel('Focus');
};

export const execute = async (interaction: ButtonInteraction) => {
	const member = interaction.member as GuildMember;
	const msg = await member.send(
		buildFocusMessage(interaction.channel.name, false),
	);
	interaction.channel.messages.cache.set(
		msg.id,
		msg as unknown as Message<true>,
	);

	const focusMember = await focusMemberRepo.get(interaction.user.id);
	if (!focusMember) {
		const focusMember: FocusMember = {
			messageId: msg.id,
			deafen: false,
			channelName: interaction.channel.name,
		};
		if (member.voice.serverDeaf) {
			focusMember.serverDeaf = true;
		}
		if (member.voice.serverMute) {
			focusMember.serverMute = true;
		}
		await focusMemberRepo.set(interaction.user.id, focusMember);
	} else {
		try {
			const oldMsg = interaction.channel.messages.cache.get(
				focusMember.messageId,
			);
			if (oldMsg) {
				await oldMsg.delete();
			}
			interaction.channel.messages.cache.delete(focusMember.messageId);
		} catch (e) {
			console.warn('focus-button.execute() ~ error while deleting oldMsg', e);
		}
		focusMember.messageId = msg.id;
		focusMember.channelName = interaction.channel.name;
		await focusMemberRepo.set(interaction.user.id, focusMember);
	}
	interaction.reply({
		content: 'You can manage your focus settings in my DM!',
		ephemeral: true,
	});
};
