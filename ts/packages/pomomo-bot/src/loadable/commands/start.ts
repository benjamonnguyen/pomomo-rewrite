import config from 'config';
import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	AnyThreadChannel,
	ChannelType,
	VoiceChannel,
} from 'discord.js';
import { Session } from 'pomomo-common/src/model/session';
import { SessionSettingsBuilder } from 'pomomo-common/src/model/settings/session-settings';
import { SessionConflictError } from 'pomomo-common/src/db/session-repo';
import sessionRepo from '../../db/session-repo';
import { send } from '../../message/session-message';
import { joinVoiceChannel } from '@discordjs/voice';
import { playStartResource } from '../../voice/audio-player';

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
	)
	.addStringOption((opt) =>
		opt
			.setName(EOption.NAME)
			.setDescription('Optional name for the study room'),
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
		eMsg = 'Error occurred while starting session...';
	}

	return eMsg;
};

const _createVoiceChannel = async (
	interaction: CommandInteraction,
	name: string,
): Promise<VoiceChannel> => {
	const channel = await interaction.guild.channels.create({
		name: name,
		type: ChannelType.GuildVoice,
	});
	console.debug('start._createVoiceChannel() ~', channel.id);

	return channel;
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

	const initialMsg = await interaction.reply({
		content: 'Starting session!',
		fetchReply: true,
	});

	const nameOpt = interaction.options.get(EOption.NAME);
	const name = nameOpt
		? (nameOpt.value as string)
		: `study room #${sessionCount}`;

	let session: Session;
	let voiceChannel: VoiceChannel;
	let thread: AnyThreadChannel;
	try {
		session = await _createSession(interaction);
		session.initialMsgId = initialMsg.id;

		voiceChannel = await _createVoiceChannel(interaction, name);
		session.voiceId = voiceChannel.id;
		const member = interaction.member as GuildMember;
		member.voice.member.voice
			.setChannel(voiceChannel)
			.catch((e) => console.error('start.execute() ~', e));

		thread = await initialMsg.startThread({ name: name });
		thread.members.add(member).catch(console.error);
		session.threadId = thread.id;

		const timerMsg = await send(session, thread);
		timerMsg.pin().catch(console.error);
		session.timerMsgId = timerMsg.id;
		await sessionRepo
			.set(session)
			.then(() => sessionRepo.incSessionCount(session.guildId, 1));
		await interaction.editReply(`Session started in <#${session.voiceId}>`);
	} catch (e) {
		console.error(e);
		// rollback
		const promises = [];
		promises.push(
			interaction.editReply({
				content: _getErrorMessage(e as Error),
			}),
		);
		if (voiceChannel) {
			promises.push(voiceChannel.delete());
		}
		if (session) {
			promises.push(sessionRepo.delete(session.id));
		}
		if (thread) {
			promises.push(thread.delete());
		}
		Promise.allSettled(promises);
	}

	const conn = joinVoiceChannel({
		channelId: session.voiceId,
		guildId: session.guildId,
		adapterCreator: interaction.guild.voiceAdapterCreator,
	});
	playStartResource([conn]).catch(console.error);
};
