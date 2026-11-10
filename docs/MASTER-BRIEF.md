# CODEX MASTER DEVELOPMENT PROMPT
# THE FRACTURE — SCIENCE-FANTASY REAL-TIME STRATEGY GAME

## 1. YOUR ASSIGNMENT

You are developing **The Fracture**, an original real-time strategy game combining the military, economic, and technological progression of classic RTS games with twelve distinct civilizations drawn from science fiction, fantasy, mythology, and supernatural horror.

The primary gameplay inspiration is **StarCraft**, especially its base-building, production, research, unit counters, and building extensions. Other useful references include Age of Empires, Command & Conquer, Warcraft III, and the original StarCraft's pre-rendered visual approach.

These are mechanical references, not designs to copy.

**The Fracture must have its own appearance, architecture, civilizations, units, technologies, and atmosphere.**

The game must be serious, strategically deep, visually coherent, and enjoyable as a standalone RTS.

**IMPORTANT: Do not implement the storyline or campaign yet.**

For now, build the functional RTS, civilization selection, skirmish mode, maps, economy, buildings, units, technology trees, AI opponents, combat, and user interface.

There will eventually be an extensive story campaign with approximately 25 missions and 10 illustrated narrative sequences. Structure the game so that those features can be added later without rewriting its core systems.

### Working with the existing project

Before changing anything:

1. Inspect the repository and identify its existing framework, game engine, file structure, rendering system, gameplay mechanics, and assets.
2. Preserve working functionality wherever practical.
3. Reuse existing systems that are suitable for this project.
4. Do not rewrite the entire project unnecessarily.
5. If an implementation already exists, improve and extend it instead of creating competing systems.
6. Keep the architecture modular, maintainable, and data-driven.
7. Implement real gameplay, not merely a design document or static mockup.

If there is no existing project, initialize an appropriate lightweight 2D or 2.5D RTS architecture.

Prioritize a working game with good performance over elaborate graphics that make the game difficult to run.

---

# 2. GAME UNIVERSE — BACKGROUND CONTEXT ONLY

The Fracture takes place across **three parallel universes**.

Each universe contains an alternate version of the same underlying planet. Geography may overlap, but civilizations, history, natural laws, and technology are radically different.

The three currently known universes are:

### Kareth — Science fiction and industry

Kareth contains:

1. Humans
2. Reptilians
3. Machines
4. Colony Insects
5. Primates

### Elyndra — Magic, fantasy, and mythology

Elyndra contains:

6. Wizards
7. Elder Races
8. Mythological Peoples
9. Draconic Civilization

### Morvane — Supernatural and gothic civilization

Morvane contains:

10. Night Kingdom
11. Infernal Empire

### The twelfth civilization — Symbiotes

12. Symbiotes

The Symbiotes do not originally exist as an established civilization.

They emerge during the interdimensional war from fungal organisms combining with the living tissue and nerve clusters of a severed Reptilian Emperor's tail, under the influence of magic and dimensional disturbances.

They eventually become an independent biological civilization governed by one distributed consciousness.

### Important worldbuilding restrictions

- There are exactly **12 playable civilizations**.
- Each established civilization is one unified playable faction.
- Humans are one civilization, not several independent nations.
- Reptilians are one civilization.
- Colony Insects are intelligent individuals belonging to one organized civilization, not an unintelligent hive mind.
- Elder Races are one united civilization containing elves, dwarves, orcs, goblins, and trolls.
- Night Kingdom is one united civilization containing vampires, werewolves, undead, ghosts, and related supernatural peoples.
- Symbiotes are one distributed consciousness controlling many biological bodies.
- Different civilizations can fight or cooperate, even when they originate from the same universe.
- The three known universes are not necessarily the only universes that exist. Preserve room for future expansions.

### Future campaign premise — DO NOT IMPLEMENT YET

The Reptilian Emperor opens a dimensional passage and invades Elyndra, seeking magical power.

The Wizard ruler eventually captures and adapts this technology, opening further passages to Morvane and creating opportunities for political and military alliances.

The interdimensional war expands as different civilizations pursue their own strategic objectives.

The major rulers across the three worlds are alternate versions of the same underlying individual, shaped by different histories and cultures.

During the war, a new fungal intelligence emerges from the Emperor's severed tail. Three children from different universes find the organism, recognize that it is intelligent, and rescue it.

The children are alternate versions of the same child:

- Tarin: a human wizarding boy from Elyndra.
- Kesh: a reptilian boy from Kareth.
- Rook: a werewolf boy from Morvane.

They name the organism Thread.

Thread initially develops affection for them, but becomes increasingly obsessed with eliminating suffering through universal unity. It admires the Machines' apparent efficiency and attempts to eliminate emotion and individuality.

Ultimately, it seeks to assimilate all life into one consciousness.

Thread genuinely believes this is morally necessary, making its story a Greek-style tragedy about pride, certainty, good intentions, control, and the inability to understand one's own emotions.

Its affection for the children remains real, despite its attempts to eliminate that attachment.

The war eventually forces the other civilizations to cooperate against the Symbiotes.

### What to do with this information

Use this background to ensure:

- Civilization designs are thematically consistent.
- Dimensional travel can be added later.
- The game supports temporary alliances and coalition warfare.
- Symbiotes are fully functional in skirmish despite their later narrative origin.
- Campaign missions can have different playable factions and multiple AI participants.
- Future cinematic scenes can be inserted between missions.
- The underlying game rules remain independent of the storyline.

**Do not create campaign missions, narrative cinematics, illustrated scenes, voice acting, scripted character dialogue, or story-specific objectives now.**

Only prepare modular interfaces and systems that can support those features in the future.

---

# 3. CORE GAME MODES

## Skirmish

The primary game mode must be Skirmish.

The player chooses a civilization, map, opponent civilizations, difficulty, and team arrangement.

Include:

- Player versus AI.
- AI versus AI, where practical.
- Two-player matches.
- Multi-faction free-for-all.
- Team games with allied civilizations.
- Random civilization selection.
- Victory and defeat conditions.
- A post-match summary.

Start with reliable two-player matches and support additional players through expandable architecture.

Do not prioritize online multiplayer before the single-player skirmish systems are stable.

### Victory conditions

The default victory condition is elimination of all enemy headquarters and production capability, with appropriate checks to prevent unwinnable situations.

Additional victory modes can be introduced later.

## Future campaign

Prepare an extensible mission system capable of:

- Loading a scripted map.
- Selecting the player's civilization.
- Defining starting buildings and units.
- Creating allied, hostile, and neutral forces.
- Supporting multiple simultaneous objectives.
- Triggering reinforcements and events.
- Changing alliances.
- Recording completed objectives.
- Launching illustrated narrative sequences between missions.

Do not populate it with campaign missions yet.

---

# 4. THE RTS GAMEPLAY SYSTEM

