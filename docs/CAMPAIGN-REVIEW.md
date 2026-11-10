# Campaign implementation review

Updated 10 November 2026. The 8 November review assessed an outline before implementation. Its finding that the campaign did not exist is historical and has been superseded: the game now contains all 25 mission definitions, the campaign runtime, menus, persistence, objectives and cinematic playback.

## Current verification status

- Eight mission-definition groups pass: all 25 unique missions, four acts, all twelve playable civilizations, correct progression and cinematic placement, valid production/structure references, acyclic objective dependencies, actual faction unit roles, recovery economy, civilian loss allowances and the final four-stage operation.
- All 25 static route audits pass using the simulation's actual movement checks. Every objective interaction area and convoy destination is connected to the initial ground army; workers share that component; all four resources are accessible; starting Ore is visible. Report: [campaign-route-audit.json](campaign-route-audit.json).
- Fourteen campaign runtime regression groups pass. These isolate movement-driven objectives, paid production, real gathering, protected structures, civilian loss rules, military withdrawal counts, moving/repeating convoys, actual resource districts, stage clocks, one-shot triggers and save restoration.
- The final Standard command-only playthrough of all 25 missions is running. Its current result record is [campaign-command-playtest.json](campaign-command-playtest.json). The commander uses ordinary movement, attack, gathering, construction and paid production. It does not teleport units, inject damage or resources, or mark objectives complete.
- Browser integration checks exercise mission selection, briefings, objective navigation, separate saves, checkpoint recovery, outcome persistence, all progression locks, cinematic controls, missing-media fallback and offline launch. Deliberate outcome fixtures test the interface; they are not mission wins.
- A successful automated playthrough establishes mechanical feasibility for that controller and difficulty. Representative human playtesting is still needed before claiming average-player balance across the entire campaign.

## Story decisions resolved

1. The initial invasion is played as Mission 1. Scene 1 follows its victory. This is the user's latest explicit correction, overriding the pasted narration's earlier placement heading.
2. The Emperor voluntarily sheds his tail to escape the battle. Cleanup crews recover its fungus and regenerative tissue after passage through the rift and seal it as potentially invasive contamination. Magical influences transform it; no inherited memories are asserted.
3. Kesh is reptilian and Rook is a werewolf. Tarin is human. Artwork review must preserve their anatomy; the earlier infirmary reference is not an authoritative character sheet.
4. The war spans approximately eighteen months. Older Tarin narrates retrospectively; the ending's reflection on years of separate world histories does not lengthen the war itself.
5. Their same-soul connection emerges through shared gestures, habits and drawings rather than identical biographies. The three boys appear only in the story, never as escort objectives or vulnerable battlefield heroes.
6. Thread initially offers real help, later imposes integration, and retains attachment to the children. Its network is neutralized by severing support connections before the final core objective. Survival in disconnected fragments remains deliberately uncertain.
7. Machine interference concerns physical mechanisms and coordination signals. Mechanical kills still do not generate Biomass. There is no new resource, hidden thirteenth faction, unrelated final monster, or new recorded dialogue.

## Implemented mission structure

