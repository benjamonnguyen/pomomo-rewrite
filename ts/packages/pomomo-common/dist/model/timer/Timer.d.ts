declare class Timer {
    remainingSeconds: number;
    isRunning: boolean;
    lastUpdated: Date;
    static init(remainingSeconds: number): Timer;
    toggle(): void;
    getTimeRemainingAsString: (resolutionM?: number) => string;
    calcSecondsSince(since: Date): number;
}
export default Timer;
