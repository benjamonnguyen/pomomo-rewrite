export class FocusMember {
    deafen;
    serverDeaf;
    serverMute;
    guildId;
    channelId;
    messageId;
    channelName;
}
export function buildFocusMemberKey(userId) {
    return `focusMember#u${userId}`;
}
//# sourceMappingURL=focus-member.js.map