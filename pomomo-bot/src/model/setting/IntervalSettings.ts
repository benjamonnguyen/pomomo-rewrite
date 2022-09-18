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
		this.pomodoro = !pomodoro
			? config.get('command.start.pomodoro.default')
			: pomodoro;
		this.shortBreak = !shortBreak
			? config.get('command.start.shortBreak.default')
			: shortBreak;
		this.longBreak = !longBreak
			? config.get('command.start.longBreak.default')
			: longBreak;
		this.intervals = !intervals
			? config.get('command.start.intervals.default')
			: intervals;
	}
}

export default IntervalSettings;
