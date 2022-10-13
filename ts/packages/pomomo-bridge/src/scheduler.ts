import config from 'config';
import { CronJob } from 'cron';
import sessionRepo from './db/session-repo';
import { plainToInstance } from 'class-transformer';
import { Session } from 'pomomo-common/src/model/session';
import {
	createUpdateTimerCmd,
	createGoNextStateCmd,
	createCheckIdleCmd,
} from './create-command';
import { CommandMessage } from 'pomomo-common/src/command';
import bridge from './bridge';
import { DateTime } from 'luxon';

const BATCH_SIZE = config.get('scheduler.batchSize');
const LINGER_MS = config.get('scheduler.lingerMs');

/**
 * scans redis session database and generates batches of commands
 * to send to discord client
 */
export const job = new CronJob(
	config.get('scheduler.job.session.cronTime'),
	async () => {
		console.log('running cron job');
		let lastBatch = DateTime.now();
		let commands: CommandMessage[] = [];

		for await (const key of sessionRepo.client.scanIterator({
			MATCH: 'session#*',
		})) {
			console.log('cron job ~ processing', key);
			const session = plainToInstance(
				Session,
				await sessionRepo.client.json.get(key),
			);

			if (session.idleCheck) {
				console.debug('idleCheck');
				if (
					(new Date().getTime() - session.idleCheck.getTime()) / 3600000 >=
					24
				) {
					sessionRepo
						.delete(session.id)
						.then(() => console.warn('idleCheck timed out -', session.id))
						.catch(console.error);
				}
			} else if (true) {
				console.debug('isIdle', session.id);
				commands.push(createCheckIdleCmd(session.guildId, session.channelId));
			}

			if (!session.timer.isRunning) {
				console.debug('not running', session.id);
			} else {
				if (session.timer.calculateCurrentSecondsRemaining() <= 0) {
					console.debug('goNextState', session.id);
					const cmd = createGoNextStateCmd(session.guildId, session.channelId);
					if (cmd) {
						commands.push(cmd);
					}
				} else {
					console.debug('updateTimer', session.id);
					const cmd = createUpdateTimerCmd(session.guildId, session.channelId);
					if (cmd) {
						commands.push(cmd);
					}
				}
			}

			console.debug(
				`scheduler batchSize: ${
					commands.length
				} - lastBatch.diffNow() ${lastBatch.diffNow()}`,
			);
			if (
				commands.length &&
				(commands.length >= BATCH_SIZE || lastBatch.diffNow() >= LINGER_MS)
			) {
				bridge.sendCommands([...commands]).catch(console.error);
				commands = [];
				lastBatch = DateTime.now();
			}
		}

		if (commands.length) {
			bridge.sendCommands(commands).catch(console.error);
		}
	},
);
