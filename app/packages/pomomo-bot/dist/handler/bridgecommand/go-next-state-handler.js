import { playForState } from '../../voice/audio-player';
import sessionRepo from '../../db/session-repo';
import { update } from '../../message/session-message';
import { joinVoiceChannel } from '@discordjs/voice';
import discordClient from '../../bot';
// import { handleAutoshush } from '../../autoshush';
async function handle(command) {
    console.debug('go-next-state.handle() ~', command.payload);
    const guild = await discordClient.guilds.fetch(command.targetGuildId);
    const session = await sessionRepo.get(command.targetGuildId, command.payload.channelId);
    session.goNextState();
    await sessionRepo.set(session);
    // TODO await handleAutoshush(session, guild.members);
    const conn = joinVoiceChannel({
        channelId: session.channelId,
        guildId: session.guildId,
        adapterCreator: guild.voiceAdapterCreator,
    });
    await Promise.allSettled([update(session), playForState(session.state, [conn])]);
}
export default handle;
//# sourceMappingURL=go-next-state-handler.js.map