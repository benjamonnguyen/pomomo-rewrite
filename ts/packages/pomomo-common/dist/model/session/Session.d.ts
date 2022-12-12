import { SessionSettings } from '../settings/session-settings';
import Timer from '../timer/Timer';
import { Stats } from '../stats';
import { FocusMember } from '../../model/focus-member';
export declare enum ESessionState {
    POMODORO = 0,
    SHORT_BREAK = 1,
    LONG_BREAK = 2
}
export declare class Session {
    guildId: string;
    channelId: string;
    timerMsgId: string;
    state: ESessionState;
    interval: number;
    premium: boolean;
    idleCheck?: Date;
    settings: SessionSettings;
    timer: Timer;
    lastInteracted: Date;
    lastUpdated: Date;
    stats: Stats;
    focusMembers: FocusMember[];
    static init(settings: SessionSettings, guildId: string, premium?: boolean): Session;
    get id(): string;
    isIdle(): boolean;
    goNextState(skip?: boolean): void;
    private getNextState;
}
