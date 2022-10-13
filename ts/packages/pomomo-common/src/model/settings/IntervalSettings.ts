import config from 'config';
import { ESessionState } from '../session';

const pomodoroDefault: number = config.get('command.start.pomodoro.default');
const shortBreakDefault: number = config.get(
	'command.start.shortBreak.default',
);
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

	getDurationS(state: ESessionState): number {
		switch (state) {
			case ESessionState.POMODORO:
				return this.pomodoro * 60;
			case ESessionState.SHORT_BREAK:
				return this.shortBreak * 60;
			case ESessionState.LONG_BREAK:
				return this.longBreak * 60;
			default:
				return -1;
		}
	}
}

export default IntervalSettings;
