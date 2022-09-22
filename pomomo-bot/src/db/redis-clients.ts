import { createClient } from 'redis';
import config from 'config';

export const sessionsClient = createClient({
	url: config.get('redis.db.sessions.url'),
});
sessionsClient.on('error', (err) => console.log('Redis Client Error', err));
