import config from 'config';
import { ErrorCode } from 'pomomo-common/src/discord/error';
import { DiscordAPIError, Interaction } from 'discord.js';
import { buildErrorEmbed } from '../../message/error-message';

const INVITE_URL = config.get('url.invite');

export async function handleInteractionError(
	interaction: Interaction,
	e: Error,
) {
	console.warn(
		'----------\nerror-handler.handleInteractionError()',
		e,
		'\n----------',
	);
	if (e instanceof DiscordAPIError) {
		if (e.status === 403) {
			if (e.code === ErrorCode.MISSING_ACCESS) {
				return await _reply(
					interaction,
					'Pomomo is missing access!\nCheck your voice channel permission settings or grant Pomomo access if the channel is private.\n',
				);
			}
			return await _reply(
				interaction,
				`Pomomo is missing permissions!\nUse this link to re-invite: ${INVITE_URL}`,
			);
		}
		if (e.status === 404) {
			if (e.code === ErrorCode.UNKNOWN_INTERACTION) {
				return await _reply(
					interaction,
					`Pomomo is missing permissions!\nUse this link to re-invite: ${INVITE_URL}`,
				);
			}
		}
	}

	return await _reply(interaction, null);
}

async function _reply(interaction: Interaction, msgContent: string) {
	if (!interaction.isRepliable()) {
		console.debug('error-handler._reply() interaction not repliable');
		return;
	}

	if (interaction.replied) {
		await interaction.editReply({
			content: msgContent,
			embeds: [buildErrorEmbed()],
		});
	} else {
		await interaction.reply({
			content: msgContent,
			embeds: [buildErrorEmbed()],
			ephemeral: true,
		});
	}
}
