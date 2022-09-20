import IntervalSettings from './IntervalSettings';
import { Type } from 'class-transformer';

class SessionSettings {
	volume: number;
	@Type(() => IntervalSettings) intervalSettings: IntervalSettings;

	constructor(volume: number, intervalSettings: IntervalSettings) {
		this.volume = volume;
		this.intervalSettings = intervalSettings;
	}
}

export default SessionSettings;
