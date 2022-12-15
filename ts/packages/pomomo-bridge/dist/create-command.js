import logger from 'pomomo-common/src/logger';
import { CommandMessage, ECommand } from 'pomomo-common/src/command';
export function createUpdateTimerCmd(guildId, channelId) {
    for (const arg of arguments) {
        if (!arg) {
            logger.error('command.createUpdateTimerCmd() ~ missing', arg);
            return;
        }
    }
    return new CommandMessage(ECommand.UPDATE_TIMER, { channelId: channelId }, guildId);
}
export function createGoNextStateCmd(guildId, channelId) {
    for (const arg of arguments) {
        if (!arg) {
            logger.error('command.createGoNextStateCmd() ~ missing', arg);
            return;
        }
    }
    return new CommandMessage(ECommand.GO_NEXT_STATE, { channelId: channelId }, guildId);
}
export function createCheckIdleCmd(guildId, channelId) {
    for (const arg of arguments) {
        if (!arg) {
            logger.error('command.createCheckIdleCmd() ~ missing', arg);
            return;
        }
    }
    return new CommandMessage(ECommand.CHECK_IDLE, { channelId: channelId }, guildId);
}
//# sourceMappingURL=create-command.js.map