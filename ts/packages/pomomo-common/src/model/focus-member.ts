export class FocusMember {
	deafen: boolean;
	serverDeaf?: true;
	serverMute?: true;
	guildId: string;
	channelId: string;
	messageId: string;
	channelName: string;
}

export function buildFocusMemberKey(userId: string): string {
	return `focusMember#u${userId}`;
}
