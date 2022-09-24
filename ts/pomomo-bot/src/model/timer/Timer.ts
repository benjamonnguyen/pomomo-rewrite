import { Type } from 'class-transformer';

class Timer {
	remainingSeconds: number;
	isRunning: boolean;
	@Type(() => Date) lastUpdated: Date;

	static init(remainingSeconds: number) {
		const timer = new Timer();
		timer.remainingSeconds = remainingSeconds;
		timer.isRunning = true;
		timer.lastUpdated = new Date();

		return timer;
	}

	toggle() {
		const now = new Date();
		if (this.isRunning) {
			this.remainingSeconds -= Math.ceil(
				(now.getTime() - this.lastUpdated.getTime()) / 1000,
			);
		}
		this.lastUpdated = now;
		this.isRunning = !this.isRunning;
	}

	getRemainingTime = (resolution?: number): string => {
		const h = Math.floor(this.remainingSeconds / 3600);
		const m = Math.floor((this.remainingSeconds % 3600) / 60);
		console.debug(
			'Timer.getRemainingTime ~',
			`t: ${this.remainingSeconds} h: ${h} m: ${m}`,
		);

		if (h < 1 && m < 1) {
			return 'Less than 1 minute remaining!';
		}

		let res = [];
		if (resolution) {
			// TODO refreshRate
		}
		if (h) {
			res.push(h);
			res.push(h > 1 ? 'hours' : 'hour');
		}
		if (m) {
			res.push(m);
			res.push(m > 1 ? 'minutes' : 'minute');
		}
		res.push('remaining!');

		return res.join(' ');
	};
}

export default Timer;
