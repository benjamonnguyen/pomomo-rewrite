import 'reflect-metadata';
import { logger } from 'pomomo-common/src/logger';
import bridge from './bridge';
import sessionRepo from './db/session-repo';
import { sessionJob } from './scheduler';

bridge.start();

sessionJob.start();
logger.logger.info('started sessionJob!');

// healthCheckJob.start();
// logger.logger.info('started healthCheckJob!');

const gracefulShutdown = () => {
	logger.logger.info('Starting graceful shutdown...');
	const a = bridge.close().then(() => logger.logger.info('bridge closed!'));
	const b = sessionRepo.client
		.quit()
		.then(() => logger.logger.info('sessionClient quitted!'));
	Promise.allSettled([a, b]);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
