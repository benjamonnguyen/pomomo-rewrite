import { createClient } from 'redis';
import config from 'config';

export const sessionsClient = createClient({
	url: config.get('redis.db.sessions.url'),
});
sessionsClient.on('error', console.error);
sessionsClient.on('debug', console.debug);
