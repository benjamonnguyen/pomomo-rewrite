import { SessionSettings } from '../settings/session-settings';
import Timer from '../timer/Timer';
import { Type } from 'class-transformer';
import { buildSessionKey } from '../../db/session-repo';

const IDLE_TIMEOUT_HOUR = 1;
const PREMIUM_IDLE_TIMEOUT_HOUR = 24;

export enum ESessionState {
	POMODORO,
	SHORT_BREAK,
	LONG_BREAK,
}

export class Session {
	guildId: string;
	channelId: string;
	voiceChannelId: string;
	// #userId?: number; TODO allow DM sessions
	messageId: string;
	state = ESessionState.POMODORO;
	premium: boolean;
	@Type(() => Date) idleCheck?: Date;
	@Type(() => SessionSettings) settings: SessionSettings;
	@Type(() => Timer) timer: Timer;
	@Type(() => Date) lastUpdated = new Date();

	static init(
		settings: SessionSettings,
		guildId: string,
		channelId: string,
		voiceChannelId: string,
		premium = false,
	) {
		const session = new Session();
		// if (!userId && (!guildId || !channelId)) {
		// 	throw 'Either userId or guildId and channelId must be provided';
		// }
		// TODO check that msg and channels still exist else end

		session.guildId = guildId;
		session.channelId = channelId;
		session.voiceChannelId = voiceChannelId;
		// this.#userId = userId;
		session.premium = premium;
		session.settings = settings;
		session.timer = Timer.init(settings.intervalSettings.pomodoro * 60);

		return session;
	}

	get id() {
		return buildSessionKey(this.guildId, this.channelId);
	}

	isIdle() {
		const idleTimeH =
			(new Date().getTime() - this.lastUpdated.getTime()) / 1000 / 3600;
		return this.premium
			? PREMIUM_IDLE_TIMEOUT_HOUR < idleTimeH
			: IDLE_TIMEOUT_HOUR < idleTimeH;
	}
}
