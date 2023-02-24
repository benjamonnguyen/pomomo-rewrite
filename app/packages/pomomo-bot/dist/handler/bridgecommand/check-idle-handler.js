import discordClient from '../../bot';
import sessionRepo from '../../db/session-repo';
import { buildSessionKey } from 'pomomo-common/src/db/session-repo';
import { end } from '../../loadable/buttons/end-button';
import { playIdleResource } from '../../voice/audio-player';
import { joinVoiceChannel } from '@discordjs/voice';
import { handleRejectedSettledResults } from '../../logger';
async function handle(command) {
    console.debug('check-idle.handle() ~', command.payload);
    try {
        const guild = await discordClient.guilds.fetch(command.targetGuildId);
        const channel = (await guild.channels.fetch(command.payload.channelId));
        const sessionKey = buildSessionKey(guild.id, channel.id);
        await sessionRepo.client.json.set(sessionKey, '.idleCheck', new Date());
        const msg = await channel.send({
            content: 'Are you still there? 👀',
        });
        let conn = null;
        try {
            conn = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
            });
        }
        catch (e) {
            console.warn('check-idle.handle() - failed to get voiceConnection');
        }
        const results = await Promise.allSettled([
            msg.react('👍'),
            playIdleResource(conn),
        ]);
        await msg
            .awaitReactions({
            errors: ['time'],
            max: 1,
            time: 300000,
            filter: (reaction, _) => reaction.emoji.name === '👍',
        })
            .then(async () => {
            results.push(...(await Promise.allSettled([
                msg.delete(),
                sessionRepo.client.json.del(sessionKey, '.idleCheck'),
                sessionRepo.client.json.set(sessionKey, '.lastInteracted', new Date()),
            ])));
        })
            .catch(async () => {
            const session = await sessionRepo.get(command.targetGuildId, command.payload.channelId);
            console.info('check-idle.handle() - killing idle session', session.id);
            results.push(...(await Promise.allSettled([
                end(session),
                msg.edit({ content: 'Idle session ended' }),
            ])));
        });
        handleRejectedSettledResults(results);
    }
    catch (e) {
        console.error('check-idle.handle() error', e);
        sessionRepo
            .get(command.targetGuildId, command.payload.channelId)
            .then((session) => end(session).catch(console.error))
            .catch(console.error);
    }
}
export default handle;
//# sourceMappingURL=check-idle-handler.js.map