import 'reflect-metadata';
import logger from 'pomomo-common/src/logger';
import bridge from './bridge';
import sessionRepo from './db/session-repo';
import { job } from './scheduler';
bridge
    .start()
    .then((b) => logger.info(`bridge started: ${JSON.stringify(b, null, 2)}`));
job.start();
logger.info('started scheduler job!');
const gracefulShutdown = () => {
    logger.info('Starting graceful shutdown...');
    const a = bridge.close().then(() => logger.info('bridge closed!'));
    const b = sessionRepo.client
        .quit()
        .then(() => logger.info('sessionClient quitted!'));
    Promise.allSettled([a, b]);
    setTimeout(() => {
        logger.info('gracefulShutdown timed out!');
        process.exit();
    }, 5000);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
//# sourceMappingURL=index.js.map