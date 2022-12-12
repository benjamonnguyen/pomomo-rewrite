import config from 'config';
import { AudioPlayer, AudioPlayerStatus, createAudioResource, VoiceConnectionStatus, } from '@discordjs/voice';
import Denque from 'denque';
import { once, EventEmitter } from 'node:events';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { ESessionState } from 'pomomo-common/src/model/session';
const START_SOUND_PATH = path.join('resources', 'sound', 'start.ogg');
const SHORT_BREAK_SOUND_PATH = path.join('resources', 'sound', 'short-break.ogg');
const LONG_BREAK_SOUND_PATH = path.join('resources', 'sound', 'long-break.ogg');
const IDLE_SOUND_PATH = path.join('resources', 'sound', 'idle.ogg');
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
        console.info(`audioPlayerManager.killTimedOutPlayers() ~ killCount ${killCount} ~ totalSize ${this.totalSize}`);
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
                await once(this, 'available');
            }
        }
        return new Promise((resolve) => resolve(this.pool.pop()));
    }
    async play(resource, connections) {
        if (!connections.length || !resource) {
            return;
        }
        const MAX_WAIT_MS = 5000;
        const player = await this.getAvailablePlayer();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const connectionsOnceReady = [];
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
export function playForState(state, connections) {
    if (!connections.length) {
        return;
    }
    console.debug('audio-player.playForState()', state.toString());
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
        return audioPlayerManager.play(createAudioResource(createReadStream(resourcePath)), connections);
    }
}
export function playIdleResource(connections) {
    if (!connections.length) {
        return;
    }
    console.debug('audio-player.playIdleResource()');
    return audioPlayerManager.play(createAudioResource(createReadStream(IDLE_SOUND_PATH)), connections);
}
//# sourceMappingURL=audio-player.js.map