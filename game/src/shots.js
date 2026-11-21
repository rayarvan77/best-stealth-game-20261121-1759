// shots.js — staged scenes for the screenshots.
// One job: put the game into a fixed, readable state for each shot
// so the screenshots are real renders of the game's own code.
// ?shot=start — level overview: guards, cones, cover and exit in one frame.
// ?shot=play — mid-sneak: a guard suspicious, the player behind a crate.
// ?shot=end  — the player slipping out the exit, floor cleared.

import { SCREEN } from './game.js';
import { GUARD_STATE } from './guards.js';

export function stageShot(game, shot) {
  const q = new URLSearchParams(window.location.search);
  const name = shot ?? q.get('shot') ?? '';
  if (name === 'start') {
    game.start();
    // Let the guards walk a little off their spawn points so the
    // patrol reads as movement, not a still life — but not long
    // enough for anyone to spot the player at the door.
    for (let i = 0; i < 20; i++) game.update(1 / 60);
    game.screen = SCREEN.PLAYING;
  } else if (name === 'play') {
    game.start();
    // Jump to the Gallery Wing: more cover, more guards.
    game._loadLevel(1);
    game.screen = SCREEN.PLAYING;
    const p = game.player;
    // Crouch behind the crate at (7, 9) — the guard below is coming.
    p.x = 7.5;
    p.y = 10.5;
    p.sneaking = true;
    p.angle = Math.PI / 2;
    const g = game.guards[0];
    g.x = 9.5;
    g.y = 8.5;
    g.angle = Math.PI / 2;
    g.state = GUARD_STATE.SUSPICIOUS;
    g.detection = 62;
    g.lastSeen = { x: 7.5, y: 10.5 };
    const g2 = game.guards[1];
    g2.x = 20.5;
    g2.y = 6.5;
    g2.angle = -Math.PI / 2;
    for (let i = 0; i < 30; i++) game.update(1 / 60);
    game.screen = SCREEN.PLAYING;
  } else if (name === 'end') {
    game.start();
    // All artifacts taken, player at the green exit, floor cleared.
    for (const l of game.level.loot) l.taken = true;
    game.player.x = game.level.exit.x - 0.4;
    game.player.y = game.level.exit.y;
    game.player.angle = 0;
    game.score = 540;
    game.levelTime = 96;
    game.screen = SCREEN.LEVEL_CLEAR;
  }
  // Deterministic: freeze the clock so every render matches.
  game.time = 12.5;
}
