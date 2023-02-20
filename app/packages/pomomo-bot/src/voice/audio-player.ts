import config from 'config';
import {
	AudioPlayer,
	AudioPlayerStatus,
	AudioResource,
	VoiceConnection,
	PlayerSubscription,
	createAudioResource,
	VoiceConnectionStatus,
} from '@discordjs/voice';
import Denque from 'denque';
import { once, EventEmitter } from 'node:events';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { ESessionState } from 'pomomo-common/src/model/session';
import { fileURLToPath } from 'url';
import discordClient from '../bot';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const START_SOUND_PATH = path.join(
	__dirname,
	'..',
	'..',
	'resources',
	'sound',
	'start.ogg',
);
const SHORT_BREAK_SOUND_PATH = path.join(
	__dirname,
	'..',
	'..',
	'resources',
	'sound',
	'short-break.ogg',
);
const LONG_BREAK_SOUND_PATH = path.join(
	__dirname,
	'..',
	'..',
	'resources',
	'sound',
	'long-break.ogg',
);
const IDLE_SOUND_PATH = path.join(
	__dirname,
	'..',
	'..',
	'resources',
	'sound',
	'idle.ogg',
);

const minPoolSize: number = config.get('voice.audioPlayer.pool.minSize');
const maxPoolSize: number = config.get('voice.audioPlayer.pool.maxSize');
const idleTimeout: number = config.get('voice.audioPlayer.pool.idleTimeoutMs');
const idleTimeoutPollRate: number = config.get(
	'voice.audioPlayer.pool.idleTimeoutPollRateMs',
);

class MyAudioPlayer extends AudioPlayer {
	lastActive = new Date();

	isTimedOut() {
		return new Date().getTime() - this.lastActive.getTime() >= idleTimeout;
	}
}

class AudioPlayerManager extends EventEmitter {
	private pool = new Denque<MyAudioPlayer>();
	private totalSize = 0;

	constructor() {
		super();
		for (let i = 0; i < minPoolSize; i++) {
			this.addPlayer();
		}
		this.pollKillTimedOutPlayers();
	}

	private killTimedOutPlayers() {
		if (this.totalSize === minPoolSize) {
			return;
		}
		let killCount = 0;
		while (!this.pool.isEmpty() && this.pool.peekFront().isTimedOut()) {
			this.pool.shift().stop();
			killCount++;
			this.totalSize--;
		}
		if (killCount) {
			console.info(
				`audioPlayerManager clusterId ${
					discordClient.cluster.id || -1
				} ~ killCount ${killCount} ~ totalSize ${this.totalSize}`,
			);
		}
	}

	private pollKillTimedOutPlayers() {
		this.killTimedOutPlayers();
		setTimeout(() => this.pollKillTimedOutPlayers(), idleTimeoutPollRate);
	}

	private addPlayer() {
		if (this.pool.length == maxPoolSize) {
			return;
		}
		const player = new MyAudioPlayer();
		player.on('error', console.error);
		player.on('stateChange', (oldState, newState) => {
			if (
				oldState.status != AudioPlayerStatus.Idle &&
				newState.status === AudioPlayerStatus.Idle
			) {
				(player['subscribers'] as PlayerSubscription[]).forEach((sub) =>
					sub.unsubscribe(),
				);
				player.lastActive = new Date();
				this.pool.push(player);
				this.emit('available');
			}
		});

		this.pool.push(player);
		this.totalSize++;
		console.info('audioPlayerManager.addPlayer() ~ totalSize', this.totalSize);
	}

	private async getAvailablePlayer(): Promise<MyAudioPlayer> {
		if (!this.pool.length) {
			if (this.totalSize < maxPoolSize) {
				this.addPlayer();
			} else {
				const now = new Date();
				await once(this, 'available');
				console.info(
					`waited ${
						(new Date().getTime() - now.getTime()) / 1000
					} seconds for availablePlayer`,
				);
			}
		}

		return new Promise((resolve) => resolve(this.pool.pop()));
	}

	public async play(resource: AudioResource, connections: VoiceConnection[]) {
		if (!connections.length || !resource) {
			console.warn('audio-player.play() bad args');
			return;
		}
		const MAX_WAIT_MS = 10000;
		const player = await this.getAvailablePlayer();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const connectionsOnceReady: Promise<any[]>[] = [];
		connections.forEach((conn) => {
			conn.subscribe(player);
			if (conn.state.status != VoiceConnectionStatus.Ready) {
				connectionsOnceReady.push(once(conn, VoiceConnectionStatus.Ready));
			}
		});

		let timeout: NodeJS.Timeout;
		return Promise.race([
			new Promise(
				(resolve) =>
					(timeout = setTimeout(() => {
						console.error(
							`audioPlayerManager.play() omitted ${
								connections.length - player.playable.length
							}/${connections.length} connections`,
						);
						resolve('timeout');
					}, MAX_WAIT_MS)),
			),
			Promise.allSettled(connectionsOnceReady).then(() =>
				clearTimeout(timeout),
			),
		]).then(() => {
			player.play(resource);
		});
	}
}

const audioPlayerManager = new AudioPlayerManager();

export function playForState(
	state: ESessionState,
	connections: VoiceConnection[],
) {
	if (!connections.length) {
		return;
	}
	console.debug(
		`audio-player.playForState() state: ${state} - ${connections.length} connections`,
	);
	let resourcePath;
	if (state === ESessionState.POMODORO) {
		resourcePath = START_SOUND_PATH;
	} else if (state === ESessionState.SHORT_BREAK) {
		resourcePath = SHORT_BREAK_SOUND_PATH;
	} else if (state === ESessionState.LONG_BREAK) {
		resourcePath = LONG_BREAK_SOUND_PATH;
	}

	if (resourcePath) {
		return audioPlayerManager.play(
			createAudioResource(createReadStream(resourcePath)),
			connections,
		);
	}
}

export function playIdleResource(connections: VoiceConnection[]) {
	if (!connections.length) {
		return;
	}
	console.debug('audio-player.playIdleResource()');
	return audioPlayerManager.play(
		createAudioResource(createReadStream(IDLE_SOUND_PATH)),
		connections,
	);
}
