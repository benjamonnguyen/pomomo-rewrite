import { CommandMessage, ECommand } from 'pomomo-common/src/command';
import handleUpdateTimer from './update-timer';
import handleGoNextState from './go-next-state';
import handleCheckIdle from './check-idle';

const handle = async (commands: CommandMessage[]) => {
	const promises: Promise<void>[] = [];
	commands.forEach((c) => {
		switch (c.commandType) {
			case ECommand.UPDATE_TIMER:
				promises.push(handleUpdateTimer(c));
				break;
			case ECommand.GO_NEXT_STATE:
				promises.push(handleGoNextState(c));
				break;
			case ECommand.CHECK_IDLE:
				promises.push(handleCheckIdle(c));
				break
			default:
				console.error(`handler not implemented for command: ${c.commandType}`);
		}
	});

	try {
		return await Promise.allSettled(promises);
	} catch (message) {
		return console.error(message);
	}
};

export default handle;
