# Model realism pass — units, buildings and scenery — 22 November 2026

Continues the geometry pass in [UNIT-BUILDING-GEOMETRY-2026-11-22.md](UNIT-BUILDING-GEOMETRY-2026-11-22.md).
All work is procedural geometry in the existing renderers. No replacement raster illustrations, no imported
artwork, no new runtime dependencies, and no change to unit statistics, abilities, AI, the four-resource
economy, the twelve factions or the roster.

## Units

### Four-legged creatures (`src/identity-art.js`)
Covers dragon, wyvern, lizard, hound, cat, chimera, hydra and shellbeast profiles — Drake, Armored Drake,
Wyvern, Dragon Whelp, Mature Dragon, Ancient Dragon, Hellhound, Familiar, Magical Beast, Chimera, Hydra,
Carapace Beast.

- Scapula, deltoid and haunch masses now stand proud of the barrel, so legs read as attached rather than pinned on.
- Rib and flank seams replace the smooth lofted tube.
- `legs4` gained a hock joint, a tapering pastern and two thigh seams per leg.
- Dragon scale rows went from three rows of six to five rows of seven and now reach down the flank; a
  transverse belly-scute course plates the underside.
- Hound, cat and chimera gained three overlapping coat-tuft rows, the fur equivalent of the scale rows.

### Lycans (`src/identity-art.js`, wolf branch)
The shoulder mass previously sat at jaw height and buried the head. It now sits below the jaw line, a
modeled neck column carries the head clear, the ruff sweeps back and down instead of upward, and chest and
flank fur seams match the quadruped coat density. Affects Lycan Tracker, Lycan Assault Trooper and
Lycan Heavy Fighter.

### Gargoyle
Reclassified as a bare, stone-skinned creature: body, arms and legs now use the carved-stone material
instead of team-tinted cloth, with chiselled chest and abdomen courses and a carved spinal ridge.

### Harpies
The feather wing was rebuilt as one closed vane — adjacent flight feathers share edges, so there are no
gaps — with separated trailing tips, two covert rows and the arm bone laid over the top. Breast plumage
now stands proud of the chest instead of being buried inside it, plus a feathered collar, rump coverts
and scaled shanks. A long tail fan was tried and removed: at this camera angle it foreshortened into a
bright sliver. Short rump tufts are used instead.

### Thrown stone
The `rock` weapon (Gargoyle, Cyclops Stone Thrower, Troll Siege Breaker, ape throwers) is now a faceted
boulder with a rock material instead of a smooth sphere.

### Naval hulls (`src/expansion-art.js`)
Every civilization now builds a different hull. A per-faction profile sets prow length, stempost height,
beam fullness at seven stations, turn of the bilge (sharp V through full barge section), bow and stern
sheer, and transom width. The results are visibly distinct: machine pontoons are flat and full-beamed,
myth and reptilian galleys are narrow V-hulled with long raked prows, primate canoes are the sharpest,
symbiote and insect hulls are the fullest.

Prow ornaments by family: waterline ram (myth, reptilians), horned figurehead with a lit eye
(dragons, infernal), stempost lantern (wizards, night, elders), carved scrollwork (the rest).

Forward reach is capped so the longest siege hulls stay inside the 336×336 sprite frame; this was caught
by `unit-model-browser.cjs` and fixed.

## Buildings (`src/building-art.js`)

Shared helpers, so the changes reach every civilization that uses them (the primate and symbiote building
renderers have their own paths and are unchanged).

- The flat base tray became a stepped footing: a wide lower course, the paved slab above it, a kerb lip
  around the edge and a loose stone skirt on the ground outside, so structures sit in the terrain.
- `roof()` gained a projecting eave with a fascia band and a shaded soffit, plus barge boards closing
  both gable ends.
- `box()` gives every large structural box a projecting plinth course and a capping band with shadow
  lines, so big walls no longer read as a single blank slab.

## Scenery (`src/sprite-mesh.js`, `src/art.js`, `src/environment-art.js`)

- `foliage()`: each leaf blade now carries its own pitch and roll, so the canopy catches light unevenly
  instead of reading as one flat plane, and blades deep inside a crown are shaded by the mass above them.
  Eight blades per cluster instead of seven.
- Broadleaf trees: crowns are tinted by height, giving a sunlit top and a shaded underside, with three
  extra shaded masses closing the canopy from beneath.
- Snow pines: snow now settles as separate drifts on the boughs with a crown cap and an apex cap seated on
  the leader, instead of sheathing each tier in a smooth cone. The dark needles are visible again.
- Aetherland pines: a second set of boughs with hanging fronds closes the gaps between branches.
- Both conifers gained a sixth, small tier so the leader is clothed instead of standing as a bare pole.
- Desert acacia: the smooth blob canopy was replaced with individual leaf masses.

## Not done

- Workers and scouts were not revisited in this pass; they remain the plainest models.
- Flyers, transports, merchants and carriers other than the harpy and gargoyle were not revisited.
- Building facades are improved at the shared-helper level only; individual structures did not receive
  bespoke detailing, and the primate and symbiote building renderers were not touched.
