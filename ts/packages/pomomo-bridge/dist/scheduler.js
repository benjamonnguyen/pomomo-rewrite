import config from 'config';
import { CronJob } from 'cron';
import sessionRepo from './db/session-repo';
import { plainToInstance } from 'class-transformer';
import { Session } from 'pomomo-common/src/model/session';
import { createUpdateTimerCmd, createGoNextStateCmd, createCheckIdleCmd, } from './create-command';
import bridge from './bridge';
import { DateTime } from 'luxon';
import { calcTimeRemaining } from 'pomomo-common/src/util/timer-util';
const BATCH_SIZE = config.get('scheduler.batchSize');
const LINGER_MS = config.get('scheduler.lingerMs');
const RESOLUTION_M = config.get('session.resolutionM');
/**
 * scans redis session database and generates batches of commands
 * to send to discord client
 */
export const job = new CronJob(config.get('scheduler.job.session.cronTime'), async () => {
    let lastBatch = DateTime.now();
    let commands = [];
    for await (const key of sessionRepo.client.scanIterator({
        MATCH: 'session#*',
    })) {
        // console.log('cron job ~ processing', key);
        const session = plainToInstance(Session, await sessionRepo.client.json.get(key));
        if (session.idleCheck) {
            if ((new Date().getTime() - session.idleCheck.getTime()) / 3600000 >=
                24) {
                sessionRepo
                    .delete(session.id)
                    .then(() => console.warn('idleCheck timed out -', session.id))
                    .catch(console.error);
            }
        }
        else if (session.isIdle()) {
            commands.push(createCheckIdleCmd(session.guildId, session.channelId));
        }
        if (!session.timer.isRunning) {
            continue;
        }
        else {
            const now = new Date();
            if (session.timer.calcSecondsSince(now) <= 0) {
                const cmd = createGoNextStateCmd(session.guildId, session.channelId);
                if (cmd) {
                    commands.push(cmd);
                }
            }
            else {
                const { hours, minutes } = calcTimeRemaining(session.timer.calcSecondsSince(now), RESOLUTION_M);
                const { hours: lastUpdatedH, minutes: lastUpdatedM } = calcTimeRemaining(session.timer.calcSecondsSince(session.lastUpdated), RESOLUTION_M);
                if (hours === lastUpdatedH && minutes === lastUpdatedM) {
                    continue;
                }
                else {
                    const cmd = createUpdateTimerCmd(session.guildId, session.channelId);
                    if (cmd) {
                        commands.push(cmd);
                    }
                }
            }
        }
        if (commands.length &&
            (commands.length >= BATCH_SIZE || lastBatch.diffNow() >= LINGER_MS)) {
            bridge.sendCommands([...commands]).catch(console.error);
            commands = [];
            lastBatch = DateTime.now();
        }
    }
    if (commands.length) {
        bridge.sendCommands(commands).catch(console.error);
    }
});
//# sourceMappingURL=scheduler.js.map