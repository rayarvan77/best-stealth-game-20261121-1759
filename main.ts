// main.ts — Museum of Shadows hand-in (Node 22, standard library only).
//
// What it does, in order:
//   1. works out where the entry lives (the folder beside this file)
//      and where it must be handed in (/output, or MAKEFUN_OUTPUT_DIR
//      when the grader is not the one running it);
//   2. clears that output folder so a stale file can never leak in;
//   3. copies game/ and screenshots/ across unchanged;
//   4. writes dossier.json with buildDossier from the vendored
//      make.fun library, under the scorer's own caps, so the dossier
//      is byte for byte the one the gate rebuilds.
//
// The game itself is plain static files under game/ — index.html and
// its ES modules, no library, no network request — and the screenshots
// under screenshots/ are real renders of that code.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this bounty, from the kit's gate: at most
// 4 screenshots of 256 KiB each, game/ under 993 files and 48 MiB,
// paths under 1,000 bytes, and the dossier text capped at 160 KiB.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(from: string, to: string): void {
  if (!existsSync(from)) {
    throw new Error(`main.ts: expected folder missing: ${from}`);
  }
  cpSync(from, to, { recursive: true });
}

function main(): void {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

  const dossier = buildDossier(outputDir, dossierCaps);
  const dossierPath = join(outputDir, 'dossier.json');
  writeFileSync(dossierPath, dossier);

  // The dossier must be readable back as JSON, or the run failed even
  // though every copy above succeeded — refuse to pass silently.
  JSON.parse(readFileSync(dossierPath, 'utf8'));
}

main();
