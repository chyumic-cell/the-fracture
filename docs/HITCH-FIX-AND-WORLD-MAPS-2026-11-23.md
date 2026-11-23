# Save-file hitch fix and world map types — 23 November 2026

## 1. Stutter with a real save

### Reproduction

The reported save (300×300 Narrows, Kareth, humans vs Standard symbiotes, 2,222 entities, game time 848 s)
was loaded through the normal Load button in headless Chrome:

```
PROFILE_SAVE=<path to save> PROFILE_DURATION=30000 node tests/profile-hitches.cjs
```

`tests/profile-hitches.cjs` now accepts `PROFILE_SAVE` (load a save instead of starting a scripted match),
`PROFILE_URL` (profile another server) and reports every frame over 50 ms with its timestamp.

### Causes found

All three were whole-map A* searches (90,000 cells on this map) repeated on a schedule:

1. **AI supply checks.** Every AI economy pass asked "can a worker reach this deposit through explored
   ground?" for each known deposit (all of them, not a capped list), for up to three workers each, with a
   full `path()` call. Unreachable deposits made every call exhaust the map. Measured: `ai` ticks up to
   2.2 s, 1,450 such calls in 20 s costing 11 s.
2. **Stuck movers.** Four of the player's units held move orders to map-edge points they cannot reach.
   `go()` re-plans every 1.3 s; each plan was a ~40 ms exhaustive search, and all four ran in the same frame.
   This was the regular "about once a second" beat.
3. **Walking gatherers.** `gatherSpot()` reads a cached working edge (`u.gatherPosition`) that nothing ever
   wrote, so every walking gatherer re-ran its edge-route searches every tick, and its failing
   "known ground only" first attempt exhausted the explored region.

### Fixes (all in `src/simulation.js` except the AI call sites)

- `navRegions(owner, open)` labels connected regions of a player's *known* terrain using exactly `path()`'s
  cell, slope and diagonal rules (open=false: explored ground only; open=true: unexplored counts as
  walkable). Built lazily (~3–12 ms on 300×300). Exploring new cells only ever removes links from the
  optimistic map, so that map is rebuilt only when known ground becomes *more* passable (`knownGain`),
  a gate changes or knowledge is reset.
- `knownRoute(u, q)` replaces the AI's `path()`-based checks in `src/ai-economy.js` and returns the same
  answer: conclusive cases come from the region map; the rare "a neighbour of q is reachable but q is not"
  case runs one directed optimistic search; exact distance ties fall back to the original search.
- `path()` skips its known-ground-only first attempt when the region map proves it cannot end within one
  cell of the goal, and memoises "no step closer" results for stuck movers until known terrain gains
  passability (exploration alone cannot change that answer).
- `gatherSpot()` skips candidate edges in another region, and now really caches the chosen edge for up to
  2 s while the worker is more than 3 tiles away (kept in a WeakMap, never saved). Near the deposit it
  re-chooses every tick as before. This is the one deliberate behaviour change: a far-away gatherer no
  longer switches edge mid-walk.
- `ai-logistics.js` asks `FractureMapLayouts.isMaritime()` (same answer for every existing layout).

Exactness evidence: `tests/navigation-regions.test.cjs` compares the shortcuts with the full A* on 808
sampled routes over four layouts while exploration grows, plus a sealed-unit memo invalidation case. A
comparison harness recorded 0 differences between `knownRoute` and the old check over 2,135 calls in the
`ai-opening-delivery` scenario and 6,223 calls on the user's save.

### Measured result (same save, same harness, headless Chrome, 30 s, no CPU profiler)

| | frames in 30 s | p50 | p95 | p99 | max | frames > 250 ms | frames > 1 s | worst AI tick |
|---|---|---|---|---|---|---|---|---|
| before (unmodified HEAD, 2 runs) | 595 / 599 | 16.7 ms | 100 ms | 1,216 / 1,016 ms | 1,666 / 1,716 ms | 16 / 15 | 7 / 7 | 1,632 / 1,638 ms |
| after (2 runs) | 1,698 / 1,702 | 16.7 ms | 16.8 ms | 66.6 ms | 133 / 150 ms | 0 | 0 | 131 / 120 ms |

