import { SessionSettings } from '../setting/session-settings';
import Timer from '../timer/Timer';
import { Type } from 'class-transformer';
import { buildSessionKey } from '../../db/session-repo';

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
	state: ESessionState;
	@Type(() => SessionSettings) settings: SessionSettings;
	@Type(() => Timer) timer: Timer;
	idleFlag: boolean;
	@Type(() => Date) lastUpdated: Date;

	static init(
		settings: SessionSettings,
		guildId: string,
		channelId: string,
		voiceChannelId: string,
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
		session.settings = settings;
		session.state = ESessionState.POMODORO;
		session.timer = Timer.init(settings.intervalSettings.pomodoro * 60);
		session.idleFlag = false;
		session.lastUpdated = new Date();

		return session;
	}

	get id() {
		return buildSessionKey(this.guildId, this.channelId);
	}
}
