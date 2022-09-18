import IntervalSettings from './IntervalSettings';

class SessionSettings {
	volume: number;
	intervalSettings: IntervalSettings;

	constructor(volume: number, intervalSettings: IntervalSettings) {
		this.volume = volume;
		this.intervalSettings = intervalSettings;
	}
}

export default SessionSettings;
