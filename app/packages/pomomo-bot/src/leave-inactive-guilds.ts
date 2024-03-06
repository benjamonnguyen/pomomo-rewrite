import sessionRepo from './db/session-repo';
import { buildGuildKey } from 'pomomo-common/src/db/session-repo';
import { Guild } from 'discord.js';
import { MyDiscordClient } from './bot';

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

const leaveGuilds = async (client: MyDiscordClient) => {
	const activeGuildIds = new Set([
		'1013286653722361876',
		'1077328457471643739',
		'169075182772682753',
		'171070323230375937',
		'176164023199334401',
		'179728247104208896',
		'216414763104600084',
		'219273973412790272',
		'233068738386198539',
		'245187706160676865',
		'249954352825892864',
		'278041093386534914',
		'289392370422644736',
		'300777083284488193',
		'306703511196925952',
		'312424171617386496',
		'349315950127874048',
		'350110704264675328',
		'352185210764525570',
		'357005374362222603',
		'384790242948808706',
		'480940947295830027',
		'534267161506611200',
		'539800670652465193',
		'545866241655439360',
		'555976034953068544',
		'617418407058604042',
		'635271422226464778',
		'690725718572793926',
		'710239128591269951',
		'716067912443494472',
		'778818593893908511',
		'781593548717424660',
		'816402005265219656',
		'857170168157044766',
		'87348301220835328',
		'890281692496003093',
		'901571518167924807',
		'920680176755556454',
		'921343052080119808',
		'925263308855070730',
		'930421947811131412',
		'951474134561468467',
	]);

	const leavePromises: Array<Promise<void | Guild>> = [];

	client.guilds.cache.forEach(guild => {
		if (!activeGuildIds.has(guild.id)) {
			console.info(guild.id);
			leavePromises.push(
				guild
					.leave()
					.catch(() => console.error('Failed to leave guildId: ' + guild.id)),
			);
		}
	});

	console.info(await Promise.allSettled(leavePromises));
};

export { leaveInactiveGuilds, leaveGuilds };
