import { CommandMessage, ECommand } from 'pomomo-common/src/command';
import handleUpdateTimer from './update-timer';
import handleGoNextState from './go-next-state';

const handle = (commands: CommandMessage[]) => {
	const promises: Promise<void>[] = [];
	commands.forEach((c) => {
		switch (c.commandType) {
			case ECommand.UPDATE_TIMER:
				promises.push(handleUpdateTimer(c));
				break;
			case ECommand.GO_NEXT_STATE:
				promises.push(handleGoNextState(c));
				break;
			default:
				console.error(`handler not implemented for command: ${c.commandType}`);
		}
	});

	return Promise.allSettled(promises).catch(console.error);
};

export default handle;
