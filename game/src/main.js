// main.js — bootstrap.
// One job: wire the canvas to the game, run the frame loop, and
// stage a screenshot scene when the URL asks for one (?shot=...).

import { Game } from './game.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

// Screenshot mode: stage the scene, draw one frame, and stop the
// clock so the render is identical every time it is taken.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(game, shot);
  game.draw();
  window.__game = game;
} else {
  const loop = (ts) => {
    game.frame(ts);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.__game = game;
}

// Expose a tiny probe the play-test harness reads.
window.__probe = () => ({
  screen: game.screen,
  level: game.level.name,
  guards: game.guards.length,
  loot: game.level.loot.length,
  score: game.score,
  player: { x: game.player.x, y: game.player.y },
});
