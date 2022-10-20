import sessionRepo from '../../db/session-repo';
import {
	CommandInteraction,
	GuildMember,
	SlashCommandBuilder,
} from 'discord.js';
import { buildSessionKey } from 'pomomo-common/src/db/session-repo';
import { FocusMember } from 'pomomo-common/src/model/focus-member';

enum EOption {
	MUTE_ONLY = 'mute_only',
}

export const command = new SlashCommandBuilder()
	.setName('focus')
	.setDescription(
		'Toggle focus mode (automatically deafen/mute during pomodoro intervals)',
	)
	.addBooleanOption((opt) =>
		opt.setName(EOption.MUTE_ONLY).setDescription(`Default: false`),
	);

export const execute = async (interaction: CommandInteraction) => {
  const errorMsg = await _validate(interaction);
  if (errorMsg) {
    await interaction.reply({ content: errorMsg });
    return;
  }

  const member = interaction.member as GuildMember;
  const sessionKey = buildSessionKey(interaction.guildId, member.voice.channelId);

  const mute_only_opt = interaction.options.get('mute_only');
  const focusMember = {
    id: member.id,
    mute_only: mute_only_opt.value === true ? true : null,
    voiceState: {
      serverDeaf: member.voice.serverDeaf === true ? true : null,
      serverMute: member.voice.serverMute === true ? true : null,
    }
  };

  await sessionRepo.client.sAdd()
  // ephemeral reply
};

async function _validate(interaction: CommandInteraction): Promise<string> {
	const channelId = (interaction.member as GuildMember).voice.channelId;
	if (!channelId) {
		return 'You must be in a voice channel with an active session';
	}

	const sessionKey = buildSessionKey(interaction.guildId, channelId);
	if ((await sessionRepo.client.exists([sessionKey])) === 0) {
		return 'You must be in a voice channel with an active session';
	}

	return null;
}
