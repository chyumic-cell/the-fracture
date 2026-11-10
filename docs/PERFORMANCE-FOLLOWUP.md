# Performance follow-up — 10 November 2026

The recurring pauses were investigated in isolated browser matches. The user's open match was not reloaded or reset.

## Reproduction and fixes

An initial small-map opening did not reproduce the complaint. A large-map stress fixture with an army changing direction every three seconds exposed whole-map searches for blocked destinations, repeated scans of thousands of static objects, and synchronous mesh work for uncached poses. The fixture includes deliberately invalid/blocked movement targets, so it is a diagnostic stress case rather than a full-match balance benchmark.

The old route finder could take several seconds on such a query. It now uses a navigable goal ring, stamped reusable buffers and private-knowledge route caching. Object lookups and kind lists are indexed. Visibility updates touch visible cells, and static scenery visibility is reused until it changes. All scenery variants and all initial idle facings are prepared before play. Background workers execute the same authored unit renderer; cached cropped pixels avoid rerendering evicted poses. The artwork resolution, faction identity, simulation speed and AI decision frequency are preserved.

## Final sample

- Scenario: 700 × 700, seed 48122, normal terrain, workers gathering, mixed units repeatedly changing destinations. 14,335 total entities including decorative trees and deposits.
- Duration: 30 seconds, 1,777 measured animation frames.
- Median frame interval: 16.7 ms.
- 95th percentile: 16.8 ms.
- 99th percentile: 33.3 ms.
- Longest frame interval: 34.2 ms.
- Browser long tasks over 50 ms: 0.
- Route queries: 4,981; slowest sampled query: 1.5 ms.
- Unit-art calls: 30,279; slowest main-thread call: 8.0 ms.

The final sample has timing wrappers but **no CPU profiler**, avoiding profiler attachment pauses. Earlier `performance-cpu.json` and `performance-verified.json` were diagnostic CPU captures and should not be used for their maximum-frame comparison. `performance-steady.json` contains the final measured data. A separate deterministic navigation check verifies that a blocked nearby goal on a 700 map explores fewer than 100 cells, invalidates after visible demolition, returns independent cached paths and preserves private fog knowledge.

These measurements are local, bounded evidence. They do not establish constant frame rate for every late-game army, hardware configuration or map. Direct `file:` launch uses a synchronous sprite fallback when background workers are unavailable; localhost play uses background sprite workers. The user can save the existing match with F5, refresh, and restore with F9 to apply the changes.
