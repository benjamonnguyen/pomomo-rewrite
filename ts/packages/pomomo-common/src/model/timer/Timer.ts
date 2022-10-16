import { Type } from 'class-transformer';
import { calcTimeRemaining } from '../../util/timer-util';

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

	getTimeRemainingAsString = (resolutionM?: number): string => {
		const secondsRemaining = this.calcSecondsSince(new Date());
		const { hours, minutes } = calcTimeRemaining(secondsRemaining, resolutionM);

		if (hours < 1 && minutes < 1) {
			return 'Less than 1 minute remaining!';
		}

		let res = [];
		if (resolutionM) {
			res.push('<');
		}
		if (hours) {
			res.push(hours);
			res.push(hours > 1 ? 'hours' : 'hour');
		}
		if (minutes) {
			res.push(minutes);
			res.push(minutes > 1 ? 'minutes' : 'minute');
		}
		res.push('remaining!');

		return res.join(' ');
	};

	calcSecondsSince(since: Date): number {
		return (
			(this.lastUpdated.getTime() +
				this.remainingSeconds * 1000 -
				since.getTime()) /
			1000
		);
	}
}

export default Timer;
