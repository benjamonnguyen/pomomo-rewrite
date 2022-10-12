import { CommandMessage } from 'pomomo-common/src/command';
import { playForState } from '../../voice/audio-player';
import sessionRepo from '../../db/session-repo';
import { update } from '../../message/session-message';
import { joinVoiceChannel } from '@discordjs/voice';
import discordClient from '../../bot';

async function handle(command: CommandMessage): Promise<void> {
	console.debug('go-next-state.handle() ~', command.payload);

	const voiceAdapterCreator = (
		await discordClient.guilds.fetch(command.targetGuildId)
	).voiceAdapterCreator;

	sessionRepo
		.get(command.targetGuildId, command.payload.threadId)
		.then((session) => {
			session.goNextState();
      sessionRepo.set(session);
			update(session).catch((e) =>
				console.error('go-next-state.handle() ~', command, e),
			);

			const conn = joinVoiceChannel({
				channelId: session.voiceId,
				guildId: session.guildId,
				adapterCreator: voiceAdapterCreator,
			});
			playForState(session.state, [conn]).catch(console.error);
		})
		.catch((e) => console.error('go-next-state.handle() ~', command, e));
}

export default handle;
