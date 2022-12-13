import config from 'config';
import pino from 'pino';
export default pino({
    transport: {
        target: 'pino-pretty',
        options: {
            translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
            ignore: 'pid,hostname',
        },
    },
    level: config.get('logger.level'),
});
//# sourceMappingURL=index.js.map