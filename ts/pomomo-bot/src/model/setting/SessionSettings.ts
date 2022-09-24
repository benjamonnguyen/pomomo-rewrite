import IntervalSettings from './IntervalSettings';
import { Type } from 'class-transformer';

export class SessionSettings {
	volume: number;
	@Type(() => IntervalSettings) intervalSettings;

	constructor(volume = 10, intervalSettings = new IntervalSettings()) {
		this.volume = volume;
		this.intervalSettings = intervalSettings;
	}
}

export class SessionSettingsBuilder {
	sessionSettings = new SessionSettings();

	intervalSettings(
		pomodoro: number,
		shortBreak: number,
		longBreak: number,
		intervals: number,
	): SessionSettingsBuilder {
		this.sessionSettings.intervalSettings = new IntervalSettings(
			pomodoro,
			shortBreak,
			longBreak,
			intervals,
		);
		return this;
	}

	volume(volume: number): SessionSettingsBuilder {
		this.sessionSettings.volume = volume;
		return this;
	}

	build() {
		return this.sessionSettings;
	}
}
