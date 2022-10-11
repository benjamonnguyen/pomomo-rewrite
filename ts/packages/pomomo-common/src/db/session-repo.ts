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

	async get(guildId: string, channelId: string) {
		const sessionKey = buildSessionKey(guildId, channelId);
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
			.then(() => console.info('sessions-client ~ Set', session.id));
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
		if ((await this.getSessionCount(guildId)) < 1) {
			await this.client.json.set(
				buildGuildKey(guildId),
				'.',
				{
					sessionCount: 0,
				},
				{ NX: true },
			);
			return 1;
		}

		return (await this.client.json.numIncrBy(
			buildGuildKey(guildId),
			'.sessionCount',
			by,
		)) as number;
	}
}

export function buildSessionKey(guildId: string, channelId: string): string {
	return `session:g:${guildId}c:${channelId}`;
}

export function buildGuildKey(guildId: string): string {
	return `guild:${guildId}`;
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