- Ship deck fittings, rigging and superstructure are unchanged; only hull form and prow ornament differ
  per civilization.
- Hell/moon stalagmites and dreadhollow trees were reviewed and left as they were.

## Validation

All of the following were run after the final change:

- `tests/art-realism-roster.cjs` for all twelve factions: 261 units, four poses each, 1,044 renders,
  zero empty renders and zero page exceptions.
- `tests/unit-model-browser.cjs`: all-civilization geometry, eight facings, gestures, death and owner
  masks — PASS.
- `tests/building-model-browser.cjs`: 272 buildings, bounds, distinctness and material usage — PASS.
- `tests/naval-art-browser.cjs`: 60 distinct ship models and twelve harbors — PASS.
- `tests/browser-gameplay.cjs`: gather, build, train, groups, facing, hold, save/load, eight directions,
  twelve faction renderers, offline file launch — PASS.
- `tests/graphics.test.cjs` (10 checks), `tests/simulation.test.cjs` (41 tests),
  `tests/legacy-gameplay.test.cjs` (11 checks), `tests/environments.test.cjs` (133 cases) — PASS.

This is a model refinement, not a claim of photorealism, and not a claim that every unit received a
bespoke sculpt. The audits check that renders are nonempty, in bounds, distinct and exception-free; they
do not score appearance.

---

# Continuation — 23 November 2026

## Workers and scouts

- The worker tool was a pale featureless bar in both renderers. It is now a forged pick: a swelled haft
  with a bound grip, a wedged eye, a swept point and a hammer poll. The carried pack gained a back board,
  shoulder straps over the chest and a visible load. Covers both the modern figure rig and the
  identity-art humanoids (Ghoul Laborer, Satyr Worker, Imp Worker).
- Slings were a thread and a dot. They are now paired cords running from the fist to a leather pouch,
  slack at rest and whirled through the throw (Goblin Scout, Imp Scout, Kobold Slinger, ape slingers).
- Scouts and stealth troops carry a ranger kit: a slung satchel under a chest strap and a rolled blanket
  lashed across the back.
- The centaur barrel gained shoulder and haunch masses with flank seams, and a saddle blanket that drapes
  over the spine and down both flanks with a fringed hem, replacing a flat floating plate.

## Flyers and carriers

- The great-bird carrier shared by myth, dragons and elders was a smooth egg with flat paper wings. It is
  now a keeled body with a modeled neck, a two-mandible beak, eyes, legs with talons gripping the harness,
  a fanned tail, and broad cambered wings.
- The four industrial civilizations shared one box with two crossed sticks. They now fly different
  aircraft: a cargo helicopter (glazed nose and cabin, tapered tail boom, fin, tail rotor, skids), a
  ribbed airship with fins, gondola and side propellers, a quad-rotor lift drone with ducted fans, and a
  tandem-rotor sky barge with an open cargo deck.

## Feathers and scales

A shared `pelt()` helper on the sprite mesh lays overlapping plates over any lofted form, so a body can be
clad using the same numbers that built it.

- Scaled creatures (dragon, wyvern, lizard, hydra, shellbeast) are clad nose to tail tip: body, tail, neck
  and legs all carry individual overlapping scales.
- Reptile civilizations wear scale over the whole trunk, with scaled tails and snouts.
- Bird bodies, breasts and necks carry hundreds of individual contour feathers.
- Every wing — great bird, condor and harpy — is built from twenty or so separate overlapping flight
  feathers with visible quills, under three covert rows, instead of a handful of panels.

## Symbiotes

Reworked from wet vascular tissue toward something between a plant and a fungus, following supplied
reference of tree root systems, mycelial networks and mould blooms.

- The `bio` and `mold` surfaces lost their veins and blisters and their high specular. They now carry
  woody root grain running along the form, a pale branching mycelial network, dry mould patches and
  powdery stippling, all matte.
- The unit palette moved off flesh pinks, reds and violets onto root bark, sage, cream mycelium and
  ochre accents.

## Gameplay and interface

- Production queue capacity raised from six to fifteen.
- Shift-click queues five units instead of one, and buys five lots at a market or dock instead of one.
  A batch stops at the first refusal and reports how many it placed.

## Performance

Profiling a loaded match found two real hot spots in the simulation tick:

- `combatEntities()` rebuilt a fresh combined array on every call, and it is called once per unit per
  tick. It is now cached against the entity-kind index.
- `nearestEnemy()` ran the expensive visibility and detection checks before the cheap range test. The
  order is reversed, with an early skip for candidates that could not beat the current best. Measured
  `canTarget` cost over a twenty-second loaded sample fell from 1117 ms to 315 ms.
- The O(n²) unit separation loop now rejects distant pairs on their bounding box before computing a
  square root.

These are genuine reductions in per-tick work and allocation. However, the exact symptom reported — a
split-second freeze on a regular two-second beat — was NOT reproduced in the harness: measured spike
gaps were irregular (67 ms to 5.5 s). The remaining frame spikes in the profile are render-side
(`drawImage`, `render`, deferred sprite work, `querySelector` in the action-button rebuild), not
simulation-side. Whether the user-visible two-second beat is gone has not been verified.

