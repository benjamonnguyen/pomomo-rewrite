export interface FocusMember {
	id: string;
	mute_only?: true | null;
	voiceState: { serverDeaf: true | null; serverMute: true | null };
}
