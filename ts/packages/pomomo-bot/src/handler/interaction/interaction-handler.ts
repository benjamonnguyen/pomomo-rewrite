import { ButtonInteraction, CommandInteraction, Interaction } from "discord.js";
import { handleInteractionError } from "../../handler/error/error-handler";
import handleCommandInteraction from '../../handler/interaction/command-interaction-handler';
import handleButtonInteraction from '../../handler/interaction/button-interaction-handler';

const handle = async (interaction: Interaction) => {
  try {
		if (interaction.isButton()) {
			await handleButtonInteraction(interaction as ButtonInteraction);
		} else if (interaction.isCommand()) {
			await handleCommandInteraction(interaction as CommandInteraction);
		}
	} catch (e) {
		await handleInteractionError(interaction, e);
	}
}

export default handle;