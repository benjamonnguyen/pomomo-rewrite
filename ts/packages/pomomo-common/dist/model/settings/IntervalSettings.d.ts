import { ESessionState } from '../session';
declare class IntervalSettings {
    pomodoro: number;
    shortBreak: number;
    longBreak: number;
    intervals: number;
    constructor(pomodoro?: number, shortBreak?: number, longBreak?: number, intervals?: number);
    getDurationS(state: ESessionState): number;
}
export default IntervalSettings;
