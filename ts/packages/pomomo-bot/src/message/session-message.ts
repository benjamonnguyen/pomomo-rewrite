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
import { pauseResumeBtn } from '../loadable/buttons/pause-resume';
import { endBtn } from '../loadable/buttons/end';
import discordClient from '../bot';

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
		.setDescription(
			`${pomodoro}\n${shortBreak}\n${longBreak}\nIntervals: ${intervalSettings.intervals}`,
		);
};

// const sessionStatsEmbed = (s: Session) => {
// 	return new EmbedBuilder()
// 		.setTitle('Session Stats')
// 		.setColor(Colors.Blue)
// 		.setDescription('TODO');
// };
// #endregion

// TODO join/autoshush opt-in buttons + db integration

const buttonsActionRow = (s: Session) => {
	return new ActionRowBuilder().setComponents(
		pauseResumeBtn(s),
		endBtn(),
	) as unknown as ActionRow<MessageActionRowComponent>;
};

export const send = async (s: Session, channel: TextBasedChannel) => {
	console.debug('session-message.send() ~ channelId', channel.id);
	return channel.send({
		content: getGreeting(),
		embeds: [sessionSettingsEmbed(s), timerStatusEmbed(s)],
		components: [buttonsActionRow(s)],
	});
};

export const update = async (s: Session) => {
	console.debug('session-message.update() ~', s.id);

	return (await discordClient.fetchTimerMsg(s))
		.edit({
			embeds: [sessionSettingsEmbed(s), timerStatusEmbed(s)],
			components: [buttonsActionRow(s)],
		})
		.catch(console.error);
};

export const editEnd = async (s: Session) => {
	const msg = await discordClient.fetchTimerMsg(s);
	const embed = timerStatusEmbed(s);
	embed.setColor(Colors.Red).setDescription('Session ended!');
	// TODO stat msg in intialMsg
	return msg.edit({
		// TODO user-message.endMessage
		content: getFarewell(),
		// TODO sessionStatsEmbed
		embeds: [embed],
		components: [],
	});
};

// TODO build(): MessageOptions
