import { ErrorCode } from 'pomomo-common/src/discord/error';
import { DiscordAPIError, EmbedBuilder, Interaction } from 'discord.js';
import { buildErrorEmbed } from '../../message/error-message';

export async function handleInteractionError(
	interaction: Interaction,
	e: Error,
) {
	try {
		if (e instanceof DiscordAPIError) {
			if (e.status === 403) {
				if (e.code === ErrorCode.MISSING_ACCESS) {
					return await _reply(
						interaction,
						'Grant Pomomo access to the private channel and try again!',
					);
				}
				return await _reply(interaction, 'Pomomo is missing permissions!');
			}
		}

		return await _reply(interaction, null);
	} catch (e) {
		console.error('error-handler.handleInteractionError() error', e);
	}
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
		});
	}
}
