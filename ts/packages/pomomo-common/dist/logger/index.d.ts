import pino from 'pino';
export declare enum ELogLevel {
    DEBUG = "debug",
    INFO = "info",
    ERROR = "error",
    FATAL = "fatal"
}
declare class MyLogger {
    logger: pino.Logger;
    constructor(logger: pino.Logger);
    log(lvl: ELogLevel, msg: string): void;
}
export declare const logger: MyLogger;
export {};
