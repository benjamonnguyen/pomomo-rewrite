var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Exclude, Type } from 'class-transformer';
import { calcTimeRemaining } from '../../util/timer-util';
class Timer {
    remainingSeconds;
    isRunning;
    lastUpdated;
    static init(remainingSeconds) {
        const timer = new Timer();
        timer.remainingSeconds = remainingSeconds;
        timer.isRunning = true;
        timer.lastUpdated = new Date();
        return timer;
    }
    toggle() {
        const now = new Date();
        if (this.isRunning) {
            this.remainingSeconds -= Math.ceil((now.getTime() - this.lastUpdated.getTime()) / 1000);
        }
        this.lastUpdated = now;
        this.isRunning = !this.isRunning;
    }
    getTimeRemainingAsString = (resolutionM) => {
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
    calcSecondsSince(since) {
        return ((this.lastUpdated.getTime() +
            this.remainingSeconds * 1000 -
            since.getTime()) /
            1000);
    }
}
__decorate([
    Type(() => Date)
], Timer.prototype, "lastUpdated", void 0);
__decorate([
    Exclude()
], Timer.prototype, "getTimeRemainingAsString", void 0);
export default Timer;
//# sourceMappingURL=Timer.js.map