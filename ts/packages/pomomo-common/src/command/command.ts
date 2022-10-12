export enum ECommand {
	UPDATE_TIMER,
	GO_NEXT_STATE,
}

export class CommandMessage {
	commandType: ECommand;
	payload: Payload;
	targetGuildId: string;
	options?: any;

	constructor(
		commandType: ECommand,
		payload: Payload,
		targetGuildId: string,
		options?: any,
	) {
		this.commandType = commandType;
		this.payload = payload;
		this.targetGuildId = targetGuildId;
		this.options = options;
	}
}

export interface Payload {
	threadId: string;
}
