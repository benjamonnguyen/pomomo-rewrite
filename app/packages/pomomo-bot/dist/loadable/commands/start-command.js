import config from 'config';
import { SlashCommandBuilder, channelMention, } from 'discord.js';
import { Session } from 'pomomo-common/src/model/session';
import { SessionSettingsBuilder } from 'pomomo-common/src/model/settings/session-settings';
import { buildSessionKey } from 'pomomo-common/src/db/session-repo';
import sessionRepo from '../../db/session-repo';
import { send } from '../../message/session-message';
import { joinVoiceChannel } from '@discordjs/voice';
import { playForState } from '../../voice/audio-player';
const MAX_SESSION_COUNT = config.get('session.maxCount');
var EOption;
(function (EOption) {
    EOption["POMODORO"] = "pomodoro";
    EOption["SHORT_BREAK"] = "short_break";
    EOption["LONG_BREAK"] = "long_break";
    EOption["INTERVALS"] = "intervals";
})(EOption || (EOption = {}));
export const command = new SlashCommandBuilder()
    .setName('start')
    .setDescription('Start a Pomodoro session!')
    .addIntegerOption((opt) => opt
    .setName(EOption.POMODORO)
    .setDescription(`Default: ${config.get('command.start.pomodoro.default')}`)
    .setMinValue(1)
    .setMaxValue(config.get('command.start.max')))
    .addIntegerOption((opt) => opt
    .setName(EOption.SHORT_BREAK)
    .setDescription(`Default: ${config.get('command.start.shortBreak.default')}`)
    .setMinValue(1)
    .setMaxValue(config.get('command.start.max')))
    .addIntegerOption((opt) => opt
    .setName(EOption.LONG_BREAK)
    .setDescription(`Default: ${config.get('command.start.longBreak.default')}`)
    .setMinValue(1)
    .setMaxValue(config.get('command.start.max')))
    .addIntegerOption((opt) => opt
    .setName(EOption.INTERVALS)
    .setDescription(`Default: ${config.get('command.start.intervals.default')}`)
    .setMinValue(1)
    .setMaxValue(config.get('command.start.max')));
const _validate = async (interaction) => {
    if (!interaction.inGuild()) {
        return 'Command must be sent from a server channel';
    }
    const voiceChannelId = interaction.member.voice.channelId;
    if (!voiceChannelId) {
        return 'Must be in a voice channel to start a session';
    }
    if (await sessionRepo.client.exists([
        buildSessionKey(interaction.guildId, voiceChannelId),
    ])) {
        return `There is already a session running in ${channelMention(voiceChannelId)}`;
    }
    // TODO premium check? guild#123123:{ premium: bool } with ttl
    const sessionCount = await sessionRepo.getSessionCount(interaction.guildId);
    if (sessionCount >= MAX_SESSION_COUNT) {
        return `This server can have a max of ${MAX_SESSION_COUNT} sessions`;
    }
};
const _createSession = async (interaction) => {
    const pomodoro = interaction.options.get(EOption.POMODORO);
    const shortBreak = interaction.options.get(EOption.SHORT_BREAK);
    const longBreak = interaction.options.get(EOption.LONG_BREAK);
    const intervals = interaction.options.get(EOption.INTERVALS);
    const settings = new SessionSettingsBuilder()
        .intervalSettings(!pomodoro ? null : pomodoro.value, !shortBreak ? null : shortBreak.value, !longBreak ? null : longBreak.value, !intervals ? null : intervals.value)
        .build();
    return Session.init(settings, interaction.guildId);
};
const _rollback = (session, timerMsg) => {
    const promises = [];
    if (session) {
        promises.push(sessionRepo.delete(session.id));
    }
    if (timerMsg) {
        promises.push(timerMsg.delete());
    }
    Promise.all(promises).catch(console.error);
};
export const execute = async (interaction) => {
    const errorMsg = await _validate(interaction);
    if (errorMsg) {
        await interaction.reply(errorMsg);
        return;
    }
    await interaction.reply({
        content: 'Starting session!',
    });
    let session;
    let timerMsg;
    try {
        session = await _createSession(interaction);
        const member = interaction.member;
        session.channelId = member.voice.channelId;
        timerMsg = await send(session, member.voice.channel);
        session.timerMsgId = timerMsg.id;
        await sessionRepo.insert(session, interaction.guild);
        interaction
            .editReply(`Session started in ${channelMention(session.channelId)}.\nFurther messages will be sent in that channel's chat.`)
            .catch(console.error);
    }
    catch (e) {
        _rollback(session, timerMsg);
        throw e;
    }
    const conn = joinVoiceChannel({
        channelId: session.channelId,
        guildId: session.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });
    playForState(session.state, conn).catch(console.error);
};
//# sourceMappingURL=start-command.js.map