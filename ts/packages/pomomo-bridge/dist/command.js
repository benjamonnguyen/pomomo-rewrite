import { CommandMessage, ECommand } from 'pomomo-common/src/command';
export function createUpdateTimerCmd(guildId, channelId) {
    for (const arg of arguments) {
        if (!arg) {
            console.error('command.createUpdateTimerCmd() ~ missing', arg);
            return;
        }
    }
    return new CommandMessage(ECommand.UPDATE_TIMER, { channelId: channelId }, guildId);
}
export function createGoNextStateCmd(guildId, channelId) {
    for (const arg of arguments) {
        if (!arg) {
            console.error('command.createGoNextStateCmd() ~ missing', arg);
            return;
        }
    }
    return new CommandMessage(ECommand.GO_NEXT_STATE, { channelId: channelId }, guildId);
}
export function checkIdle() { }
//# sourceMappingURL=command.js.map