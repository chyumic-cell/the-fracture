# The Fracture

A standalone, offline browser RTS with twelve civilizations, Skirmish, and a 25-mission story campaign. Development and balance testing continue; current coverage is recorded in docs/STATUS.md.

## Play on Windows

Double-click **Play The Fracture.cmd**, or open **index.html** in Chrome or Edge. No install, account, network connection, npm packages or Python is required to play.

For development only, run `node server.cjs` and visit `http://127.0.0.1:4088`.

## Story campaign

Choose **Story Campaign** on the setup screen, then **New Campaign**. The campaign has 25 military operations across four acts, with every civilization playable. Mission 1 is the first playable battle; its victory leads to the first illustrated scene. Later scenes follow missions 3, 6, 9, 12, 15, 19, 21, 24, and 25.

Briefings show the actual mission map and objectives. During play, click an objective to center its marker. Capture and activation markers need nearby soldiers and a clear perimeter. Evacuation columns physically travel along their routes; their objectives state the required survivors. The three children remain in the cinematics and never need battlefield protection.

F5/F9 use separate campaign saves. Stage changes create recovery checkpoints, and defeat offers checkpoint recovery or a full retry. Continue Campaign restores progress or a pending cinematic. Campaign Settings exports/imports campaign saves independently of Skirmish. Choose Easy, Standard, or Veteran; campaign pressure changes finite waves rather than giving the enemy unlimited resources.

Cinematics support five passages and illustrations, the supplied recordings, subtitles, pause, seeking, replay, and skip. Unavailable media is identified and cannot block progression. All fifty paintings are installed and playback/seek checks pass. The three recordings include 21 added sentence/passage pauses; the supplied first recording ends during Scene 4, and its last two passages currently remain readable without replacement narration. See [campaign controls](docs/CAMPAIGN-CONTROLS.md) and [current campaign review](docs/CAMPAIGN-REVIEW.md).

## First Skirmish match

1. Choose a civilization, opponent, world, map layout, map size, resource settings and difficulty. Start with Humans while learning the interface.
2. You begin with five workers and one headquarters. Right-click Ore with the selected workers.
3. Select workers, open BUILD, choose Barracks, and click clear explored ground. Fog-covered sites are checked when workers arrive; blocked plans receive a full refund. Workers construct it; costs are charged immediately.
4. Select the Barracks, open TRAIN, and recruit Riflemen. Housing increases population capacity.
5. To gather Lastrian Oil, build its extraction well beside the deposit and order workers to gather from the deposit. Aetherite and Rift Crystals are mined directly. Workers carry all gathered resources to a completed headquarters or collection building.
6. Build the Engineering Depot to research. Specialist research also lives in production buildings. Select the Vehicle Factory, open TECH, and attach an Armor Bay. Heavy Armor Research unlocks the Main Battle Tank there.
7. Scout, assemble a combined-arms force, and destroy hostile headquarters and military production.

## Controls

- Click / drag: select. Ctrl-click or Shift-click adds. Double-click: select visible units of a type.
- Right-click: move, gather, build, repair or attack, depending on the target.
- Right-drag: destination and facing, in any direction.
- A then click: attack-move. M: move. P: patrol. H: Hold. S: Stop. Q: role ability.
- Ctrl + 1–9: save a group. Number: recall it. Shift + number adds that group to your selection without saving. Double-tap number: center the camera. Groups persist in saves.
- Arrow keys, screen edges, middle-drag: pan. Wheel: zoom. Minimap: camera jump.
- Select a production building and right-click ground to set its rally point.
- The × in a production queue cancels that order and refunds its unused cost.
- F5: save locally. F9: load. Escape: cancel placement or open the pause menu. Space: center the camera on the selected units. Pause key or the top pause button: pause.
- The pause menu can export/import a portable JSON save file. Local saves are specific to the browser and file/site origin.

## Files

