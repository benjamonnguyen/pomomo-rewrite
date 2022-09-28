import config from 'config';
import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	ThreadAutoArchiveDuration,
	AnyThreadChannel,
} from 'discord.js';
import { SessionSettingsBuilder } from '../../model/setting/SessionSettings';
import {
	sessionsClient,
	buildSessionKey,
	SessionConflictError,
	setSession,
} from '../../db/sessions-client';
import { Session } from '../../model/session/Session';
import { send } from '../../message/session-message';

enum EOption {
	POMODORO = 'pomodoro',
	SHORT_BREAK = 'short_break',
	LONG_BREAK = 'long_break',
	INTERVALS = 'intervals',
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
	if (interaction.channel.isThread()) {
		return 'Command cannot be sent from a thread';
	}

	if (!(interaction.member as GuildMember).voice.channelId) {
		return 'Must be in a voice channel to start a session';
	}

	return null;
};

const _createSession = async (
	interaction: CommandInteraction,
	thread: AnyThreadChannel,
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

	const member = interaction.member as GuildMember;

	const session = Session.init(
		settings,
		interaction.guildId,
		thread.id,
		member.voice.channelId,
	);

	const msg = await send(session, thread);
	session.messageId = msg.id;

	// Persist session
	const key = buildSessionKey(session.guildId, session.channelId);
	if ((await sessionsClient.exists(key)) === 1) {
		throw new SessionConflictError(key);
	}
	await setSession(session);
	console.info('start._createSession() ~ Persisted', key);

	return session;
};

const _getErrorMessage = (e: Error): string => {
	let eMsg: string;
	if (e instanceof SessionConflictError) {
		eMsg = e.userMessage;
	} else {
		// TODO better error msg
		eMsg = 'Error occurred while starting session...';
	}

	return eMsg;
};

export const execute = async (interaction: CommandInteraction) => {
	const errorMsg = await _validate(interaction);
	if (errorMsg) {
		interaction.reply(errorMsg);
		return;
	}

	const startMsg = await interaction.reply({
		content: 'Starting session!',
		fetchReply: true,
	});
	const thread = await startMsg.startThread({
		name: `${
			(interaction.member as GuildMember).voice.channel.name
		} voice channel`,
		autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
	});
	try {
		await _createSession(interaction, thread);
		console.debug(
			'messageCache size: ' + interaction.channel.messages.cache.size,
		);
	} catch (e) {
		console.error(e);
		thread.delete();
		interaction.editReply({
			content: _getErrorMessage(e as Error),
		});
	}
};
