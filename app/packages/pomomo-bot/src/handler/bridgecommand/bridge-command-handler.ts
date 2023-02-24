/* eslint-disable indent */
import { CommandMessage, ECommand } from 'pomomo-common/src/command';
import handleGoNextState from './go-next-state-handler';
import handleCheckIdle from './check-idle-handler';
import handleUpdateTimer from './update-timer-handler';
import { handleError } from '../../logger';

const handle = async (commands: CommandMessage[]) => {
	const updateTimerList: CommandMessage[] = [];
	const goNextStateList: CommandMessage[] = [];
	// const checkIdleList: CommandMessage[] = [];
	commands.forEach((c) => {
		switch (c.commandType) {
			case ECommand.UPDATE_TIMER:
				updateTimerList.push(c);
				break;
			case ECommand.GO_NEXT_STATE:
				goNextStateList.push(c);
				break;
			case ECommand.CHECK_IDLE:
				// checkIdleList.push(c);
				handleCheckIdle(c).catch(handleError);
				break;
			default:
				console.error(`handler not implemented for command: ${c.commandType}`);
		}
	});
	const res = await Promise.allSettled([
		handleUpdateTimer(updateTimerList),
		handleGoNextState(goNextStateList),
		// handleCheckIdle(checkIdleList),
	]);

	res.forEach((r) => {
		if (r.status === 'rejected') {
			console.error(
				'----------\nbridge-command-handler error',
				r.reason,
				'\n----------',
			);
		}
	});
};

export default handle;
