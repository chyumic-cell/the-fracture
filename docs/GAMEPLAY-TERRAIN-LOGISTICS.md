# Gameplay, terrain, and logistics update — 12 November 2026

No illustrations were generated or edited in this gameplay pass. The original Labyrinth generator remains intact; all twelve civilizations and the four-resource / Trade Credit economy are preserved.

## Implemented

- Rivers: winding stems, tributaries, forks, rejoining side channels, delta arms, widened basins and backwaters. No bridges.
- Narrows: the same dense branching maze construction used by Labyrinth, with rivers, distinct plateau tiers, short ramps, intermediate landings, five-cell passages, defensive widenings and base spaces. Upper land is playable, rather than inaccessible decorative rock. Terrain connectivity repairs connect land components without filling river crossings. Tiny retains the specified single elevation tier; larger maps use two through five tiers.
- Terrain readability: cliff crowns on impassable edges, contrasting ramp surfaces, shared corner geometry to close ramp seams, correct cliff occlusion for units/resources/scenery, faint occluded-unit silhouettes respecting visibility, and selected resource elevation labels. Flying transport unloads remain on the chosen elevation.
- Shared explored routes: allied knowledge is shared, explored paths work in both directions, and hidden terrain is not disclosed by navigation.
- Aviation: 63-second normal endurance, geographic full-width 45-degree corridor based on distance from last refueling origin, safe-field preference with 240-second attack history, manual eligible-field selection, automatic return/diversion, six-second refueling and passenger loss if no eligible functioning field survives. Town Centers cannot refuel aircraft. All civilizations have bombers that return to rearm. Scripted campaign aircraft receive proper initial aviation infrastructure.
- Logistics: actual land/water routes, aircraft endurance, available capacity, travel time and observed threats inform transport choices; paid production comparisons include unit time and cost. Worker expeditions physically board transports, land and construct resource operations. Forward aviation and defensive construction are budgeted normally. AI difficulty grants no resource or combat bonuses.
- Naval trade: all twelve docks produce dedicated merchant ships. Ships physically run connected repeat routes, earn existing Trade Credits, remain attackable, and purchase the existing four resources. AI pays for and operates these ships. Fixed a planning probe that accidentally used dock movement rules instead of ship rules.

## Validation

See gameplay-current-regressions.json for executable test-file results. Focused tests cover refueling geometry and contraction, safe fallback and diversion, crashes with passengers, bomber rearming, unload elevation, transport choice, trade reachability/payment, worker expansion, fog and shared routes.

Narrows floor checks cover all seven sizes and seeds 7, 42 and 113, requiring every dry tile to connect to a starting area or a low shoreline reachable by transport. River-separated land is not joined by bridges. Plateau checks cover five layouts, seven sizes and three seeds. Dock checks cover Rivers and Narrows at every size. Main simulation and legacy regressions, normal browser gameplay/offline launch, and visual cliff/ramp comparisons were run. Labyrinth and Narrows were separately generated and visually inspected.

## Practical limits

- Start a new match after refreshing to use the revised map generators. Existing saves retain their terrain.
- The reachability checks cover the stated sizes/seeds, not every possible random seed.
- The twelve-faction island matrix establishes functional paid transport landings against a passive opponent. It does not certify competitive all-faction balance or an unbeatable Apocalypse opponent. Strategy remains heuristic; transport scoring is not a proof of globally optimal play.
- Campaign illustrations/audio are unchanged. Previously documented missing narration passages remain outside this gameplay pass.
