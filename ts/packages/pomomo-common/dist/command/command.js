export var ECommand;
(function (ECommand) {
    ECommand[ECommand["UPDATE_TIMER"] = 0] = "UPDATE_TIMER";
    ECommand[ECommand["GO_NEXT_STATE"] = 1] = "GO_NEXT_STATE";
    ECommand[ECommand["CHECK_IDLE"] = 2] = "CHECK_IDLE";
})(ECommand || (ECommand = {}));
export class CommandMessage {
    commandType;
    payload;
    targetGuildId;
    options;
    constructor(commandType, payload, targetGuildId, options) {
        this.commandType = commandType;
        this.payload = payload;
        this.targetGuildId = targetGuildId;
        this.options = options;
    }
    toString() {
        return `{commandType: ${ECommand[this.commandType]}, targetGuildId: ${this.targetGuildId}}`;
    }
}
//# sourceMappingURL=command.js.map