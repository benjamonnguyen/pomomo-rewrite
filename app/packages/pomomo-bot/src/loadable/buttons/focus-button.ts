import {
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	GuildMember,
	Message,
} from 'discord.js';
import * as focusMemberRepo from '../../db/focus-member-repo';
import { buildFocusMessage } from '../../message/focus-message';
import { handleAutoshush } from '../../autoshush';
import sessionRepo from '../../db/session-repo';

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

	let focusMember = await focusMemberRepo.get(interaction.user.id);
	if (!focusMember) {
		focusMember = {
			messageId: msg.id,
			deafen: false,
			guildId: interaction.guildId,
			channelId: interaction.channelId,
			channelName: interaction.channel.name,
		};
		if (member.voice.serverDeaf) {
			focusMember.serverDeaf = true;
		}
		if (member.voice.serverMute) {
			focusMember.serverMute = true;
		}
		await Promise.all([
			focusMemberRepo.add(
				focusMember.guildId,
				focusMember.channelId,
				interaction.user.id,
			),
			focusMemberRepo.set(interaction.user.id, focusMember),
		]);
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
		await focusMemberRepo.remove(
			focusMember.guildId,
			focusMember.channelId,
			interaction.user.id,
		);
		focusMember.channelId = interaction.channelId;
		focusMember.guildId = interaction.guildId;
		focusMember.messageId = msg.id;
		focusMember.channelName = interaction.channel.name;
		await Promise.all([
			focusMemberRepo.add(
				focusMember.guildId,
				focusMember.channelId,
				interaction.user.id,
			),
			focusMemberRepo.set(interaction.user.id, focusMember),
		]);
	}
	await Promise.allSettled([
		interaction.reply({
			content: 'You can manage your focus settings in my DM!',
			ephemeral: true,
		}),
		sessionRepo
			.get(interaction.guildId, interaction.channelId)
			.then((session) =>
				handleAutoshush(
					session,
					interaction.guild.members,
					new Set([interaction.user.id]),
				),
			),
	]);
};
