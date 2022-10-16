import { CommandMessage } from 'pomomo-common/src/command';
import sessionRepo from '../../db/session-repo';
import { update } from '../../message/session-message';

async function handle(command: CommandMessage): Promise<void> {
	console.debug('update-timer.handle() ~', command.payload);

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

export default handle;
