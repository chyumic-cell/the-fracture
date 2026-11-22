# AI difficulty ladder rebuild

Status date: 22 November 2026. **Calibration is not complete.** This document separates what is
verified by measurement from what is implemented but not yet validated. No win-rate target in
this document is claimed as met.

## A. Root-cause analysis: why the previous ladder failed

Three measured causes, not opinions.

### A1. The top six tiers were capability-saturated

`tests/ai-macro-bench.cjs` develops one tier alone on a map for 600 simulated seconds with no
opponent, so only its own competence affects the result. Measured on the pre-rebuild source
(seed 42, size 120):

| Level | Tier | Workers | Military | Gathered | Spent | Decisions |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Gentle | 6 | 8 | 3,604 | 3,165 | 34 |
| 2 | Relaxed | 9 | 11 | 5,457 | 4,845 | 182 |
| 3 | Easy | 12 | 20 | 6,850 | 6,530 | 207 |
| 4 | Standard | 16 | 19 | 7,962 | 7,980 | 334 |
| 5 | Challenging | 20 | 24 | **9,280** | 7,985 | 500 |
| 6 | Veteran | 22 | 20 | 7,165 | 7,680 | 667 |
| 7 | Expert | 22 | 22 | 8,370 | 7,975 | 628 |
| 8 | Master | 27 | 21 | 8,749 | 8,290 | 1,000 |
| 9 | Nightmare | 31 | 27 | 8,083 | 7,650 | 1,706 |
| 10 | Apocalypse | 27 | 22 | 8,009 | 7,670 | 2,000 |

Levels 1 to 5 were a real ladder. Levels 5 to 10 were flat and partly inverted: peak economic
output was *Challenging*, and Apocalypse gathered 14% less than Challenging while making four
times as many decisions. Veteran was an outright regression.

The reason is that the upper tiers were differentiated by parameters that had already saturated
against the game's own limits. Raising `workerTarget` from 40 to 60 on the former Apocalypse
produced **byte-identical** output. `productionLimit` was already non-binding: only four or five
production buildings were ever built. These knobs could not express a difference.

### A2. Faster decision cadence actively reduced playing strength

The former Apocalypse's signature setting was `think: 0.15`, re-planning about seven times a
second. Measured on the former Apocalypse profile with collection reach unlocked:

| `think` | Workers | Military | Gathered | Decisions |
| ---: | ---: | ---: | ---: | ---: |
| 0.15 | 29 | 25 | 9,003 | 2,000 |
| 0.60 | 32 | **47** | 9,782 | 875 |
| 1.20 | **36** | 38 | **9,931** | 451 |

Thinking *less often* nearly doubled army output. The controller was re-ranking objectives faster
than the game could execute them, so it churned orders instead of committing. Every previous
attempt made the strongest tiers think faster, which made them worse. This is why parameter
tuning produced "inconsistent results".

### A3. Collection capacity was hard-capped for every tier

`src/ai-economy.js` limited every difficulty to three collection buildings per resource, with a
fixed expansion gate. Income was therefore capped identically for Gentle and Apocalypse, which is
why total spending plateaued near 8,000 regardless of tier.

### A4. A fairness defect in map generation (found during this work)

Opening deposits were placed at five fixed offsets from each start and **silently dropped** when
the target tile was water, blocked, reserved for a route, or already occupied. Measured over 60
seeds across eight layouts on the pre-rebuild source: **16 of 120 player starts (13.3%) began
with fewer than their five opening deposits.** This is an unequal start, not an AI problem, and it
plausibly contributed to the chronic inconsistency of earlier calibration runs.

## B. Changes implemented

### B1. Capability decoupled from menu position (`src/ai.js` and all AI modules)

Capability was gated on `config.level` in 48 places across four files, so moving a profile between
menu positions silently changed its behaviour. Every gate now reads `config.grade`, an explicit
competence rank independent of `level` (the menu position). Standard carries **grade 10**, the
former Apocalypse's grade, so it inherits that controller's entire capability set exactly. Tiers
above Standard occupy grades 11 to 16.

The substitution was verified behaviour-preserving: with `grade === level` the macro benchmark
reproduced the pre-change numbers for all ten tiers byte-for-byte.

### B2. Collection reach as a difficulty competence (`src/ai-economy.js`)

