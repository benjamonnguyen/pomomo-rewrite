import { ELogLevel } from 'pomomo-common/src/logger';
import { client } from '../index';

export async function logToBridge(lvl: ELogLevel, log: string) {
	try {
		await client.send({ logLvl: lvl, log: log });
	} catch (e) {
		console.error('logToBridge() error: ' + e);
	}
}

export function handleError(e: Error) {
	console.error(e);
}

export function handleRejectedSettledResults(results: PromiseSettledResult<any>[]) {
	results.forEach(r => {
		if (r.status === 'rejected') {
			console.error(r.reason);
		}
	});
}