- `src/data.js`: twelve faction rosters, costs, prerequisite graph, research and extensions.
- `src/simulation.js`: economy, movement, private fog, construction, combat and AI integration.
- `src/ai.js`: scouting, observed-enemy memory and strategic target selection.
- `src/ai-economy.js`: worker allocation, spending, expansions and counter-unit production.
- `src/ai-combat.js`: proportional defense, coordinated attacks, flanks, support, retreats and grouped reinforcements.
- `src/tactics.js`: layered formation layout, adapted from the previous game's gameplay rules.
- `src/art.js`: coherent pixel unit/building renderer, textured isometric terrain and composited fog.
- `src/app.js`: interface, input, camera, rendering and persistence.
- `src/campaign-missions.js`: 25 mission maps, objectives, armies, waves, events and progression.
- `src/campaign.js`: campaign objective rules, physical convoys, events and checkpoint state.
- `src/campaign-ui.js`: briefings, objective panel, campaign saves, results and mission selection.
- `src/campaign-story.js` and `src/cinematic-player.js`: approved narration, scene assets, editable audio cues and playback.
- `src/campaign-landmarks.js`: code-authored battlefield landmarks, camps and crossings.
- `docs/MASTER-BRIEF.md`: supplied design brief.
- `docs/STATUS.md`: precise coverage and remaining work.
- `docs/LEGACY-GAMEPLAY-REVIEW.md`: gameplay lessons carried over from Frontier Command.

## Tests

With Node installed:

```
node tests/simulation.test.cjs
node tests/legacy-gameplay.test.cjs
node tests/ai-matches.cjs
node tests/ai-strategy.test.cjs
node tests/combat-orders.test.cjs
node tests/ai-benchmark.cjs
node tests/campaign-definitions.test.cjs
node tests/campaign-runtime.test.cjs
node tests/campaign-route-audit.cjs
```

`tests/browser-gameplay.cjs` performs real Chrome mouse/keyboard tests using the Playwright runtime installed on this development computer. It also verifies offline `file://` launch. Its local Playwright path must be adjusted on another development computer. These dependencies are not needed to play.

- `src/help.js`: plain-language building, unit, order and menu explanations. Hover over a button (including disabled buttons), or focus it with the keyboard, to read its help.

## AI opponents

Choose Gentle, Relaxed, Easy, Standard, Challenging, Veteran, Expert, Master, Nightmare or Apocalypse, from easiest to hardest. They differ in reaction speed, economic development, force size and tactics. No difficulty receives gathering, carrying, building, research, training, extraction, starting-resource or combat-stat bonuses. Standard retains its existing decision profile. Harder controllers make different spending, counter, formation, air and naval decisions; competitive calibration is recorded in docs/AI-STRATEGY.md and is not yet a consistently ordered ladder. All scout through private fog, pay full resource costs and use unchanged combat statistics. Apocalypse is intended as an extreme challenge; it is not guaranteed unbeatable. Older Normal and Hard saves map to Standard and Expert. Save, refresh, and load to apply AI updates to an existing match.

See [AI strategy and evaluation](docs/AI-STRATEGY.md) for behavior and measured comparison results.

## Maps and construction

Map sizes are Tiny (100 x 100), Small (200 x 200, default), Medium (300 x 300), Large (400 x 400), Huge (500 x 500), Massive (600 x 600) and Colossal (700 x 700). Choose Natural countryside, Mountain Passes, Steppes or Labyrinth independently of the world palette. Resource abundance ranges from Scarce to Abundant; placement can be random clusters, balanced territories or contested frontiers. Opening deposits are optional. These settings apply to new matches.

Decorative trees are cleared by successful construction. Building collision follows the drawn foundations so usable gaps remain open. Explored fog permits paid building plans; workers check the actual site on arrival and fully refund blocked or unreachable sites. Unexplored black ground stays unavailable. A planned site can also be canceled for a full refund; an already-started foundation retains its 75% cancellation refund.

Save with F5, refresh, and load with F9 to apply code and terrain changes to an existing match. Older saves remain compatible. The battlefield is prepared before play starts; terrain details are generated in the background and nearby sections are prepared ahead of camera movement.


### Graphics inspection

Open `art-review.html` to inspect every civilization's units, buildings and physical extension bays. Choose an action and direction, switch to battlefield size, slow the animation to half speed, or choose a construction stage to inspect the scaffold. This preview does not change a saved match.

The current detail pass includes higher-resolution unit sprites, fitted equipment, revised walking/work poses, faction-specific architectural fittings, dedicated add-ons, layered scaffolding and richer terrain materials. To apply it to an already open game: F5 to save, refresh, then F9 to load.

Campaign checks have different scopes: definition tests validate content references, route audits inspect actual static navigation, runtime tests isolate objective/save rules, and `tests/campaign-command-playtest.cjs` exercises missions with ordinary commands. The command-only report is `docs/campaign-command-playtest.json`; completion by an automated commander does not certify average-player or human balance. `tests/campaign-browser.cjs` tests interface and progression with explicitly labeled outcome fixtures, not mission victories.
