# Difficulty calibration and economic recovery

## Current requirement

Relaxed, the second-easiest setting, is the fixed baseline from commit `08ecc42cd2ec3c7923b29996de85baaab7280861`. This supersedes Standard, Expert and Challenging as anchors. Gentle is a forgiving learning mode and is excluded from the competitive win-rate target. Names and legacy save aliases remain unchanged.

For each of the eight adjacent pairs from Relaxed/Easy through Nightmare/Apocalypse, the lower tier should win 5–10% and the higher tier 90–95%. Short batches detect obvious failures; a full 24-game mixed-map batch needs exactly two lower-tier wins, with no unresolved games, to fall in that range. Matchups two or more tiers apart are not inferred by multiplying adjacent percentages.

## Implemented

- Gentle has a smaller workforce/army target and waits ten minutes before initiating land assaults. Local defense still operates.
- Relaxed retains its complete original profile and ordinary planning behavior. Shared emergency recovery also covers Gentle and Relaxed after stagnation; preserving tuning does not disable deadlock repairs.
- Higher tiers receive faster decision cycles, larger paid workforce/army targets, increasingly capable production forecasting, counter selection, artillery protection, damage forecasting and reinforcement planning.
- Master, Nightmare and Apocalypse no longer introduce a backwards delay in technology consideration. This changes planning timing, not research completion speed.
- Parallel factories reassess composition after each paid queue; capable tiers anticipate housing demand and keep useful factories productive.
- Easy and above proactively reserve two markets and a merchant when drilling prerequisites require resources unavailable through their known reachable deposits. Merchants physically travel and spend ordinary Trade Credits; no income is granted. Stalled lower difficulties can use the same recovery route.
- Merchants interrupted by spawn rally orders resume trading. Stationary merchants retry routes; progressing voyages retain their cargo/orders. Trade purchases remain possible while the home base is threatened.
- Stalled economic work triggers a bounded retry of failed sites, supply paths and exploration. It releases stationary failed worker orders without interrupting active transport assignments, carried cargo or deep extraction.
- Population-blocked transport queues no longer hold up housing or drilling. An affordable action that cannot execute is temporarily skipped so another useful action can proceed.
- New foundations preserve tested known corridor exits. Planning uses private discovered routes and restores temporary navigation state after evaluating a site.
- Funded island armies can launch troop transports instead of postponing attacks indefinitely because surface Ore is depleted.

## Added economic and tactical repairs

- Spending forecasts exclude deposits covered by currently observed enemy weapons and recent observed contacts. Hidden enemy movement cannot change the forecast; stale exclusions expire.

- Resource-free island openings protect the normal-priced dock and transport. A small worker party can physically ferry finite Ore back to the home collection point before an outpost is affordable. The same carried-cargo delivery behavior is available to human workers after unloading.
- Paid upgrades are evaluated against the existing army. Feasible investments retain their savings while the last resources arrive, instead of repeatedly spending the money on another basic unit.
- Observed aircraft trigger dedicated anti-air infrastructure. Incapable ground-only defenders no longer absorb air-defense assignments. Stronger controllers can build at a safe reachable outpost when the original headquarters is under attack.
- Advanced economies can build additional deep Ore mines on known exhausted deposits, distribute their existing workforce across them, and continue recruiting workers when renewable extraction is operating.
- Island troop production respects actual transport capacity. A recently working deep mine allows funded military voyages; merely owning an idle mine does not.
- Protected artillery uses its real range advantage against armed buildings; escorts stay outside the defended target's reach when a known route permits it.
- A four-player game reproduced an out-of-map formation destination crash. March destinations now remain inside the grid, and stale invalid paths recover without revealing wrapped fog cells. The captured game continued for another simulated minute past the original crash.

## Fairness

No resources, cheaper units, accelerated gathering/training/research, combat bonuses, hidden-map access, opponent-dependent profiles or scripted wins. Extra workers, factories, research and traders are purchased under the same rules as the player. The four gathered resources, existing Trade Credits and all twelve civilizations are preserved. No illustrations, artwork or terrain changes are included.

Economic recovery cannot recreate workers or resources after a position is legitimately lost. Tests distinguish a functioning recovery plan from a promise that every possible match or damaged save is recoverable.

## Reproducible testing

