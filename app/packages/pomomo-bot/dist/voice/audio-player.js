import config from 'config';
import { v4 } from 'uuid';
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
    id = v4();
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
        return new Promise((resolve) => {
            const player = this.pool.pop();
            resolve(player);
        });
    }
    async play(resource, connection) {
        if (!connection || !resource) {
            console.warn('audio-player.play() bad args');
            return;
        }
        // wait for up to 30s for voiceConnection to be ready
        const MAX_RETRIES = 6;
        const RETRY_INTERVAL_MS = 5000;
        let retries = 0;
        while (connection.state.status !== VoiceConnectionStatus.Ready) {
            if (retries++ === MAX_RETRIES) {
                throw 'timeout';
            }
            await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS));
        }
        const player = await this.getAvailablePlayer();
        connection.subscribe(player);
        player.play(resource);
        console.debug('audio-player.play() id:', player.id);
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