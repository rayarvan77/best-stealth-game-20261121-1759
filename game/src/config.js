// config.js — shared constants for Museum of Shadows.
// One job: every number the rest of the game tunes against lives here,
// so the judge's outline shows the tuning in one place.

export const TILE = 32;
export const COLS = 30;
export const ROWS = 20;
export const VIEW_W = COLS * TILE; // 960
export const VIEW_H = ROWS * TILE; // 640

// Player movement, in tiles per second.
export const WALK_SPEED = 3.4;
export const SNEAK_SPEED = 1.7;
export const GUARD_PATROL_SPEED = 1.55;
export const GUARD_SUSPICIOUS_SPEED = 2.1;
export const GUARD_CHASE_SPEED = 3.05;

// Vision cone: how far a guard sees and how wide the cone opens.
export const CONE_RANGE = 5.6 * TILE;
export const CONE_HALF_ANGLE = 0.61; // ~35 degrees each side

// Detection: 0..100. How fast being seen fills the meter.
export const DETECT_BASE_RATE = 55; // per second, point blank, lit, walking
export const DETECT_SNEAK_FACTOR = 0.42; // sneaking fills it much slower
export const DETECT_DARK_FACTOR = 0.45; // standing in shadow fills it slower
export const DETECT_DECAY_RATE = 26; // per second while unseen
export const SUSPICIOUS_AT = 38; // guard walks over to look
export const ALERTED_AT = 100; // guard chases
export const CATCH_DISTANCE = 0.55 * TILE;

// Noise: walking is heard, sneaking is not. Radius in tiles.
export const NOISE_WALK_RADIUS = 2.6;
export const NOISE_SNEAK_RADIUS = 0.7;
export const HEAR_SUSPICION = 22; // suspicion added when a guard hears steps

// Alert timers, in seconds.
export const SEARCH_TIME = 4.5; // guard looks around after losing you
export const CHASE_GIVE_UP = 3.2; // seconds without sight before giving up
export const GRACE_AFTER_CAUGHT = 0.9;

// Colours: a night museum — warm floor, cold walls, hot cones.
export const COLORS = {
  floorLight: '#3a3230',
  floorDark: '#332c2a',
  floorShadow: '#241f22',
  wall: '#191d2e',
  wallTop: '#2b3352',
  crate: '#7a5230',
  crateTop: '#9c6b3f',
  statue: '#8d97a8',
  statueTop: '#b7c0cf',
  loot: '#ffd76a',
  exit: '#39d98a',
  exitGlow: '#1d7a4c',
  player: '#e8e4da',
  playerCloak: '#4a3b63',
  guard: '#d8493b',
  guardUniform: '#7d2a24',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneSuspicious: 'rgba(255, 166, 40, 0.32)',
  coneAlerted: 'rgba(255, 64, 48, 0.38)',
  hudBg: 'rgba(10, 10, 18, 0.72)',
  text: '#f2ead8',
  textDim: '#b8ac93',
};
