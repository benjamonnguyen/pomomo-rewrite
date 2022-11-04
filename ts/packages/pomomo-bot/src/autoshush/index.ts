import { plainToInstance } from 'class-transformer';
import sessionRepo from '../db/session-repo';
import { GuildMember, GuildMemberManager } from 'discord.js';
import { ESessionState, Session } from 'pomomo-common/src/model/session';
import {
	buildFocusMemberKey,
	FocusMember,
} from 'pomomo-common/src/model/focus-member';
import { buildSessionFocusMembersKey } from '../db/focus-member-repo';
import * as focusMemberRepo from '../db/focus-member-repo';

export async function handleAutoshush(
	session: Session,
	memberManager: GuildMemberManager,
	targetUserIds?: Set<string>,
) {
	const { focusMemberKeys, members } = await buildFocusMemberKeysAndMembers(
		session,
		memberManager,
		targetUserIds,
	);

	const autoshushPromises = [];
	const focusMembers = await sessionRepo.client.json.mGet(focusMemberKeys, '.');
	for (let i = 0; i < focusMembers.length; i++) {
		const json = focusMembers.at(i);
		if (!json) {
			continue;
		}
		const focusMember = plainToInstance(FocusMember, json);
		if (
			session.guildId != focusMember.guildId ||
			session.channelId != focusMember.channelId
		) {
			continue;
		}
		const member = members.at(i);
		if (!focusMember.serverDeaf && focusMember.deafen) {
			autoshushPromises.push(
				member.voice.setDeaf(
					session.state === ESessionState.POMODORO && session.timer.isRunning,
				),
			);
		}
		if (!focusMember.serverMute) {
			autoshushPromises.push(
				member.voice.setMute(
					session.state === ESessionState.POMODORO && session.timer.isRunning,
				),
			);
		}
	}
	await Promise.allSettled(autoshushPromises);
}

export async function endAutoshush(
	session: Session,
	memberManager: GuildMemberManager,
	targetUserIds?: Set<string>,
) {
	const { focusMemberKeys, members } = await buildFocusMemberKeysAndMembers(
		session,
		memberManager,
		targetUserIds,
	);

	const autoshushPromises = [];
	const focusMembers = await sessionRepo.client.json.mGet(focusMemberKeys, '.');
	for (let i = 0; i < focusMembers.length; i++) {
		const json = focusMembers.at(i);
		if (!json) {
			continue;
		}
		const focusMember = plainToInstance(FocusMember, json);
		if (
			session.guildId != focusMember.guildId ||
			session.channelId != focusMember.channelId
		) {
			continue;
		}
		const member = members.at(i);
		if (!focusMember.serverDeaf && focusMember.deafen) {
			autoshushPromises.push(member.voice.setDeaf(false));
		}
		if (!focusMember.serverMute) {
			autoshushPromises.push(member.voice.setMute(false));
		}
		autoshushPromises.push(focusMemberRepo.del(member.id));
		autoshushPromises.push(
			focusMemberRepo.remove(
				focusMember.guildId,
				focusMember.channelId,
				member.id,
			),
		);
	}
	await Promise.allSettled([autoshushPromises]);
}

async function buildFocusMemberKeysAndMembers(
	session: Session,
	memberManager: GuildMemberManager,
	targetUserIds?: Set<string>,
) {
	let countdown = -1;
	if (targetUserIds) {
		countdown = targetUserIds.size;
	}

	const focusMemberKeys: string[] = [];
	const members: GuildMember[] = [];
	for await (const userId of sessionRepo.client.sScanIterator(
		buildSessionFocusMembersKey(session.guildId, session.channelId),
	)) {
		if (!countdown) {
			break;
		}
		if (countdown > 0 && !targetUserIds.has(userId)) {
			countdown--;
			continue;
		}
		focusMemberKeys.push(buildFocusMemberKey(userId));
		try {
			members.push(await memberManager.fetch(userId));
		} catch (e) {
			console.error('autoshush - error', e);
		}
	}

	return { focusMemberKeys, members };
}
