// player.js — the thief.
// One job: move the player with keyboard or a mouse click target,
// track sneak state, and report how loud the player is being.

import { WALK_SPEED, SNEAK_SPEED, NOISE_WALK_RADIUS, NOISE_SNEAK_RADIUS } from './config.js';
import { circleFits } from './levels.js';

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.moveTarget = null; // {x, y} in tiles, set by a mouse click
    this.stepPhase = 0;
    this.radius = 0.3;
  }

  reset(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = -Math.PI / 2;
    this.sneaking = false;
    this.moving = false;
    this.moveTarget = null;
  }

  // Keyboard vector (dx, dy) in -1..1, plus sneak flag and dt.
  update(level, keys, dt) {
    let dx = 0;
    let dy = 0;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    this.sneaking = !!keys.sneak;

    if (dx !== 0 || dy !== 0) {
      this.moveTarget = null; // keys override a click target
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.angle = Math.atan2(dy, dx);
      this.step(level, dx, dy, dt);
      return;
    }

    if (this.moveTarget) {
      const tx = this.moveTarget.x - this.x;
      const ty = this.moveTarget.y - this.y;
      const dist = Math.hypot(tx, ty);
      if (dist < 0.08) {
        this.moveTarget = null;
        this.moving = false;
        return;
      }
      this.angle = Math.atan2(ty, tx);
      this.step(level, tx / dist, ty / dist, dt);
      return;
    }

    this.moving = false;
  }

  step(level, dx, dy, dt) {
    const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
    const nx = this.x + dx * speed * dt;
    const ny = this.y + dy * speed * dt;
    const r = this.radius;
    if (circleFits(level, nx, this.y, r)) this.x = nx;
    if (circleFits(level, this.x, ny, r)) this.y = ny;
    this.moving = true;
    this.stepPhase += speed * dt;
  }

  // How far away the player's steps can be heard, in tiles.
  noiseRadius() {
    if (!this.moving) return 0;
    return this.sneaking ? NOISE_SNEAK_RADIUS : NOISE_WALK_RADIUS;
  }
}
