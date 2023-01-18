import { client } from '../index';
export async function logToBridge(lvl, log) {
    try {
        await client.send({ logLvl: lvl, log: log });
    }
    catch (e) {
        console.error('logToBridge() error: ' + e);
    }
}
//# sourceMappingURL=index.js.map