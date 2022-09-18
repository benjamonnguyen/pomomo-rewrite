class IntervalSettings {
	pomodoro: number;
	shortBreak: number;
	longBreak: number;
	intervals: number;

	constructor(
		pomodoro: number,
		shortBreak: number,
		longBreak: number,
		intervals: number,
	) {
		this.pomodoro = pomodoro;
		this.shortBreak = shortBreak;
		this.longBreak = longBreak;
		this.intervals = intervals;
	}
}

export default IntervalSettings;
