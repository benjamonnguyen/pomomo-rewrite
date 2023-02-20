import { client } from '../index';
export async function logToBridge(lvl, log) {
    try {
        await client.send({ logLvl: lvl, log: log });
    }
    catch (e) {
        console.error('logToBridge() error: ' + e);
    }
}
export function handleError(e) {
    console.error(e);
}
export function handleRejectedSettledResults(results) {
    results.forEach(r => {
        if (r.status === 'rejected') {
            console.error(r.reason);
        }
    });
}
//# sourceMappingURL=index.js.map