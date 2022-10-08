import 'reflect-metadata';
import bridge from './bridge';
import { app } from './api';
import config from 'config';
import sessionRepo from './db/session-repo';
import { job } from './scheduler';

const PORT = config.get('api.port');

bridge
	.start()
	.then((b) => console.info(`bridge started: ${JSON.stringify(b, null, 2)}`));

app.listen(PORT, () => console.info('expressApp listening on port', PORT));

job.start();

const gracefulShutdown = () => {
	console.info('Starting graceful shutdown...');
	bridge
		.close()
		.then(() => console.info('bridge closed!'))
		.catch(console.error);
	sessionRepo._client
		.quit()
		.then(() => console.info('sessionsClient quitted!'))
		.catch(console.error);
	setTimeout(process.exit(), 2000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export {};
