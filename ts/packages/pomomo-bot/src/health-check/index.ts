import config from 'config';
import { CronJob } from 'cron';
import { client } from '../index';

/**
 * Kill cluster if bridge connection is down
 */
export const bridgeHealthCheck = new CronJob(
	config.get('scheduler.job.healthCheck.cronTime'),
	async () => {
		const response = await client.request({ bridgeHealthCheck: true });
		if (!response) {
			console.error('bridgeHealthCheck - lost connection!');
			process.send({
				type: 'process:msg',
				data: {
					restart: true,
				},
			});
		}
	},
);
