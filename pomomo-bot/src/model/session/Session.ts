import SessionSettings from '../setting/SessionSettings';
import ESessionState from '../session/ESessionState';
import Timer from '../timer/Timer';

class Session {
	#guildId?: number;
	#channelId?: number;
	#voiceChannelId?: number;
	#userId?: number;
	#messageId: number;
	#state: ESessionState;
	#settings: SessionSettings;
	#timer: Timer;
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
		this.#settings = settings;
		this.#state = ESessionState.POMODORO;
		this.#timer = new Timer(settings.intervalSettings.pomodoro);
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

export default Session;
