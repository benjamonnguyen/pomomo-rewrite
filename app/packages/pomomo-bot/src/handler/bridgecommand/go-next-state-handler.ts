import { CommandMessage } from 'pomomo-common/src/command';
import { playForState } from '../../voice/audio-player';
import sessionRepo from '../../db/session-repo';
import { update } from '../../message/session-message';
import { joinVoiceChannel, VoiceConnection } from '@discordjs/voice';
import discordClient from '../../bot';
import { handleError, handleRejectedSettledResults } from '../../logger';
import { ESessionState } from 'pomomo-common/src/model/session';

async function handle(commands: CommandMessage[]): Promise<void> {
	if (commands.length === 0) {
		return;
	}

	const pomodoros: VoiceConnection[] = [];
	const shortBreaks: VoiceConnection[] = [];
	const longBreaks: VoiceConnection[] = [];

	console.debug(`go-next-state-handler - ${commands.length} cmds`);
	for (const command of commands) {
		const session = await sessionRepo.get(
			command.targetGuildId,
			command.payload.channelId,
		);
		session.goNextState();
		await sessionRepo.set(session);

		// TODO await handleAutoshush(session, guild.members);
		update(session).catch(handleError);
		const guild = await discordClient.guilds.fetch(command.targetGuildId);
		try {
			const conn = joinVoiceChannel({
				channelId: session.channelId,
				guildId: session.guildId,
				adapterCreator: guild.voiceAdapterCreator,
			});
			if (session.state === ESessionState.POMODORO) {
				pomodoros.push(conn);
			} else if (session.state === ESessionState.SHORT_BREAK) {
				shortBreaks.push(conn);
			} else if (session.state === ESessionState.LONG_BREAK) {
				longBreaks.push(conn);
			}
		} catch (e) {
			console.error('go-next-state-handler error:', e);
			// (guild.channels.cache.get(session.channelId) as TextBasedChannel).send(
			// 	`Starting ${session.state}!\nUnable to get voice connection`,
			// );
		}
	}
	Promise.allSettled([
		playForState(ESessionState.POMODORO, pomodoros),
		playForState(ESessionState.SHORT_BREAK, shortBreaks),
		playForState(ESessionState.LONG_BREAK, longBreaks),
	]).then(handleRejectedSettledResults);
}

export default handle;
