import { createClient } from 'redis';
import config from 'config';

export const sessionsClient = createClient({
	url: config.get('redis.sessions-db.url'),
});
sessionsClient.on('error', (err) => console.log('Redis Client Error', err));
