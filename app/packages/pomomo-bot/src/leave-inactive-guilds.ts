import sessionRepo from './db/session-repo';
import { buildGuildKey } from 'pomomo-common/src/db/session-repo';
import { Guild } from 'discord.js';

const leaveInactiveGuilds = async (guilds: IterableIterator<Guild>) => {
	let leaveCount = 0;
	const guildKeys: string[] = [];
	const guildsArr: Guild[] = [];
	for (const guild of guilds) {
		guildKeys.push(buildGuildKey(guild.id));
		guildsArr.push(guild);
	}
	const dbResponse = await sessionRepo.client.json.mGet(
		guildKeys,
		'.sessionCount',
	);

	let i = 0;
	for (const guild of guildsArr) {
		const a = dbResponse.at(i++);
		if (a === null) {
			await guild.leave().then((g) => console.log('left guildId', g.id));
			leaveCount++;
		}
	}

	console.info(leaveCount, 'guilds left!');
};

export default leaveInactiveGuilds;
