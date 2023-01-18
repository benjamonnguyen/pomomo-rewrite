import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const loadCommands = (client) => {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((f) => f.endsWith('.js'));
    for (const file of commandFiles) {
        import(path.join(commandsPath, file)).then(({ command, execute }) => {
            if (!command || !execute) {
                throw `${file} file does not contain required exports`;
            }
            if (client.commands.has(command.name)) {
                throw 'Conflict of commandName: ' + command.name;
            }
            client.commands.set(command.name, execute);
            console.info(`Added command: ${command.name}`);
        });
    }
};
export const loadButtons = (client) => {
    const buttonsPath = path.join(__dirname, 'buttons');
    const buttonFiles = fs
        .readdirSync(buttonsPath)
        .filter((f) => f.endsWith('.js'));
    for (const file of buttonFiles) {
        import(path.join(buttonsPath, file)).then(({ BUTTON_ID, execute }) => {
            if (!BUTTON_ID || !execute) {
                throw `${file} file does not contain required exports`;
            }
            if (client.buttons.has(BUTTON_ID)) {
                throw 'Conflict of buttonId: ' + BUTTON_ID;
            }
            client.buttons.set(BUTTON_ID, execute);
            console.info(`Added button: ${BUTTON_ID}`);
        });
    }
};
//# sourceMappingURL=loader.js.map