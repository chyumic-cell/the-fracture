# New environments and Varied for every world — 23 November 2026

Environments change only how a battlefield looks. Resources, navigation, the random-number sequence and unit stats are unchanged. Scenery uses the existing tree placement, collision and paid clearing rules. Every environment works with every map layout, including the world map types.

## New looks

| World | Environment | Look |
|---|---|---|
| Kareth | Jungle | humid green floor with leaf litter, tea-brown river water, tall jungle trees with buttress roots, broad-leaf canopy and hanging vines |
| Elyndra | Duskbloom | indigo twilight ground with glinting spores, glowing teal water, giant mushrooms with violet stalks and caps freckled with teal light |
| Morvane | Rotmire | plague bog: jaundiced olive moss over bruise-violet mud, black-green bile water with glowing scum, violet cliffs, gallows trees hung with silk-wrapped cocoons and glowing green pustules |

Rotmire is Morvane's first look that is neither red nor grey.

## Varied on every world

Kareth already had Varied climates (arctic north, temperate middle, desert south). Elyndra and Morvane now have Varied too, banding their own looks across the map from north to south with smooth blends between bands:

- **Elyndra, Varied realms:** Starfall → Aetherland → Osland → Duskbloom.
- **Morvane, Varied wastes:** Moon → Dreadhollow → Rotmire → Hell.

Kareth's Varied climates is unchanged and does not include Jungle. Morvane's Varied still has two grey bands (Moon, Dreadhollow) and a red one (Hell), because those are Morvane's looks. Default selections are unchanged: Varied climates on Kareth, Aetherland on Elyndra, Hell on Morvane.

## Verification

- Environment suite: 205 cases (up from 133). It covers every look on every layout, clearing, save/load, the Varied banding order, every band appearing, and continuous colors across band edges for all three worlds.
- Browser environment check: selector contents per world, pixel-identical terrain between the main thread and the terrain worker for every look and Varied option, all four tree variants of each look without clipping, offline launch.
- Graphics, simulation, legacy gameplay, map-layout, maps, ramp-material browser and browser gameplay checks pass.

## Previews

- [New trees](new-environment-trees.png): Jungle, Duskbloom and Rotmire, four variants each.
- [Varied overviews](varied-environments-review.png): Kareth, Elyndra and Morvane minimaps.
- Terrain with water, cliffs and trees: [Jungle](jungle-terrain-review.png), [Duskbloom](duskbloom-terrain-review.png), [Rotmire](rotmire-terrain-review.png); [Rotmire in game](rotmire-review.png).
