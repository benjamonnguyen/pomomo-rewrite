export declare class FocusMember {
    deafen: boolean;
    serverDeaf?: true;
    serverMute?: true;
    guildId: string;
    channelId: string;
    messageId: string;
    channelName: string;
}
export declare function buildFocusMemberKey(userId: string): string;
