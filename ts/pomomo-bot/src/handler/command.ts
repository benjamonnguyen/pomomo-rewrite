import {
	CommandMessage,
	ECommand,
	TimerUpdatePayload,
} from '../../../common/api/command';

const handle = (commandMsg: CommandMessage) => {
	switch (commandMsg.commandType) {
		case ECommand.TIMER_UPDATE:
			return handleTimerUpdate(commandMsg.payload);
		default:
			throw `handler not implemented for command: ${commandMsg.commandType}`;
	}
};

function handleTimerUpdate(payload: TimerUpdatePayload) {
	console.debug('command.handleTimerUpdate()');
	console.log(payload);
}

export default handle;
