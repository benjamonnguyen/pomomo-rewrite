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

const START_SOUND_PATH = path.join('resources', 'sound', 'start.ogg');

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
		console.info(
			`audioPlayerManager.killTimedOutPlayers() ~ killCount ${killCount} ~ totalSize ${this.totalSize}`,
		);
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
		// TODO ensure player won't be GC'ed while popped;

		this.pool.push(player);
		this.totalSize++;
		console.info('audioPlayerManager.addPlayer() ~ totalSize', this.totalSize);
	}

	private async getAvailablePlayer(): Promise<MyAudioPlayer> {
		if (!this.pool.length) {
			if (this.totalSize < maxPoolSize) {
				this.addPlayer();
			} else {
				await once(this, 'available');
			}
		}

		return new Promise((resolve) => resolve(this.pool.pop()));
	}

	public async play(resource: AudioResource, connections: VoiceConnection[]) {
		const MAX_WAIT_MS = 5000;
		const player = await this.getAvailablePlayer();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const connectionsOnceReady: Promise<any[]>[] = [];
		connections.forEach((conn) => {
			conn.subscribe(player);
			if (conn.state.status != VoiceConnectionStatus.Ready) {
				connectionsOnceReady.push(once(conn, VoiceConnectionStatus.Ready));
			}
		});

		return Promise.race([
			new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS)),
			Promise.allSettled(connectionsOnceReady),
		]).then(() => player.play(resource));
	}
}

const audioPlayerManager = new AudioPlayerManager();

export const playStartResource = async (connections: VoiceConnection[]) => {
	console.log('audio-player.playStartResource()');
	const resource = createAudioResource(createReadStream(START_SOUND_PATH));
	return audioPlayerManager.play(resource, connections);
};
