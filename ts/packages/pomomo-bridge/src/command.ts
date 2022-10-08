import { CommandMessage, ECommand } from 'pomomo-common/src/command';

export function createUpdateTimerCommand(
	guildId: string,
	channelId: string,
	lastUpdated: Date,
	remainingSeconds: number,
) {
	return new CommandMessage(ECommand.TIMER_UPDATE, {}, guildId);
}

export function goNextState() {}

export function checkIdle() {}
