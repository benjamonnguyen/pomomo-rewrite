import config from 'config';
import {
	SlashCommandBuilder,
	CommandInteraction,
	GuildMember,
} from 'discord.js';
import { SessionSettingsBuilder } from '../model/setting/SessionSettings';
import { sessionsClient } from '../db/redis-clients';
import { Session, SessionConflictError } from '../model/session/Session';
import { instanceToPlain } from 'class-transformer';

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

const _validate = (interaction: CommandInteraction): string => {
	if (!interaction.guild) {
		return 'Command must be sent from a guild';
	}

	const member = interaction.member as GuildMember;
	if (!member.voice) {
		return 'Must be in a voice channel to start a session';
	}

	return null;
};

const _createAndPersistSession = async (
	interaction: CommandInteraction,
	messageId: string,
): Promise<void> => {
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

	const session = new Session(
		settings,
		messageId,
		interaction.guildId,
		interaction.channelId,
		member.id,
	);

	const sessionInDb = await sessionsClient.json.get(session.id);
	if (sessionInDb) {
		throw new SessionConflictError(session.id);
	}
	const sessionJson = instanceToPlain(session);
	await sessionsClient.json.set(session.id, '.', sessionJson);
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
	if (!interaction.isRepliable()) {
		return;
	}

	const errorMsg = _validate(interaction);
	if (errorMsg) {
		interaction.reply(errorMsg);
		return;
	}

	const msg = await interaction.reply({
		content: 'Starting session!',
		fetchReply: true,
	});
	try {
		await _createAndPersistSession(interaction, msg.id);
		await msg.pin();
	} catch (e) {
		console.error(e);
		interaction.editReply({
			content: _getErrorMessage(e),
		});
	}
};
