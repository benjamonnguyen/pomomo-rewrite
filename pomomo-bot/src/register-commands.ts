import 'reflect-metadata';
import { Routes } from 'discord.js';
import { REST } from '@discordjs/rest';
import config from 'config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'url';

const commands = [];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((p) => p.endsWith('.js'));

for (const file of commandFiles) {
	const { command } = await import(path.join(commandsPath, file));
	commands.push(command.toJSON());
}

const rest = new REST({ version: '10' }).setToken(config.get('botToken'));

rest.put(Routes.applicationCommands(config.get('clientId')), { body: commands })
	.then((data) => {
		console.info(JSON.stringify(data, null, 2));
		process.exit();
	})
	.catch(console.error);

export {};
