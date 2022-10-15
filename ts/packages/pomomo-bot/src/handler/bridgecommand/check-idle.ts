import discordClient from '../../bot';
import { CommandMessage } from 'pomomo-common/src/command';
import sessionRepo from '../../db/session-repo';
import { TextBasedChannel } from 'discord.js';
import { buildSessionKey } from 'pomomo-common/src/db/session-repo';
import { end } from '../../loadable/buttons/end';
import { playIdleResource } from '../../voice/audio-player';
import { joinVoiceChannel } from '@discordjs/voice';

async function handle(command: CommandMessage): Promise<void> {
	console.debug('check-idle.handle() ~', command.payload);

	try {
		const guild = await discordClient.guilds.fetch(command.targetGuildId);
		const channel = (await guild.channels.fetch(
			command.payload.channelId,
		)) as TextBasedChannel;

		const sessionKey = buildSessionKey(guild.id, channel.id);
		await sessionRepo.client.json.set(sessionKey, '.idleCheck', new Date());

		const msg = await channel.send({
			content: 'Are you still there? 👀',
		});
		await msg.react('👍');
		playIdleResource([
			joinVoiceChannel({
				channelId: channel.id,
				guildId: guild.id,
				adapterCreator: guild.voiceAdapterCreator,
			}),
		]).catch(console.error);
		await msg
			.awaitReactions({
				errors: ['time'],
				max: 1,
				time: 300000,
				filter: (reaction, _) => reaction.emoji.name === '👍',
			})
			.then(() => {
				msg.delete().catch(console.error);
				return Promise.all([
					sessionRepo.client.json.del(sessionKey, '.idleCheck'),
					sessionRepo.client.json.set(sessionKey, '.lastInteracted', new Date()),
				]);
			})
			.catch(() => {
				console.error('check-idle.handle() - killing idle session');
				sessionRepo
					.get(command.targetGuildId, command.payload.channelId)
					.then((session) => end(session).catch(console.error))
					.catch(console.error);
				msg.edit({ content: 'Idle session ended' }).catch(console.error);
			});
	} catch (e) {
		console.error('check-idle.handle() error', e);
	}
}

export default handle;
