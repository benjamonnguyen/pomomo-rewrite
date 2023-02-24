import { CommandMessage } from 'pomomo-common/src/command';
import sessionRepo from '../../db/session-repo';
import { update } from '../../message/session-message';

async function handle(commands: CommandMessage[]): Promise<void> {
	// if (commands.length === 0) {
	// 	return;
	// }
	console.debug(`update-timer.handle() - ${commands.length} cmds`);
	for (const command of commands) {
		try {
			const session = await sessionRepo.get(
				command.targetGuildId,
				command.payload.channelId,
			);
			if (session.timer.isRunning) {
				await update(session);
			}
		} catch (e) {
			return Promise.reject(e);
		}
	}
}

export default handle;