Raw reports: `docs/performance-save-before.json` (a 20 s profiled run of HEAD) and
`docs/performance-save-after.json`. Machine load from other sessions made single runs vary; the table
uses back-to-back runs.

### Not fixed / limits

- About 5 frames per 30 s still exceed 100 ms. The largest remaining single cost is the AI planning a
  genuine ~500-tile land route in `transportChoices` (a few times a minute), plus rendering.
- Only this save and the existing scripted scenario were measured. Other saves may have other hot spots.

## 2. World map types

No world had its own map types before; all eleven layouts were shared. (The request mentioned a world
called "Nareth" with a jungle type; no such world or layout exists in this repository. The three worlds
are Kareth, Elyndra and Morvane, and Elyndra's Wildwood now fills the jungle role.)

Each world now adds three map types after the shared layouts in the setup list (an "<World> map types"
group that changes with the World selector; a world-specific choice falls back to Natural when the world
changes):

| World | Map type | Terrain |
|---|---|---|
| Kareth | Highland Lochs | long glacial lakes in parallel, crossed by protected fords; rolling hills and crags |
| Kareth | Canyonlands | mesa country cut by a winding canyon network with benches; mesas climbable near bases; buttes |
| Kareth | Fjords (naval) | open sea along one edge, deep tapering inlets with land bridges; harbours cut to every base |
| Elyndra | Wildwood | dense forest everywhere except clear trails, glades and bases; small ponds |
| Elyndra | Ley Terraces | stepped hills of two or three tiers with radial ramps, crowned by an unclimbable ley spire |
| Elyndra | Starfall Lakes | crater lakes inside raised rims with one or two breaches to a lakeside shore |
| Morvane | Brimstone Rifts | jagged edge-to-edge chasms crossed only at stone bridges |
| Morvane | Crater Field | walled craters (some with central peaks) entered through narrow breaches |
| Morvane | Spire Wastes | clusters of stone spires and broken ash ridges, with a trail linking the bases |

Water uses each environment's palette (lava-red on Hell, blood-dark on Dreadhollow). Wildwood forest is
planted after the ordinary tree scatter, so every older layout draws the same random sequence; it is capped
at 7% of map area in trees.

Every world type finishes with shared guards: flat dry base clearings; `linkStarts` (causeway if any base
is cut off); `linkRegions` (joins any large stranded land region or reserved lane); and `boundDetours`
(a base's nearest rival may be at most 2.2× its grid distance away on foot).

Measured fairness (ring starts, 96/144/192, 2 and 4 players, 3 seeds): open ground within 18 steps of each
base min/max ratio ≥ 0.84 for every type; nearest-neighbour detour ≤ 1.9×.

### Tests

- `tests/map-layouts.test.cjs` (+5 groups): three or more types per world, deterministic and distinct;
  connectivity of every base and reserved lane at 96/144/192 × 2–4 players × 3 seeds plus 500 and 700;
  open ground ratio ≥ 0.75 and detour ≤ 2.3; opening deposits off reserved lanes; one theme check per type.
- `tests/maps.test.cjs` (+1 group): real matches for all nine types (100 and 200, random starts, 2 and 4
  players) walk worker routes between bases, find all four opening deposit kinds near every base, bound
  scenery counts, check Wildwood density, and round-trip a save.

### Limits

- Balance across these maps is not established; only terrain fairness metrics and opening-match checks ran.
- The AI has no map-type-specific tactics; it treats Fjords as maritime and the rest as land maps.
- Generation was viewed as terrain diagrams and one in-game Crater Field screenshot, not a full art review
  of every type in every environment.
