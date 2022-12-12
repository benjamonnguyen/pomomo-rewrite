import { createClient } from 'redis';
import { plainToInstance, instanceToPlain } from 'class-transformer';
import { Session } from '../model/session/Session';
export class SessionRepository {
    client;
    constructor(url) {
        this.client = createClient({
            url: url,
        });
        this.client.on('error', console.error);
        this.client.once('ready', () => console.info('sessionClient ready!'));
        this.client.connect();
    }
    async get(guildId, channelId) {
        const sessionKey = buildSessionKey(guildId, channelId);
        const sessionInDb = await this.client.json.get(sessionKey);
        if (!sessionInDb) {
            throw new SessionNotFoundError(sessionKey);
        }
        return plainToInstance(Session, sessionInDb);
    }
    async set(session) {
        return this.client.json.set(session.id, '.', instanceToPlain(session));
    }
    async insert(session) {
        if (!(session.guildId && session.channelId && session.timerMsgId)) {
            throw new InvalidSessionError(session);
        }
        try {
            await this.client.json.set(session.id, '.', instanceToPlain(session), {
                NX: true,
            });
            console.info('session-repo ~ Insert', session.id);
        }
        catch (_) {
            const e = new SessionConflictError(session.id);
            console.error('session-repo.insert()', e);
            throw e;
        }
        await this.client.json
            .set(buildGuildKey(session.guildId), '.', {
            sessionCount: 0,
        }, { NX: true })
            .catch(console.error);
        await this.incSessionCount(session.guildId, 1);
    }
    async delete(sessionId) {
        const guildId = (await this.client.json.get(sessionId, {
            path: '.guildId',
        }));
        this.client.del(sessionId).then((n) => {
            if (n) {
                this.incSessionCount(guildId, -n).catch((e) => console.error('sessions-client.delete()', e));
                console.info('sessions-client ~ Deleted', sessionId);
            }
        });
    }
    async getSessionCount(guildId) {
        return this.client.json
            .get(buildGuildKey(guildId), {
            path: '.sessionCount',
        })
            .then((count) => count || 0)
            .catch((e) => {
            console.error('session-repo.getSessionCount()', e);
            return -1;
        });
    }
    async incSessionCount(guildId, by) {
        const guildKey = buildGuildKey(guildId);
        if ((await this.client.json.get(guildKey)) < 1) {
            await this.client.json.set(guildKey, '.sessionCount', 1);
            return 1;
        }
        return (await this.client.json.numIncrBy(guildKey, '.sessionCount', by));
    }
}
export function buildSessionKey(guildId, channelId, premium = false) {
    const prefix = premium ? 'session:premium' : 'session';
    return `${prefix}#g${guildId}c${channelId}`;
}
export function buildGuildKey(guildId) {
    return `guild#${guildId}`;
}
export class SessionConflictError extends Error {
    userMessage = 'Session already exists for this channel';
    constructor(sessionId) {
        super();
        this.message = `Session already exists for id: ${sessionId}`;
    }
}
export class SessionNotFoundError extends Error {
    constructor(sessionId) {
        super();
        this.message = `Session not found for id: ${sessionId}`;
    }
}
export class InvalidSessionError extends Error {
    constructor(session) {
        super();
        this.message = JSON.stringify(session);
    }
}
//# sourceMappingURL=session-repo.js.map