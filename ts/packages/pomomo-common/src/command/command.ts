export enum ECommand {
	UPDATE_TIMER,
}

export class CommandMessage {
	commandType: ECommand;
	payload: IPayload;
	targetGuildId: string;
	options?: any;

	constructor(
		commandType: ECommand,
		payload: IPayload,
		targetGuildId: string,
		options?: any,
	) {
		this.commandType = commandType;
		this.payload = payload;
		this.targetGuildId = targetGuildId;
		this.options = options;
	}
}

export interface IPayload {
	channelId: string;
}

export interface UpdateTimerPayload extends IPayload {}
