# Development notes

This is The Fracture, a separate project from Frontier Command. Preserve the four-resource economy, exactly twelve factions, no historical Ages, and no campaign content yet. Read docs/STATUS.md before claiming any feature complete.

Gameplay lessons/tests may be adapted from Frontier Command; do not import its artwork. Keep a sharp, coherent 1990s isometric sprite direction. Supplied reference sheets are not verified animation sheets.

Run the simulation and legacy-gameplay tests after gameplay changes. Run browser-gameplay.cjs after control/render/UI changes. server.cjs uses localhost:4088; the old game uses 4077 and should be left alone.

Keep the runtime dependency-free and offline-capable. Document unfinished faction art/mechanics accurately. Do not claim all-matchup balance from the opening-match smoke suite.
