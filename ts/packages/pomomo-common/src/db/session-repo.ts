import { createClient, RedisClientType } from 'redis';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { Session } from '../model/session/Session';

export class SessionRepository {
	client: RedisClientType;

	constructor(url: string) {
		this.client = createClient({
			url: url,
		});
		this.client.on('error', console.error);
		this.client.once('ready', () => console.info('sessionClient ready!'));
		this.client.connect();
	}

	async get(guildId: string, threadId: string) {
		const sessionKey = buildSessionKey(guildId, threadId);
		const sessionInDb = await this.client.json.get(sessionKey);
		console.debug('sessions-client ~ Got', sessionKey);
		if (!sessionInDb) {
			throw new SessionNotFoundError(sessionKey);
		}
		return plainToInstance(Session, sessionInDb);
	}

	async set(session: Session) {
		return this.client.json
			.set(session.id, '.', instanceToPlain(session))
			.then(() => console.info('session-repo ~ Set', session.id));
	}

	async insert(session: Session) {
		if (
			!(
				session.guildId &&
				session.threadId &&
				session.voiceId &&
				session.initialMsgId &&
				session.timerMsgId
			)
		) {
			throw new InvalidSessionError(session);
		}

		try {
			await this.client.json.set(session.id, '.', instanceToPlain(session), {
				NX: true,
			});
			console.info('session-repo ~ Insert', session.id);
		} catch (_) {
			const e = new SessionConflictError(session.id);
			console.error('session-repo.insert()', e);
			throw e;
		}
		await this.incSessionCount(session.guildId, 1);
	}

	async delete(sessionId: string) {
		const guildId = (await this.client.json.get(sessionId, {
			path: '.guildId',
		})) as string;
		this.client.del(sessionId).then(() => {
			this.incSessionCount(guildId, -1).catch((e) =>
				console.error('sessions-client.delete()', e),
			);
			console.info('sessions-client ~ Deleted', sessionId);
		});
	}

	async getSessionCount(guildId: string): Promise<number> {
		return this.client.json
			.get(buildGuildKey(guildId), {
				path: '.sessionCount',
			})
			.then((count) => (count as number) || 0)
			.catch((e) => {
				console.error('session-repo.getSessionCount()', e);
				return -1;
			});
	}

	async incSessionCount(guildId: string, by: number): Promise<number> {
		const guildKey = buildGuildKey(guildId);
		if (!(await this.client.json.get(guildKey))) {
			this.client.json.set(guildKey, '.', { sessionCount: 1 });
			return 1;
		}
		return (await this.client.json.numIncrBy(
			guildKey,
			'.sessionCount',
			by,
		)) as number;
	}
}

export function buildSessionKey(guildId: string, threadId: string, premium = false): string {
	const prefix = premium ? 'session:premium' : 'session';
	return `${prefix}#g${guildId}c${threadId}`;
}

export function buildGuildKey(guildId: string): string {
	return `guild#${guildId}`;
}

export class SessionConflictError extends Error {
	userMessage = 'Session already exists for this channel';

	constructor(sessionId: string) {
		super();
		this.message = `Session already exists for id: ${sessionId}`;
	}
}

export class SessionNotFoundError extends Error {
	constructor(sessionId: string) {
		super();
		this.message = `Session not found for id: ${sessionId}`;
	}
}

export class InvalidSessionError extends Error {
	constructor(session: Session) {
		super();
		this.message = JSON.stringify(session);
	}
}
