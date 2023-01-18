import sessionRepo from '../../db/session-repo';
import { update } from '../../message/session-message';
async function handle(command) {
    console.debug('update-timer.handle() ~', command.payload);
    try {
        const session = await sessionRepo.get(command.targetGuildId, command.payload.channelId);
        if (session.timer.isRunning) {
            await update(session);
        }
    }
    catch (e) {
        return Promise.reject(e);
    }
}
export default handle;
//# sourceMappingURL=update-timer-handler.js.map