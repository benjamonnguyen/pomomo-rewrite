import { RedisClientType } from 'redis';
import { Session } from '../model/session/Session';
import { Guild } from 'discord.js';
export declare class SessionRepository {
    client: RedisClientType;
    constructor(url: string);
    get(guildId: string, channelId: string): Promise<Session>;
    set(session: Session): Promise<"OK">;
    insert(session: Session, guild: Guild): Promise<void>;
    delete(sessionId: string): Promise<void>;
    getSessionCount(guildId: string): Promise<number>;
    incSessionCount(guildId: string, by: number): Promise<number>;
}
export declare function buildSessionKey(guildId: string, channelId: string, premium?: boolean): string;
export declare function buildGuildKey(guildId: string): string;
export declare class SessionConflictError extends Error {
    userMessage: string;
    constructor(sessionId: string);
}
export declare class SessionNotFoundError extends Error {
    constructor(sessionId: string);
}
export declare class InvalidSessionError extends Error {
    constructor(session: Session);
}
