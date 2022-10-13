import IntervalSettings from './IntervalSettings';
import { Type } from 'class-transformer';

export class SessionSettings {
	@Type(() => IntervalSettings) intervalSettings: IntervalSettings;

	constructor(intervalSettings = new IntervalSettings()) {
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

	build() {
		return this.sessionSettings;
	}
}
