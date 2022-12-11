import config from 'config';
import { ESessionState, Session } from 'pomomo-common/src/model/session';
import {
	EmbedBuilder,
	ActionRow,
	Colors,
	MessageActionRowComponent,
	ActionRowBuilder,
	TextBasedChannel,
	bold,
} from 'discord.js';
import { getFarewell, getGreeting } from './user-message';
import { pauseResumeBtn } from '../loadable/buttons/pause-resume-button';
import { endBtn } from '../loadable/buttons/end-button';
import { skipBtn } from '../loadable/buttons/skip-button';
import discordClient from '../bot';
import sessionRepo from '../db/session-repo';
import { focusBtn } from '../loadable/buttons/focus-button';

const RESOLUTION_M = config.get('session.resolutionM') as number;

// #region EMBEDS
const timerStatusEmbed = (s: Session) => {
	const timeRemaining = s.premium
		? s.timer.getTimeRemainingAsString()
		: s.timer.getTimeRemainingAsString(RESOLUTION_M);
	return new EmbedBuilder()
		.setTitle('Timer')
		.setColor(Colors.DarkGreen)
		.setDescription(timeRemaining);
};

const sessionSettingsEmbed = (s: Session) => {
	const intervalSettings = s.settings.intervalSettings;
	let pomodoro = `Pomodoro: ${intervalSettings.pomodoro} min`;
	let shortBreak = `Short break: ${intervalSettings.shortBreak} min`;
	let longBreak = `Long break: ${intervalSettings.longBreak} min`;
	const intervals = `Interval: ${s.interval} | ${intervalSettings.intervals}`;

	switch (s.state) {
		case ESessionState.POMODORO:
			pomodoro = bold(pomodoro);
			break;
		case ESessionState.SHORT_BREAK:
			shortBreak = bold(shortBreak);
			break;
		case ESessionState.LONG_BREAK:
			longBreak = bold(longBreak);
			break;
	}
	return new EmbedBuilder()
		.setTitle('Session Settings')
		.setColor(Colors.Orange)
		.setDescription(`${pomodoro}\n${shortBreak}\n${longBreak}\n${intervals}`);
};

// const sessionStatsEmbed = (s: Session) => {
// 	return new EmbedBuilder()
// 		.setTitle('Session Stats')
// 		.setColor(Colors.Blue)
// 		.setDescription('TODO');
// };
// #endregion

// TODO join/autoshush opt-in buttons + db integration

const primaryActionRow = (s: Session) => {
	return new ActionRowBuilder().setComponents(
		pauseResumeBtn(s),
		skipBtn(),
		endBtn(),
	) as unknown as ActionRow<MessageActionRowComponent>;
};

const secondaryActionRow = () => {
	return new ActionRowBuilder().setComponents(
		focusBtn(),
	) as unknown as ActionRow<MessageActionRowComponent>;
};

export const send = async (s: Session, channel: TextBasedChannel) => {
	return channel.send({
		content: getGreeting(),
		embeds: [sessionSettingsEmbed(s), timerStatusEmbed(s)],
		components: [
			primaryActionRow(s),
			// secondaryActionRow(),
		],
	});
};

export const update = async (s: Session) => {
	console.debug('session-message.update() ~', s.id);

	let msg;
	try {
		msg = await discordClient.fetchMessage(
			s.guildId,
			s.channelId,
			s.timerMsgId,
		);
	} catch (e) {
		console.error("session-message.update() can't find timerMsg", e);
		sessionRepo.delete(s.id).catch(console.error);
	}

	sessionRepo.client.json
		.set(s.id, '.lastUpdated', new Date())
		.catch((e) => console.error('session-message.update() error', e));

	if (msg) {
		msg
			.edit({
				embeds: [sessionSettingsEmbed(s), timerStatusEmbed(s)],
				components: [primaryActionRow(s), secondaryActionRow()],
			})
			.catch(console.error);
	}
};

export const editEnd = async (s: Session) => {
	let msg;
	try {
		msg = await discordClient.fetchMessage(
			s.guildId,
			s.channelId,
			s.timerMsgId,
		);
	} catch (e) {
		console.error(e);
		sessionRepo.delete(s.id).catch(console.error);
	}

	if (msg) {
		const embed = new EmbedBuilder()
			.setTitle('Timer')
			.setColor(Colors.Red)
			.setDescription('Session ended!');
		// TODO stat msg in intialMsg
		msg
			.edit({
				// TODO user-message.endMessage
				content: getFarewell(),
				// TODO sessionStatsEmbed
				embeds: [embed],
				components: [],
			})
			.catch(console.error);
	}
};

// TODO build(): MessageOptions
