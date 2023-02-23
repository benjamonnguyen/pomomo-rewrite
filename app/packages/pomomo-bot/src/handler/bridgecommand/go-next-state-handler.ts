import { CommandMessage } from 'pomomo-common/src/command';
import { playForState } from '../../voice/audio-player';
import sessionRepo from '../../db/session-repo';
import { update } from '../../message/session-message';
import { joinVoiceChannel } from '@discordjs/voice';
import discordClient from '../../bot';
import { handleError } from '../../logger';

async function handle(commands: CommandMessage[]): Promise<void> {
	if (commands.length === 0) {
		return;
	}

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

		let conn;
		try {
			conn = joinVoiceChannel({
				channelId: session.channelId,
				guildId: session.guildId,
				adapterCreator: guild.voiceAdapterCreator,
			});
			await playForState(session.state, conn);
		} catch (e) {
			console.error('go-next-state-handler error:', e);
			const channel = await guild.channels.fetch(session.channelId);
			if (channel && channel.isTextBased()) {
				await channel.send(`Starting ${session.state}!`);
			}
			return;
		}
	}
}

export default handle;
