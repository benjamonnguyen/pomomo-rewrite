import { ActionRowBuilder } from 'discord.js';
import { toggleDeafenBtn } from '../loadable/buttons/toggle-deafen-button';
import { exitFocusBtn } from '../loadable/buttons/exit-focus-button';
export function buildFocusMessage(channelName, deafen) {
    return {
        content: `Focus mode activated in ${channelName} channel!`,
        components: [buildActionRow(deafen)],
    };
}
function buildActionRow(deafen) {
    return new ActionRowBuilder().addComponents([
        toggleDeafenBtn(deafen),
        exitFocusBtn(),
    ]);
}
//# sourceMappingURL=focus-message.js.map