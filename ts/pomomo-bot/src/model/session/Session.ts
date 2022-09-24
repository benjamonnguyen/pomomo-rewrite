import { SessionSettings } from '../setting/SessionSettings';
import Timer from '../timer/Timer';
import { Type } from 'class-transformer';

enum ESessionState {
	POMODORO,
	SHORT_BREAK,
	LONG_BREAK,
}

export class Session {
	guildId: string;
	channelId: string;
	voiceChannelId?: string;
	// #userId?: number; TODO allow DM sessions
	messageId: string;
	state: ESessionState;
	@Type(() => SessionSettings) settings: SessionSettings;
	@Type(() => Timer) timer: Timer;
	idleFlag: boolean;
	lastUpdated: Date;

	constructor(
		settings: SessionSettings,
		messageId: string,
		guildId: string,
		channelId: string,
		voiceChannelId: string,
	) {
		// if (!userId && (!guildId || !channelId)) {
		// 	throw 'Either userId or guildId and channelId must be provided';
		// }

		this.guildId = guildId;
		this.channelId = channelId;
		this.voiceChannelId = voiceChannelId;
		// this.#userId = userId;
		this.messageId = messageId;
		this.settings = settings;
		this.state = ESessionState.POMODORO;
		this.timer = new Timer(settings.intervalSettings.pomodoro);
		this.idleFlag = false;
		this.lastUpdated = new Date();
	}

	get id(): string {
		// if (this.#userId) {
		// 	return `u:${this.#userId}`;
		// }

		return `g:${this.guildId}c:${this.channelId}`;
	}

	// TODO calculate timer properties
	toggleTimer() {
		this.timer.isRunning = !this.timer.isRunning;
	}
}

export class SessionConflictError extends Error {
	message: string;
	userMessage = 'Session already exists for this channel';

	constructor(sessionId: string) {
		super();
		this.message = `Session already exists for id: ${sessionId}`;
	}
}
