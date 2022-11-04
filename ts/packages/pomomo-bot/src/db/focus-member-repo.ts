import { instanceToPlain, plainToInstance } from 'class-transformer';
import {
	buildFocusMemberKey,
	FocusMember,
} from 'pomomo-common/src/model/focus-member';
import sessionRepo from './session-repo';

export async function get(userId: string): Promise<FocusMember> {
	const key = buildFocusMemberKey(userId);
	return plainToInstance(FocusMember, await sessionRepo.client.json.get(key));
}

export async function set(userId: string, focusMember: FocusMember) {
	const key = buildFocusMemberKey(userId);
	await sessionRepo.client.json.set(key, '.', instanceToPlain(focusMember));
}

export async function add(guildId: string, channelId: string, userId: string) {
	const key = buildSessionFocusMembersKey(guildId, channelId);
	await sessionRepo.client.sAdd(key, userId);
}

export async function remove(guildId: string, channelId: string, userId: string) {
	const key = buildSessionFocusMembersKey(guildId, channelId);
	await sessionRepo.client.sRem(key, userId);
}

export async function del(userId: string): Promise<number> {
	const key = buildFocusMemberKey(userId);
	return await sessionRepo.client.json.del(key);
}

export async function toggleDeafen(userId: string): Promise<boolean> {
	const key = buildFocusMemberKey(userId);
	const deafen = await sessionRepo.client.json.get(key, {
		path: '.deafen',
	});
	await sessionRepo.client.json.set(key, '.deafen', !deafen);

	return Promise.resolve(!deafen);
}

export function buildSessionFocusMembersKey(guildId: string, channelId: string) {
	return `session:info#g${guildId}c${channelId}:focusMembers`;
}
