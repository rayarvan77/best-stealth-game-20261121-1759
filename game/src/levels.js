// levels.js — the three museum floors.
// One job: the maps, the patrol routes and the loot of every level.
// Legend: # wall, . floor, d shadow floor, C crate, S statue,
//          L loot (artifact), E exit, P player start.
// Guards are listed separately with tile-space patrol waypoints.

export const LEVELS = [
  {
    name: 'The Grand Hall',
    sub: 'Night one — two guards, three artifacts',
    map: [
      '##############################',
      '#P..........#.......C....L...#',
      '#...........#................#',
      '#..C.....C..#...C......C.....#',
      '#...........#................#',
      '#....####...#....####........#',
      '#...........#................#',
      '#..C.....C......C......C.....#',
      '#...........#................#',
      '#....C......#....C....C......#',
      '#...........#................#',
      '#..C.....C..#...C.......C....#',
      '#...........#................#',
      '#....C......#....####........#',
      '#...........#................#',
      '#..L.....C..#...C......L.....#',
      '#...........#................#',
      '#....C......#....C......C....#',
      '#...........#.........E......#',
      '##############################',
    ],
    guards: [
      { waypoints: [[2, 2], [10, 2], [10, 14], [2, 14]], pause: 1.2 },
      { waypoints: [[14, 2], [26, 2], [26, 18], [14, 18]], pause: 1.2 },
    ],
  },
  {
    name: 'The Gallery Wing',
    sub: 'Night two — three guards, three artifacts',
    map: [
      '##############################',
      '#P....C.....#......d....L....#',
      '#...........#....ddd.........#',
      '#..C.....C..#....ddd...C.....#',
      '#...........#................#',
      '#....###....#..C....####.....#',
      '#...........#................#',
      '#..S.....C......C......S.....#',
      '#...........#................#',
      '#....C...d..#....d....C......#',
      '#......ddd..#...ddd..........#',
      '#..C...ddd..#....d....C......#',
      '#...........#................#',
      '#....C......#....C....###....#',
      '#...........#................#',
      '#..L...C....#....C......C....#',
      '#...........#................#',
      '#....C...S..#..C....C....L...#',
      '#...........#.........E......#',
      '##############################',
    ],
    guards: [
      { waypoints: [[2, 2], [10, 2], [10, 14], [2, 14]], pause: 0.9 },
      { waypoints: [[18, 4], [26, 4], [26, 12], [18, 12]], pause: 0.9 },
      { waypoints: [[10, 17], [10, 15]], pause: 1.4 },
    ],
  },
  {
    name: 'The Vault',
    sub: 'Night three — four guards, three artifacts',
    map: [
      '##############################',
      '#P...C....#....d.....C...L...#',
      '#..........#...ddd...........#',
      '#..C...C..#...ddd..C....C....#',
      '#..........#.................#',
      '#...####..#..C...#####.......#',
      '#..........#.................#',
      '#..S...C.....C......C...S....#',
      '#..........#.................#',
      '#...C..d..#...d...C.....C....#',
      '#.....ddd.#..ddd.............#',
      '#..C..ddd.#...d....C....C....#',
      '#..........#.................#',
      '#...C.....#...C....#####.....#',
      '#..........#.................#',
      '#..L..C...#..C....C.....L....#',
      '#..........#.................#',
      '#...C..S..#...C.....C...C....#',
      '#.........#..........E.......#',
      '##############################',
    ],
    guards: [
      { waypoints: [[2, 2], [8, 2], [8, 14], [2, 14]], pause: 0.7 },
      { waypoints: [[22, 4], [26, 4], [26, 12], [22, 12]], pause: 0.7 },
      { waypoints: [[2, 16], [8, 16], [8, 12], [2, 12]], pause: 1.0 },
      { waypoints: [[20, 16], [26, 16], [26, 14], [20, 14]], pause: 1.0 },
    ],
  },
];

// Parse one map into a grid plus the things that sit on it.
export function parseLevel(def) {
  const grid = [];
  const crates = [];
  const statues = [];
  const loot = [];
  const shadow = [];
  let playerStart = { x: 1.5, y: 1.5 };
  let exit = { x: 27.5, y: 18.5 };
  for (let y = 0; y < def.map.length; y++) {
    const row = def.map[y];
    const grow = [];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      let solid = false;
      if (ch === '#') solid = true;
      if (ch === 'C') { solid = true; crates.push({ x, y }); }
      if (ch === 'S') { solid = true; statues.push({ x, y }); }
      if (ch === 'L') loot.push({ x: x + 0.5, y: y + 0.5, taken: false });
      if (ch === 'd') shadow.push({ x, y });
      if (ch === 'P') playerStart = { x: x + 0.5, y: y + 0.5 };
      if (ch === 'E') exit = { x: x + 0.5, y: y + 0.5 };
      grow.push(solid);
    }
    grid.push(grow);
  }
  return {
    name: def.name,
    sub: def.sub,
    grid,
    crates,
    statues,
    loot,
    shadow,
    playerStart,
    exit,
    guards: def.guards,
    width: def.map[0].length,
    height: def.map.length,
  };
}

// Is the tile at (tx, ty) solid (wall, crate or statue)?
export function isSolidTile(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= level.width || ty >= level.height) return true;
  return level.grid[ty][tx];
}

// Is the tile at (tx, ty) shadow floor (harder to be seen in)?
export function isShadowTile(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= level.width || ty >= level.height) return false;
  return level.shadow.some((s) => s.x === tx && s.y === ty);
}

// Circle-vs-grid collision: can a circle of radius r sit at (x, y) in tiles?
export function circleFits(level, x, y, r) {
  const x0 = Math.floor(x - r);
  const x1 = Math.floor(x + r);
  const y0 = Math.floor(y - r);
  const y1 = Math.floor(y + r);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!isSolidTile(level, tx, ty)) continue;
      const cx = Math.max(tx, Math.min(x, tx + 1));
      const cy = Math.max(ty, Math.min(y, ty + 1));
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy < r * r) return false;
    }
  }
  return true;
}
