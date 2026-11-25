# Group movement fixes — 25 November 2026

Reported: units bump into each other and get stuck; a group walks in a perfect line, and units walk in
circles "until their time in the line comes".

## Causes (src/march.js)

- In single file, each unit's place is measured back along the path the group has already walked. Early in
  a march that path is only a few steps long, so every unit further down the column was sent back to the
  starting point: it turned around, walked back, then turned again when the column moved.
- On arrival every unit went to the final formation place it was given when the order was issued, so
  units crossed the group to reach it.

## Fixes

- A unit whose column place is behind it (and roughly in its own line) waits for the column instead of
  walking back.
- On arrival the final formation places go to the nearest unit of the same type (unit types keep their
  formation rows).

Tried and rejected after measuring: re-ranking the column every step (units traded places back and forth),
fixing the column order on entry, swapping formation slots on turns (left units stranded), stepping
sideways into the column (zig-zags), and a delay before entering single file (left a unit stranded).

## Measured (tests/group-movement.test.cjs scenarios, 16 or 24 humans infantry)

| scenario | U-turns before → after | stuck before → after |
|---|---|---|
| through a two-tile gap | 20 → 14 | 0 → 0 |
| detour around water | 27 → 10 | 0 → 0 |
| two groups crossing head-on | 15 → 12 | 2 → 0 (stuck the whole minute before) |
| cluttered base | 18 → 6 | 0 → 0 |

Arrival times are unchanged within about two seconds. Some U-turns remain, mostly in head-on crossings and
in the first seconds while a loose group lines up.
