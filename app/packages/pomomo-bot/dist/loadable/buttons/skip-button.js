import sessionRepo from '../../db/session-repo';
import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { update } from '../../message/session-message';
export const BUTTON_ID = 'skipBtn';
export const skipBtn = () => {
    return new ButtonBuilder()
        .setCustomId(BUTTON_ID)
        .setStyle(ButtonStyle.Primary)
        .setLabel('Skip');
};
export const execute = async (interaction) => {
    try {
        await interaction.deferUpdate();
        const session = await sessionRepo.get(interaction.guildId, interaction.channelId);
        await skip(session);
    }
    catch (e) {
        console.error('skip.execute() ~', e);
        interaction
            .reply({
            content: 'Something went wrong while skipping interval...',
        })
            .catch(console.error);
    }
};
export async function skip(session) {
    session.goNextState(true);
    const res = await Promise.allSettled([
        sessionRepo.set(session),
        update(session),
        // handleAutoshush(session, memberManager),
    ]);
    res.forEach((r) => {
        if (r.status === 'rejected') {
            console.error('skip-button.skip() - error', r.reason);
        }
    });
}
//# sourceMappingURL=skip-button.js.map