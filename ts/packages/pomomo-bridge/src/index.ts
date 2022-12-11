import 'reflect-metadata';
import bridge from './bridge';
import sessionRepo from './db/session-repo';
import { job } from './scheduler';

bridge
	.start()
	.then((b) => console.info(`bridge started: ${JSON.stringify(b, null, 2)}`));

job.start();
console.info('started scheduler job!');

const gracefulShutdown = () => {
	console.info('Starting graceful shutdown...');
	const a = bridge.close().then(() => console.info('bridge closed!'));
	const b = sessionRepo.client
		.quit()
		.then(() => console.info('sessionsClient quitted!'));
	Promise.allSettled([a, b]);
	setTimeout(() => {
		console.info('gracefulShutdown timed out!');
		process.exit();
	}, 2000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export {};
