export declare enum ECommand {
    UPDATE_TIMER = 0,
    GO_NEXT_STATE = 1,
    CHECK_IDLE = 2
}
export declare class CommandMessage {
    commandType: ECommand;
    payload: Payload;
    targetGuildId: string;
    options?: any;
    constructor(commandType: ECommand, payload: Payload, targetGuildId: string, options?: any);
    toString(): string;
}
export interface Payload {
    channelId: string;
}
