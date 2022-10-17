import config from 'config';
import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	channelMention,
	TextBasedChannel,
} from 'discord.js';
import { Session } from 'pomomo-common/src/model/session';
import { SessionSettingsBuilder } from 'pomomo-common/src/model/settings/session-settings';
import {
	buildSessionKey,
	SessionConflictError,
} from 'pomomo-common/src/db/session-repo';
import sessionRepo from '../../db/session-repo';
import { send } from '../../message/session-message';
import { joinVoiceChannel } from '@discordjs/voice';
import { playForState } from '../../voice/audio-player';

const MAX_SESSION_COUNT = config.get('session.maxCount') as number;

enum EOption {
	POMODORO = 'pomodoro',
	SHORT_BREAK = 'short_break',
	LONG_BREAK = 'long_break',
	INTERVALS = 'intervals',
	NAME = 'name',
}

export const command = new SlashCommandBuilder()
	.setName('start')
	.setDescription('Start a Pomodoro session!')
	.addIntegerOption((opt) =>
		opt
			.setName(EOption.POMODORO)
			.setDescription(
				`Default: ${config.get('command.start.pomodoro.default')}`,
			)
			.setMinValue(1)
			.setMaxValue(config.get('command.start.max')),
	)
	.addIntegerOption((opt) =>
		opt
			.setName(EOption.SHORT_BREAK)
			.setDescription(
				`Default: ${config.get('command.start.shortBreak.default')}`,
			)
			.setMinValue(1)
			.setMaxValue(config.get('command.start.max')),
	)
	.addIntegerOption((opt) =>
		opt
			.setName(EOption.LONG_BREAK)
			.setDescription(
				`Default: ${config.get('command.start.longBreak.default')}`,
			)
			.setMinValue(1)
			.setMaxValue(config.get('command.start.max')),
	)
	.addIntegerOption((opt) =>
		opt
			.setName(EOption.INTERVALS)
			.setDescription(
				`Default: ${config.get('command.start.intervals.default')}`,
			)
			.setMinValue(1)
			.setMaxValue(config.get('command.start.max')),
	);

const _validate = async (interaction: CommandInteraction): Promise<string> => {
	if (!interaction.inGuild()) {
		return 'Command must be sent from a server channel';
	}

	const voiceChannelId = (interaction.member as GuildMember).voice.channelId;
	if (!voiceChannelId) {
		return 'Must be in a voice channel to start a session';
	}

	if (
		await sessionRepo.client.exists([
			buildSessionKey(interaction.guildId, voiceChannelId),
		])
	) {
		return `There is already a session running in ${channelMention(
			voiceChannelId,
		)}`;
	}

	return null;
};

const _createSession = async (
	interaction: CommandInteraction,
): Promise<Session> => {
	const pomodoro = interaction.options.get(EOption.POMODORO);
	const shortBreak = interaction.options.get(EOption.SHORT_BREAK);
	const longBreak = interaction.options.get(EOption.LONG_BREAK);
	const intervals = interaction.options.get(EOption.INTERVALS);
	const settings = new SessionSettingsBuilder()
		.intervalSettings(
			!pomodoro ? null : (pomodoro.value as number),
			!shortBreak ? null : (shortBreak.value as number),
			!longBreak ? null : (longBreak.value as number),
			!intervals ? null : (intervals.value as number),
		)
		.build();

	return Session.init(settings, interaction.guildId);
};

const _getErrorMessage = (e: Error): string => {
	let eMsg: string;
	if (e instanceof SessionConflictError) {
		eMsg = e.userMessage;
	} else {
		// TODO better error msg
		eMsg = 'Something went wrong while starting your session...';
	}

	return eMsg;
};

export const execute = async (interaction: CommandInteraction) => {
	const errorMsg = await _validate(interaction);
	if (errorMsg) {
		interaction.reply(errorMsg);
		return;
	}

	// TODO premium check?

	const sessionCount = await sessionRepo.getSessionCount(interaction.guildId);
	if (sessionCount >= MAX_SESSION_COUNT) {
		interaction.reply(
			`This server can have a max of ${MAX_SESSION_COUNT} sessions`,
		);
		return;
	}

	await interaction.reply({
		content: 'Starting session!',
	});

	let session: Session;
	try {
		session = await _createSession(interaction);

		const member = interaction.member as GuildMember;
		session.channelId = member.voice.channelId;

		const timerMsg = await send(
			session,
			member.voice.channel as TextBasedChannel,
		);
		// timerMsg.pin().catch(console.error);
		session.timerMsgId = timerMsg.id;
		await sessionRepo.insert(session);
		interaction
			.editReply(`Session started in ${channelMention(session.channelId)}, further updates will be sent in that channel\'s chat`)
			.catch(console.error);
	} catch (e) {
		console.error(e);
		// rollback
		const promises = [];
		promises.push(
			interaction.editReply({
				content: _getErrorMessage(e as Error),
			}),
		);
		if (session) {
			promises.push(sessionRepo.delete(session.id));
		}
		Promise.allSettled(promises);
	}

	const conn = joinVoiceChannel({
		channelId: session.channelId,
		guildId: session.guildId,
		adapterCreator: interaction.guild.voiceAdapterCreator,
	});
	playForState(session.state, [conn]).catch(console.error);
};
