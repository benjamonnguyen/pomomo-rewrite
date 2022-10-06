import express, { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import {
	ECommand,
	CommandMessage,
	TimerUpdatePayload,
} from '../../common/api/command';
import bridge from './bridge';

export const app = initializeExpressApp();

app.put('/timer', (req, res) => {
	const commands: CommandMessage[] = [];
	req.body.forEach(
		(c: { targetGuildId: string; payload: TimerUpdatePayload }) =>
			commands.push({
				targetGuildId: c.targetGuildId as string,
				payload: c.payload as TimerUpdatePayload,
				commandType: ECommand.TIMER_UPDATE,
			}),
	);
	bridge
		.sendCommands(commands)
		.then((e) => res.send(e))
		.catch((e) => res.send(e));
});

// goNextState

// TODO checkIdle

// TODO handleIdle

function initializeExpressApp(): Express {
	const expressApp = express();
	expressApp.use(helmet());
	expressApp.use(bodyParser.json());
	expressApp.use(cors());
	expressApp.use(morgan('dev'));

	return expressApp;
}
