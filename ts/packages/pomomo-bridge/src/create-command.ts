import { logger } from 'pomomo-common/src/log';
import { CommandMessage, ECommand, Payload } from 'pomomo-common/src/command';

export function createUpdateTimerCmd(
	guildId: string,
	channelId: string,
): CommandMessage {
	for (const arg of arguments) {
		if (!arg) {
			logger.error('command.createUpdateTimerCmd() ~ missing', arg);
			return;
		}
	}
	return new CommandMessage(
		ECommand.UPDATE_TIMER,
		{ channelId: channelId } as Payload,
		guildId,
	);
}

export function createGoNextStateCmd(
	guildId: string,
	channelId: string,
): CommandMessage {
	for (const arg of arguments) {
		if (!arg) {
			logger.error('command.createGoNextStateCmd() ~ missing', arg);
			return;
		}
	}
	return new CommandMessage(
		ECommand.GO_NEXT_STATE,
		{ channelId: channelId } as Payload,
		guildId,
	);
}

export function createCheckIdleCmd(
	guildId: string,
	channelId: string,
): CommandMessage {
	for (const arg of arguments) {
		if (!arg) {
			logger.error('command.createCheckIdleCmd() ~ missing', arg);
			return;
		}
	}
	return new CommandMessage(
		ECommand.CHECK_IDLE,
		{ channelId: channelId } as Payload,
		guildId,
	);
}
