import { createClient } from 'redis';
import config from 'config';

const sessionsClient = createClient({
	url: config.get('redis.sessions-db.url'),
});
sessionsClient.on('error', (err) => console.log('Redis Client Error', err));
await sessionsClient.connect();
console.log('Connected to redisClient');

export { sessionsClient };
