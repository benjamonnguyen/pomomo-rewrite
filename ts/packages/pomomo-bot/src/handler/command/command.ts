import { CommandMessage, ECommand } from 'pomomo-common/src/command';
import handleUpdateTimer from './update-timer';

const handle = (commands: CommandMessage[]) => {
	const promises: Promise<void>[] = [];
	commands.forEach((c) => {
		switch (c.commandType) {
			case ECommand.UPDATE_TIMER:
				promises.push(handleUpdateTimer(c));
				break;
			default:
				console.error(`handler not implemented for command: ${c.commandType}`);
		}
	});

	return Promise.allSettled(promises);
};

export default handle;