The game should be a genuine real-time strategy experience.

The player must gather resources, construct buildings, train units, research technologies, expand to new resource locations, build armies, and defeat opponents.

### Required controls

Implement:

- Left-click unit selection.
- Drag-box multiple selection.
- Right-click context-sensitive commands.
- Select all units of a particular type.
- Control groups.
- Camera panning.
- Mouse-wheel zoom.
- Minimap navigation.
- Rally points.
- Production queues.
- Build menus.
- Unit and building information panels.
- Tooltips.
- Keyboard shortcuts.

### Required unit commands

- Move
- Attack
- Attack-move
- Stop
- Hold position
- Patrol
- Gather resources
- Construct buildings
- Repair, where appropriate
- Use special abilities
- Set rally points

### World and battlefield mechanics

Implement:

- Fog of war.
- Explored versus unexplored terrain.
- Vision ranges.
- Unit collision.
- Unit and building footprints.
- Pathfinding around buildings and terrain.
- Obstacle avoidance.
- Ground and flying movement.
- Ranged combat and projectiles.
- Melee combat.
- Splash damage.
- Anti-air attacks.
- Detection of concealed units.
- Terrain that creates meaningful tactical decisions.

The AI and player must follow the same underlying combat and economic rules.

### Formation and movement behavior

Large armies should move intelligently, without excessive bunching or units endlessly blocking each other.

Support basic formations and improve them over time.

Units should preserve their relative arrangement where practical, but individual movement and obstacle avoidance must take priority over rigid formations.

### Buildings

Buildings must:

- Have construction costs and times.
- Occupy physical space.
- Have health and destruction states.
- Provide specific functions.
- Display their available production and research options.
- Show prerequisites for locked units.
- Support multiple copies.
- Remain functional in the presence of other buildings of the same type.

---

# 5. THE FOUR RESOURCE ECONOMY

All twelve civilizations use the same **four primary resources**.

Do not use generic Materials or Energy counters.

The four resources are:

## 5.1 Ore

Ore is extracted from rocky mineral deposits.

It represents the metal-bearing and structural minerals used in buildings, tools, weapons, armor, and ordinary military production.

Ore is the principal resource for:

- Early buildings.
- Workers.
- Basic infantry.
- Construction.
- Conventional equipment.
- Fortifications.

All civilizations require Ore.

## 5.2 Lastrian Oil

Lastrian Oil is a naturally occurring, energy-rich liquid extracted from underground reservoirs.

It is an original resource in the game's universe.

Technological civilizations refine it into fuels, lubricants, chemical materials, and industrial compounds.

Fantasy and magical civilizations use its unusual properties for alchemy, potions, enchantment processes, and specialist production.

It is especially important for:

- Vehicles.
- Advanced manufacturing.
- Biological production.
- Industrial technology.
- Alchemy.
- Advanced military equipment.

Oil must be collected from actual deposits using suitable extractors or wells.

## 5.3 Aetherite

Aetherite is a naturally occurring mineral with magical properties.

It must be mined from mineral deposits.

**Do not represent Aetherite as water from a magic spring or as abstract mana floating above the ground.**

It is a tangible, mineable substance.

It is used for:

- Magical research.
- Enchantments.
- Spell-related technology.
- Supernatural units.
- Biological transformations.
- Advanced defensive systems.
- Certain hybrid science-and-magic technologies.

Aetherite existed before the interdimensional war.

Magic-focused civilizations use more of it, but technological civilizations can develop specialized uses for it.

## 5.4 Rift Crystals

Rift Crystals form around disturbances between dimensions.

They are rare, valuable crystalline deposits.

Rift Crystals are used for:

- Advanced research.
- Elite military units.
- Exceptional weapons.
- Powerful magical technologies.
- Dimensional technology.
- Late-game civilization-specific developments.

These should be the rarest of the four resources.

Control of Rift Crystal deposits should be strategically important.

However, a player who loses access to Rift Crystals must still be able to produce ordinary military units and defend their base.

### Resource extraction requirements

- Every standard map contains accessible deposits of the four resources.
- Workers physically gather or extract them.
- Resource sites can be depleted.
- Players can establish additional resource-gathering bases.
- The resource deposits must be visually recognizable.
- Different civilizations may use different-looking extraction structures.
- Extraction behavior should remain mechanically consistent.
- Map generation must provide reasonable resource access to all players.

### No salvage

**There is no resource salvage system.**

Destroyed buildings, vehicles, weapons, and battlefield wreckage do not generate Ore, Oil, Aetherite, or Rift Crystals.

Do not add salvage collection to the economy.

---

# 6. POPULATION CAPACITY

Population is not a fifth gathered resource.

Population capacity is created by housing or equivalent infrastructure.

Examples:

- Humans: Residential Blocks.
- Reptilians: Brood Quarters.
- Machines: Charge Nodes.
- Colony Insects: Brood Mounds.
- Primates: Communal Stores.
- Symbiotes: Vein Colonies.
- Wizards: Wizarding Residences.
- Elder Races: Guild Quarters.
- Mythological Peoples: Storehouses.
- Dragons: Kobold Dens.
- Night Kingdom: Nocturnal Residences.
- Infernal Empire: Cinder Pits.

Suggested initial values:

- Starting workers: 5.
- Starting population capacity: 20.
- Maximum population: 200.

Balance population usage according to military power.

Small infantry should use relatively little population. Large monsters, elite machines, dragons, and exceptional combat units should use substantially more.

Population limits must meaningfully affect army composition.

---

# 7. CIVILIZATION-SPECIFIC KILL COUNTERS

Exactly two civilizations receive special kill-generated production counters.

These are not gathered map resources.

## Reptilians — Captives

Reptilians earn Captive points by killing eligible enemy biological units.

Captive points can be spent at Capture Pens to create standardized mind-jacked soldiers.

Rules:

- Enemy biological deaths generate Captive points.
- Machines do not generate Captive points.
- Buildings do not generate Captive points.
- Self-destruction does not generate Captive points.
- Repeatedly resurrected or free summoned units cannot be exploited to farm points.
- A Captive is a counter, not a physically escorted prisoner.
- A killed Human, Orc, Primate, or other eligible biological unit can contribute to the same pool.

Captured production creates a limited set of standardized Reptilian Thrall models.

Do not generate a distinct infected version of every opposing unit.

## Symbiotes — Biomass

Symbiotes earn Biomass points from eligible enemy biological unit kills.

Biomass is spent to create standardized reconstructed fungal organisms.

Rules:

- Biological enemy kills generate Biomass.
- Mechanical units do not.
- Buildings do not.
- No resource salvage.
- No physical corpse-gathering mechanic.
- Biomass must not be farmable through self-destruction or repeated resurrection.
- The resulting unit is a standardized Symbiote design.

Examples of reconstructed units:

- Husk
- Stalker
- Brute
- Spitter

