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
