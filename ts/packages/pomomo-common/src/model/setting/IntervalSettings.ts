import config from 'config';

const pomodoroDefault: number = config.get('command.start.pomodoro.default');
const shortBreakDefault: number = config.get('command.start.shortBreak.default');
const longBreakDefault: number = config.get('command.start.longBreak.default');
const intervalsDefault: number = config.get('command.start.intervals.default');

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
		this.pomodoro = pomodoro || pomodoroDefault;
		this.shortBreak = shortBreak || shortBreakDefault;
		this.longBreak = longBreak || longBreakDefault;
		this.intervals = intervals || intervalsDefault;
	}
}

export default IntervalSettings;
