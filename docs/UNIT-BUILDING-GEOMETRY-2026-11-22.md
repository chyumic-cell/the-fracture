# Unit and building geometry pass — 22 November 2026

The existing procedural 3D models and CPU sprite baking remain in use. No replacement raster illustrations, new runtime dependencies, unit statistics or faction roster changes.

## Implemented

- Shared figure rig: deeper chest/back sections, fuller upper arms, thighs and calves, tapering into joints; overlapping open shoulder plates replace spherical caps.
- Human soldiers: textile plate carriers, magazine pouches, shoulder straps, open-faced ballistic helmets, chin straps, padded knees and boots.
- Vampires use the fuller figure rig with tailored coats, high collars and split coat tails. Other Night creatures retain their independent identities.
- Symbiotes: continuous flexor/extensor tissue, wider integrated limb joins, embedded roots with reduced contrast, flattened palms and hooked digits. Roots keep their small pulses; the host body does not inflate. The shared colony kit also benefits their structures and specialized carriers.
- Shared creature rig: deeper ribcage and fuller legs. Insect armor and sacs use tapered cross-sections rather than stacked rounded pods; organic carrier hulls have tapered body sections.
- Armored vehicles: axial tire/road-wheel geometry, flat sidewalls, tread blocks and hub fasteners. Machines distinguish painted shell surfaces from exposed metal.
- Mechanical bombers: cross-section fuselages, framed cockpit glazing and shaped engine housings. Nonorganic naval decks have modeled individual boards/plates.
- Every unit using the shared mesh renderer gets restrained metal surface noise and ownership markings that retain underlying baked lighting/shadows.
- Shared architecture: recessed window glazing, jambs, lintels, projecting sills, mullions, individual staggered roof courses with thickness, industrial gutters/downpipes.

## Limits

This is a broad model refinement, not a claim of photorealism or that every individual unit received a bespoke sculpt. Independent specialty models retain their identities and existing designs where only shared materials/anatomy apply. Buildings without the shared roof/window helpers do not gain those particular architectural changes.

## Validation

Full roster render audit: 261 units, twelve civilizations, four poses each (idle, movement, attack, death), 1,044 renders. The audit checks nonempty renders and browser exceptions and produces review sheets; it is not a subjective realism score. Browser gameplay regression covers gather/build/train, groups, facing, hold, save/load, eight directions, twelve faction renderers and offline file launch. See task result for final completion status.

## Symbiote readability correction

Distinct modeled cranium, brow, recessed eye sockets, mouth, lower jaw and supporting neck replace the root-covered head masses. Root counts are reduced on unit bodies and small parts; arms are spaced farther from the torso. The Harvester no longer has duplicate overlapping hand appendages. Neural Binder has a visible head above its neural crown. This preserves asymmetrical fungal anatomy while making body parts identifiable.

Final validation passed: full 261-unit/four-pose audit; 638 additional symbiote samples covering all eight facings, gestures, death and owner masks; all 272 building bounds/material/distinctness checks; browser gameplay and offline launch. Syntax and git diff whitespace checks passed.