A reconstructed unit should not retain the visual appearance of its original species.

The difference between the two mechanics is thematic and tactical:

- Reptilians produce technologically controlled Thralls.
- Symbiotes produce bodies controlled by one fungal intelligence.

Both civilizations must also possess ordinary military production capabilities so they remain viable against Machine opponents.

---

# 8. TECHNOLOGY AND PROGRESSION

The Fracture must use **StarCraft-style prerequisite progression**, not Age of Empires-style ages.

There must be no universal Age I, Age II, Age III upgrade.

There must be no mandatory civilization-wide age advancement button.

Instead, players unlock new capabilities by:

1. Constructing particular buildings.
2. Researching technologies.
3. Constructing specialized production structures.
4. Attaching extensions, for the civilizations that use them.
5. Developing civilization-specific biological or magical capabilities.

A player can develop different branches in different orders.

Advanced units should require meaningful economic and technological investment.

Basic units must remain useful throughout the match.

### Physical extensions — Only three civilizations

The following civilizations use physical building extensions:

1. Humans
2. Reptilians
3. Machines

Extensions attach visually and mechanically to production buildings.

An eligible building has one extension slot.

A player can build multiple copies of that building with different extensions.

Extensions unlock specialist units, abilities, and research.

The other nine civilizations do not use the same generic physical-extension system.

Their progression systems must reflect their respective societies.

### Research

Include:

- Weapon upgrades.
- Armor upgrades.
- Unit-specific upgrades.
- Production improvements.
- Special abilities.
- Military specialization.
- Research prerequisites.

Weapon and armor upgrades can initially have three levels, with costs and research times increasing at higher levels.

All unlock relationships should be defined in data, not scattered across unrelated code.

---

# 9. THE TWELVE PLAYABLE CIVILIZATIONS

The following civilization identities, progression systems, buildings, and units define the intended game.

Names are working names where appropriate, but the themes and distinctions must remain intact.

Implement every civilization using the same underlying engine, while allowing faction-specific mechanics.

## CIVILIZATION 1 — HUMANS

**Universe:** Kareth

**Identity:** Industrial civilization with modern military technology, firearms, armored vehicles, aircraft, and combined-arms tactics.

Humans are flexible, relatively conventional, and capable of pursuing several military strategies.

### Visual identity

- Grounded modern military technology.
- Practical industrial architecture.
- Armored personnel carriers.
- Tanks.
- Artillery.
- Aircraft.
- Infantry in recognizable military equipment.
- Restrained colors and realistic proportions.

Avoid exaggerated science-fiction super-soldiers.

### Core buildings

- Command Center — headquarters and workers.
- Residential Block — population.
- Resource Extractors — resource collection.
- Barracks — infantry.
- Engineering Depot — military research.
- Vehicle Factory — armored vehicles.
- Airfield — aircraft.
- Advanced Research Center — elite technology.
- Defensive Turret — base defense.

### Building extensions

**Barracks**

- Medical Wing: Medics and support research.
- Weapons Wing: Heavy Gunners and advanced infantry weapons.

**Vehicle Factory**

- Armor Bay: Tanks and advanced armored vehicles.
- Siege Bay: Artillery and siege vehicles.

**Airfield**

- Helicopter Hangar: Helicopters and gunships.
- Aerospace Workshop: Fighters and advanced aircraft.

### Units

- Engineer — worker and builder.
- Scout — light reconnaissance.
- Rifleman — standard infantry.
- Rocket Infantry — anti-armor and anti-air.
- Medic — infantry support.
- Heavy Gunner — heavy infantry.
- Armored Personnel Carrier / IFV — protected transport and infantry support.
- Main Battle Tank — armored combat.
- Self-Propelled Artillery — siege.
- Fighter Aircraft — air superiority.
- Gunship — ground attack.
- Commando — advanced specialist.

### Important visual distinctions

The Scout must be visibly lighter and less equipped than a Rifleman.

The Heavy Gunner must have clearly bulkier armor and a heavier weapon.

The Engineer must be recognizable through practical equipment and yellow safety markings.

The Medic must have obvious medical identification.

The IFV must be smaller, lower, and visually distinct from a Main Battle Tank.

The Main Battle Tank needs a prominent turret, long cannon, and heavier tracked silhouette.

Human military doctrine emphasizes cooperation between infantry, armor, and aviation.

---

## CIVILIZATION 2 — REPTILIANS

**Universe:** Kareth

**Identity:** Technologically advanced imperial reptilian civilization with disciplined armies, predatory biological characteristics, military hierarchy, and neural domination technology.

### Visual identity

- Reptilian humanoids with scales, tails, and distinct reptile anatomy.
- Advanced military technology.
- Imperial architecture.
- Heavy armor.
- Biological control laboratories.
- War-beasts.
- Dark metallic and militaristic aesthetics.

They must not look like Humans wearing reptile helmets.

### Core buildings

- Imperial Seat.
- Brood Quarters.
- Legion Barracks.
- Dominion Armory.
- Capture Pens.
- Beast Kennels.
- War Foundry.
- Sky Aerie.
- Imperial Sanctum.
- Watch Spire.

### Extensions

**Legion Barracks**

- Shock Wing: elite assault troops.
- Control Wing: Subjugators and neural-control equipment.

**War Foundry**

- Armor Workshop: heavy vehicles.
- Siege Workshop: siege walkers and artillery.

**Beast Kennels**

- Venom Laboratory: venomous creatures.
- War-Breeding Chamber: large war-beasts.

**Capture Pens**

- Specialized neural-conditioning modules for different Thrall production improvements.

### Units

- Laborer.
- Skink Scout.
- Legionnaire.
- Venom Rifleman.
- Shock Guard.
- Subjugator.
- Mind-Jacked Thrall.
- Thrall Enforcer.
- War-Beast.
- Imperial Tank.
- Siege Walker.
- Winged Hunter.
- Imperial Guard.

### Special mechanic

Captives generated through enemy biological kills.

Mind-jacked units use standardized models.

The faction must remain militarily viable without Captives.

---

## CIVILIZATION 3 — MACHINES

**Universe:** Kareth

**Identity:** Autonomous artificial intelligence civilization with self-repairing robotic units, automated manufacturing, and highly coordinated mechanical armies.

### Visual identity

The inspiration is the dark machine civilization from *The Matrix*, especially Sentinels and industrial autonomous machinery.

Use:

- Mechanical spiders.
- Crawlers.
- Tentacled flying drones.
- Walkers.
- Robotic assembly systems.
- Dark metal.
- Industrial structures.
- Nonhumanoid robotic silhouettes.

Avoid making every Machine look like an armored Human soldier.

### Core buildings

- Central Kernel.
- Charge Node.
- Reclamation Station.
- Fabricator.
- Logic Array.
- Assembly Foundry.
- Drone Hive.
- Signal Spire.
- Replication Core.
- Defense Node.

