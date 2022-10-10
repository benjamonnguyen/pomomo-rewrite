import config from 'config';
import { Session } from 'pomomo-common/src/model/session';
import {
	EmbedBuilder,
	Message,
	ActionRow,
	Colors,
	MessageActionRowComponent,
	ActionRowBuilder,
	TextBasedChannel,
} from 'discord.js';
import { getFarewell, getGreeting } from './user-message';
import { pauseResumeBtn } from '../loadable/buttons/pause-resume';
import { endBtn } from '../loadable/buttons/end';
import discordClient from '../bot';
import { Manager } from 'discord-hybrid-sharding';

const RESOLUTION_M = config.get('session.refreshRateM') as number;

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
	return new EmbedBuilder().setTitle('Session Settings').setColor(Colors.Orange)
		.setDescription(`Pomodoro: ${intervalSettings.pomodoro} min
		Short break: ${intervalSettings.shortBreak} min
    Long break: ${intervalSettings.longBreak} min
    Intervals: ${intervalSettings.intervals}`);
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
