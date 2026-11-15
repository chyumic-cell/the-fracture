# Tactical request coverage

The 62-point list is a design backlog, not a claim that every tactic is complete. All behavior must use ordinary paid units, private observations and existing mechanics. Relaxed remains the fixed baseline. No match result is scripted and no controller reads its opponent's difficulty.

## Implemented behavior and remaining gaps

| Requested items | Current behavior | Remaining work |
| --- | --- | --- |
| 1, 3, 4, 8: reconnaissance, surveillance, threats, uncertainty | Scouts revisit terrain; observed contacts expire; target and route decisions use private fog. | A unified, decaying route-threat field and explicit intelligence-confidence requirements before each operation. |
| 2, 6: combat probes, counter-reconnaissance | Local defenders intercept visible scouts; bait detachments can withdraw toward prepared defenses. | Deliberate limited-loss reconnaissance missions and coordinated scout interception. |
| 5, 7: composition analysis, intelligence-driven targets | Paid counter production responds to observed composition and queued coverage; strategic target scores favor valuable exposed buildings. | Track confidence and persistent trends across several encounters. |
| 9, 13, 14, 16: concentration, combined arms, screening, chokepoints | Assault assembly, group reinforcements, paid varied forces, artillery screens and route-aware towers/walls. | More reliable cross-route arrival synchronization and multi-layer defensive layouts. |
| 10–12: isolated detachments, flanking, envelopment | A separate fast flank can join the main assault; local force comparisons govern engagement. | Explicit isolated-detachment operations and two simultaneous encircling wings. |
| 15, 17: terrain, ambushes | Known routes guide mines, towers and real bait-and-guard ambushes. Existing height damage rules apply normally. | No invented forest concealment, trenches or cover bonuses. Broader terrain-aware firing-position selection remains. |
| 18–20: focus fire, overkill, threats | Expected damage, ordinary counters, in-flight projectiles and committed windups influence targeting. Ready weapons are assigned first at the top tiers. | Mixed air/land/naval groups still need one shared fire-allocation plan. |
| 21–23: kiting, dispersion, controlled pursuit | Ranged cooldown movement, feasible splash avoidance, and local-support checks before chasing into observed fortification fire. Temporary pursuit holds resume movement when contacts leave. | Pursuit protection currently covers entry into fortification fire. General mobile pursuit and a full route-integrated ambush forecast remain incomplete. |
| 24–26, 30–32: depth, reserves, counterattacks, asset defense, reinforcement, economy of force | Local reserves are preferred to peeling troops off an assault. Threat scoring includes headquarters, extraction and workers. Towers support interceptions. | Multiple simultaneous defensive sectors and staged counterattack missions need further work. |
| 27–29: withdrawal, retreat, wounded extraction | Groups retreat when losing, preserve committed shots, and seek actual healing/repair where available. | Explicit alternating rear-guard covering fire and full casualty evacuation. |
| 33–35: rushes, raids, hit-and-run | Vulnerable construction can trigger an earlier assault; fast groups raid exposed workers and leave when guards respond. | Better estimates of reinforcement arrival and raid opportunity cost. |
| 36–39: feints, diversion, multi-axis attacks, interdiction | Separate raid and flank groups provide limited multi-axis pressure. | No general deception planner, defender-response prediction, or sustained encirclement/interdiction operation. |
| 40–44: siege, breach, denial, containment, exploitation | Range-aware siege screens, economic raids, and smaller finishing forces against visibly weakened objectives. | Explicit breach recognition, reserve exploitation and expansion containment. |
| 45, 46: air superiority and air-ground coordination | Aircraft prioritize visible anti-air threats; ordinary domain tactics preserve committed attacks. | Coordinated suppression windows and timed air-ground offensives. |
| 47–52: transports, recovery, landings, shipping, escorts | Existing route/capacity/range-aware air/sea decisions, real refueling, landing checks, shipping targets and escorts. | Coordinated contested landings and escort coverage across entire routes need improvement. |
| 53, 54: patterns, adaptation | Composition counters respond to observed enemies. | Repeated-route and habitual-response models are not yet implemented. |
| 55–57: rotation, synchronization, timing | Reinforcement waves, assembly phases and support-aware retreats. | Fresh-force rotation and travel-time/ability-based multi-group synchronization. |
| 58, 59: deception, layered operations | Mined bait ambushes and separate scouting, siege, assault and finishing behaviors exist. | They are not a complete deception or scout–breach–exploit–consolidate campaign planner. |
| 60–62: risk, opportunities, reassessment | Local power/counters/health inform attacks and retreats. Master and above can replace a newly fortified objective with a reachable vulnerable production target, with a review interval and improvement threshold. | Broader expected-loss forecasts and reassessment of every air/naval/economic operation. |

## Verification and scope

`tests/ai-operational-decisions.test.cjs` exercises visible-versus-hidden tower decisions, resuming an interrupted advance, favorable pursuit, reserve continuity and objective reassessment. Existing battle-planning, strategy, advanced-tactics and fairness tests cover other conditional behaviors. Tests do not imply every tactic works optimally in every map or civilization.

Equal-roster combat screens are diagnostics. Only completed full matches count toward the requested adjacent 5–10% lower-tier win rate. Timeouts remain unresolved; a two-game side swap cannot establish that percentage. See AI-LADDER-CALIBRATION.md for measured results and unfinished calibration.
