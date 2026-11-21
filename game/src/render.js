// render.js — everything the player sees.
// One job: draw the museum, the cones, the people and every screen
// (title, HUD, level clear, caught, victory) onto one canvas.
// All art is drawn in code; no images are loaded.

import { TILE, VIEW_W, VIEW_H, COLORS } from './config.js';
import { conePolygon } from './vision.js';
import { GUARD_STATE } from './guards.js';

function coneFill(guard) {
  if (guard.state === GUARD_STATE.ALERTED) return COLORS.coneAlerted;
  if (guard.state === GUARD_STATE.SUSPICIOUS || guard.state === GUARD_STATE.SEARCH) {
    return COLORS.coneSuspicious;
  }
  return COLORS.coneCalm;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.canvas.width = VIEW_W;
    this.canvas.height = VIEW_H;
    this.ctx = canvas.getContext('2d');
  }

  // --- the room ------------------------------------------------------

  drawFloor(level, time) {
    const ctx = this.ctx;
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        if (level.grid[y][x]) continue;
        const shadow = level.shadow.some((s) => s.x === x && s.y === y);
        ctx.fillStyle =
          shadow ? COLORS.floorShadow : (x + y) % 2 === 0 ? COLORS.floorLight : COLORS.floorDark;
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        // faint tile grout
        ctx.strokeStyle = 'rgba(0,0,0,0.18)';
        ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE - 1, TILE - 1);
      }
    }
    // moonlight pools drifting across the hall
    const mx = ((time * 12) % (VIEW_W + 400)) - 200;
    const grad = ctx.createRadialGradient(mx, 150, 20, mx, 150, 260);
    grad.addColorStop(0, 'rgba(150, 180, 255, 0.05)');
    grad.addColorStop(1, 'rgba(150, 180, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  drawWalls(level) {
    const ctx = this.ctx;
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        if (!level.grid[y][x]) continue;
        const isCrate = level.crates.some((c) => c.x === x && c.y === y);
        const isStatue = level.statues.some((s) => s.x === x && s.y === y);
        if (isCrate) {
          ctx.fillStyle = COLORS.crate;
          ctx.fillRect(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6);
          ctx.fillStyle = COLORS.crateTop;
          ctx.fillRect(x * TILE + 3, y * TILE + 3, TILE - 6, 7);
          ctx.strokeStyle = 'rgba(0,0,0,0.45)';
          ctx.strokeRect(x * TILE + 3.5, y * TILE + 3.5, TILE - 7, TILE - 7);
          ctx.beginPath();
          ctx.moveTo(x * TILE + 3, y * TILE + 3);
          ctx.lineTo(x * TILE + TILE - 3, y * TILE + TILE - 3);
          ctx.moveTo(x * TILE + TILE - 3, y * TILE + 3);
          ctx.lineTo(x * TILE + 3, y * TILE + TILE - 3);
          ctx.stroke();
        } else if (isStatue) {
          ctx.fillStyle = '#5d6675';
          ctx.fillRect(x * TILE + 7, y * TILE + 16, TILE - 14, TILE - 18);
          ctx.fillStyle = COLORS.statue;
          ctx.beginPath();
          ctx.arc(x * TILE + TILE / 2, y * TILE + 13, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = COLORS.statueTop;
          ctx.fillRect(x * TILE + 9, y * TILE + 18, TILE - 18, 5);
        } else {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
          ctx.fillStyle = COLORS.wallTop;
          ctx.fillRect(x * TILE, y * TILE, TILE, 4);
        }
      }
    }
  }

  drawLootAndExit(level, time) {
    const ctx = this.ctx;
    const allTaken = level.loot.every((l) => l.taken);
    for (const l of level.loot) {
      if (l.taken) continue;
      const px = l.x * TILE;
      const py = l.y * TILE + Math.sin(time * 2 + l.x) * 2;
      const glow = ctx.createRadialGradient(px, py, 2, px, py, 22);
      glow.addColorStop(0, 'rgba(255, 215, 106, 0.5)');
      glow.addColorStop(1, 'rgba(255, 215, 106, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(px - 22, py - 22, 44, 44);
      ctx.fillStyle = COLORS.loot;
      ctx.beginPath();
      ctx.moveTo(px, py - 9);
      ctx.lineTo(px + 7, py);
      ctx.lineTo(px, py + 9);
      ctx.lineTo(px - 7, py);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8a6d1f';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Exit: a green door that only opens once every artifact is taken.
    const ex = level.exit.x * TILE;
    const ey = level.exit.y * TILE;
    const pulse = 0.6 + 0.4 * Math.sin(time * 3);
    const eg = ctx.createRadialGradient(ex, ey, 4, ex, ey, 46);
    eg.addColorStop(0, allTaken ? `rgba(57, 217, 138, ${0.55 * pulse})` : 'rgba(57, 217, 138, 0.12)');
    eg.addColorStop(1, 'rgba(57, 217, 138, 0)');
    ctx.fillStyle = eg;
    ctx.fillRect(ex - 46, ey - 46, 92, 92);
    ctx.fillStyle = allTaken ? COLORS.exit : '#2c5c40';
    ctx.fillRect(ex - 13, ey - 15, 26, 30);
    ctx.fillStyle = allTaken ? '#0d2b1c' : '#173626';
    ctx.fillRect(ex - 9, ey - 11, 18, 22);
    ctx.fillStyle = allTaken ? '#bff5d8' : '#3a6b4e';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(allTaken ? 'EXIT' : 'LOCKED', ex, ey - 20);
  }

  // --- the people ----------------------------------------------------

  drawCones(level, guards) {
    const ctx = this.ctx;
    for (const g of guards) {
      const poly = conePolygon(level, g);
      ctx.beginPath();
      ctx.moveTo(poly[0].x * TILE, poly[0].y * TILE);
      for (let i = 1; i < poly.length; i++) {
        ctx.lineTo(poly[i].x * TILE, poly[i].y * TILE);
      }
      ctx.closePath();
      ctx.fillStyle = coneFill(g);
      ctx.fill();
      // cone edge
      ctx.strokeStyle = 'rgba(255, 220, 120, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawGuard(g, time) {
    const ctx = this.ctx;
    const px = g.x * TILE;
    const py = g.y * TILE;
    const bob = Math.sin(g.stepPhase * 2.4) * 1.5;
    // body
    ctx.fillStyle = COLORS.guardUniform;
    ctx.beginPath();
    ctx.arc(px, py + bob * 0.2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(px, py + bob * 0.2, 8, 0, Math.PI * 2);
    ctx.fill();
    // facing tick
    ctx.strokeStyle = '#ffd6d0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(g.angle) * 15, py + Math.sin(g.angle) * 15);
    ctx.stroke();
    // state mark: ? when suspicious, ! when alerted, magnifier while searching
    let mark = null;
    if (g.state === GUARD_STATE.ALERTED) mark = '!';
    else if (g.state === GUARD_STATE.SUSPICIOUS) mark = '?';
    else if (g.state === GUARD_STATE.SEARCH) mark = '…';
    if (mark) {
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = g.state === GUARD_STATE.ALERTED ? '#ff5a48' : '#ffc23d';
      ctx.fillText(mark, px, py - 18);
    }
    // detection ring: fills as this guard gets sure of you
    if (g.detection > 4) {
      ctx.beginPath();
      ctx.arc(px, py, 17, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * g.detection) / 100);
      ctx.strokeStyle = g.detection >= 100 ? '#ff4030' : '#ffc23d';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    void time;
  }

  drawPlayer(player, time) {
    const ctx = this.ctx;
    const px = player.x * TILE;
    const py = player.y * TILE;
    const crouch = player.sneaking ? 0.82 : 1;
    // sneak shadow ring: how far your steps carry
    const noise = player.noiseRadius();
    if (noise > 0) {
      ctx.beginPath();
      ctx.arc(px, py, noise * TILE, 0, Math.PI * 2);
      ctx.strokeStyle = player.sneaking
        ? 'rgba(140, 200, 255, 0.18)'
        : 'rgba(255, 200, 90, 0.22)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // click target marker
    if (player.moveTarget) {
      ctx.strokeStyle = 'rgba(242, 234, 216, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(player.moveTarget.x * TILE, player.moveTarget.y * TILE, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(player.moveTarget.x * TILE - 10, player.moveTarget.y * TILE);
      ctx.lineTo(player.moveTarget.x * TILE + 10, player.moveTarget.y * TILE);
      ctx.moveTo(player.moveTarget.x * TILE, player.moveTarget.y * TILE - 10);
      ctx.lineTo(player.moveTarget.x * TILE, player.moveTarget.y * TILE + 10);
      ctx.stroke();
    }
    // cloak
    ctx.fillStyle = COLORS.playerCloak;
    ctx.beginPath();
    ctx.arc(px, py, 12 * crouch + 2, 0, Math.PI * 2);
    ctx.fill();
    // hood
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    // eyes look where you face
    ctx.fillStyle = '#1c2438';
    const ex = Math.cos(player.angle) * 3;
    const ey = Math.sin(player.angle) * 3;
    ctx.beginPath();
    ctx.arc(px + ex - 2.5, py + ey - 1, 1.4, 0, Math.PI * 2);
    ctx.arc(px + ex + 2.5, py + ey - 1, 1.4, 0, Math.PI * 2);
    ctx.fill();
    void time;
  }

  // --- HUD and screens -----------------------------------------------

  drawHud(game) {
    const ctx = this.ctx;
    const level = game.level;
    const taken = level.loot.filter((l) => l.taken).length;
    const maxDetect = Math.max(0, ...game.guards.map((g) => g.detection));
    const anyAlerted = game.guards.some((g) => g.state === GUARD_STATE.ALERTED);

    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(0, 0, VIEW_W, 34);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${level.name}  ·  ${taken}/${level.loot.length} artifacts`, 12, 22);
    ctx.textAlign = 'right';
    ctx.fillText(`Score ${game.score}   ·   ${game.timerText()}`, VIEW_W - 12, 22);

    // detection bar
    const bw = 220;
    const bx = VIEW_W / 2 - bw / 2;
    const by = 44;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(bx - 2, by - 2, bw + 4, 16);
    const frac = maxDetect / 100;
    ctx.fillStyle = frac >= 1 ? '#ff4030' : frac >= 0.38 ? '#ffc23d' : '#39d98a';
    ctx.fillRect(bx, by, bw * frac, 12);
    ctx.strokeStyle = 'rgba(242,234,216,0.6)';
    ctx.strokeRect(bx - 2.5, by - 2.5, bw + 5, 17);
    ctx.fillStyle = COLORS.text;
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(anyAlerted ? 'SPOTTED — RUN!' : maxDetect >= 38 ? 'SUSPICIOUS' : 'UNSEEN', VIEW_W / 2, by + 28);

    // sneak + noise hint
    ctx.textAlign = 'left';
    ctx.font = '11px monospace';
    ctx.fillStyle = game.player.sneaking ? '#8cc8ff' : COLORS.textDim;
    ctx.fillText(
      game.player.sneaking ? 'SNEAKING (Shift) — quiet, slow, hard to spot' : 'WASD / arrows move · Shift sneak · click to walk',
      12,
      VIEW_H - 10,
    );
    const near = game.guards
      .map((g) => g.footstepTick(game.player))
      .reduce((a, b) => Math.max(a, b), 0);
    if (near > 0.15) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffc23d';
      ctx.fillText('♪ footsteps nearby…', VIEW_W - 12, VIEW_H - 10);
    }
  }

  panel(title, lines, accent) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(5, 5, 12, 0.72)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = 'rgba(16, 18, 34, 0.96)';
    const pw = 560;
    const ph = 150 + lines.length * 26;
    ctx.fillRect(VIEW_W / 2 - pw / 2, VIEW_H / 2 - ph / 2, pw, ph);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(VIEW_W / 2 - pw / 2, VIEW_H / 2 - ph / 2, pw, ph);
    ctx.fillStyle = accent;
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, VIEW_W / 2, VIEW_H / 2 - ph / 2 + 52);
    ctx.fillStyle = COLORS.text;
    ctx.font = '15px monospace';
    lines.forEach((line, i) => {
      ctx.fillText(line, VIEW_W / 2, VIEW_H / 2 - ph / 2 + 96 + i * 26);
    });
  }

  drawTitle(time) {
    const ctx = this.ctx;
    ctx.fillStyle = '#0b0b16';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // a fake moonlit hall behind the title
    for (let i = 0; i < 40; i++) {
      const x = (i * 173) % VIEW_W;
      const y = (i * 97) % VIEW_H;
      ctx.fillStyle = i % 2 ? '#1a1d33' : '#141728';
      ctx.fillRect(x, y, 60, 60);
    }
    const glow = ctx.createRadialGradient(VIEW_W / 2, 200, 10, VIEW_W / 2, 200, 320);
    glow.addColorStop(0, 'rgba(255, 214, 90, 0.10)');
    glow.addColorStop(1, 'rgba(255, 214, 90, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 52px monospace';
    ctx.fillText('MUSEUM OF SHADOWS', VIEW_W / 2, 150);
    ctx.fillStyle = COLORS.text;
    ctx.font = '17px monospace';
    ctx.fillText('Steal the artifacts. Dodge the cones. Reach the exit unseen.', VIEW_W / 2, 188);
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '14px monospace';
    const lines = [
      'WASD / arrows — move        Shift — sneak (quiet, slow, hard to spot)',
      'Click — walk there          R — restart level        P — pause        M — mute',
      'Guards patrol with vision cones. Fill the meter and they chase you.',
      'Shadow floor hides you. Crates and statues block sight. Grab every artifact,',
      'then slip out the green exit. Three nights, three floors — get them all.',
    ];
    lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 250 + i * 24));
    const blink = 0.55 + 0.45 * Math.sin(time * 3);
    ctx.fillStyle = `rgba(57, 217, 138, ${blink})`;
    ctx.font = 'bold 20px monospace';
    ctx.fillText('— CLICK OR PRESS ENTER TO BEGIN —', VIEW_W / 2, 430);
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '12px monospace';
    ctx.fillText('An original game — no network, no files beyond this folder.', VIEW_W / 2, 560);
    void time;
  }
}