`tests/ai-ladder-calibration.cjs` runs real, deterministic, side-swapped games. It records exact source fingerprints, settings, winners, time limits, paid spending, gathered resources and final armies. Resume is allowed only for the same source and settings. Draws and time limits are unresolved, never counted as higher-tier wins.

```powershell
$env:AI_SOURCE = 'src'
$env:AI_REPORT = '.art-work/ai-ladder-next-run.json'
$env:AI_ROTATE = '1'
$env:AI_ROUNDS = '12'
$env:AI_HIGHS = '3,4,5,6,7,8,9,10'
$env:AI_SECONDS = '1800'
node tests/ai-ladder-calibration.cjs
```

This rotates Natural, Small Islands, Labyrinth, Rivers, Narrows, Large Islands, Mountain Passes, Coastal, Steppes, Mediterranean and Continental, plus all twelve civilizations. The internal indices are test settings; menu names remain words only. `AI_SIZES` supports a comma-separated size list. Default competitive checks exclude Gentle.

Resource variation is now enabled by default. Each paired duel keeps the same resource amount, placement and starting-deposit setting on both sides. Amounts are Scarce (0.5), Normal (1), Rich (2) and Abundant (4); placements are balanced, random and contested. Starting deposits are independently enabled/disabled. Initial stock and every player's resource rates remain equal. Set `AI_VARY_CONDITIONS=0` only for a fixed-condition replay.

By default, a side-swapped random nonadjacent matchup is inserted after every four adjacent matchup pairs. Its multiplayer result is kept outside adjacent win-rate statistics. `AI_INTERLEAVE_EVERY=0` disables these insertions for an exact replay; another positive integer changes the interval.

For a standalone batch of nonadjacent strategy checks, set `AI_CROSS_CHECKS=28` and `AI_CROSS_SEED` to a recorded integer. The scheduler samples all 28 eligible nonadjacent tier pairs without replacement, rotates civilizations/maps and swaps their starting sides. With variation enabled these checks also sample two, three and four players with independently selected extra opponents. Adjacent calibration remains one-on-one: free-for-all winners are recorded separately and are not counted toward the adjacent 5–10% target. `tests/ai-cross-tier-schedule.test.cjs` checks repeatability, all economic choices and side-pair consistency. Choose a new report filename when changing settings or source.

Source and test-runner hashes are recorded. Failed matches preserve replay saves, exceptions count as errors, and losses against lower tiers are explicitly flagged. A timeout never counts as a win.

A small sample guides tuning but does not establish the true win probability. The statistics helper separates the observed 5–10% batch result from an upper confidence bound; zero lower-tier wins does not satisfy the requested minimum. Paired sides share a seed and are not independent evidence for a universal statistical guarantee.

## Baseline and regression evidence

`tests/fixtures/ai-relaxed-anchor.json` contains the complete preserved profile and full-game checkpoint hashes from the original code. `tests/ai-anchor-capture.cjs` compares separate-process replays on Human Natural, Primate Small Islands and Machine Narrows maps. Gameplay checkpoint hashes match after the recovery changes; only the new recovery-monitor bookkeeping is excluded from those hashes. Orders, economy, RNG and other gameplay state remain compared.

`tests/ai-recovery.test.cjs` covers all twelve civilizations' recovery budgets, physical merchant travel and normal exchange prices, stalled-order retries, save restoration, protected active voyages and corridor placement. A captured population-deadlocked island save resumed paid research and mining, earning 918 more Ore over 400 simulated seconds. All three allied Apocalypse economies also sustained extraction through the twenty-minute Small Islands depletion test. The final guarded-supply controller also resumed the depletion save from 1,200 to 1,500 seconds: Humans earned another 1,578 Ore, Primates 1,596 and Machines 1,224 through ordinary extraction. See `ai-renewable-recheck.json`. These are economic recovery checks, not competitive win-rate tests.

Other focused checks cover production planning, island assaults, fair rates/fog, real worker expeditions and naval trade. Simulation and legacy gameplay regressions are also required.

## Balance status

The earlier mixed-map candidate failed the requested range: Easy won 13 of 24 against Relaxed, lost five and left six unresolved. The upper-tier screen also found inversions. Those findings motivated the recovery fixes; they are not evidence that calibration is complete. Reports named `ai-relaxed-current-*` describe the subsequent candidate. The requested whole-ladder 5–10% range must not be claimed until current complete batches support it.
