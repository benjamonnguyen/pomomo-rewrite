export class FocusMember {
	deafen: boolean;
	serverDeaf?: true;
	serverMute?: true;
	messageId: string;
	channelName: string;
}

export function buildFocusMemberKey(userId: string): string {
	return `focusMember#u${userId}`;
}
