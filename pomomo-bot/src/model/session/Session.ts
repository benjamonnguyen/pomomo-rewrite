import SessionSettings from '../setting/SessionSettings';
import ESessionState from '../session/ESessionState';
import Timer from '../timer/Timer';
import { Type, instanceToPlain } from 'class-transformer';
import { sessionsClient } from '../../db/redisClient';
import { SessionConflictError } from '../../error/sessionError';

class Session {
	#guildId?: number;
	#channelId?: number;
	#voiceChannelId?: number;
	#userId?: number;
	#messageId: number;
	#state: ESessionState;
	@Type(() => SessionSettings) settings: SessionSettings;
	@Type(() => Timer) timer: Timer;
	#idleFlag: boolean;
	#lastUpdated: Date;

	constructor(
		messageId: number,
		settings: SessionSettings,
		guildId?: number,
		channelId?: number,
		voiceChannelId?: number,
		userId?: number,
	) {
		if (!userId && (!guildId || !channelId)) {
			throw 'Either userId or guildId and channelId must be provided';
		}

		this.#guildId = guildId;
		this.#channelId = channelId;
		this.#voiceChannelId = voiceChannelId;
		this.#userId = userId;
		this.#messageId = messageId;
		this.settings = settings;
		this.#state = ESessionState.POMODORO;
		this.timer = new Timer(settings.intervalSettings.pomodoro);
		this.#idleFlag = false;
		this.#lastUpdated = new Date();
	}

	get id(): string {
		if (this.#userId) {
			return `u:${this.#userId}`;
		}

		return `g:${this.#guildId}c:${this.#channelId}`;
	}
}

const start = (
	messageId: number,
	settings: SessionSettings,
	guildId?: number,
	channelId?: number,
	voiceChannelId?: number,
	userId?: number,
) => {
	const session = new Session(
		messageId,
		settings,
		guildId,
		channelId,
		voiceChannelId,
		userId,
	);

	if (sessionsClient.get(session.id)) {
		throw new SessionConflictError(
			`Session already exists for id: ${session.id}`,
		);
	} else {
		sessionsClient.json.set(session.id, '.', instanceToPlain(session));
	}
};

export { start };
