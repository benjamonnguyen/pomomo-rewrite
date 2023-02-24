var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import config from 'config';
import { SessionSettings } from '../settings/session-settings';
import Timer from '../timer/Timer';
import { Type } from 'class-transformer';
import { buildSessionKey } from '../../db/session-repo';
import { Stats } from '../stats';
const IDLE_TIMEOUT_HOUR = config.get('session.idleTimeoutH');
const PREMIUM_IDLE_TIMEOUT_HOUR = config.get('session.premium.idleTimeoutH');
export var ESessionState;
(function (ESessionState) {
    ESessionState["POMODORO"] = "pomodoro";
    ESessionState["SHORT_BREAK"] = "short break";
    ESessionState["LONG_BREAK"] = "long break";
})(ESessionState || (ESessionState = {}));
export class Session {
    guildId;
    channelId;
    // #userId?: number; TODO allow DM sessions
    timerMsgId;
    state = ESessionState.POMODORO;
    interval = 1;
    premium;
    idleCheck;
    settings;
    timer;
    lastInteracted = new Date();
    lastUpdated = new Date();
    stats = new Stats();
    focusMembers = [];
    static init(settings, guildId, premium = false) {
        const session = new Session();
        // if (!userId && (!guildId || !channelId)) {
        // 	throw 'Either userId or guildId and channelId must be provided';
        // }
        session.guildId = guildId;
        session.premium = premium;
        session.settings = settings;
        session.timer = Timer.init(settings.intervalSettings.getDurationS(ESessionState.POMODORO));
        return session;
    }
    get id() {
        return buildSessionKey(this.guildId, this.channelId);
    }
    isIdle() {
        const idleTimeH = (new Date().getTime() - this.lastInteracted.getTime()) / 1000 / 3600;
        return this.premium
            ? PREMIUM_IDLE_TIMEOUT_HOUR < idleTimeH
            : IDLE_TIMEOUT_HOUR < idleTimeH;
    }
    goNextState(skip = false) {
        this.state = this.getNextState(this.state);
        if (this.state != ESessionState.POMODORO && !skip) {
            if (this.interval >= this.settings.intervalSettings.intervals) {
                this.interval = 1;
            }
            else {
                this.interval++;
            }
            this.stats.intervalsCompleted++;
            this.stats.minutesCompleted += this.settings.intervalSettings.pomodoro;
        }
        this.timer.remainingSeconds = this.settings.intervalSettings.getDurationS(this.state);
        this.timer.lastUpdated = new Date();
    }
    getNextState(state) {
        if (state === ESessionState.POMODORO) {
            if (this.interval === this.settings.intervalSettings.intervals) {
                return ESessionState.LONG_BREAK;
            }
            return ESessionState.SHORT_BREAK;
        }
        return ESessionState.POMODORO;
    }
}
__decorate([
    Type(() => Date)
], Session.prototype, "idleCheck", void 0);
__decorate([
    Type(() => SessionSettings)
], Session.prototype, "settings", void 0);
__decorate([
    Type(() => Timer)
], Session.prototype, "timer", void 0);
__decorate([
    Type(() => Date)
], Session.prototype, "lastInteracted", void 0);
__decorate([
    Type(() => Date)
], Session.prototype, "lastUpdated", void 0);
__decorate([
    Type(() => Stats)
], Session.prototype, "stats", void 0);
//# sourceMappingURL=Session.js.map