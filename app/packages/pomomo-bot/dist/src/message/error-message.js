import config from 'config';
import { Colors, EmbedBuilder } from 'discord.js';
const SUPPORT_SERVER_URL = config.get('url.supportServer');
export const buildErrorEmbed = () => {
    return new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription(`Something went wrong...\nPlease reach out to us on the [support server](${SUPPORT_SERVER_URL}) if the issue persists.`);
};
//# sourceMappingURL=error-message.js.map