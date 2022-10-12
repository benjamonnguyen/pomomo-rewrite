import { CommandMessage } from 'pomomo-common/src/command';
import sessionRepo from '../../db/session-repo';
import { update } from '../../message/session-message';

async function handle(command: CommandMessage): Promise<void> {
	console.debug('update-timer.handle() ~', command.payload);

	try {
		const session = await sessionRepo.get(
			command.targetGuildId,
			command.payload.threadId,
		);
		if (
			session.timer.isRunning &&
			session.timer.calculateCurrentSecondsRemaining() > 0
		) {
			update(session);
		}
		Promise.resolve();
	} catch (e) {
		return Promise.reject(e);
	}
}

export default handle;
