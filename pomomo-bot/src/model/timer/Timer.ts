class Timer {
	remaining: number;
	isRunning: boolean;
	lastUpdated: Date;

	constructor(remaining: number) {
		this.remaining = remaining;
		this.isRunning = true;
		this.lastUpdated = new Date();
	}
}

export default Timer;
