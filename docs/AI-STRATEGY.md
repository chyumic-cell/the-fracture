# AI strategy — current fair-rate build, 10 November 2026

All ten AI difficulties use the player's gathering, carrying, construction, training, research and deep-extraction rates. They pay normal prices and use the same finite resources, upgrades, population limits, unit statistics and private navigation knowledge. Previous reports using economic difficulty modifiers are superseded; their wins do not establish the current AI's strength.

Standard's decision-profile values remain unchanged. Differences between the named difficulties are planning/reaction frequency, workforce and army goals, scouting, production planning, composition, research timing, reserves, focus fire, ranged spacing, flanking, reinforcement and observed-target raids. The current release fixes concrete decisions but still requires measured competitive calibration; it is not a consistently ordered difficulty ladder.

## Current decision fixes

- Preserve an affordable reinforcement cycle before optional infrastructure. Avoid early building-breaker spam and evaluate available counters using actual weapon multipliers, armor, health and prices.
- Expand a saturated production branch before speculative technology. Nightmare and Apocalypse additionally require the existing factories to be busy before adding another and staff their paid production with more normal workers. Production capacity is purchased; it does not multiply training speed.
- Permit cost-effective weapon and armor upgrades while replacing losses instead of postponing them indefinitely. Healing support can be planned before an entire late-game army exists.
- Reserve damage from in-flight shots and committed windups, including visible armor, so troops do not all waste their fire on the same dying target. Preserve committed weapon releases.
- Keep artillery outside its minimum range. Retreat from genuinely unfavorable fights without abandoning a winning assault solely because it suffered earlier casualties. Longer marches receive distance-based operation timeouts.
- Avoid permanently withdrawing wounded veterans when no healer exists. Evade splash only when movement can clear the blast before impact without sacrificing a ready shot.
- Add a dedicated air/naval tactical controller. Aircraft prioritize visible anti-air threats, escorts cover aircraft, siege vessels prioritize shore structures, and damaged units withdraw using charted routes. Strategic wing orders respect active tactical orders and weapon windups.
- Buy fleet composition in response to observed ships and aircraft. All detection, naval paths, targeting, prices, population, research and unit statistics remain normal player rules.
- Gentle, Relaxed and Easy do not coordinate focus fire or activate combat abilities; Standard keeps its prior behavior. Legacy Normal and Hard save IDs still map to Standard and Expert.

The same faction definitions drive all these systems. The competitive tournament sample below covers Humans and Primates; it does not certify all twelve matchups or all map sizes. No campaign illustrations were generated.

## Island logistics

- Purchases the actual dock, unlock chain and transport, with reserved funds for essential crossing production.
- Explores charted shoreline frontiers using the owner's remembered water/obstacles. Hidden actual geography cannot alter a planned naval path; physical movement still obeys real terrain.
- Uses scouting progress and distance-appropriate crossing timeouts instead of abandoning a newly built boat because a fixed match clock expired.
- Lands paid reconnaissance troops on an observed foreign shoreline when a ship cannot see an inland opponent. Those troops explore until they find actual targets.
- Releases troops left on the departure shore, clears landed troops away from the unloading beach immediately and tracks the actual carrier passengers.
- Uses naval escorts and air alternatives, with actual boarding, movement and unloading.

`island-standard-final-matrix.json` records twelve Standard factions on the same 100-tile small-island seed against passive opponents. All twelve purchased ships, physically landed troops and won. A separate 200-tile Primate large-island trace also won after several naval landings. This verifies functioning logistics in those scenarios, not all-size/all-seed competitive naval balance.

## Current difficulty measurement

The release was tested in 31 normal-rule matches: **25 higher-level wins, 5 lower-level wins and 1 time limit**. Every report records unchanged source hashes, and those hashes match the uploaded AI. No resources, units, damage or victory conditions were injected. Time limits are not scored as wins.

The adjacent ladder uses Humans, a 100-tile Natural map, seed 42, balanced placement and Rich resources, with both starting positions tested. The simulation limit is 1,500 seconds. Report: [ai-release-adjacent.json](ai-release-adjacent.json).

| Comparison | Higher wins | Lower wins | Time limits |
| --- | ---: | ---: | ---: |
| Relaxed / Gentle | 2 | 0 | 0 |
| Easy / Relaxed | 1 | 0 | 1 |
| Standard / Easy | 2 | 0 | 0 |
| Challenging / Standard | 2 | 0 | 0 |
| Veteran / Challenging | 1 | 1 | 0 |
| Expert / Veteran | 2 | 0 | 0 |
| Master / Expert | 2 | 0 | 0 |
| Nightmare / Master | 2 | 0 | 0 |
| Apocalypse / Nightmare | 1 | 1 | 0 |

Additional checks:

- [Default-resource holdout](ai-release-holdout.json): four side-swapped upper-level games on seed 17, Standard resource abundance. Two higher-level wins and two lower-level wins.
- [Wider gaps](ai-release-wide.json): Apocalypse against Master and Expert, seed 213301, both starting positions. Four higher-level wins. This is encouraging separation in a small sample, not a guaranteed win rate.
- [Competitive maritime play](ai-release-maritime.json): Humans and Primates on 100-tile Small Islands and Continental layouts. Apocalypse beat Expert in three of four games. Both sides performed physical paid landings in every match. The higher controller occupied the first starting position in this sample; it was not a side-swapped naval tournament.
- [Larger island game](ai-release-large-islands.json): 200-tile Primate Large Islands, Standard resource abundance, Apocalypse versus Expert. Apocalypse won in 929 simulated seconds. This is one larger-map check, not all-size coverage.

Every adjacent tier won at least once in the main ladder, and wider gaps were clearer in the separate sample. However, adjacent tiers still trade wins, one lower-tier game timed out, and the two-seed sample is too small to certify a consistently ordered strength ladder. Apocalypse is not proven unbeatable by humans. Competitive calibration across the remaining civilizations, additional maps and larger sizes remains open.

## Verification

All **29 simulation regression files** passed against this release, including the required simulation and legacy-gameplay suites. Fourteen new decision groups cover paid reinforcement budgeting, production expansion, preserving weapon releases, avoiding wasted shots, artillery spacing, sensible retreats, air/naval priorities, private visibility, saved tactical state and physically possible projectile evasion.

Standard's complete five-minute serialized simulation is identical to the pre-change capture: SHA-256 `ca97b3628bdbfbbe736a97c15b26effe327a94b712912e502e74ec425ce9f1e8`. Its decision profile and normal economic rules remain unchanged.

Browser checks passed for the ten named settings, activation, save/load, normal gathering/building/training, controls, all twelve faction renderers and direct offline launch. The user's active browser game was not reset. See [ai-difficulty-validation.json](ai-difficulty-validation.json) for the combined record. Save, refresh the game page and resume to load the new code into an existing match.
