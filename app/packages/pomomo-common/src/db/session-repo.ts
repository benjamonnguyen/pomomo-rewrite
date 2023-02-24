import { createClient, RedisClientType } from 'redis';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { Session } from '../model/session/Session';
import { Guild } from 'discord.js';

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
		if (!sessionInDb) {
			throw new SessionNotFoundError(sessionKey);
		}
		return plainToInstance(Session, sessionInDb);
	}

	async set(session: Session) {
		return this.client.json.set(session.id, '.', instanceToPlain(session));
	}

	async insert(session: Session, guild: Guild) {
		if (!(session.guildId && session.channelId && session.timerMsgId)) {
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
		const guildKey = buildGuildKey(session.guildId);
		await this.client.json
			.set(
				guildKey,
				'.',
				{
					sessionCount: 0,
					sessionsStarted: 0,
				},
				{ NX: true },
			)
			.catch(console.error);
		await Promise.all([
			this.incSessionCount(session.guildId, 1),
			this.client.json.set(guildKey, '.name', guild.name),
			this.client.json
				.numIncrBy(guildKey, '.sessionsStarted', 1)
				.catch((_) => this.client.json.set(guildKey, '.sessionsStarted', 1)),
			this.client.json.set(guildKey, '.lastUpdated', new Date()),
		]);
	}

	async delete(sessionId: string) {
		const guildId = (await this.client.json.get(sessionId, {
			path: '.guildId',
		})) as string;
		this.client.del(sessionId).then((n: number) => {
			if (n) {
				this.incSessionCount(guildId, -n).catch((e) =>
					console.error('sessions-client.delete()', e),
				);
				console.info('sessions-client ~ Deleted', sessionId);
			}
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
		if ((await this.client.json.get(guildKey)) < 1) {
			await this.client.json.set(guildKey, '.sessionCount', 1);
			return 1;
		}
		return (await this.client.json.numIncrBy(
			guildKey,
			'.sessionCount',
			by,
		)) as number;
	}
}

export function buildSessionKey(
	guildId: string,
	channelId: string,
	premium = false,
): string {
	const prefix = premium ? 'session:premium' : 'session';
	return `${prefix}#g${guildId}c${channelId}`;
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
