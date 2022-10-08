import { createClient, RedisClientType } from 'redis';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { Session } from '../model/session/Session';

export class SessionRepository {
	_client: RedisClientType;

	constructor(url: string) {
		this._client = createClient({
			url: url,
		});
		this._client.on('error', console.error);
		this._client.once('ready', () => console.info('sessionClient ready!'));
		this._client.connect();
	}

	async get(guildId: string, channelId: string) {
		const sessionKey = buildSessionKey(guildId, channelId);
		const sessionInDb = await this._client.json.get(sessionKey);
		console.debug('sessions-client ~ Got', sessionKey);
		if (!sessionInDb) {
			throw new SessionNotFoundError(sessionKey);
		}
		return plainToInstance(Session, sessionInDb);
	}

	async set(session: Session) {
		return this._client.json
			.set(session.id, '.', instanceToPlain(session))
			.then(() => console.info('sessions-client ~ Set', session.id));
	}

	async delete(sessionId: string) {
		this._client
			.del(sessionId)
			.then(() => console.info('sessions-client ~ Deleted', sessionId));
	}
}

export const buildSessionKey = (guildId: string, channelId: string) => {
	return `session:g:${guildId}c:${channelId}`;
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
