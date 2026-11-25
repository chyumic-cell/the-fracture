# Colossal-map performance — 25 November 2026

Reported: a 4-player match on a Colossal map (700×700 tiles, 490,000 cells, about 14,500 trees,
deposits and buildings) was "very very glitchy". The cause was long frames: several systems did work
proportional to the whole map in a single frame.

## How it was measured

- Headless simulation: 4 computer players (humans, reptilians, symbiotes, primates), Colossal, seed 4242,
  Standard, 20 steps per second for 4–6 game minutes, timing every step (`node` with
  `performance.now()`); V8 CPU profiles for line-level detail.
- Browser: `tests/profile-hitches.cjs` now accepts `PROFILE_PLAYERS` (player count) and `PROFILE_ADVANCE`
  (fast-forward the match to that game time before measuring frames).

## Causes and fixes

| Cause | Fix | Exactness |
|---|---|---|
| A unit sent to a spot it cannot enter (a building edge, a ledge) made A* search every reachable cell before returning the nearest one; up to 1 s even for 5-tile trips. | `path()` uses the region map to prove the goal unreachable and to bound the nearest reachable distance, then stops at the first cell popped at that distance. | Same route: the full search only replaces its best cell when strictly nearer. Compared with a truly exhaustive search (`g.exhaustivePaths=true`) on 808 sampled routes. |
| The explored-ground region map was rebuilt over all 490,000 cells whenever any player uncovered one cell. | Union-find map that absorbs newly explored cells; full rebuild only when already-known terrain changes. | Compared partition-for-partition with fresh builds over 120 updates while units explore. |
| The explored-cell count was recounted over the whole map every step (~5% of every frame). | Kept incrementally; writers outside the simulation call `forgetExploredCount`. | Same count. |
| AI route checks rebuilt a whole-map "through unexplored ground" region map (~100 ms) and, in one case, ran a whole-map search. | That case answers yes directly: a cell next to the target is provably reachable on known ground, so a known route ends within two units, which is what the check asks. | Behaviour change: in 6 of 808 sampled checks the old search said no only because its shortest route cut through unexplored ground; the test verifies each yes with a real known-ground path. |
| Vision pass re-checked every remembered object once per player (25 ms per pass, 2.5 passes a second). | Objects and their cells gathered once per pass; squared distances in the sight disc. | Same result. 25 ms → 8 ms. |
| Every AI scout scored about 54,000 frontier candidates across the whole map per decision. | Candidates within 90 tiles first; whole map only if none qualifies. | Unchanged on maps up to 180 tiles; on larger maps a far target is chosen only when nothing nearby qualifies. |
| All AIs thought in the same frame every 0.2 s. | Each AI still thinks every 0.2 s, spread across the interval. | Timing of AI decisions shifts by up to 0.15 s. |
| Worker caps: every gatherer counted every unit each step. | Per-step index of gatherers per deposit. | Same counts (index refreshed when a worker is redirected). |
| Unit spacing compared every pair of moving units. | Sweep in x order, comparing only units within 1.5 tiles in x. | Same pairs; processing order differs. |
| Building placement scanned every entity and remembered object for each candidate site. | Candidate list cached within a step; distant objects skipped first. | Same blockers. |
| Minimap repainted all 490,000 cells on every vision pass. | Repaints only cells whose sight changed, with a full repaint every 3 s for other exploration. | Same picture. |

## Result (headless simulation, 4 AIs, Colossal, same seed)

| | before | after |
|---|---|---|
| mean step | 78 ms | 7 ms |
| 95th percentile | 270 ms | 15 ms |
| 99th percentile | 1,229 ms | 39 ms |
| worst step after the opening | 4,306 ms | 655 ms (one long-route search in 4 minutes) |

The "before" run carried heavier instrumentation, which inflates its mean; the percentiles and worst
steps are the clearer comparison. The opening step (first-time caches) still takes about one second.

## Result in the browser (headless Chrome 1440×900, 4 players, Colossal, after 4 game minutes)

`PROFILE_SIZE=700 PROFILE_PLAYERS=4 PROFILE_ADVANCE=240 PROFILE_DURATION=40000 node tests/profile-hitches.cjs`

| | before (match opening only) | after (4 minutes in) |
|---|---|---|
| median frame | 16.7 ms | 16.7 ms |
| 95th percentile | 33.2 ms | 16.8 ms |
| 99th percentile | 33.5 ms | 33.4 ms |
| worst frame | 517 ms | 167 ms |

The "before" browser run could only sample the opening, which is the lightest part of a match; the
simulation table above shows how much worse later minutes were before the fixes.

## Not solved

- A rare long-route search can still take about 0.5 s on Colossal when the only way to a reachable goal
  is a long detour. A hierarchical path planner would remove it; that is a larger change.
- AI turns can still reach about 170 ms in the browser on Colossal (12 frames over 50 ms in 40 s).
