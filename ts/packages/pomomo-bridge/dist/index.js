import 'reflect-metadata';
import { logger } from 'pomomo-common/src/logger';
import bridge from './bridge';
import sessionRepo from './db/session-repo';
import { sessionJob } from './scheduler';
bridge.start();
sessionJob.start();
logger.logger.info('started scheduler job!');
const gracefulShutdown = () => {
    logger.logger.info('Starting graceful shutdown...');
    const a = bridge.close().then(() => logger.logger.info('bridge closed!'));
    const b = sessionRepo.client
        .quit()
        .then(() => logger.logger.info('sessionClient quitted!'));
    Promise.allSettled([a, b]);
    setTimeout(() => {
        logger.logger.info('gracefulShutdown timed out!');
        process.exit();
    }, 5000);
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
export { gracefulShutdown };
//# sourceMappingURL=index.js.map