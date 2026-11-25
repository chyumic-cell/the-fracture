# Economy and technology rework — 25 November 2026

Changes requested together: a dynamic market, a longer road to the strongest units, resource-specific
collectors built on their deposits, deep mines as collector upgrades, worker caps, easier clicking and a
tidier worker build menu. The AI was taught each rule. It has **not** been re-calibrated across difficulty
levels; that pass is pending in the AI difficulty session.

## Market

- One market shared by every player. Base prices per lot of ten: Ore 20, Lastrian Oil 30, Aetherite 30,
  Rift Crystals 60 Trade Credits (previously a flat 20 for anything).
- Each lot bought raises that resource's price by 7%; each lot sold lowers it by 7%. Prices drift back
  toward base (time constant four minutes) and stay between 0.35× and 4× base.
- New: sell ten of a resource for 60% of its current price. Buying and selling back always loses credits.
- Market and dock panels show live buy and sell prices. Prices are saved with the match.
- Merchant income per trip is unchanged; rising prices are what slow the conversion of credits into
  resources.

## Technology

Every civilization gains six doctrines with its own names (for example Humans: Combined Arms Doctrine,
Mechanized Warfare, Ordnance Engineering, Air Superiority Doctrine, Special Operations Program,
Strategic Command). They are research, not Ages: each opens only its own unit family.

| Doctrine | Researched at | Requires | Opens |
|---|---|---|---|
| Organization | infantry building | — | heavy and support units |
| Heavy | vehicle/beast building | Organization | tanks |
| Siege | vehicle/beast building | Organization | siege units |
| Air | air building (lab if none) | Organization | fighters, gunships, bombers, air transports |
| Elite | elite building | Heavy | stealth and elite units |
| Strategic | elite building | Elite + Advanced | giants |

Costs run from 160 Ore / 30 Oil (35 s) to 380 / 120 / 160 / 70 (85 s). The vehicle/beast building now
also needs the lab, and the air building needs the vehicle/beast building. Basic infantry and anti-air
troops stay ungated so early defence against aircraft remains possible. Ships keep their dock and lab
requirements, because campaign fleet missions field warships from the start.

## Collectors, drop-off and deep mines

- Each resource is delivered only to its own collector (Ore collection station, Lastrian extraction well,
  Aetherite mine, Rift observatory). The headquarters also accepts Ore.
- Collectors are placed on top of a deposit node: clicking within about a tile and a half snaps onto it,
  and the placement preview snaps the same way. Same-resource deposit nodes no longer block the
  footprint; workers mine the node from the building's edge and deliver on the spot.
- General stores (the eight civilizations' depot buildings) and directly placed deep mines are no longer
  buildable. Existing ones in old saves keep working as buildings but accept no resources.
- Deep mines come from a paid upgrade on a completed collector ("Upgrade to <deep mine name>"), available
  after Subsurface Extraction, at the old deep-mine cost and time. The upgrade converts the building in
  place and it keeps accepting its resource.
- Caps: three gatherers per deposit node (later arrivals move to the nearest node of the same resource
  with room, or report that every nearby node is full) and six miners per deep mine.
- Right-click with workers on any own collector to work its nearest deposit node with room; exhausted
  deposit nodes are no longer clickable, so a deep mine is no longer hidden behind its spent node.

## Follow-up fixes

- Only Ore can be gathered before its collector stands. Ordering workers onto an Oil, Aetherite or Rift
  deposit with no collector of that resource leaves them waiting with a message naming the collector to
  build; nothing is dug up with nowhere to deliver it.
- A collector built over a deposit node is worked from the building's edge (reach grows by its
  footprint). Before this, small deposits such as Rift Crystals were completely covered and could not be
  mined at all.
- Idle-worker button in the top bar: shows the count, glows when any worker is idle, click selects the
  next idle worker and centres on it, Shift-click selects all; hotkey `.` (full stop).
- Build menu buttons no longer move in the page on each refresh. Re-appending them to keep the groups in
  order could cancel a click between press and release, so clicking a building sometimes did nothing.
- Workers' picks now swing: raised over the shoulder, then brought down until the haft is horizontal with
  the point driven into the deposit, then recovered (human-style rigs; Night Kingdom and Primate rigs reach
  a slightly steeper strike).

## Build menu

The worker build menu is grouped under Economy (headquarters, housing, the four collectors, market,
dock), Military, Research and Defense, in a fixed order.

## AI changes

The AI uses the same rules and no bonuses:
- It treats a deposit as served only by a building that accepts that resource.
- It plans a collector for any resource its tech plan needs, and claims the nearest safe deposit for each
  missing resource first.
- It builds collectors on the deposit itself, and upgrades spent collectors instead of placing deep mines (claiming a remembered spent node with a
  collector first when needed). It never assigns more miners to a deep mine than the cap.
- Its market purchases use the live price.

## Measured effect (6-minute AI smoke matches, 100×100, Standard, one seed per pairing)

Average Ore gathered fell from about 3,100 to about 2,200 per player, and several civilizations had not
yet collected Aetherite or Rift Crystals by six minutes. No doctrine was researched by six minutes in
either rule set's sample. This is a single small sample, not a balance claim.

## Verification

- New `tests/market.test.cjs` (6 checks) and `tests/collectors.test.cjs` (6 checks).
- Updated tests that assumed a flat 20-credit price: `ai-recovery`, `expansion-systems`, `naval-trade`
  and `ai-operational-recovery`.
- Full Node suite and browser checks: see `docs/STATUS.md`.

## Limits

- Win rates between difficulty levels were not measured under these rules.
- The AI still builds some secondary collectors later than a strong player would: in the latest 6-minute smoke
  sample every AI ran Ore and Oil collectors and most a Rift observatory, but only two of twelve had an
  Aetherite collector. This is for the AI calibration pass to address.
