import {
	CommandMessage,
	ECommand,
	UpdateTimerPayload,
} from 'pomomo-common/src/command';

export function createUpdateTimerCommand(guildId: string, channelId: string) {
	if (!guildId || !channelId) {
		console.error('command.createUpdateTimerCommand() ~', guildId, channelId);
	}
	return new CommandMessage(
		ECommand.UPDATE_TIMER,
		{ channelId: channelId } as UpdateTimerPayload,
		guildId,
	);
}

export function goNextState() {}

export function checkIdle() {}
