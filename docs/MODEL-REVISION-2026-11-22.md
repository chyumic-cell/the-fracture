# Model and material revision — 22 November 2026

The art remains authored 3D geometry rasterized into sprites. No generated illustration sheets replace the existing model pipeline. The art review page now loads the same source modules as the game, including when opened as a local file.

## Changes

- Humanoids: shaped ribcages, narrower waists, pelvis and neck definition, rounded shoulder caps, separated joints and asymmetric resting stances. Equipment varies by unit role. The Night civilization retains its previous gothic model foundation, with additional tailored details, after the generic replacement proved visually worse.
- Combat presentation: stronger anticipation and follow-through, armed cooldown poses and armed advances after combat. Occasional idle gestures are restricted to safe inactivity. Damage and attack timing remain simulation-driven.
- Other bodies: differentiated vehicle chassis, insect and creature surface details, revised ship hulls and bomber presentation.
- Architecture: separate machine architecture, more distinct production-building forms and faction-specific aviation structures. Brick, cinderblock, concrete, wood, stone, metal, chitin and wet biological material use object-space surface patterns.
- Symbiotes: collapsed, uneven host volumes replace inflated ovals. Intertwined root bundles fork and reconnect across the body, with curved bends, irregular gaps, smaller fungal filaments and hooked tips. Structural tissue joins shoulders, hips, necks and limbs. Small root and vascular pulses use a bounded animation cycle rather than inflating the entire body. Land merchants, ships, bombers and transports share the colony geometry. Buildings using the shared colony kit inherit its root structure.

## Verification and limits

- Full Node regression suite: 57/57 test files passed with test concurrency limited to two. An earlier highly concurrent run reported a campaign save checksum failure; the isolated campaign tests and the complete bounded-concurrency rerun passed. The earlier failure is recorded rather than presented as a diagnosed fix.
- Browser gameplay and offline launch passed, including all twelve faction renderers and save/load.
- Worker-rendered pixels, projectile origins, team recoloring and archived sprite restoration match the main renderer across five anatomical families, including the final symbiote root geometry.
- The initial all-civilization geometry audit covered 261 units and 7,569 poses. The architecture audit covered 272 buildings. These reports precede the final humanoid/symbiote refinements and are not a claim of final visual approval.
- A subsequent check passed 888 attack-facing samples across the revised organic/humanoid families. The final symbiote root audit passed all 1,034 samples across 22 units and 22 buildings: eight facings, idle/attack/walk/death poses, pulse variation and bounded cache keys. The land-merchant pulse and siege-ship corpse clipping found in the first pass were corrected. Final results are recorded in `symbiote-root-audit.json`.
- Sprite bounds and distinct output hashes do not establish that the requested reference-image quality has been reached. Visual quality remains open to review; no claim is made that every asset now matches those references.
- Existing AI work and its uncalibrated difficulty ladder are separate from this model revision. No difficulty win-rate claim is made here.
