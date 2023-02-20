import config from 'config';
import discordClient from '../../bot';
import { CommandMessage } from 'pomomo-common/src/command';
import sessionRepo from '../../db/session-repo';
import { TextBasedChannel } from 'discord.js';
import { buildSessionKey } from 'pomomo-common/src/db/session-repo';
import { end } from '../../loadable/buttons/end-button';
import { playIdleResource } from '../../voice/audio-player';
import { joinVoiceChannel } from '@discordjs/voice';
import { shardIdForGuildId } from 'pomomo-common/src/util/shard-util';
import { handleRejectedSettledResults } from '../../logger';

const TOTAL_SHARDS = config.get('bridge.totalShards') as number;

async function handle(command: CommandMessage): Promise<void> {
	console.debug('check-idle.handle() ~', command.payload);

	try {
		const guild = await discordClient.guilds.fetch(command.targetGuildId);
		if (guild.shardId == undefined) {
			guild.shardId = shardIdForGuildId(
				parseInt(command.targetGuildId),
				TOTAL_SHARDS,
			);
		}
		const channel = (await guild.channels.fetch(
			command.payload.channelId,
		)) as TextBasedChannel;

		const sessionKey = buildSessionKey(guild.id, channel.id);
		await sessionRepo.client.json.set(sessionKey, '.idleCheck', new Date());

		const msg = await channel.send({
			content: 'Are you still there? 👀',
		});
		const results: Array<PromiseSettledResult<any>> = await Promise.allSettled([
			msg.react('👍'),
			playIdleResource([
				joinVoiceChannel({
					channelId: channel.id,
					guildId: guild.id,
					adapterCreator: guild.voiceAdapterCreator,
				}),
			]),
		]);
		await msg
			.awaitReactions({
				errors: ['time'],
				max: 1,
				time: 300000,
				filter: (reaction, _) => reaction.emoji.name === '👍',
			})
			.then(async () => {
				results.push(
					...(await Promise.allSettled([
						msg.delete(),
						sessionRepo.client.json.del(sessionKey, '.idleCheck'),
						sessionRepo.client.json.set(
							sessionKey,
							'.lastInteracted',
							new Date(),
						),
					])),
				);
			})
			.catch(async () => {
				const session = await sessionRepo.get(
					command.targetGuildId,
					command.payload.channelId,
				);
				console.info('check-idle.handle() - killing idle session', session.id);
				results.push(
					...(await Promise.allSettled([
						end(session),
						msg.edit({ content: 'Idle session ended' }),
					])),
				);
			});

		handleRejectedSettledResults(results);
	} catch (e) {
		console.error('check-idle.handle() error', e);
		sessionRepo
			.get(command.targetGuildId, command.payload.channelId)
			.then((session) => end(session).catch(console.error))
			.catch(console.error);
	}
}

export default handle;