| Mission | Player | Playable structure |
|---|---|---|
| 1 — The Bridge at Dawn | Wizards | Build a Ward Tower, train Spellguards, defend the physical bridge through stage-timed attacks and evacuate six of eight civilian groups. |
| 2 — Imperial Orders | Reptilians | Construct an armory, capture an actual Aetherite district, anchor the gateway; optional Captive-funded Thrall production. |
| 3 — Keys to a Third World | Wizards | Scout the research site, destroy its spire, capture the imperial apparatus intact and protect activation toward Morvane. |
| 4 — Through the Breach | Night Kingdom | Defend the Gothic compound, secure the road, recover stranded residents and evacuate them using ranged/assault troops. |
| 5 — No Neutral Ground | Humans | Establish vehicle production, take both supply routes, withstand a mechanized probe and remove the outpost with Machine assistance. |
| 6 — Hold Ashbridge | Elder Races | Protect the infirmary, open withdrawal, delay successive attacks and evacuate eight of ten groups. Victory is evacuation. |
| 7 — Lines in the Earth | Colony Insects | Restore an Ore district, gather real supplies, produce specialists and break the siege battery while keeping the Queen Chamber. |
| 8 — The Forest War | Primates | Scout forest roads, prepare a watch position, intercept two moving armored supply convoys and capture the crossing. Escaped convoys repeat. |
| 9 — Logic of War | Machines | Restore production and disconnected assembly/automation nodes, use repairs and Sentinel support, then remove the siege command. |
| 10 — Stone and Oath | Mythological Peoples | Protect the temple, capture two resource roads through mountain passes, recruit specialists and remove the occupation garrison. |
| 11 — Fire Against Steel | Draconic Civilization | Defend the hatchery through an actual aircraft attack, restore outlying Oil/Aetherite districts, train anti-air defenders and counterattack; Mature Dragon production is optional. |
| 12 — The Terms of Fire | Infernal Empire | Capture a physical Rift Crystal district, build the actual Summoning Circle, secure the crossing and defeat its rival command. |
| 13 — The Emperor's Wound | Reptilians | Recover intact records, protect the investigation perimeter and examine the missing specimens. The origin is investigated without granting inherited memories. |
| 14 — Unaccounted Movements | Humans | Scout missing-patrol locations with detectors, escort supply carriers and withstand the unfamiliar biological attack. |
| 15 — Shelter of the Unclaimed | Night Kingdom | Defend the shelter and escort displaced people with genuine allied biological assistance. Attacks occur inside the defense interval. |
| 16 — A Necessary Pattern | Symbiotes | Protect shelter, gather ordinary resources, build growth structures, extend the network, then integrate a district that requested autonomy. |
| 17 — Deviation | Machines | Trace biological coordination interference, restore a production junction and destroy the competing relay. |
| 18 — The Price of Peace | Wizards | Locate controlled residents, disconnect their node and physically evacuate them without treating them as hostile targets. |
| 19 — Without Consent | Elder Races | Establish a rescue post, disable two nodes, then extract northern and southern populations sequentially while a reserve covers the rear. |
| 20 — Firebreak | Draconic Civilization | Defend the pass and hatchery, develop anti-air coverage, fight an advancing Root Colossus siege organism and destroy its concentration with coalition support. |
| 21 — The Fall of the Crossings | Reptilians | Protect traffic, attempt stabilization, then change to military withdrawal when the crossing fails. Four surviving soldiers must reach the rear assembly. |
| 22 — A Common Oath | Mythological Peoples | Reconnect two allied forces, escort their supply column and assault the stronghold with Human and Infernal support. |
| 23 — The Ground Between Worlds | Primates | Scout a forest crossing, prepare an ambush, destroy the relay and escort actual withdrawing coalition soldiers while holding the road. |
| 24 — Breaking the Pattern | Machines | Restore the disruption station, disable three ordered relays, defend its broadcast and withdraw four soldiers. |
| 25 — One More Choice | Wizards | Four stages: establish coalition supply, cut the outer relays, remove defenses/support junctions, then neutralize the isolated Prime Heart. Ten allied civilizations contribute. |

## Fairness corrections already made

- Normal collection, production, health and damage remain in Standard. Campaign difficulty changes finite wave pressure; it does not enable the Skirmish challenge economy bonuses for scripted opponents.
- Protected starting supplies and Ore-only armies permit recovery. Strategic mining districts contain actual finite deposits rather than merely named markers.
- Critical routes are physically connected and wide enough for current movement. Scripted armies target walkable building approaches instead of occupied centers, avoiding repeated map-wide path searches.
- Civilians physically move and their saved arrival IDs prevent double counting. Missions advertise quotas with spare groups. Mission 19 releases the populations sequentially instead of exposing both before the player can respond.
- Civilian/supply escorts and military withdrawals are distinct: military objectives require real combat units, not one nearby worker.
- Convoy escape never counts as destruction. Another convoy arrives so a missed column does not silently make Mission 8 impossible.
- The opening, Ashbridge, air-defense and shelter attacks were moved inside their intended objective windows after early command runs showed they could arrive after victory.
- Mandatory mission objectives override Skirmish elimination. Optional tasks never block progression. Four-stage final victory requires the support objectives; early core occupation cannot skip them.

## Media and fidelity work still being verified

All ten approved transcripts are present. Cinematic entries contain five independent image/passage slots and the playback system is operational. Final watercolor/colored-pencil painting installation and real-recording cue alignment are still being completed. The three supplied recordings are preserved as audio sources; no synthesized substitute is used. The first recording ends during Scene 4. Its remaining two passages can be read, but matching narration was not supplied. The final asset manifest is authoritative for exact completed image and verified-audio coverage.

The current mission rules express research-team protection through activation/defense perimeters rather than separate researcher units. Machine interference currently supplies mission objectives rather than an actual production-efficiency effect. A general research-completion objective is not yet in the objective switch, although ordinary research and unit prerequisites work. These specific mechanics are under review for a small follow-up implementation; they must not be described as present until their focused checks pass.

Dragon development currently uses the existing production and research tree, including optional Mature Dragon production; no new biological age simulation is claimed. The campaign reuses current faction abilities and combat instead of inventing unsupported trench tools, a new ritual economy or separate combat rules.
