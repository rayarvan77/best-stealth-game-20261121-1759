// guards.js — the patrol AI.
// One job: move a guard along its route and run its alert state machine.
// States: patrol -> suspicious (saw a flicker, walks over to look)
//        -> alerted (saw you clearly, chases) -> search -> patrol.

import {
  GUARD_PATROL_SPEED,
  GUARD_SUSPICIOUS_SPEED,
  GUARD_CHASE_SPEED,
  DETECT_BASE_RATE,
  DETECT_SNEAK_FACTOR,
  DETECT_DARK_FACTOR,
  DETECT_DECAY_RATE,
  SUSPICIOUS_AT,
  ALERTED_AT,
  SEARCH_TIME,
  CHASE_GIVE_UP,
  HEAR_SUSPICION,
  NOISE_WALK_RADIUS,
} from './config.js';
import { isShadowTile, circleFits } from './levels.js';
import { inVisionCone } from './vision.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  ALERTED: 'alerted',
  SEARCH: 'search',
};

export class Guard {
  constructor(def, index) {
    this.index = index;
    this.waypoints = def.waypoints.map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 }));
    this.pause = def.pause ?? 1;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.angle = 0;
    this.wp = 1;
    this.wait = 0;
    this.state = GUARD_STATE.PATROL;
    this.detection = 0; // 0..100, how sure this guard is that you are there
    this.lastSeen = null;
    this.searchTimer = 0;
    this.unseenTimer = 0;
    this.scanAngle = 0;
    this.stepPhase = 0; // drives the footstep ticks
    this.heardAt = 0;
  }

  // Move toward (tx, ty) at `speed` tiles/sec, sliding along walls.
  moveToward(level, tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.02) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    const r = 0.3;
    if (circleFits(level, nx, this.y, r)) this.x = nx;
    if (circleFits(level, this.x, ny, r)) this.y = ny;
    this.angle = Math.atan2(dy, dx);
    this.stepPhase += step;
    return dist <= step + 0.02;
  }

  // One tick: see, hear, decide, move.
  update(level, player, dt, now, onEvent) {
    const sees = inVisionCone(level, this, player);
    const inShadow = isShadowTile(level, Math.floor(player.x), Math.floor(player.y));

    if (sees) {
      let rate = DETECT_BASE_RATE;
      const dist = Math.hypot(player.x - this.x, player.y - this.y);
      rate *= 1.35 - Math.min(0.85, dist / 8); // closer fills faster
      if (player.sneaking) rate *= DETECT_SNEAK_FACTOR;
      if (inShadow) rate *= DETECT_DARK_FACTOR;
      if (player.moving) rate *= 1.15;
      this.detection = Math.min(ALERTED_AT, this.detection + rate * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.unseenTimer = 0;
    } else {
      this.detection = Math.max(0, this.detection - DETECT_DECAY_RATE * dt);
      this.unseenTimer += dt;
    }

    // Hearing: loud footsteps nearby make a patrolling guard suspicious.
    if (!player.sneaking && player.moving && this.state === GUARD_STATE.PATROL) {
      const d = Math.hypot(player.x - this.x, player.y - this.y);
      if (d < NOISE_WALK_RADIUS && now - this.heardAt > 1.5) {
        this.heardAt = now;
        this.detection = Math.max(this.detection, HEAR_SUSPICION);
        this.lastSeen = { x: player.x, y: player.y };
        onEvent('heard', this);
      }
    }

    // State transitions.
    if (this.detection >= ALERTED_AT && this.state !== GUARD_STATE.ALERTED) {
      this.state = GUARD_STATE.ALERTED;
      this.unseenTimer = 0;
      onEvent('alerted', this);
    } else if (
      this.detection >= SUSPICIOUS_AT &&
      this.state === GUARD_STATE.PATROL
    ) {
      this.state = GUARD_STATE.SUSPICIOUS;
      this.scanAngle = this.angle;
      this.searchTimer = 0;
      onEvent('suspicious', this);
    } else if (
      this.state === GUARD_STATE.SUSPICIOUS &&
      this.detection < SUSPICIOUS_AT * 0.5
    ) {
      this.state = GUARD_STATE.PATROL;
    }

    if (this.state === GUARD_STATE.ALERTED) {
      if (sees) {
        this.moveToward(level, player.x, player.y, GUARD_CHASE_SPEED, dt);
        this.unseenTimer = 0;
      } else if (this.lastSeen) {
        const arrived = this.moveToward(
          level,
          this.lastSeen.x,
          this.lastSeen.y,
          GUARD_CHASE_SPEED,
          dt,
        );
        if (arrived || this.unseenTimer > CHASE_GIVE_UP) {
          this.state = GUARD_STATE.SEARCH;
          this.searchTimer = SEARCH_TIME;
          this.scanAngle = this.angle;
        }
      }
      return;
    }

    if (this.state === GUARD_STATE.SUSPICIOUS) {
      if (this.lastSeen) {
        const arrived = this.moveToward(
          level,
          this.lastSeen.x,
          this.lastSeen.y,
          GUARD_SUSPICIOUS_SPEED,
          dt,
        );
        if (arrived) {
          // Look around for a moment, then give up and go back.
          this.scanAngle += dt * 1.6;
          this.angle = this.scanAngle;
          this.searchTimer += dt;
          if (this.searchTimer > 2.2) {
            this.searchTimer = 0;
            this.state = GUARD_STATE.PATROL;
          }
        }
      }
      return;
    }

    if (this.state === GUARD_STATE.SEARCH) {
      this.searchTimer -= dt;
      this.angle += dt * 2.4; // slow sweep while searching
      if (this.searchTimer <= 0) this.state = GUARD_STATE.PATROL;
      return;
    }

    // Patrol: walk the waypoints, pausing at each one to look around.
    if (this.wait > 0) {
      this.wait -= dt;
      this.angle += Math.sin(now * 0.8 + this.index) * dt * 0.35;
      return;
    }
    const target = this.waypoints[this.wp];
    const arrived = this.moveToward(level, target.x, target.y, GUARD_PATROL_SPEED, dt);
    if (arrived) {
      this.wp = (this.wp + 1) % this.waypoints.length;
      this.wait = this.pause;
    }
  }

  // A short footstep tick when this guard is close enough to be heard.
  footstepTick(player) {
    const d = Math.hypot(player.x - this.x, player.y - this.y);
    return d < 7 ? 1 - d / 7 : 0;
  }
}