### Extensions

**Fabricator**

- Recon Module.
- Combat Module.

**Assembly Foundry**

- Walker Module.
- Siege Module.

**Drone Hive**

- Interceptor Module.
- Sentinel Module.

### Units

- Construction Drone.
- Recon Spider.
- Blade Drone.
- Pulse Sentry.
- Repair Drone.
- Interceptor Drone.
- Heavy Walker.
- Siege Crawler.
- Sentinel.
- Hunter-Killer.
- Command Relay.
- Juggernaut.

### Special mechanic

A connected automation network improves production coordination and mechanical repair.

Damaged Machine units can be repaired using the normal economic resources.

Do not create a separate salvage currency.

---

## CIVILIZATION 4 — COLONY INSECTS

**Universe:** Kareth

**Identity:** Intelligent social insect civilization based primarily on ants and termites.

Individual insects are intelligent.

They cooperate through organized social structures and specialized castes, not a single shared consciousness.

### Visual identity

- Clearly insect anatomy.
- Ant- and termite-derived organisms.
- Six-legged or biologically plausible forms.
- Workers, soldiers, specialized heavy castes.
- Mounds and colony architecture.
- Chitin and resin construction.

Do not turn these into humanoids with insect helmets.

### Buildings

- Queen Chamber.
- Brood Mound.
- Nutrient Extractor.
- Caste Nursery.
- Soldier Warren.
- Caste Research Chamber.
- Pheromone Relay.
- Resin Foundry.
- Wing Hatchery.
- Royal Brood Chamber.
- Acid Spire.

### Units

- Worker Ant.
- Scout Ant.
- Soldier Ant.
- Acid Spitter.
- Shield Termite.
- Warrior Lancer.
- Sapper Termite.
- Winged Scout.
- Flying Stinger.
- Siege Termite.
- Royal Guard.
- Bombardier Caste.

### Progression

The player develops increasingly specialized castes through Nurseries, Brood Chambers, and biological research.

Examples:

Soldier Brood Chamber → Reinforced Chitin research → Heavy Soldier Caste.

Wing Hatchery → Advanced Wing Development → Flying Stinger.

Royal Brood Chamber → Siege Caste Development → Siege Termite.

---

## CIVILIZATION 5 — PRIMATES

**Universe:** Kareth

**Identity:** Intelligent gorilla-like and ape-like civilization characterized by physical strength, practical craftsmanship, organized communities, and relatively primitive technology.

### Visual identity

- Large powerful ape bodies.
- Organic physical movement.
- Tribal and communal architecture.
- Stone, timber, metalworking, primitive explosives, and siege machinery.
- Substantial physical strength.

They are not unintelligent animals.

They have military traditions, engineering, leadership, and organized civilization.

### Buildings

- Great Lodge.
- Communal Stores.
- Gathering Yard.
- War Circle.
- Hunting Grounds.
- Toolsmith.
- Stoneworks.
- Powder Workshop.
- Siege Yard.
- Great War Council.
- Cliff Watch.

### Units

- Gatherer.
- Runner.
- Club Warrior.
- Spear Warrior.
- Slinger.
- Javelin Hunter.
- Shieldback.
- Powder Gunner.
- Firepot Thrower.
- Battering Ram.
- Heavy Catapult.
- Silverback Champion.
- Great Stone Thrower.

### Progression

Training, practical craftsmanship, metalworking, stoneworking, and siege engineering.

Primates should not suddenly acquire futuristic tanks simply to match Humans.

Their power comes from excellent physical units, practical weapons, durable formations, and powerful siege equipment.

They must still have functional counters against aircraft and advanced technology.

---

## CIVILIZATION 6 — WIZARDS

**Universe:** Elyndra

**Identity:** A society of human witches and wizards with magical education, professional institutions, potion-making, charms, spells, enchanted objects, and magical creatures.

### Visual identity

**Harry Potter-like magical society.**

Not generic medieval fantasy.

Wizard civilization should look like an established society with schools, shops, homes, academies, and institutions where magic performs functions that other societies accomplish through technology.

Its military consists principally of trained witches and wizards.

Avoid relying on ordinary knights and medieval foot soldiers.

### Buildings

- Wizarding Hall.
- Wizarding Residences.
- Dueling Academy.
- Charms Academy.
- Potions Academy.
- Transfiguration Academy.
- Magical Creatures Conservatory.
- Broom Flight School.
- Grand Academy.
- Ward Tower.

### Units

- Apprentice Worker.
- Familiar.
- Spellguard.
- Duelist.
- Healer.
- Hexer.
- Wardbreaker.
- Transfigurer.
- Enchanted Golem.
- Broom Rider.
- Magical Beast.
- Spell Artillery.
- Grand Wizard.

### Progression

Each specialized academy provides its own research tree.

**Dueling Academy**

Offensive magic and combat Wizards.

**Charms Academy**

Defensive magic, wards, detection, utility spells.

**Potions Academy**

Healing, alchemy, temporary enhancements, battlefield support.

**Transfiguration Academy**

Transformations, enchanted constructs, magical manipulation.

**Magical Creatures Conservatory**

Familiars, enchanted beasts, specialized creatures.

**Broom Flight School**

Airborne magical units.

**Grand Academy**

Advanced magical research and elite Wizards.

Do not give the Wizards physical factory-style add-on structures.

Their development comes from academic specialization and research.

---

## CIVILIZATION 7 — ELDER RACES

**Universe:** Elyndra

**Identity:** One unified political civilization consisting of:

- Elves
- Dwarves
- Orcs
- Goblins
- Trolls

### Visual identity

A combination of **Tolkien-style fantasy and Eoin Colfer's Artemis Fowl-style advanced magical technology**.

Imagine ancient architecture, sophisticated craftsmanship, enchanted machinery, highly developed engineering, advanced underground systems, magical technology, and distinct racial specializations.

They should look ancient and technologically impressive at the same time.

They must not simply look like generic medieval villagers.

### Buildings

- High Council.
- Guild Quarters.
- Resource Hall.
- Mixed Barracks.
- Dwarven Runeforge.
- Elven Grove.
- Orc War Hall.
- Goblin Artifice Workshop.
- Troll Hall.
- Runic Transit Hub.
- Council of the Five.
- Watchtower.

### Units

- Goblin Worker.
- Goblin Scout.
- Dwarf Shieldbearer.
- Dwarf Crossbowman.
- Elf Archer.
- Elf Spellweaver.
- Orc Warrior.
- Orc Berserker.
- Goblin Sapper.
- Troll Brute.
- Troll Siege Breaker.
- Runic Siege Engine.
- Advanced Dwarven Artillery.

### Progression

Through specialized guilds and combined research.

Examples:

Dwarven Runeforge + Goblin Workshop → Runic Siege Engineering → Advanced Siege Engine.

Elven Grove + Council Research → Advanced Magical Reconnaissance.

