import { SlashCommandBuilder, Routes } from 'discord.js';
import { REST } from '@discordjs/rest';
import config from 'config';

const startCmd = new SlashCommandBuilder()
	.setName('start')
	.setDescription('Start a Pomodoro session!')
	.addIntegerOption(opt => opt
		.setName('pomodoro')
		.setDescription(`Default: ${config.get('command.start.pomodoro.default')}`)
		.setMinValue(1)
		.setMaxValue(config.get('command.start.max')),
	)
	.addIntegerOption(opt => opt
		.setName('short_break')
		.setDescription(`Default: ${config.get('command.start.shortBreak.default')}`)
		.setMinValue(1)
		.setMaxValue(config.get('command.start.max')),
	)
	.addIntegerOption(opt => opt
		.setName('long_break')
		.setDescription(`Default: ${config.get('command.start.longBreak.default')}`)
		.setMinValue(1)
		.setMaxValue(config.get('command.start.max')),
	)
	.addIntegerOption(opt => opt
		.setName('intervals')
		.setDescription(`Default: ${config.get('command.start.intervals.default')}`)
		.setMinValue(1)
		.setMaxValue(config.get('command.start.max')),
	);

const commands = [
	startCmd,
]
	.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.get('botToken'));

rest.put(Routes.applicationCommands(config.get('clientId')), { body: commands })
	.then(data => console.log(JSON.stringify(data, null, 2)))
	.catch(console.error);

export {};