## Validation

All twelve faction rosters (261 units, four poses), the all-civilization unit model audit, 272 buildings,
60 ship models, browser gameplay, simulation (41), legacy gameplay (11), AI strategy (17), combat orders
(13), unit counters (8), combat presentation, march edge regression and environments (133) pass.

## Bird-borne bombers, machine tentacles and machine ships — 23 November 2026

- The bomber variants use a separate renderer that the carrier pass had missed. The primate, myth, dragon
  and infernal bombers now share the same feathered build as their carriers: keeled body, modeled head,
  two-mandible beak, eyes, legs, fanned tail, contour plumage and individual overlapping flight feathers.
  Their old smooth body, cone beak and flat quad wings are gone, as are the dragon/infernal dorsal fins.
  The primate rider gained arms and legs instead of floating as a bare torso.
- Machines: a shared tentacle crown gives every non-naval, non-bomber machine a radiating nest of
  segmented manipulators, each curling on its own phase and ending in a claw, with sensor lenses at the
  roots. Larger chassis carry a second, shorter crown.
- Machine warships: the rounded stern pods were replaced with a faceted armoured citadel — chamfered
  forward face, louvred radiator banks, cable conduits, a sensor mast and glazing — in the same angular
  language as the walkers.
- Pulse Sentry, Siege Crawler and Command Relay now walk on load-bearing tentacle legs with splayed pads
  that plant and lift in sequence. The Juggernaut keeps its tracks, as asked.

## Art review page

Added a Trees & scenery section so the environment meshes can be reviewed alongside the units: every
world and climate, three variants each. The page intro was rewritten to describe the current direction.
Verified from `file:///D:/TheFracture/art-review.html` with no page errors; off-screen cards stay blank
until scrolled into view, which is the page's existing lazy drawing.

## Validation (this pass)

All twelve faction rosters, the all-civilization unit model audit (geometry, eight facings, gestures,
death, owner masks), 272 buildings, 60 ship models, browser gameplay, simulation (41) and legacy
gameplay (11) pass.

## Frame hitch investigation, round two — 23 November 2026

A Chrome trace of a loaded match (300×300 map, 311 units, 2,868 entities) identified three real causes
and measured each fix. Figures are self time from a CPU profile over a ~22 second window of the same
scripted scenario, so they are comparable to one another.

### Sprite jobs cloned the whole faction

`async-art.js` posted `{d, f, ...}` to the sprite worker, where `f` is a faction object carrying every
unit, building, research and extension definition. Structured-cloning that graph runs synchronously on
the main thread, once per sprite job. The trace showed `HandlePostMessage` tasks up to 293 ms.

The worker already imports `data.js`, so jobs now carry ids plus any campaign-specific overrides, and
the worker resolves the definitions itself. Measured `postMessage` cost: **0.04 ms average, 0.2 ms peak**
over 89 calls. The worker's own reply handler measures 1.1 ms average, 2.9 ms peak.

### Vision re-cloned every remembered object several times a second

`updateVision` ran `['building','resource','tree'].includes(e.kind)` — allocating a fresh array per
entity per player — and then spread-cloned every visible building, resource and tree into the player's
knowledge map. On this map that is thousands of clones every 0.4 s. It now re-snapshots only when a
field a player could notice has actually changed, and refreshes `seenAt` in place otherwise. Measured
`updateVision`: **1405 ms → ~550 ms** total, peak call **57 ms → 47 ms**.

### Target search scanned every combat entity for every unit

`nearestEnemy` was an O(units × combat entities) scan each tick. A bucketed spatial index (8-tile cells,
rebuilt once per tick) now limits the search to nearby cells. Ties are broken by the entity's position in
the list, so the chosen target does not depend on bucket visit order and the result matches a full scan.

Combat search cluster (`dist` + `nearestEnemy` + `canTarget`) over the same window:
**10.3 s → 8.2 s**. Frame `p99`: **133 ms → 84 ms**. `p50` stays at 17 ms.

Also bounded: the machine and symbiote repair-aura check, which scanned every finished building for
every unit each tick, now rejects on a bounding box first and skips entirely at full health.

### What is still not established

The reported symptom — a split-second freeze on a regular two-second beat — was still **not reproduced**.
Measured spike gaps remain irregular. Peak frames of 200–400 ms persist in the harness and are not
attributable to the simulation tick, the sprite worker or the terrain worker, all of which are now
instrumented and cheap. The remaining peaks sit in rendering and browser-internal work (`drawImage`,
`render`, `querySelector` in the action-button rebuild, garbage collection). Whether the user-visible
beat is gone has not been verified, and the render path has not been optimised.

### Validation

simulation (41), legacy gameplay (11), combat orders (13), unit counters (8), AI strategy (17), AI
advanced tactics (14), AI battle planning, AI coastal operations, AI recovery, AI operational decisions,
combat presentation, transport choice, browser gameplay, and the human and machine roster renders all
pass.
