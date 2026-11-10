# World environments — 10 November 2026

Choose a Battlefield, then an Environment in skirmish setup. World-specific choices are remembered while changing the Battlefield selector.

- Morvane: Hell has red ash, dark red waterways, layered red cliffs and pointed stalagmite clusters. Moon has gray regolith, shallow crater relief, gray cliffs, dark gray waterways and broken rock pillars. Moon terrain and scenery are strictly achromatic; army, resources and ownership retain their recognizable colors.
- Kareth and Elyndra: Temperate, Desert, Arctic, or Varied climates. Varied maps blend northern snow, temperate countryside and southern desert across broad irregular regions. Dedicated desert maps use sand, wind ripples, palms and acacias; arctic maps use wind-packed snow, icy shorelines and snow pines.
- Every environment works independently of all nine map layouts and the seven existing sizes. Mediterranean layout no longer overrides Morvane or the selected desert/arctic palette.
- Stalagmites, rock pillars and vegetation retain the existing tree entity and collision footprint. They supply no resource. Successful paid construction or an extension clears them under the same tree rules; failed attempts do not clear scenery. Resource distribution, random-number state, map geometry, movement, production and unit bonuses are unchanged.
- Environment is saved with match options. Saves without the field retain temperate Kareth/Elyndra; Morvane uses Hell. Saved maps and entities are retained exactly.
- All artwork is code-authored with the existing sprite mesh and terrain renderers. No generated illustration or raster asset is loaded. Climate material colors interpolate at shared tile corners; the minimap and campaign briefing map use matching palettes. Terrain remains baked in bounded background chunks, with the same synchronous offline fallback.

## Verification

`tests/environments.test.cjs`: 122 cases cover all nine layouts, unchanged map/nav/deposit/RNG hashes, tree blocking and paid clearing in every environment, save restoration, continuous climate fields, and minimap colors.

`tests/environments-browser.cjs`: ten environment/world combinations, terrain worker pixel parity, all scenery variants without clipping, strictly gray Moon terrain/scenery, setup switching, Moon island deployment/save-load, and offline Hell launch. `environment-validation.json` records the renderer results. `environments-review.png` is a contact sheet from the actual renderers; `moon-gameplay-review.png` shows an isolated live match.

Simulation, legacy gameplay and building-placement regressions pass. The regular browser gameplay check also passes (gather/build/train, control groups, facing, Hold, save/load, twelve faction renderers and offline launch). Large-map loading and panning are checked separately; performance is not a universal frame-rate guarantee.

The 500-map loading/panning check passed: 23.3 seconds initial preparation, 2.7 seconds distant pan, with textured chunks ready before presentation. A final focused check also verified updated briefing-map colors in all three campaign worlds and worker parity after the palette optimization.
