import config from 'config';
import { SessionSettings } from '../settings/session-settings';
import Timer from '../timer/Timer';
import { Type } from 'class-transformer';
import { buildSessionKey } from '../../db/session-repo';
import { Stats } from '../stats';

const IDLE_TIMEOUT_HOUR = config.get('session.idleTimeoutH') as number;
const PREMIUM_IDLE_TIMEOUT_HOUR = config.get(
	'session.premium.idleTimeoutH',
) as number;

export enum ESessionState {
	POMODORO,
	SHORT_BREAK,
	LONG_BREAK,
}

export class Session {
	guildId: string;
	channelId: string;
	// #userId?: number; TODO allow DM sessions
	timerMsgId: string;
	state = ESessionState.POMODORO;
	interval = 1;
	premium: boolean;
	@Type(() => Date) idleCheck?: Date;
	@Type(() => SessionSettings) settings: SessionSettings;
	@Type(() => Timer) timer: Timer;
	@Type(() => Date) lastInteracted = new Date();
	@Type(() => Date) lastUpdated = new Date();
	@Type(() => Stats) stats = new Stats();

	static init(settings: SessionSettings, guildId: string, premium = false) {
		const session = new Session();
		// if (!userId && (!guildId || !channelId)) {
		// 	throw 'Either userId or guildId and channelId must be provided';
		// }

		session.guildId = guildId;
		// this.#userId = userId;
		session.premium = premium;
		session.settings = settings;
		session.timer = Timer.init(
			settings.intervalSettings.getDurationS(ESessionState.POMODORO),
		);

		return session;
	}

	get id() {
		return buildSessionKey(this.guildId, this.channelId);
	}

	isIdle() {
		const idleTimeH =
			(new Date().getTime() - this.lastInteracted.getTime()) / 1000 / 3600;
		return this.premium
			? PREMIUM_IDLE_TIMEOUT_HOUR < idleTimeH
			: IDLE_TIMEOUT_HOUR < idleTimeH;
	}

	goNextState(skip = false) {
		this.state = this.getNextState(this.state);

		if (this.state != ESessionState.POMODORO && !skip) {
			if (this.interval >= this.settings.intervalSettings.intervals) {
				this.interval = 1;
			} else {
				this.interval++;
			}
			this.stats.intervalsCompleted++;
			this.stats.minutesCompleted += this.settings.intervalSettings.pomodoro;
		}

		this.timer.remainingSeconds = this.settings.intervalSettings.getDurationS(
			this.state,
		);
		this.timer.lastUpdated = new Date();
	}

	private getNextState(state: ESessionState): ESessionState {
		if (state === ESessionState.POMODORO) {
			if (this.interval === this.settings.intervalSettings.intervals) {
				return ESessionState.LONG_BREAK;
			}
			return ESessionState.SHORT_BREAK;
		}

		return ESessionState.POMODORO;
	}
}
