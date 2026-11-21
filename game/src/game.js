// game.js — the state machine and the loop.
// One job: own the screens (title, playing, paused, level clear,
// caught, victory), update everything each frame, and keep score.

import { LEVELS, parseLevel } from './levels.js';
import { Guard, GUARD_STATE } from './guards.js';
import { Player } from './player.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { SoundFX } from './audio.js';
import {
  ALERTED_AT,
  CATCH_DISTANCE,
  GRACE_AFTER_CAUGHT,
  TILE,
  VIEW_W,
  VIEW_H,
} from './config.js';

export const SCREEN = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_CLEAR: 'levelclear',
  CAUGHT: 'caught',
  VICTORY: 'victory',
};

export class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas);
    this.sfx = new SoundFX();
    this.screen = SCREEN.TITLE;
    this.levelIndex = 0;
    this.score = 0;
    this.timePlayed = 0;
    this.levelTime = 0;
    this.caughtTimer = 0;
    this.clearTimer = 0;
    this.alertStingAt = 0;
    this.lastTs = 0;
    this.time = 0;
    this.paused = false;
    this._loadLevel(0);

    this.input.onKey = (code) => this._onKey(code);
    this.input.onClick = (x, y) => this._onClick(x, y);
  }

  get level() {
    return this._level;
  }

  get guards() {
    return this._guards;
  }

  get player() {
    return this._player;
  }

  _loadLevel(index) {
    this.levelIndex = index;
    this._level = parseLevel(LEVELS[index]);
    this._player = new Player(this._level.playerStart);
    this._guards = this._level.guards.map((def, i) => new Guard(def, i));
    this.levelTime = 0;
    this.caughtTimer = 0;
    this.clearTimer = 0;
  }

  start() {
    this.sfx.ensure();
    this.score = 0;
    this.timePlayed = 0;
    this._loadLevel(0);
    this.screen = SCREEN.PLAYING;
    this.sfx.click();
  }

  restartLevel() {
    this.sfx.ensure();
    this._loadLevel(this.levelIndex);
    this.screen = SCREEN.PLAYING;
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.screen = SCREEN.VICTORY;
      this.sfx.victory();
      return;
    }
    this._loadLevel(this.levelIndex + 1);
    this.screen = SCREEN.PLAYING;
  }

  timerText() {
    const t = Math.floor(this.levelTime);
    const m = String(Math.floor(t / 60)).padStart(2, '0');
    const s = String(t % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  _onKey(code) {
    this.sfx.ensure();
    if (code === 'KeyM') {
      this.sfx.toggleMute();
      return;
    }
    if (this.screen === SCREEN.TITLE) {
      if (code === 'Enter' || code === 'Space') this.start();
      return;
    }
    if (this.screen === SCREEN.PLAYING) {
      if (code === 'KeyP' || code === 'Escape') {
        this.screen = SCREEN.PAUSED;
        this.paused = true;
      } else if (code === 'KeyR') {
        this.restartLevel();
      }
      return;
    }
    if (this.screen === SCREEN.PAUSED) {
      if (code === 'KeyP' || code === 'Escape' || code === 'Enter') {
        this.screen = SCREEN.PLAYING;
        this.paused = false;
      } else if (code === 'KeyR') {
        this.restartLevel();
        this.paused = false;
      }
      return;
    }
    if (this.screen === SCREEN.LEVEL_CLEAR) {
      if (code === 'Enter' || code === 'Space' || code === 'KeyR') this.nextLevel();
      return;
    }
    if (this.screen === SCREEN.CAUGHT) {
      if (code === 'KeyR' || code === 'Enter' || code === 'Space') this.restartLevel();
      return;
    }
    if (this.screen === SCREEN.VICTORY) {
      if (code === 'KeyR' || code === 'Enter' || code === 'Space') this.start();
    }
  }

  _onClick(x, y) {
    this.sfx.ensure();
    if (this.screen === SCREEN.TITLE) {
      this.start();
      return;
    }
    if (this.screen === SCREEN.LEVEL_CLEAR) {
      this.nextLevel();
      return;
    }
    if (this.screen === SCREEN.CAUGHT) {
      this.restartLevel();
      return;
    }
    if (this.screen === SCREEN.VICTORY) {
      this.start();
      return;
    }
    if (this.screen === SCREEN.PAUSED) {
      this.screen = SCREEN.PLAYING;
      this.paused = false;
      return;
    }
    if (this.screen !== SCREEN.PLAYING) return;
    // Click-to-walk: set a target in tile space.
    this._player.moveTarget = { x: x / TILE, y: y / TILE };
  }

  _onGuardEvent(kind, guard) {
    if (kind === 'suspicious') this.sfx.suspicious();
    if (kind === 'alerted') {
      this.sfx.alerted();
      this.alertStingAt = this.time;
    }
    if (kind === 'heard') this.sfx.suspicious();
    void guard;
  }

  update(dt) {
    this.time += dt;
    if (this.screen !== SCREEN.PLAYING) return;
    this.timePlayed += dt;
    this.levelTime += dt;

    this._player.update(this._level, this.input.keys, dt);
    const now = this.time;
    for (const g of this._guards) {
      g.update(this._level, this._player, dt, now, (k, guard) => this._onGuardEvent(k, guard));
    }

    // Footstep ticks: your steps, and the guards' steps when close.
    const stepLen = 1.1;
    if (this._player.moving && this._player.stepPhase > stepLen) {
      this._player.stepPhase -= stepLen;
      this.sfx.footstep(this._player.sneaking ? 0.25 : 0.7);
    }
    for (const g of this._guards) {
      if (g.stepPhase > 2.2) {
        g.stepPhase -= 2.2;
        this.sfx.footstep(g.footstepTick(this._player) * 0.8);
      }
    }

    // Loot pickup.
    for (const l of this._level.loot) {
      if (l.taken) continue;
      const d = Math.hypot(this._player.x - l.x, this._player.y - l.y);
      if (d < 0.6) {
        l.taken = true;
        this.score += 100;
        this.sfx.pickup();
      }
    }

    // Caught? Any alerted guard that reaches you ends the night.
    // The timer only grows while a guard is actually on you, and
    // drains when you break away — a graze is not a capture.
    let inCatchRange = false;
    for (const g of this._guards) {
      if (g.state !== GUARD_STATE.ALERTED) continue;
      const d = Math.hypot(this._player.x - g.x, this._player.y - g.y);
      if (d < CATCH_DISTANCE) {
        inCatchRange = true;
        this.caughtTimer += dt;
        if (this.caughtTimer > GRACE_AFTER_CAUGHT * 0.4) {
          this.screen = SCREEN.CAUGHT;
          this.sfx.caught();
          return;
        }
      }
    }
    if (!inCatchRange) this.caughtTimer = Math.max(0, this.caughtTimer - dt);

    // Exit: only open once every artifact is taken.
    const allTaken = this._level.loot.every((l) => l.taken);
    if (allTaken) {
      const d = Math.hypot(this._player.x - this._level.exit.x, this._player.y - this._level.exit.y);
      if (d < 0.7) {
        const timeBonus = Math.max(0, 300 - Math.floor(this.levelTime * 2));
        this.score += 200 + timeBonus;
        this.sfx.levelClear();
        if (this.levelIndex + 1 >= LEVELS.length) {
          this.screen = SCREEN.VICTORY;
          this.sfx.victory();
        } else {
          this.screen = SCREEN.LEVEL_CLEAR;
          this.clearTimer = 0;
        }
        return;
      }
    }
  }

  draw() {
    const r = this.renderer;
    const ctx = r.ctx;
    if (this.screen === SCREEN.TITLE) {
      r.drawTitle(this.time);
      return;
    }
    r.drawFloor(this._level, this.time);
    r.drawLootAndExit(this._level, this.time);
    r.drawCones(this._level, this._guards);
    r.drawWalls(this._level);
    for (const g of this._guards) r.drawGuard(g, this.time);
    r.drawPlayer(this._player, this.time);
    r.drawHud(this);

    if (this.screen === SCREEN.PAUSED) {
      r.panel('PAUSED', ['P or click — resume', 'R — restart this floor', 'M — mute'], '#8cc8ff');
    } else if (this.screen === SCREEN.LEVEL_CLEAR) {
      r.panel(
        'FLOOR CLEARED',
        [
          `${this._level.name} — all artifacts stolen, unseen.`,
          `Score ${this.score}   ·   Time ${this.timerText()}`,
          'Click or press Enter for the next floor.',
        ],
        '#39d98a',
      );
    } else if (this.screen === SCREEN.CAUGHT) {
      r.panel(
        'CAUGHT!',
        [
          'A guard got his hands on you. The night is over.',
          `Score ${this.score}   ·   ${this._level.name}`,
          'Press R or click to try this floor again.',
        ],
        '#ff5a48',
      );
    } else if (this.screen === SCREEN.VICTORY) {
      r.panel(
        'GHOST OF THE MUSEUM',
        [
          'Every artifact, every floor — and nobody ever saw you.',
          `Final score ${this.score}   ·   Total time ${Math.floor(this.timePlayed)}s`,
          'Press R or click to play again.',
        ],
        '#ffd76a',
      );
    }
    void ctx;
    void VIEW_W;
    void VIEW_H;
    void ALERTED_AT;
  }

  frame(ts) {
    const dt = Math.min(0.05, this.lastTs ? (ts - this.lastTs) / 1000 : 0.016);
    this.lastTs = ts;
    this.update(dt);
    this.draw();
  }
}