Orc War Hall + Troll Hall → Heavy Assault Doctrine.

All peoples belong to one faction and share one economy.

Do not divide the Elder Races into independent selectable factions.

---

## CIVILIZATION 8 — MYTHOLOGICAL PEOPLES

**Universe:** Elyndra

**Identity:** Classical mythological civilization influenced by Greek and Roman mythology.

Includes intelligent mythological peoples such as:

- Centaurs
- Satyrs
- Minotaurs
- Cyclopes
- Gorgons
- Harpies

Also includes less intelligent mythological beasts.

### Visual identity

- Classical architecture.
- Temples.
- Marble and stone structures.
- Mythological monsters.
- Sacred sites.
- Armor and equipment drawing on classical antiquity.
- Powerful legendary creatures.

Maintain a serious aesthetic rather than a colorful cartoon mythology style.

### Buildings

- Great Agora.
- Storehouse.
- Sacred Resource Extractors.
- Training Courtyard.
- Labyrinth.
- Oracle Temple.
- Cyclops Quarry.
- Harpy Aerie.
- Stone Circle.
- Beast Sanctuary.
- Great Pantheon.
- Sentinel Statue.

### Units

- Satyr Worker.
- Centaur Scout.
- Satyr Javelin Thrower.
- Centaur Archer.
- Minotaur Guardian.
- Minotaur Champion.
- Gorgon Seer.
- Cyclops Stone Thrower.
- Harpy Scout.
- Harpy Raider.
- Chimera.
- Hydra.

### Progression

Through sacred rites, temples, specialized training, and mythological beast cultivation.

Temples provide research and blessings.

They do not function as generic futuristic factories with renamed unit buttons.

---

## CIVILIZATION 9 — DRACONIC CIVILIZATION

**Universe:** Elyndra

**Identity:** A civilization ruled by intelligent dragons, with smaller draconic peoples such as Kobolds and Draconians.

### Visual identity

- Intelligent dragons.
- Large mountain settlements.
- Hatcheries.
- Ancient fortified lairs.
- Kobold labor.
- Draconian infantry.
- Drakes and Wyverns.
- Powerful aerial creatures.

### Buildings

- Hoard Throne.
- Kobold Dens.
- Ember Well.
- Scale Barracks.
- Furnace Forge.
- Hatchery.
- Sky Roost.
- Treasure Vault.
- Elder Lair.
- Flame Tower.

### Units

- Kobold Worker.
- Kobold Scout.
- Kobold Slinger.
- Draconian Spearman.
- Draconian Flameguard.
- Drake.
- Armored Drake.
- Wyvern.
- Dragon Whelp.
- Dragon Sage.
- Mature Dragon.
- Ancient Dragon.

### Progression

Through hatcheries, maturation, specialized breeding, and bloodline research.

Some units can mature into stronger organisms.

Ancient Dragons must be extremely expensive and powerful, with appropriate population costs and weaknesses.

The faction should be capable of fighting effectively using Kobolds, Draconians, and smaller creatures before obtaining mature Dragons.

---

## CIVILIZATION 10 — NIGHT KINGDOM

**Universe:** Morvane

**Identity:** One unified supernatural civilization governed largely by vampires and containing werewolves, undead, ghosts, revenants, and related supernatural creatures.

### Visual identity — VERY IMPORTANT

The primary inspiration is the **Underworld film series**, including Underworld: Evolution.

Do not create a generic medieval Halloween civilization.

Do not base the architecture primarily on graveyards, little crypt huts, haunted cottages, and cartoon castles.

The Night Kingdom is a sophisticated modern-gothic supernatural civilization.

Its visual identity should combine:

- Gothic aristocratic architecture.
- Black stone and dark industrial materials.
- Fortified estates.
- Military complexes.
- Modern firearms.
- Underground laboratories.
- Biological research.
- Armored supernatural troops.
- Vampiric nobility.
- Powerful Werewolf fighters.
- Advanced industry.
- Supernatural technology.

Vampires and Werewolves are members of one political civilization, not separate playable factions.

### Buildings

- Night Citadel.
- Nocturnal Residences.
- Black Armory.
- Vampire Military Academy.
- Lycan Training Compound.
- Blood Research Institute.
- Revenant Laboratory.
- Spectral Research Center.
- Night Foundry.
- Elder Court.
- Gothic Defense Tower.

### Units

- Worker / Ghoul Laborer.
- Vampire Operative.
- Vampire Duelist.
- Vampire Marksman.
- Lycan Tracker.
- Lycan Assault Trooper.
- Lycan Heavy Fighter.
- Blood Mage.
- Revenant Soldier.
- Stitched Horror.
- Ghost Scout.
- Wraith.
- Undead Knight.
- Ancient Vampire.
- Heavy Night Kingdom Combat Vehicle.

### Progression

Advanced military institutions, biological research, supernatural orders, and industrial development.

Vampires emphasize speed, precision, firearms, blood abilities, and stealth.

Lycans emphasize physical strength and assault combat.

Revenants provide resilient reconstructed troops.

Spectral units provide detection, infiltration, and supernatural attacks.

Advanced units require appropriate research institutes and production buildings.

---

## CIVILIZATION 11 — INFERNAL EMPIRE

**Universe:** Morvane

**Identity:** A hierarchical demonic civilization featuring Demons, Imps, Hellhounds, Gargoyles, Greater Demons, and Archdemons.

### Visual identity

- Demonic military civilization.
- Infernal architecture.
- Hellforges.
- Summoning circles.
- Dark stone.
- Fire.
- Large fortified structures.
- Hierarchies of infernal power.

Keep this civilization visually distinct from the Night Kingdom.

### Buildings

- Infernal Throne.
- Cinder Pits.
- Soul Furnace.
- Imp Warrens.
- Legion Gate.
- Hell Kennels.
- Hellforge.
- Gargoyle Roost.
- Sacrificial Altar.
- Summoning Circle.
- Abyssal Gate.
- Ash Tower.

### Units

- Imp Worker.
- Imp Scout.
- Imp Skirmisher.
- Demon Footsoldier.
- Hellhound.
- Flamecaster.
- Infernal Guard.
- Gargoyle.
- Siege Fiend.
- Tormentor.
- Greater Demon.
- Archdemon.

### Progression

Through summoning, rituals, infernal metallurgy, and military hierarchy.

Example:

Legion Gate → Hellforge → Greater Summoning Research → Abyssal Gate → Greater Demon.

The most powerful demons require expensive rituals and advanced buildings.

All ritual costs must use the four established resources, unless the ability simply has a cooldown or rechargeable unit ability meter.

Do not introduce an unnecessary additional economic currency.

---

## CIVILIZATION 12 — SYMBIOTES

**Origin:** Born during the interdimensional war.

**Identity:** A fungal biological civilization controlled by one distributed consciousness.

### Visual identity — CRITICAL

