# Museum of Shadows — a stealth game

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/rayarvan77/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/rayarvan77/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

An entry for the [make.fun bounty "Make the best stealth game"](https://make.fun/bounty/best-stealth-game-20261121-1759).

You are Rook, a thief loose in a night museum. Three floors stand between
you and a clean getaway: the Grand Hall, the Gallery Wing, and the Vault.
Every floor hides three artifacts and one green exit. Take everything,
slip out, and never let a guard see you do it.

## How it plays

- **Move** with WASD or the arrow keys. **Click** anywhere and Rook walks
  there on his own. Hold **Shift** to sneak — slower, quieter, and much
  harder to spot.
- **Guards patrol** fixed routes, sweeping the floor with vision cones.
  A cone that touches you fills the detection meter above the level.
  Fill it a little and the guard gets suspicious: he walks over to look,
  marked with a `?`. Fill it all the way and he chases you, marked `!`,
  and if he catches you the night is over.
- **Cover is real.** Crates and statues block both movement and sight —
  a guard cannot see through them, and neither can his cone. Shadow
  floor (the darker tiles) hides you too: detection fills less than half
  as fast while you stand in it.
- **Noise matters.** Walking is heard a few tiles away; sneaking is
  barely heard at all. A guard who hears your steps turns suspicious
  and comes to check. The HUD tells you when footsteps are close, and
  the game plays soft synthesized footstep sounds that give away how
  near a guard is.
- **The exit stays locked** until every artifact on the floor is taken.
  Clearing a floor fast earns a time bonus. Clear all three floors
  unseen and you finish as the Ghost of the Museum.

Other keys: **R** restarts the floor, **P** pauses, **M** mutes the
sound. The title screen, pause, level-clear, caught and victory screens
are all in the game, and the score, timer and artifact count sit in the
HUD the whole time.

## The three floors

| Floor | Guards | What changes |
| --- | --- | --- |
| The Grand Hall | 2 | Wide open rooms, long sightlines, learn the cones |
| The Gallery Wing | 3 | Statues to hide behind, shadow floor to use, tighter patrols |
| The Vault | 4 | Four guards, short pauses, the smallest margin for error |

## Running it

No build step, no network, no install. Any static server works:

```sh
cd game
python3 -m http.server 8080
# open http://localhost:8080
```

Or serve the whole entry and open `game/index.html` from any static host.
The game is one canvas, plain JavaScript modules, and every sound is
synthesized with WebAudio — there are no image, font or audio files to
fetch, so it plays fully offline in a desktop browser.

## How the code is laid out

```
game/
  index.html        the page: canvas, styles, module entry point
  src/
    main.js         bootstrap: canvas, frame loop, screenshot mode
    game.js         screens, the loop, scoring, win/lose
    levels.js       the three maps, patrol routes, collision helpers
    guards.js       the patrol AI: patrol, suspicious, alerted, search
    player.js       movement, sneaking, click-to-walk, noise
    vision.js       line of sight and the vision-cone math
    render.js       all drawing: floor, cones, people, HUD, screens
    audio.js        synthesized sounds: steps, alerts, pickups, jingles
    input.js        keyboard and mouse
    shots.js        the three staged scenes used for the screenshots
main.ts             the hand-in: copies game/ + screenshots/ to /output
                    and writes dossier.json with vendor/makefun-game.ts
vendor/
  makefun-game.ts   the kit's library, copied unchanged
screenshots/        1-start, 2-play and 3-end, real renders of this code
```

The guard AI is the heart of it. A guard in `patrol` walks his route
and pauses at each waypoint to look around. Being seen fills his
personal detection meter at a rate that depends on distance, light and
whether you are sneaking; the meter decays when you break sight. Past
a threshold he turns `suspicious` and walks to the last place he saw
you, looking around when he gets there. A full meter makes him
`alerted`: he chases, and if he loses you for a few seconds he
`search`es the area in a slow sweep before giving up and going back to
his route. Hearing loud steps nearby makes a patrolling guard
suspicious even when he saw nothing.

## Screenshots

- `1-start.jpg` — the Grand Hall from above: both guards, their cones,
  the crates, three artifacts and the locked exit in one frame.
- `2-play.jpg` — mid-sneak in the Gallery Wing: Rook crouched in shadow
  behind a crate while a guard, suspicious, closes in with his meter
  half full.
- `3-end.jpg` — the floor cleared: all three artifacts taken, Rook at
  the open exit, score on the board.

## License

MIT — see [LICENSE](LICENSE).
