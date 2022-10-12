import { CommandMessage, ECommand, Payload } from 'pomomo-common/src/command';

export function createUpdateTimerCmd(
	guildId: string,
	channelId: string,
): CommandMessage {
	for (const arg of arguments) {
		if (!arg) {
			console.error('command.createUpdateTimerCmd() ~ missing', arg);
			return;
		}
	}
	return new CommandMessage(
		ECommand.UPDATE_TIMER,
		{ threadId: channelId } as Payload,
		guildId,
	);
}

export function createGoNextStateCmd(
	guildId: string,
	threadId: string,
): CommandMessage {
	for (const arg of arguments) {
		if (!arg) {
			console.error('command.createGoNextStateCmd() ~ missing', arg);
			return;
		}
	}
	return new CommandMessage(
		ECommand.GO_NEXT_STATE,
		{ threadId: threadId } as Payload,
		guildId,
	);
}

export function checkIdle() {}