`expansionLimit`, `expansionAt`, `expansionWorkers` and `expansionSites` are now profile fields.
Stronger controllers charter and pay for more collection sites, earlier. Prices, yields and
gathering rates are untouched; these are ordinary purchases under ordinary rules. Note that
`expansionSites > 1` was tested and rejected: holding several foundations in flight starved the
rest of the economy (9,003 to 7,242 gathered). All tiers use one.

### B3. Decision commitment (`src/ai.js`)

New `commitment` capability (grade 11+): the controller retains its current objective unless a
candidate beats it by a clear margin, instead of re-ranking every pass. This addresses A2 directly.

### B4. Home defence (`src/ai-combat.js`, `homeGuard`)

The previous reserve was `min(3, 12% of army)` — a hard cap of three units regardless of army
size, so a counter-attack met an empty base. Every tier now holds back a real proportion of its
army. Tiers with `adaptiveGarrison` (grade 11+) size the guard against the enemy strength they
have actually observed, and always strengthen it when a known threat is inside their territory.

### B5. Random starting positions (`src/simulation.js`)

Starts are now drawn at random from the seed rather than from a fixed ring. A minimum separation
keeps openings playable, and candidate sets are scored so no player is dropped into materially
worse ground. `startPositions:'ring'` restores the original fixed ring and `starts:[...]` pins
exact positions; deterministic scenario tests use these, and campaign missions were already
overwriting `g.starts` with their own mission positions, so scripted content is unaffected.

### B6. Opening deposits are guaranteed (`src/simulation.js`)

A deposit whose intended offset is unusable is nudged outward to the nearest workable tile instead
of being dropped. Measured over the same 60 seeds and eight layouts: **13.3% of starts short of
deposits before, 0% after.**

### B7. Naval access is guaranteed (`src/map-layouts.js`)

The `rivers` layout wipes all water and redraws it, and its `channel` routine skips every cell
within 13 tiles of a start, so a random start could end up 116 tiles from water — outside the
90-tile radius the game itself searches when siting a dock. A tributary is now run toward any
start the drainage network left dry. Because `channel` keeps its 13-tile dry margin, the spur
stops short of the base and, being a dead end, never severs land movement.

Measured nearest water per start (seed 42):

| Layout / size | Original ring starts | Random starts, after this fix |
| --- | --- | --- |
| rivers 300 | 28, 13 | 13, 13 |
| rivers 700 | 72, 13 | 14, 13 |
| narrows 300 | 21, 30 | 14, 13 |
| narrows 700 | 75, 55 | 13, 14 |

This is better than the original behaviour, which relied on the ring happening to fall near water.

## C. Baseline verification: Standard preserves the former Apocalypse

`tests/fixtures/ai-standard-anchor.json` records all 40 keys of `configFor('apocalypse')` read
from the pre-rebuild `src/ai.js` via `git show HEAD:src/ai.js`. `tests/ai-ladder-behavior.test.cjs`
asserts the new Standard reproduces every one of those decision parameters, excluding only `id`,
`name`, `level` and `grade`. **This test passes.**

In the macro benchmark, the new Standard reproduced the former Apocalypse's solo development
exactly: 27 workers, 22 military, 8,009 gathered, 7,670 spent, 2,000 decisions — identical.

Two deviations are deliberate and are *not* covered by that equality, because they are shared
repairs rather than tier capabilities, and section 6 of the brief forbids reserving fixes for
stronger tiers:

- Home defence (B4) applies to every tier, Standard included.
- The scouting diversion budget, which previously pulled up to five workers off income at the
  highest grades, is capped at two for all tiers.

## D. Difficulty design

| Level | Tier | Grade | Cadence | Collection sites | Distinguishing competence |
| ---: | --- | ---: | ---: | ---: | --- |
| 1 | Gentle | 1 | 18.0 | 1 | Builds, gathers, defends locally; no land assault before 600s |
| 2 | Relaxed | 2 | 3.2 | 1 | Basic economy and army, little coordination |
| 3 | Easy | 4 | 2.4 | 2 | Focus fire, abilities, coherent attacks |
| 4 | Standard | 10 | 0.15 | 3 | **The former Apocalypse controller, preserved** |
| 5 | Challenging | 11 | 0.45 | 4 | Objective commitment; threat-sized home guard |
| 6 | Veteran | 12 | 0.50 | 5 | Wider collection reach, earlier expansion |
| 7 | Expert | 13 | 0.55 | 6 | Longer intelligence retention (240s) |
| 8 | Master | 14 | 0.60 | 7 | Larger sustained economy and army targets |
| 9 | Nightmare | 15 | 0.65 | 8 | Earliest expansion, 280s memory |
| 10 | Apocalypse | 16 | 0.70 | 10 | Widest reach, 320s intelligence retention |