The Symbiotes must be unsettling, organic, and physically distinct.

Their appearance draws on:

- Fungal tissue.
- Mycelium.
- Reconstructed biological bodies.
- Neural structures.
- Tendrils.
- Organic armor.
- Biological growth.
- Increasingly efficient, orderly organism design.

They should not look like hedgehogs, cute fantasy pets, ordinary zombies, or humanoids wearing fungus costumes.

They should not simply be recolored Colony Insects.

As they develop more advanced technology, their bodies become increasingly symmetrical, efficient, and machine-like in their organization, but remain entirely biological.

### Buildings

- Prime Heart.
- Vein Colony.
- Digestive Pit.
- Growth Pool.
- Neural Lobe.
- Reclamation Vat.
- Graft Chamber.
- Spore Canopy.
- Cortex Spire.
- Spine Tower.

### Units

- Harvester.
- Prowler.
- Talon.
- Spore Dart.
- Listener.
- Husk.
- Stalker.
- Spitter.
- Brute.
- Carapace Beast.
- Spore Flyer.
- Neural Binder.
- Root Colossus.

### Progression

Through biological evolution, research, and neural-network development.

Examples:

Growth Pool → Neural Lobe → Reinforced Tissue Research → Graft Chamber → Carapace Beast.

Reclamation Vat → Reconstructed Body Research → Husk, Stalker, Spitter, and Brute production.

Cortex Spire → Advanced Neural Coordination → Root Colossus.

### Special mechanics

**Biomass**

Earned from enemy biological kills and used for standardized reconstructed units.

**Living Network**

Symbiote structures form an interconnected biological network.

Certain advanced structures require network access.

The network can improve regeneration, coordination, and local defense.

### Critical distinction

Colony Insects consist of many intelligent individuals.

Symbiotes consist of one intelligence operating many bodies.

This must be reflected in their art direction and gameplay identity.

---

# 10. TECH TREE IMPLEMENTATION

The technology tree should be implemented as a reusable dependency system.

Every unit and building needs a clear definition containing, where applicable:

- Unique identifier.
- Civilization identifier.
- Display name.
- Role.
- Health.
- Armor.
- Attack damage.
- Attack type.
- Attack range.
- Attack cooldown.
- Movement speed.
- Vision range.
- Population cost.
- Ore cost.
- Lastrian Oil cost.
- Aetherite cost.
- Rift Crystal cost.
- Captive or Biomass cost, if relevant.
- Production time.
- Production building.
- Prerequisites.
- Required research.
- Required extension, if applicable.
- Abilities.
- Upgrade relationships.
- Sprite references.
- Audio references.

### User interface behavior

If a unit is locked, its production button should remain visible but disabled.

The tooltip should state exactly what is required.

Example:

**Human Main Battle Tank**

Requires:

- Vehicle Factory.
- Armor Bay extension.
- Heavy Armor Research.

Or:

**Wizard Healer**

Requires:

- Potions Academy.
- Healing Research I.

Do not make players guess why a unit is unavailable.

### Strategic variety

Every civilization must support at least two meaningful development strategies.

Examples:

- Humans: infantry specialization versus armored warfare versus aviation.
- Reptilians: elite military production versus Thrall support versus war-beasts.
- Machines: swarms versus heavy walkers versus aerial Sentinels.
- Colony Insects: rapid light castes versus heavily armored castes.
- Primates: powerful infantry versus siege warfare.
- Wizards: offensive spells versus protective and healing magic.
- Elder Races: military guild combinations.
- Mythological Peoples: ordinary mythic troops versus elite monsters.
- Dragons: Draconian armies versus investment in powerful Dragons.
- Night Kingdom: Vampire technology versus Lycan assaults versus supernatural support.
- Infernal Empire: rapid demon armies versus ritual-based greater creatures.
- Symbiotes: basic organism swarms versus advanced reconstructed bodies.

Avoid a single mandatory build order for every match.

---

# 11. MILITARY BALANCING

The game must have counterplay.

No civilization should be unbeatable because of its theme.

Every civilization must be capable of dealing with:

- Light infantry.
- Heavy infantry.
- Large monsters.
- Armored vehicles.
- Flying units.
- Fortifications.
- Stealth units.
- Large swarms.
- Siege weapons.

Their solutions do not have to look alike.

For example:

- Humans use rockets and anti-air weapons.
- Wizards use appropriate combat spells.
- Primates use powerful throwing weapons and specialized siege equipment.
- Insects use acid projectiles and flying castes.
- Dragons use aerial combat and fire attacks.
- Machines use mechanical interceptors and long-range weapons.

### Basic units must remain relevant

Advanced units should expand tactical options.

They should not make all early units obsolete.

A well-organized force of ordinary troops, supported by the right counters, should remain useful in the late game.

### Elite units

Large Dragons, Archdemons, Juggernauts, Root Colossi, and similar apex units should be:

- Expensive.
- Slow to produce.
- Population-intensive.
- Powerful.
- Vulnerable to appropriate counters.

Do not allow players to win simply by mass-producing the same elite unit without strategic weaknesses.

---

# 12. GRAPHICS AND VISUAL STYLE

This is a serious RTS game.

The graphics should be relatively lightweight, sharp, recognizable, and visually consistent.

The visual approach should resemble the technical discipline of classic pre-rendered RTS games without copying their actual artistic designs.

## Perspective

Use a consistent three-quarter isometric or isometric-like camera for gameplay.

Maintain coherent:

- Viewing angle.
- Lighting direction.
- Unit proportions.
- Building proportions.
- Ground alignment.
- Shadow placement.
- Sprite origin points.
- Scale relationships.

### Scale

Humans should be appropriately sized relative to buildings, vehicles, trees, and terrain.

Do not make infantry excessively large.

Large creatures should be visibly larger than ordinary soldiers without looking distorted.

### Suggested frame dimensions

- Small infantry: approximately 48 × 48 pixels.
- Larger infantry: approximately 64 × 64 pixels.
- Vehicles: approximately 96 × 96 pixels.
- Large monsters: approximately 128 × 128 pixels.
- Buildings: approximately 128–256 pixels or as required by their footprints.

Treat these as practical starting targets, not rigid limits.

### Distinct silhouettes

Every unit must be visually recognizable at normal gameplay zoom.

Color alone is not enough.

Use different:

- Body proportions.
- Weapons.
- Armor.
- Head shapes.
- Equipment.
- Stance.
- Movement.
- Unit size.

Do not make Scouts, Riflemen, and Heavy Troopers look nearly identical.

Do not make an IFV and a Main Battle Tank look like the same vehicle.

Apply this principle across all twelve civilizations.

---

# 13. EIGHT-DIRECTION UNIT SPRITES

Every moving unit should support **eight genuinely different facing directions**.

Use:

- N
- NE
- E
- SE
- S
- SW
- W
- NW

### Correct appearance

