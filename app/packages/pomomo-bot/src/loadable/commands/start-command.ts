import config from 'config';
import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
	channelMention,
	TextBasedChannel,
	Message,
} from 'discord.js';
import { Session } from 'pomomo-common/src/model/session';
import { SessionSettingsBuilder } from 'pomomo-common/src/model/settings/session-settings';
import { buildSessionKey } from 'pomomo-common/src/db/session-repo';
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

	// TODO premium check? guild#123123:{ premium: bool } with ttl

	const sessionCount = await sessionRepo.getSessionCount(interaction.guildId);
	if (sessionCount >= MAX_SESSION_COUNT) {
		return `This server can have a max of ${MAX_SESSION_COUNT} sessions`;
	}
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

const _rollback = (session: Session, timerMsg: Message): void => {
	const promises = [];
	if (session) {
		promises.push(sessionRepo.delete(session.id));
	}
	if (timerMsg) {
		promises.push(timerMsg.delete());
	}
	Promise.all(promises).catch(console.error);
};

export const execute = async (interaction: CommandInteraction) => {
	const errorMsg = await _validate(interaction);
	if (errorMsg) {
		await interaction.reply(errorMsg);
		return;
	}

	await interaction.reply({
		content: 'Starting session!',
	});

	let session: Session;
	let timerMsg: Message;
	try {
		session = await _createSession(interaction);

		const member = interaction.member as GuildMember;
		session.channelId = member.voice.channelId;

		timerMsg = await send(session, member.voice.channel as TextBasedChannel);
		session.timerMsgId = timerMsg.id;
		await sessionRepo.insert(session, interaction.guild);
		interaction
			.editReply(
				`Session started in ${channelMention(
					session.channelId,
				)}.\nFurther messages will be sent in that channel's chat.`,
			)
			.catch(console.error);
	} catch (e) {
		_rollback(session, timerMsg);
		throw e;
	}

	const conn = joinVoiceChannel({
		channelId: session.channelId,
		guildId: session.guildId,
		adapterCreator: interaction.guild.voiceAdapterCreator,
	});
	conn.once('stateChange', (oldState, newState) => {
		const oldNetworking = Reflect.get(oldState, 'networking');
		const newNetworking = Reflect.get(newState, 'networking');

		const networkStateChangeHandler = (
			oldNetworkState: any,
			newNetworkState: any,
		) => {
			const newUdp = Reflect.get(newNetworkState, 'udp');
			clearInterval(newUdp?.keepAliveInterval);
		};

		oldNetworking?.off('stateChange', networkStateChangeHandler);
		newNetworking?.on('stateChange', networkStateChangeHandler);
	});
	// conn.on('stateChange', (oldState, newState) => {
	// 	if (oldState.status === VoiceConnectionStatus.Ready && newState.status === VoiceConnectionStatus.Connecting) {
	// 		conn.configureNetworking();
	// 	}
	// });
	playForState(session.state, conn).catch(console.error);
};
