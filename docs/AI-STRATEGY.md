# AI strategy — current fair-rate build, 10 November 2026

All ten AI difficulties use the player's gathering, carrying, construction, training, research and deep-extraction rates. They pay normal prices and use the same finite resources, upgrades, population limits, unit statistics and private navigation knowledge. Previous reports using economic difficulty modifiers are superseded; their wins do not establish the current AI's strength.

Standard's decision-profile values remain unchanged. Differences between the named difficulties are planning/reaction frequency, workforce and army goals, scouting, production planning, composition, research timing, reserves, focus fire, ranged spacing, flanking, reinforcement and observed-target raids. Stronger behavior still needs measured calibration: changing these settings is not itself proof of a reliable ordering.

## Island logistics

- Purchases the actual dock, unlock chain and transport, with reserved funds for essential crossing production.
- Explores charted shoreline frontiers using the owner's remembered water/obstacles. Hidden actual geography cannot alter a planned naval path; physical movement still obeys real terrain.
- Uses scouting progress and distance-appropriate crossing timeouts instead of abandoning a newly built boat because a fixed match clock expired.
- Lands paid reconnaissance troops on an observed foreign shoreline when a ship cannot see an inland opponent. Those troops explore until they find actual targets.
- Releases troops left on the departure shore, clears landed troops away from the unloading beach immediately and tracks the actual carrier passengers.
- Uses naval escorts and air alternatives, with actual boarding, movement and unloading.

`island-standard-final-matrix.json` records twelve Standard factions on the same 100-tile small-island seed against passive opponents. All twelve purchased ships, physically landed troops and won. A separate 200-tile Primate large-island trace also won after several naval landings. This verifies functioning logistics in those scenarios, not all-size/all-seed competitive naval balance.

## Current difficulty measurement

`ai-counter-corrected-fair-ladder.json` contains 18 adjacent-level Human games on the same balanced-placement seed, with starting sides exchanged. It uses the current corrected counter rules and normal economy rates. Checked simulation/AI source hashes remained unchanged during the tournament and still matched at the documentation checkpoint.

| Comparison | Higher wins | Lower wins | Time limits |
| --- | ---: | ---: | ---: |
| Relaxed / Gentle | 2 | 0 | 0 |
| Easy / Relaxed | 1 | 0 | 1 |
| Standard / Easy | 2 | 0 | 0 |
| Challenging / Standard | 2 | 0 | 0 |
| Veteran / Challenging | 2 | 0 | 0 |
| Expert / Veteran | 0 | 1 | 1 |
| Master / Expert | 1 | 1 | 0 |
| Nightmare / Master | 1 | 1 | 0 |
| Apocalypse / Nightmare | 2 | 0 | 0 |

Time limits remain unresolved matches, never inferred victories. The requested smooth strength ladder is unfinished, particularly Expert and several higher adjacent pairs. Apocalypse's two wins in this seed do not prove that humans cannot beat it. Additional calibration, seeds, wider gaps and competitive maritime matchups remain necessary. Campaign illustrations stay paused.

## Verification

AI strategy, difficulty and fairness regressions pass, including all ten levels' normal rates, paid transport prices, normal production speed, preserved Standard profile and private naval navigation. The full run passes all 27 simulation regression files. Shared combat multipliers now drive actual damage and counter descriptions; see UNIT-COUNTERS.md for the twelve-civilization roster audit. Normal browser gameplay, save/load and offline launch also pass.
