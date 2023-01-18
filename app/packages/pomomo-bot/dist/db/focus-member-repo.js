import { instanceToPlain, plainToInstance } from 'class-transformer';
import { buildFocusMemberKey, FocusMember, } from 'pomomo-common/src/model/focus-member';
import sessionRepo from './session-repo';
export async function get(userId) {
    const key = buildFocusMemberKey(userId);
    return plainToInstance(FocusMember, await sessionRepo.client.json.get(key));
}
export async function set(userId, focusMember) {
    const key = buildFocusMemberKey(userId);
    await sessionRepo.client.json.set(key, '.', instanceToPlain(focusMember));
}
export async function add(guildId, channelId, userId) {
    const key = buildSessionFocusMembersKey(guildId, channelId);
    await sessionRepo.client.sAdd(key, userId);
}
export async function remove(guildId, channelId, userId) {
    const key = buildSessionFocusMembersKey(guildId, channelId);
    console.info('focus-member-repo.remove -', key);
    await sessionRepo.client.sRem(key, userId);
}
export async function del(userId) {
    const key = buildFocusMemberKey(userId);
    console.info('focus-member-repo.del -', key);
    return await sessionRepo.client.json.del(key);
}
export async function toggleDeafen(userId) {
    const key = buildFocusMemberKey(userId);
    const deafen = await sessionRepo.client.json.get(key, {
        path: '.deafen',
    });
    await sessionRepo.client.json.set(key, '.deafen', !deafen);
    return Promise.resolve(!deafen);
}
export function buildSessionFocusMembersKey(guildId, channelId) {
    return `session:info#g${guildId}c${channelId}:focusMembers`;
}
//# sourceMappingURL=focus-member-repo.js.map