North means the unit faces away from the viewer, showing its back.

South means the unit faces toward the viewer, showing its front.

East and West must show corresponding side profiles.

Northeast and Northwest must show three-quarter rear views.

Southeast and Southwest must show three-quarter front views.

**Do not generate several frames that all face the same direction and simply label them differently.**

This problem occurred in earlier artwork and must not be repeated.

### Animations

Support:

- Idle.
- Walking or moving.
- Attacking.
- Taking damage, where appropriate.
- Death or destruction.
- Special abilities.

A reasonable initial target is:

- 8 directions.
- 4–6 movement frames per direction.
- 3–5 attack frames per direction.
- Appropriate idle and death sequences.

For vehicles, separate turret orientation from hull movement where appropriate.

For creatures, use believable species-specific movement rather than copying human walking animations.

### Artwork assets

Reuse suitable provided artwork if it exists in the repository.

However, earlier reference sheets may contain inaccurate directions, inconsistent scale, or non-game-ready images.

Do not assume those sheets are complete animation atlases.

Validate asset quality, transparency, alignment, and directional accuracy before integrating them.

When appropriate assets do not yet exist, use clearly documented temporary game sprites with distinguishable silhouettes.

Do not falsely represent placeholders as finished assets.

---

# 14. OPTIMIZATION AND GAME SIZE

I want the game to be lightweight and performant.

Do not rely on unnecessarily high-resolution textures.

Use:

- Compact texture atlases.
- Efficient sprite batching.
- Shared animation systems.
- Asset caching.
- Lazy loading where appropriate.
- Only necessary faction assets loaded for a match.
- Efficient pathfinding.
- Sensible AI update intervals.
- Efficient projectile pooling where useful.
- Limited unnecessary particle effects.

Use appropriate transparent image formats for sprites and efficient compression for packaged assets.

Remember that compressed file size and GPU texture memory are different.

Optimize both.

### Performance goals

Aim for smooth gameplay on an ordinary desktop or laptop, including large armies.

Target 60 FPS under representative gameplay conditions where hardware permits.

Avoid unnecessary per-unit expensive operations every frame.

Do not generate thousands of unique models where reusable unit types are sufficient.

The game's size should remain reasonable even with twelve civilizations.

### Visual clarity

Low resolution should not mean blurry graphics.

Sprites should remain sharp, readable, and visually attractive.

Preserve serious atmosphere and detail through good silhouettes, lighting, color discipline, and composition rather than gigantic images.

---

# 15. THE USER INTERFACE

Design the UI for a serious military and fantasy RTS.

Avoid cartoonish panels, exaggerated icons, childish fonts, or unnecessary decorative effects.

### Main menu

Include:

- Skirmish.
- Civilization selection.
- Settings.
- Future Campaign entry, disabled or marked as unavailable until implemented.

### Skirmish setup

Include:

- Map selection.
- Player civilization.
- Opponent civilization.
- AI difficulty.
- Player count.
- Team configuration.
- Starting conditions.

### In-game interface

Display:

- Ore.
- Lastrian Oil.
- Aetherite.
- Rift Crystals.
- Population.
- Captives for Reptilians, when relevant.
- Biomass for Symbiotes, when relevant.
- Minimap.
- Selected unit information.
- Production buttons.
- Research buttons.
- Building menu.
- Command buttons.
- Production queue.
- Health bars.
- Rally points.

The UI should adapt to the selected civilization without changing its basic usability.

Different civilizations may have visual themes, but controls must remain familiar.

### Tooltips

Every unit, building, research option, and ability needs a clear tooltip.

Explain cost, function, prerequisites, and relevant combat role.

---

# 16. MAPS AND TERRAIN

Maps must support gameplay across the three different universes.

### Kareth maps

- Industrial regions.
- Technological cities.
- Alien terrain.
- Machine installations.
- Reptilian military compounds.
- Insect colonies.
- Primate territories.

### Elyndra maps

- Magical settlements.
- Wizarding communities.
- Elder Races' cities.
- Forests.
- Mountains.
- Temples.
- Draconic fortresses.

### Morvane maps

- Modern gothic cities.
- Vampire estates.
- Lycan-controlled districts.
- Night Kingdom research installations.
- Infernal strongholds.
- Supernatural landscapes.

### Universal map requirements

Every civilization must be able to play on every map.

A Human versus Wizard match should work in Kareth, Elyndra, or Morvane.

Maps should have:

- Starting base areas.
- Resource locations.
- Expansion opportunities.
- Defensible terrain.
- Multiple possible routes.
- Strategic chokepoints.
- Appropriate space for base-building.

For future campaign use, the map architecture must allow the same underlying geography to have alternate versions across the three universes.

Do not implement complicated multi-map dimensional travel during ordinary skirmishes yet.

---

# 17. AI OPPONENTS

The AI should behave like a genuine RTS opponent.

It must:

- Gather resources.
- Build workers.
- Construct housing.
- Build military structures.
- Research technologies.
- Add building extensions when appropriate.
- Produce armies.
- Scout.
- Expand.
- Defend its base.
- Attack enemy positions.
- React to enemy army composition.
- Replace losses.
- Pursue victory conditions.

### Difficulty levels

**Easy**

Slower expansion, less aggressive, forgiving decision-making.

**Normal**

Reasonable economy, expansion, technology development, and tactical decisions.

**Hard**

More effective development, scouting, counters, attacks, and army coordination.

Do not simply give Hard AI unlimited free resources.

A stronger AI should primarily make better decisions.

### Civilization-specific strategies

AI behavior must reflect faction capabilities.

Examples:

- Humans develop mixed infantry and armor.
- Machines exploit production efficiency.
- Reptilians utilize Thralls when available.
- Colony Insects expand and field organized castes.
- Wizards invest in spell research and support units.
- Dragons balance cheap Draconian troops with expensive Dragons.
- Symbiotes manage biological production and Biomass.
- Night Kingdom combines ranged technology with strong Lycan assaults.

Avoid having every AI use the same army composition.

---

# 18. ENGINE ARCHITECTURE

Create reusable systems for:

- Resources.
- Workers.
- Buildings.
- Construction.
- Production.
- Research.
- Technology prerequisites.
- Extensions.
- Unit movement.
- Combat.
- Unit abilities.
- Population.
- AI.
- Fog of war.
- Maps.
- Animation.
- Sound.
- Faction configuration.

Civilizations should largely be data-defined rather than requiring twelve entirely separate gameplay engines.

### Suggested data organization

Use the existing project's conventions where possible.

The architecture should conceptually separate:

- `factions`
- `units`
- `buildings`
- `research`
- `extensions`
- `abilities`
- `resources`
- `maps`
- `ai`
- `rendering`
- `audio`
- `ui`
- `game_modes`

Each civilization should have its own configuration defining its units, buildings, research, and special behavior.

