import config from 'config';
import { ESessionState } from '../session';
const pomodoroDefault = config.get('command.start.pomodoro.default');
const shortBreakDefault = config.get('command.start.shortBreak.default');
const longBreakDefault = config.get('command.start.longBreak.default');
const intervalsDefault = config.get('command.start.intervals.default');
class IntervalSettings {
    pomodoro;
    shortBreak;
    longBreak;
    intervals;
    constructor(pomodoro, shortBreak, longBreak, intervals) {
        this.pomodoro = pomodoro || pomodoroDefault;
        this.shortBreak = shortBreak || shortBreakDefault;
        this.longBreak = longBreak || longBreakDefault;
        this.intervals = intervals || intervalsDefault;
    }
    getDurationS(state) {
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
//# sourceMappingURL=IntervalSettings.js.map