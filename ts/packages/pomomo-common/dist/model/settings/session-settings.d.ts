import IntervalSettings from './IntervalSettings';
export declare class SessionSettings {
    intervalSettings: IntervalSettings;
    constructor(intervalSettings?: IntervalSettings);
}
export declare class SessionSettingsBuilder {
    sessionSettings: SessionSettings;
    intervalSettings(pomodoro: number, shortBreak: number, longBreak: number, intervals: number): SessionSettingsBuilder;
    build(): SessionSettings;
}
