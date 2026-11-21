// vision.js — what a guard can see.
// One job: line of sight through walls and crates, and the vision cone test.
// Positions are in tile units; the guard looks along `angle`.

import { CONE_RANGE, CONE_HALF_ANGLE } from './config.js';
import { isSolidTile } from './levels.js';

// Walk the grid cells a line passes through; false the moment a solid
// tile blocks the view. A small step count keeps it cheap and exact enough.
export function hasLineOfSight(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist * 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor(x0 + dx * t);
    const ty = Math.floor(y0 + dy * t);
    if (isSolidTile(level, tx, ty)) return false;
  }
  return true;
}

// Is `target` inside the guard's cone (range + angle + line of sight)?
export function inVisionCone(level, guard, target) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return false;
  if (dist < 0.45) return true; // breathing down his neck: always seen
  const want = Math.atan2(dy, dx);
  let diff = want - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CONE_HALF_ANGLE) return false;
  return hasLineOfSight(level, guard.x, guard.y, target.x, target.y);
}

// How far a guard's sight reaches along one ray before a wall stops it.
// Used to draw the cone clipped by the room, so it hugs the walls.
export function coneRayLength(level, gx, gy, angle) {
  const step = 0.12;
  let d = step;
  while (d < CONE_RANGE) {
    const x = gx + Math.cos(angle) * d;
    const y = gy + Math.sin(angle) * d;
    if (isSolidTile(level, Math.floor(x), Math.floor(y))) return d;
    d += step;
  }
  return CONE_RANGE;
}

// The cone as a fan of points (centre + arc), clipped by walls.
export function conePolygon(level, guard, rays = 26) {
  const pts = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= rays; i++) {
    const a = guard.angle - CONE_HALF_ANGLE + (2 * CONE_HALF_ANGLE * i) / rays;
    const len = coneRayLength(level, guard.x, guard.y, a);
    pts.push({ x: guard.x + Math.cos(a) * len, y: guard.y + Math.sin(a) * len });
  }
  return pts;
}
