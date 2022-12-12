import sessionRepo from '../../db/session-repo';
import { ButtonBuilder, ButtonStyle, } from 'discord.js';
import { editEnd } from '../../message/session-message';
import { getVoiceConnection } from '@discordjs/voice';
import { endAutoshush } from '../../autoshush';
export const BUTTON_ID = 'endBtn';
export const endBtn = () => {
    return new ButtonBuilder()
        .setCustomId(BUTTON_ID)
        .setStyle(ButtonStyle.Danger)
        .setLabel('End');
};
export const execute = async (interaction) => {
    try {
        const session = await sessionRepo.get(interaction.guildId, interaction.channelId);
        await end(session, interaction.guild.members);
    }
    catch (e) {
        console.error('end.execute() ~', e);
        interaction
            .reply({
            content: 'Something went wrong while ending session...',
        })
            .catch(console.error);
    }
};
export async function end(session, memberManager) {
    const promises = [];
    if (memberManager) {
        promises.push(endAutoshush(session, memberManager));
    }
    promises.push([editEnd(session), sessionRepo.delete(session.id)]);
    const res = await Promise.allSettled(promises);
    res.forEach((r) => {
        if (r.status === 'rejected') {
            console.error('end-button.end() - error', r.reason);
        }
    });
    try {
        const conn = getVoiceConnection(session.guildId);
        if (conn) {
            conn.destroy();
        }
    }
    catch (e) {
        console.error('end.end()', e);
    }
}
//# sourceMappingURL=end-button.js.map