Cadence is *calibrated, not monotone*: section A2 shows that pushing it lower reduces strength, and
measurement also showed degradation past about 0.8s. `tests/ai-difficulty.test.cjs` therefore
asserts monotone **grade, worker target, army target, collection reach, expansion timing and
capability nesting**, and no longer asserts that cadence decreases.

## E. Fairness

No tier receives resources, cheaper units, faster gathering, training, construction or research,
combat bonuses, hidden map knowledge, population allowances or scripted outcomes. `economyRates`
remains `{gather:1, production:1}` for every tier and is not read anywhere in the codebase, so no
rate multiplier exists to be abused. `tests/ai-difficulty.test.cjs` and
`tests/ai-fair-islands.test.cjs` verify identical gather rates, full prices, player-rate
construction and training, and absence of hidden naval terrain knowledge, across all ten tiers.

Relaxed is no longer the frozen calibration anchor; re-anchoring to Standard required
recalibrating the three tiers below it. `tests/ai-fair-islands.test.cjs` now asserts that Relaxed
is a strictly weaker but still functioning opponent than Standard, rather than pinning its exact
former values.

## F. Measured results so far

### F1. Regression suites

**56 of 56 `tests/*.test.cjs` suites pass.** Six suites required updating; each change and its
reason:

| Suite | Change | Reason |
| --- | --- | --- |
| `ai-difficulty` | Cadence monotonicity replaced by grade/reach/capability monotonicity | The old assertion encoded the disproven assumption of A2 |
| `ai-ladder-behavior` | Relaxed profile freeze replaced by the Standard anchor check; housing and factory expectations now capability-derived | The ladder was re-anchored to Standard per the brief |
| `ai-fair-islands` | Relaxed exact-value pin replaced by "weaker than Standard but functioning" | Same |
| `ai-strategy` | Contact-expiry time and reinforcement-wave size now derived from the tier profile | Were pinned to the former Expert's `memory` and `reinforceReserve` |
| `legacy-gameplay` | Withdrawal scenario now supplies an opposing force | Standard now uses the adaptive withdrawal rule, which requires a real enemy rather than withdrawing from an empty field |
| `ai-opening-delivery`, and three scenario fixtures | Pinned to `startPositions:'ring'` | They reproduce specific map geometry and must not depend on random starts |

### F2. Solo macro benchmark, rebuilt ladder

Mean of 4 seeds, 600 simulated seconds, size 120:

| Level | Tier | Gathered | Spent | Workers | Military |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | Gentle | 3,570 | 2,755 | 6.0 | 6.5 |
| 2 | Relaxed | 4,106 | 3,358 | 9.0 | 10.8 |
| 3 | Easy | 6,079 | 5,946 | 13.0 | 17.5 |
| 4 | Standard | 8,170 | 7,738 | 29.8 | 25.2 |
| 5 | Challenging | 8,326 | 8,038 | 30.8 | 33.8 |
| 6 | Veteran | 8,330 | 8,125 | 31.0 | 34.0 |
| 7 | Expert | 8,339 | 8,161 | 31.5 | 33.8 |
| 8 | Master | 9,370 | 9,260 | 33.8 | 44.0 |
| 9 | Nightmare | 8,794 | 8,461 | 30.5 | 27.8 |
| 10 | Apocalypse | 8,794 | 8,461 | 30.5 | 27.8 |

Honest reading: levels 1 to 4 now separate strongly (2.3x range). **Levels 4 to 10 all sit at the
same economic ceiling of roughly 8,200 to 9,400, and Nightmare and Apocalypse are identical.** The
economic lever is exhausted on a 120 map: there are not enough reachable deposits for collection
reach above about 6 to express itself. Any remaining separation among the top tiers must come from
combat and tactical quality, which a solo benchmark cannot measure by construction.

