import config from 'config';
import { CronJob } from 'cron';
import { client } from '../index';
/**
 * Kill cluster if bridge connection is down
 */
export const bridgeHealthCheck = new CronJob(config.get('scheduler.job.healthCheck.cronTime'), async () => {
    let response;
    try {
        response = await client.request({ bridgeHealthCheck: true });
    }
    catch (e) {
        console.error(e);
    }
    if (!response) {
        console.error('bridgeHealthCheck - lost connection! Restarting BotClient');
        process.kill(0, 'SIGINT');
    }
});
//# sourceMappingURL=index.js.map