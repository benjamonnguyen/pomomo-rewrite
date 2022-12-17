import config from 'config';
import pino from 'pino';
export var ELogLevel;
(function (ELogLevel) {
    ELogLevel["DEBUG"] = "debug";
    ELogLevel["INFO"] = "info";
    ELogLevel["ERROR"] = "error";
    ELogLevel["FATAL"] = "fatal";
})(ELogLevel || (ELogLevel = {}));
class MyLogger {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    log(lvl, msg) {
        if (lvl === ELogLevel.DEBUG) {
            this.logger.debug(msg);
        }
        else if (lvl === ELogLevel.INFO) {
            this.logger.info(msg);
        }
        else if (lvl === ELogLevel.ERROR) {
            this.logger.error(msg);
        }
        else if (lvl === ELogLevel.FATAL) {
            this.logger.fatal(msg);
        }
        else {
            throw 'logLevel not implemented: ' + ELogLevel[lvl];
        }
    }
}
export const logger = new MyLogger(pino({
    transport: {
        target: 'pino-pretty',
        options: {
            translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
            ignore: 'pid,hostname',
        },
    },
    level: config.get('logger.level'),
}));
//# sourceMappingURL=index.js.map