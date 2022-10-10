import config from 'config';
import { CronJob } from 'cron';
import sessionRepo from './db/session-repo';
import { plainToInstance } from 'class-transformer';
import { Session } from 'pomomo-common/src/model/session';
import { checkIdle, createUpdateTimerCommand, goNextState } from './command';
import { CommandMessage } from 'pomomo-common/src/command';
import bridge from './bridge';

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
		let lastBatch = new Date();
		let commands: CommandMessage[] = [];

		for await (const key of sessionRepo.client.scanIterator()) {
			console.log('cron job ~ processing', key);
			const json = await sessionRepo.client.json.get(key);
			const session = plainToInstance(Session, json);
			if (session.idleCheck) {
				console.debug('idleCheck');
				if ((new Date().getTime() - session.idleCheck.getTime()) / 60000) {
					sessionRepo
						.delete(session.id)
						.then(() => console.warn('idleCheck timed out -', session.id))
						.catch(console.error);
				}
				return;
			}
			if (session.isIdle()) {
				console.debug('isIdle');
				// return checkIdle();
			} else if (!session.timer.isRunning) {
				console.debug('not running');
			} else {
				const secondsRemaining =
					session.timer.calculateCurrentSecondsRemaining();
				console.log(secondsRemaining);
				if (secondsRemaining <= 0) {
					// return goNextState();
					console.debug('goNextState');
				} else {
					console.debug('updateTimer');
					commands.push(
						createUpdateTimerCommand(session.guildId, session.channelId),
					);
				}
			}

			if (
				commands.length == BATCH_SIZE ||
				new Date().getTime() - lastBatch.getTime() >= LINGER_MS
			) {
				bridge.sendCommands([...commands]).catch(console.error);
				commands = [];
				lastBatch = new Date();
			}
		}

		console.debug(commands.length);
		if (commands.length) {
			bridge.sendCommands(commands).catch(console.error);
		}
	},
);