### F3. Head-to-head scorecard (partial)

`tests/ai-ladder-scorecard.cjs` runs real, deterministic, side-swapped matches and records
resources, spending, military produced, surviving and lost, kills, damage, buildings and tech.
Produced counts are exact (`lost + surviving`), which removes the produced-versus-surviving
confusion in earlier reports. Unfinished games are never counted as wins.

Completed so far — **this is a small sample and establishes nothing about the 5-10% target**:

| Pair | Completed | Higher wins | Lower wins | Unresolved | Avg match |
| --- | ---: | ---: | ---: | ---: | ---: |
| Relaxed / Gentle | 2 | 2 | 0 | 9 (all time-limit) | 1,271s |
| Expert / Veteran | 3 | 2 | 1 | 0 | 1,021s |

Mean per-match competence in those completed games:

| Pair | Side | Gathered | Military surviving | Kills | Lost |
| --- | --- | ---: | ---: | ---: | ---: |
| Relaxed / Gentle | Relaxed | 6,766 | 18 | 24 | 14 |
| Relaxed / Gentle | Gentle | 4,300 | 1 | 14 | 24 |
| Expert / Veteran | Expert | 12,149 | 33 | 37 | 32 |
| Expert / Veteran | Veteran | 8,703 | 15 | 32 | 37 |

## G. Remaining limitations and open problems

1. **No win-rate target is established.** 5 completed matches total. The brief's 20-per-pair
   standard requires 180 completed matches; 175 remain.

2. **Weak tiers cannot execute a victory.** Relaxed beat Gentle on every measured dimension in all
   11 matches, yet 9 of 11 hit the time limit. Victory requires destroying every enemy production
   building, and an AI that fields about 11 military units cannot raze a defended base. A 90-95%
   *win* rate is unreachable for pairs where the stronger side cannot finish, however dominant it
   is. Resolving this needs a decision outside the AI: either the lower tiers get enough army to
   close out games, which compresses the Gentle/Relaxed/Easy distinctions, or the match needs a
   resolution rule such as resignation on total loss of production capacity. No such rule was added
   here, because it changes game rules.

3. **The top tiers are not yet meaningfully separated.** Grades 14 to 16 differ only in numbers that
   the macro benchmark shows to be at or near saturation. Real separation needs new tactical
   competences (multi-prong attack, harassment of enemy collection, reserve management) that are
   designed but not implemented.

4. **Simulation cost scales with the stronger AI.** Upper-tier matches now run 150 to 370 seconds of
   wall time each because the armies and economies are much larger. On the two cores available to
   this session, 180 matches is roughly 10 to 15 hours.

5. Side variance remains high. Expert out-gathered Veteran roughly 1.4 to 1 and still lost one of
   three. Starting-position quality in isolation varies by 15 to 25% between slots on the same seed
   and map, and matches snowball strongly, so small early differences decide games.

6. Random starts were verified not to be systematically biased: the same tier developing alone from
   each slot on the same seed produced 8,526 vs 9,093, 7,762 vs 9,952, and 9,844 vs 8,874 — the
   direction varies by seed. Random starts do, however, raise outcome variance, which works against
   a tight win-rate band.

## H. Reproducible commands

Both runners are resumable and refuse to mix source revisions or settings into one report, so a run
can be continued on another machine as long as `src/` is unchanged.

```powershell
# Solo competence benchmark across all ten tiers
$env:AI_SECONDS='600'; $env:AI_SEEDS='42,777,31337,4242'
$env:AI_REPORT='.art-work/macro.json'
node tests/ai-macro-bench.cjs

# Head-to-head ladder scorecard, 20 completed matches per adjacent pair
$env:AI_MATCHES='20'; $env:AI_SECONDS='1500'
$env:AI_PAIRS='2:1,3:2,4:3,5:4,6:5'; $env:AI_REPORT='.art-work/tour-lower.json'
node tests/ai-ladder-scorecard.cjs
$env:AI_PAIRS='7:6,8:7,9:8,10:9'; $env:AI_REPORT='.art-work/tour-upper.json'
node tests/ai-ladder-scorecard.cjs
```

Run the two scorecard commands in separate shells to use two cores. Partial reports from this
session are in `.art-work/tour-lower.json` and `.art-work/tour-upper.json` and will be resumed
rather than restarted.
