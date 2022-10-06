import {
	CommandMessage,
	ECommand,
} from '../../../common/src/command';

const handle = (commands: CommandMessage[]) => {
	const promises: Promise<void>[] = [];
	commands.forEach((c) => {
		switch (c.commandType) {
			case ECommand.TIMER_UPDATE:
				promises.push(handleTimerUpdate(c));
				break;
			default:
				console.error(`handler not implemented for command: ${c.commandType}`);
		}
	});

	return Promise.allSettled(promises);
};

function handleTimerUpdate(command: CommandMessage) {
	console.debug('command.handleTimerUpdate() ~', command.payload);
	return Promise.resolve();
}

export default handle;
