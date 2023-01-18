import config from 'config';
import { SessionRepository } from 'pomomo-common/src/db/session-repo';
const sessionRepo = new SessionRepository(config.get('redis.db.sessions.url'));
export default sessionRepo;
//# sourceMappingURL=session-repo.js.map