Faction-specific mechanics should be implemented through clean extensions to the common rule system.

Do not create large sections of duplicated logic.

### Validation

Automatically validate:

- Missing unit references.
- Missing building prerequisites.
- Impossible technology trees.
- Circular dependencies.
- Invalid resource costs.
- Units without production buildings.
- Broken sprite references.
- Invalid extension requirements.
- Missing population costs.
- Unsupported ability definitions.

Do not allow a civilization to have units that can never be unlocked because of configuration mistakes.

---

# 19. DEVELOPMENT ORDER

This project is substantial. Implement it in a controlled sequence while preserving a playable build.

## Phase 1 — Functional RTS foundation

Get the basic engine working with:

- Camera.
- Selection.
- Movement.
- Pathfinding.
- Resources.
- Workers.
- Construction.
- Combat.
- Population.
- Production.
- Fog of war.
- Simple AI.
- Win and loss conditions.

Use Humans as the initial full reference civilization if necessary.

## Phase 2 — Technology and extensions

Implement:

- Building prerequisites.
- Research.
- Unit unlocks.
- Physical building extensions.
- Visible extension attachments.
- Production specialization.
- Locked-unit tooltips.

Validate Humans, Reptilians, and Machines.

## Phase 3 — Other civilizations

Implement the other nine civilizations using their specific development systems.

Ensure all twelve are selectable in skirmish.

Use reusable data definitions and specialized mechanics rather than twelve disconnected implementations.

## Phase 4 — Military depth

Improve:

- Unit counters.
- Combat abilities.
- Formations.
- AI.
- Different faction strategies.
- Flying units.
- Siege.
- Detection.
- Special mechanics.
- Balance.

## Phase 5 — Visual integration

Integrate the approved faction art where available.

Validate:

- Eight-direction animations.
- Unit silhouettes.
- Sprite dimensions.
- Building sizes.
- Production extensions.
- Terrain.
- Effects.
- Performance.

## Phase 6 — Skirmish completion

Complete:

- Civilization selection.
- Team configuration.
- Multiple AI opponents.
- Difficulty levels.
- Maps.
- Victory and defeat screens.
- Settings.
- Performance optimization.
- Stability.

The game should be enjoyable as a skirmish RTS before campaign development begins.

---

# 20. TESTING REQUIREMENTS

Test gameplay rather than assuming that systems work because they compile.

### Basic tests

- Workers gather each of the four resources.
- Resources are deducted when production begins.
- Construction completes.
- Buildings produce units.
- Population limits work.
- Research unlocks the correct options.
- Add-ons unlock the correct units.
- Research prerequisites display accurately.
- Units obey commands.
- AI constructs and attacks.
- Games can end successfully.

### Faction tests

Every civilization must be able to:

1. Start with a headquarters and workers.
2. Gather all required resources.
3. Construct basic military buildings.
4. Produce combat units.
5. Unlock more advanced technology.
6. Produce an army capable of attacking ground units.
7. Counter flying units.
8. Attack fortified structures.
9. Expand economically.
10. Win a standard skirmish.

### Special tests

Test Captive generation and spending.

Test Biomass generation and spending.

Test that mechanical units and buildings do not improperly generate these counters.

Test that there is no salvage economy.

Test every production extension.

Test all eight sprite directions. In particular, North must visually show the back of the unit, and South the front.

Test that all twelve civilizations can fight one another without crashing or causing incompatible behavior.

### Performance tests

Test games with:

- Multiple active players.
- Large groups of units.
- Active AI opponents.
- Frequent combat.
- Hundreds of projectiles or effects.
- Numerous buildings.

Identify and address significant performance problems.

---

# 21. WHAT NOT TO DO

Do not:

- Implement the campaign yet.
- Create story cinematics.
- Write campaign dialogue.
- Add scripted storyline missions.
- Add a universal Age I / II / III progression system.
- Give every civilization identical factory add-ons.
- Split unified civilizations into separate playable political factions.
- Create a salvage resource.
- Add a fifth universal resource.
- Replace Ore with generic Materials.
- Replace Lastrian Oil with generic Energy.
- Make Aetherite a magical spring resource.
- Require every unit to be made from Rift Crystals.
- Make the Symbiotes cute or hedgehog-like.
- Make the Night Kingdom a medieval Halloween village.
- Make Wizards a generic medieval knight faction.
- Make the Elder Races merely a collection of primitive fantasy races.
- Make Colony Insects a single hive consciousness.
- Create individual enemy-specific infected sprites for Reptilians or Symbiotes.
- Make all units look interchangeable.
- Fake the eight movement directions.
- Use enormous HD sprites when low-resolution assets are sufficient.
- Replace working code unnecessarily.
- Prioritize visual polish over functional gameplay.
- Claim features are complete unless they actually work.

---

# 22. SUCCESS CRITERIA

The project is successful when The Fracture is a playable RTS in which:

1. A player can select any of twelve distinct civilizations.
2. All civilizations gather Ore, Lastrian Oil, Aetherite, and Rift Crystals.
3. Every civilization has functioning workers, buildings, military production, and research.
4. Advanced units must be unlocked through actual prerequisites.
5. Humans, Reptilians, and Machines have functioning physical building extensions.
6. The other civilizations have progression appropriate to their societies.
7. Reptilians generate and spend Captives from eligible kills.
8. Symbiotes generate and spend Biomass from eligible kills.
9. Combat includes meaningful unit counters.
10. Players can construct and expand bases.
11. AI can manage an economy and military.
12. Units and buildings are visually distinguishable.
13. Moving units support correct eight-direction rendering.
14. Game performance remains appropriate for large RTS battles.
15. The game works without its storyline.
16. The architecture can support the planned narrative campaign later.

---

# 23. FINAL INSTRUCTIONS TO CODEX

Begin by inspecting the existing codebase and reporting the current game architecture.

Identify which required systems already exist, which can be reused, and which need to be implemented.

Then begin implementing the game.

**Do not stop after producing a plan. Make the changes that can be completed in the current working session.**

Work in sensible stages and keep the project functional.

When a feature is too large to complete in one pass, implement a clean, functioning foundation and identify the remaining work accurately.

Prioritize:

1. Functional RTS systems.
2. Four-resource economy.
3. Twelve faction definitions and production chains.
4. Research and building extensions.
5. Military combat and AI.
6. Lightweight, distinctive graphics.
7. Skirmish gameplay.
8. Future campaign compatibility.

After implementation, provide a concise report showing:

- What was completed.
- What is playable.
- What remains incomplete.
- Which tests passed or failed.
- Any assets that still need work.
- The recommended next development step.

The objective is not to create a small StarCraft imitation.

**The objective is to build the foundation of an original, serious, twelve-civilization science-fantasy RTS where every civilization has its own military identity, development system, technology, and strategic possibilities.**

Build the game first. The story campaign will be developed separately once the underlying RTS is stable.
