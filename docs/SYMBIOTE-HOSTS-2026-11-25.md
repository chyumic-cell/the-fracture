# Reptilian flicker fix and symbiote converted-host makeover — 25 November 2026

## 1. Reptilian sprites flipping between old and new looks

**Cause.** Units are drawn both on the main thread and in a background sprite worker
(`src/sprite-worker.js`). The worker's `importScripts` list never included `reptilian-art.js`, so any
frame the worker drew used the old shared rig while frames drawn on the main thread used the new
riot-armour renderer. In play the two kept swapping.

**Fix.** The worker now loads `reptilian-art.js` (and the new `symbiote-host-art.js`).

**Guard.** `tests/sprite-worker-parity-browser.cjs` draws every unit of every faction in three poses
on both the main thread and the worker and requires identical pixels (783 poses). With the old
worker list it reports every reptilian infantry pose as different; with the fix it passes. Sprites are
not cached in browser storage, so a page reload is enough.

## 2. Symbiotes: converted hosts

Built from the supplied concept sheets (converted trooper, stalker, spore-spitter, brute, winged
flyer). The sheets were used as reference only; every sprite is authored geometry in
`src/symbiote-host-art.js`, rendered through the existing mesh renderer.

**Shared look.** A human host in the remains of a tactical uniform (war belt with pouches, knee
pads, laced combat boots), overgrown by a porous amber lattice over dark maroon flesh. Exposed ribs
in an opened chest, a lattice hood framing a human face with one milky, red-rimmed eye, olive-gold
spore sacs on the back and shoulders, barbed whip tendrils trailing from the shoulders, and hooked
claws. Player colour is a cloth band round each upper arm, a buckle tab, and wing-edge bands on the
flyer.

| Unit | Build |
|---|---|
| Harvester | converted labourer, light gear and satchel, short claws |
| Talon | converted trooper, long claws |
| Husk | heavier, hunched trooper |
| Spore Dart | spore-spitter; spits a spore cloud from the mouth |
| Listener | spore-spitter with a crown of sensory tendrils; spits skyward |
| Spitter | heavy spore-spitter, a cluster of eight sacs, glowing chest vents |
| Stalker | digitigrade crouching stalker, long claws |
| Prowler | crawler on all fours |
| Brute | massive brute, heavy claws |
| Root Colossus | giant brute with seven sacs and roots at the feet |
| Neural Binder | host with a glowing tendril crown and a raised spore light |
| Spore Flyer | host with lattice-and-membrane wings and sacs on the leading edges |
| Buoyant Carrier | netted olive spore bladder over a rib-keeled flesh gondola, hanging tendrils |
| Buoyant Carrier Bomber | the same bladder carrying bomb sacs that drop on attack |

Ranged units set their projectile release point at the mouth (spitters, flyer), the raised hand
(binder) or the bomb sacs (bomber). Stats, ranges, projectiles and abilities are unchanged.

**Human proportions.** Ground hosts keep a soldier's build: long legs (hips at about half height), a narrow waist under a broad chest and shoulders, lean limbs and a proportionate hooded head. Upright hosts carry only a few short tendrils trailing from the back and smaller spore sacs, so the silhouette reads as a person, not a creature. The crawling Prowler, the flyer, the beasts, carriers and ships are unaffected.

**Colour and telling units apart.** The flesh is dark reddish-brown rather than purple-maroon. Each
unit has its own lattice colour and, where needed, a signature feature, so they read apart at a glance:

| Unit | Lattice | Signature |
|---|---|---|
| Harvester | straw | woven gathering sack on the back |
| Talon | blood-amber | bone scythe blades along the forearms |
| Husk | ivory | heavy bone plates on shoulders and chest |
| Spore Dart | olive | bone spore-launcher over the shoulder |
| Listener | sage | membrane ear-fans and sensory crown |
| Spitter | sulfur | cluster of eight sacs, chest vents |
| Stalker | bronze | dorsal bone spikes, digitigrade crouch |
| Prowler | copper | crawls on all fours |
| Neural Binder | pale gold | glowing tendril crown |
| Brute, Root Colossus, Spore Flyer | amber | size, roots, wings |

**Ships, beast and merchant.** No metal anywhere; everything is grown. All six ships share a living
hull: a rounded flesh hull with exposed ribs down the flanks, an amber lattice gunwale and deck net,
spore-sac floats on lattice outriggers, tendril oars sweeping the water, and a converted host fused to
the bow as a figurehead. Each has its own deck feature: Spine Skimmer, a bone spine cannon on a flesh
mound; Tendril Skimmer, a membrane whip-sail; Spineward Colony, three skyward spore spitters; Spore
Mortar Vessel, a great netted mortar sac; Living Ferry, an open lattice cage hold; Tidal Colony
Merchant Ship, cargo sacs and lashed bundles. The Carapace Beast is a converted war-beast under
overlapping lattice armour arches with sacs and tendrils; the Trade Organism is a pack-host carrying
the old webbing harness, bundles and spore-sac stores. Sprites were scaled to the footprint of the
models they replace. Player colour: a sash along both ship flanks, leg bands on the beast, harness
straps on the pack-host.

**Buildings.** They pick up the reddish-brown and amber through the shared kit, still mixed with each
player's livery colour, and keep their old shapes. They were not redesigned.

## Verification

- Sprite worker parity: 783 poses, all factions, pixel-identical.
- Unit model audit for symbiotes: all 22 units (infantry, creatures, carriers, ships, merchant) across 8 facings, attack, ready, gesture and death
  poses; no clipping; player-colour mask present.
- Player-colour audit: no symbiote failures. Its remaining failures (aircraft, carriers, beasts of
  other factions) are unchanged from before.
- The unit model audit's failures in other factions (Club Warrior, Shieldback, Silverback Champion,
  Demon Footsoldier, Infernal Guard, Minotaurs, Orcs, Satyr, Troll Brute, Undead Knight) are
  identical when run against the previous commit.
- Naval art (60 ship models), trade art, naval trade, naval mines, simulation, legacy gameplay, graphics, combat presentation, unit counters, bomber weapons and
  browser gameplay pass. motion-detail fails exactly as before (muzzle anchor 29.47 vs 28).

Reviews: [hosts](symbiote-hosts-review.png), [vehicles and carriers](symbiote-vehicles-review.png),
[model sheet](models-symbiotes.png).
