export class FocusMember {
	deafen?: true | null;
	serverDeaf?: true | null;
	serverMute?: true | null;
}

export function buildFocusMemberKey(guildId: string, channelId: string, userId: string): string {
	return `focusMember#g${guildId}c${channelId}u${userId}`;
}
