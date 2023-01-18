import { handleInteractionError } from '../../handler/error/error-handler';
import handleCommandInteraction from '../../handler/interaction/command-interaction-handler';
import handleButtonInteraction from '../../handler/interaction/button-interaction-handler';
const handle = async (interaction) => {
    try {
        if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
        }
        else if (interaction.isCommand()) {
            await handleCommandInteraction(interaction);
        }
    }
    catch (e) {
        await handleInteractionError(interaction, e);
    }
};
export default handle;
//# sourceMappingURL=interaction-handler.js.map