import config from 'config';
import { AudioPlayer, AudioPlayerStatus, createAudioResource, VoiceConnectionStatus, } from '@discordjs/voice';
import Denque from 'denque';
import { once, EventEmitter } from 'node:events';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { ESessionState } from 'pomomo-common/src/model/session';
import { fileURLToPath } from 'url';
import discordClient from '../bot';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const START_SOUND_PATH = path.join(__dirname, '..', '..', 'resources', 'sound', 'start.ogg');
const SHORT_BREAK_SOUND_PATH = path.join(__dirname, '..', '..', 'resources', 'sound', 'short-break.ogg');
const LONG_BREAK_SOUND_PATH = path.join(__dirname, '..', '..', 'resources', 'sound', 'long-break.ogg');
const IDLE_SOUND_PATH = path.join(__dirname, '..', '..', 'resources', 'sound', 'idle.ogg');
const minPoolSize = config.get('voice.audioPlayer.pool.minSize');
const maxPoolSize = config.get('voice.audioPlayer.pool.maxSize');
const idleTimeout = config.get('voice.audioPlayer.pool.idleTimeoutMs');
const idleTimeoutPollRate = config.get('voice.audioPlayer.pool.idleTimeoutPollRateMs');
class MyAudioPlayer extends AudioPlayer {
    lastActive = new Date();
    isTimedOut() {
        return new Date().getTime() - this.lastActive.getTime() >= idleTimeout;
    }
}
class AudioPlayerManager extends EventEmitter {
    pool = new Denque();
    totalSize = 0;
    constructor() {
        super();
        for (let i = 0; i < minPoolSize; i++) {
            this.addPlayer();
        }
        this.pollKillTimedOutPlayers();
    }
    killTimedOutPlayers() {
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
            console.info(`audioPlayerManager clusterId ${discordClient.cluster.id || -1} ~ killCount ${killCount} ~ totalSize ${this.totalSize}`);
        }
    }
    pollKillTimedOutPlayers() {
        this.killTimedOutPlayers();
        setTimeout(() => this.pollKillTimedOutPlayers(), idleTimeoutPollRate);
    }
    addPlayer() {
        if (this.pool.length == maxPoolSize) {
            return;
        }
        const player = new MyAudioPlayer();
        player.on('error', console.error);
        player.on('stateChange', (oldState, newState) => {
            if (oldState.status != AudioPlayerStatus.Idle &&
                newState.status === AudioPlayerStatus.Idle) {
                player['subscribers'].forEach((sub) => sub.unsubscribe());
                player.lastActive = new Date();
                this.pool.push(player);
                this.emit('available');
            }
        });
        this.pool.push(player);
        this.totalSize++;
        console.info('audioPlayerManager.addPlayer() ~ totalSize', this.totalSize);
    }
    async getAvailablePlayer() {
        if (!this.pool.length) {
            if (this.totalSize < maxPoolSize) {
                this.addPlayer();
            }
            else {
                const now = new Date();
                await once(this, 'available');
                console.info(`waited ${(new Date().getTime() - now.getTime()) / 1000} seconds for availablePlayer`);
            }
        }
        return new Promise((resolve) => resolve(this.pool.pop()));
    }
    async play(resource, connection) {
        if (!connection || !resource) {
            console.warn('audio-player.play() bad args');
            return;
        }
        const MAX_WAIT_MS = 10000;
        const player = await this.getAvailablePlayer();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const connectionsOnceReady = [];
        connection.subscribe(player);
        if (connection.state.status != VoiceConnectionStatus.Ready) {
            connectionsOnceReady.push(once(connection, VoiceConnectionStatus.Ready));
        }
        let timeout;
        await Promise.race([
            new Promise((_, reject) => (timeout = setTimeout(() => {
                console.error('audioPlayerManager.play() timeout!');
                reject('timeout');
            }, MAX_WAIT_MS))),
            Promise.allSettled(connectionsOnceReady).then(() => clearTimeout(timeout)),
        ]);
        player.play(resource);
    }
}
const audioPlayerManager = new AudioPlayerManager();
export function playForState(state, connection) {
    if (!connection) {
        return;
    }
    console.debug(`audio-player.playForState() state: ${state}`);
    let resourcePath;
    if (state === ESessionState.POMODORO) {
        resourcePath = START_SOUND_PATH;
    }
    else if (state === ESessionState.SHORT_BREAK) {
        resourcePath = SHORT_BREAK_SOUND_PATH;
    }
    else if (state === ESessionState.LONG_BREAK) {
        resourcePath = LONG_BREAK_SOUND_PATH;
    }
    if (resourcePath) {
        return audioPlayerManager.play(createAudioResource(createReadStream(resourcePath)), connection);
    }
}
export function playIdleResource(connection) {
    if (!connection) {
        return;
    }
    console.debug('audio-player.playIdleResource()');
    return audioPlayerManager.play(createAudioResource(createReadStream(IDLE_SOUND_PATH)), connection);
}
//# sourceMappingURL=audio-player.js.map