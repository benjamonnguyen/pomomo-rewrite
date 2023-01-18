import config from 'config';
import pino from 'pino';

export enum ELogLevel {
	DEBUG = 'debug',
	INFO = 'info',
	ERROR = 'error',
	FATAL = 'fatal',
}

class MyLogger {
	logger: pino.Logger;

	constructor(logger: pino.Logger) {
		this.logger = logger;
	}

	log(lvl: ELogLevel, msg: string) {
		if (lvl === ELogLevel.DEBUG) {
			this.logger.debug(msg);
		} else if (lvl === ELogLevel.INFO) {
			this.logger.info(msg);
		} else if (lvl === ELogLevel.ERROR) {
			this.logger.error(msg);
		} else if (lvl === ELogLevel.FATAL) {
			this.logger.fatal(msg);
		} else {
			throw 'logLevel not implemented: ' + ELogLevel[lvl];
		}
	}
}

export const logger = new MyLogger(
	pino({
		transport: {
			target: 'pino-pretty',
			options: {
				translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
				ignore: 'pid,hostname',
			},
		},
		level: config.get('logger.level'),
	}),
);
