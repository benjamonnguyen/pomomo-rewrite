import config from 'config';

class IntervalSettings {
	pomodoro: number;
	shortBreak: number;
	longBreak: number;
	intervals: number;

	constructor(
		pomodoro?: number,
		shortBreak?: number,
		longBreak?: number,
		intervals?: number,
	) {
		this.pomodoro = pomodoro || config.get('command.start.pomodoro.default');
		this.shortBreak = shortBreak || config.get('command.start.shortBreak.default');
		this.longBreak = longBreak || config.get('command.start.longBreak.default');
		this.intervals = intervals || config.get('command.start.intervals.default');
	}
}

export default IntervalSettings;
