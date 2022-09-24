import { Session } from '../model/session/Session';
import {
	EmbedBuilder,
	Message,
	ActionRow,
	Colors,
	MessageActionRowComponent,
	ActionRowBuilder,
	TextBasedChannel,
} from 'discord.js';
import { getGreeting } from './user-message';
import { pauseResumeBtn } from '../loadable/buttons/pause-resume';
import { endBtn } from '../loadable/buttons/end';

export const END_BUTTON_ID = 'endBtn';

// #region EMBEDS
const timerStatusEmbed = (s: Session) => {
	return new EmbedBuilder()
		.setTitle('Timer')
		.setColor(Colors.DarkGreen)
		.setDescription(s.timer.getRemainingTime());
};

const sessionSettingsEmbed = (s: Session) => {
	const intervalSettings = s.settings.intervalSettings;
	return new EmbedBuilder()
		.setTitle('Session Settings')
		.setColor(Colors.Orange)
		.setDescription(
			`Pomodoro: ${intervalSettings.pomodoro} min
    Short break: ${intervalSettings.shortBreak} min
    Long break: ${intervalSettings.longBreak} min
    Intervals: ${intervalSettings.intervals}`,
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
	const msg = await channel.send({
		content: getGreeting(),
		embeds: [sessionSettingsEmbed(s), timerStatusEmbed(s)],
		components: [buttonsActionRow(s)],
	});
	console.debug('session-message.send():', msg.id);
	return msg;
};

export const edit = async (s: Session, msg: Message) => {
	return msg
		.edit({
			embeds: [sessionSettingsEmbed(s), timerStatusEmbed(s)],
			components: [buttonsActionRow(s)],
		})
		.then(() => console.debug('session-message.edit():', msg.id));
};

export const editEnd = async (s: Session, msg: Message) => {
	const embed = timerStatusEmbed(s);
	embed.setColor(Colors.Red).setDescription('Session ended!');
	return msg.edit({
		// TODO user-message.endMessage
		content: 'Good job!',
		// TODO sessionStatsEmbed
		embeds: [embed],
		components: [],
	});
};
