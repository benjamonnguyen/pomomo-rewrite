import { ELogLevel } from 'pomomo-common/src/logger';
import { client } from '../index';

export async function logToBridge(lvl: ELogLevel, log: string) {
	try {
		await client.send({ logLvl: lvl, log: log });
	} catch (e) {
		console.error('logToBridge() error: ' + e);
	}
}
