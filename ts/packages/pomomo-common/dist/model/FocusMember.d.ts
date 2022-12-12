export interface FocusMember {
    id: string;
    mute_only?: true | null;
    serverDeaf?: true | null;
    serverMute?: true | null;
}
export declare function buildFocusMemberKey(): any;
