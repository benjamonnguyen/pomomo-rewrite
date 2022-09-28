import { createClient } from 'redis';
import config from 'config';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { Session } from '../model/session/Session';

export const sessionsClient = createClient({
	url: config.get('redis.db.sessions.url'),
});
sessionsClient.on('error', console.error);
sessionsClient.on('debug', console.debug);

export const buildSessionKey = (guildId: string, channelId: string) => {
	return `session:g:${guildId}c:${channelId}`;
};

export const getSession = async (guildId: string, channelId: string) => {
	const sessionKey = buildSessionKey(guildId, channelId);
	const sessionInDb = await sessionsClient.json.get(sessionKey);
	console.debug('sessions-client.getSession() ~ Got', sessionKey);
	if (!sessionInDb) {
		throw new SessionNotFoundError(sessionKey);
	}
	return plainToInstance(Session, sessionInDb);
};

export const setSession = async (session: Session) => {
	return sessionsClient.json
		.set(session.id, '.', instanceToPlain(session))
		.then(() => console.info('sessions-client.setSession() ~ Set', session.id));
};

export class SessionConflictError extends Error {
	message: string;
	userMessage = 'Session already exists for this channel';

	constructor(sessionId: string) {
		super();
		this.message = `Session already exists for id: ${sessionId}`;
	}
}

export class SessionNotFoundError extends Error {
	message: string;

	constructor(sessionId: string) {
		super();
		this.message = `Session not found for id: ${sessionId}`;
	}
}
