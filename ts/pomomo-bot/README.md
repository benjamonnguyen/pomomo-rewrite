# Pomomo Bot

## Loadables
"Loadables" are files containing a Discord Interaction's configuration and handler function.

Extensions to the bot should ideally be limited to adding files to the "./loadable" directory. These files should have the required exports and will be dynamically loaded when the bot starts up.

### Adding new commands
Add new file for the command to the "./loadable/commands" directory with required exports `{ command: SlashCommandBuilder, execute: (interaction: CommandInteraction) => Promise<void> }`

### Adding new buttons
Add new file for the new button to the "./loadable/buttons" directory with required exports `{ BUTTON_ID: string, execute: (interaction: ButtonInteraction) => Promise<void> }`