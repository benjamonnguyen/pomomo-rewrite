import config from 'config';
import { ESessionState } from 'pomomo-common/src/model/session';
import { EmbedBuilder, Colors, ActionRowBuilder, bold, } from 'discord.js';
import { getFarewell, getGreeting } from './user-message';
import { pauseResumeBtn } from '../loadable/buttons/pause-resume-button';
import { endBtn } from '../loadable/buttons/end-button';
import { skipBtn } from '../loadable/buttons/skip-button';
import discordClient from '../bot';
import sessionRepo from '../db/session-repo';
import { focusBtn } from '../loadable/buttons/focus-button';
const RESOLUTION_M = config.get('session.resolutionM');
// #region EMBEDS
const timerStatusEmbed = (s) => {
    const timeRemaining = s.premium
        ? s.timer.getTimeRemainingAsString()
        : s.timer.getTimeRemainingAsString(RESOLUTION_M);
    return new EmbedBuilder()
        .setTitle('Timer')
        .setColor(Colors.DarkGreen)
        .setDescription(timeRemaining);
};
const sessionSettingsEmbed = (s) => {
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
const primaryActionRow = (s) => {
    return new ActionRowBuilder().setComponents(pauseResumeBtn(s), skipBtn(), endBtn());
};
const secondaryActionRow = () => {
    return new ActionRowBuilder().setComponents(focusBtn());
};
export const send = async (s, channel) => {
    return channel.send({
        content: getGreeting(),
        embeds: [sessionSettingsEmbed(s), timerStatusEmbed(s)],
        components: [
            primaryActionRow(s),
            // secondaryActionRow(),
        ],
    });
};
export const update = async (s) => {
    let msg;
    try {
        msg = await discordClient.fetchMessage(s.guildId, s.channelId, s.timerMsgId);
    }
    catch (e) {
        console.error('session-message.update() can\'t find timerMsg', e);
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
export const editEnd = async (s) => {
    let msg;
    try {
        msg = await discordClient.fetchMessage(s.guildId, s.channelId, s.timerMsgId);
    }
    catch (e) {
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
//# sourceMappingURL=session-message.js.map