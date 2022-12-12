import { plainToInstance } from 'class-transformer';
import sessionRepo from '../db/session-repo';
import { ESessionState } from 'pomomo-common';
import { buildFocusMemberKey, FocusMember, } from 'pomomo-common/src/model/focus-member';
export async function handleAutoshush(session, channel) {
    const focusMemberKeys = [];
    const members = [];
    for (const [id, member] of channel.members) {
        focusMemberKeys.push(buildFocusMemberKey(id));
        members.push(member);
    }
    const autoshushPromises = [];
    const focusMembers = await sessionRepo.client.json.mGet(focusMemberKeys, '.');
    for (let i = 0; i < focusMembers.length; i++) {
        const json = focusMembers.at(i);
        if (!json) {
            continue;
        }
        const focusMember = plainToInstance(FocusMember, json);
        const member = members.at(i);
        if (!focusMember.serverDeaf && focusMember.deafen) {
            autoshushPromises.push(member.voice.setDeaf(session.state === ESessionState.POMODORO));
        }
        if (!focusMember.serverMute) {
            autoshushPromises.push(member.voice.setMute(session.state === ESessionState.POMODORO));
        }
    }
    await Promise.allSettled(autoshushPromises);
}
//# sourceMappingURL=autoshush.js.map