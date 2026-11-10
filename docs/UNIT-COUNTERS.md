# Unit counters — reviewed across all twelve civilizations

The current audit covers all 237 unit definitions, including every naval and air roster. It checks implemented combat rules, not just the wording of a tooltip. `unit-counter-audit.json` records each unit's current help, weapon bonus, minimum range and matchup multipliers.

| Unit purpose | Intended strength | Practical weakness |
| --- | --- | --- |
| Battering ram | Buildings and walls; dedicated breaching weapon | Very poor troop damage, slow, needs an escort |
| Artillery / catapults | Buildings and clustered infantry at range | Minimum firing distance; fast melee and scouts can close in |
| Light melee / raiders | Ranged infantry and exposed artillery | Heavy infantry and armored vehicles |
| Heavy infantry / anti-infantry vehicles | Light troops | Armor-piercing specialists or concentrated artillery |
| Armor-piercing specialists | Armored ground units and large armored creatures | Close infantry and concentrated bombardment |
| Interceptors | Aircraft and flying creatures | Cannot attack ground targets |
| Naval escorts | Aircraft threatening a fleet | Warships and coastal artillery |
| Warships | Surface vessels and coastal ground targets | Air attacks and opposing warships |
| Siege ships | Long-range coastal buildings and grouped ground troops | Faster warships, aircraft, and targets inside their minimum range |

These are tactical roles rather than promises that one unit wins every fight. Range, speed, armor, numbers, terrain, cost, upgrades and positioning still matter.

## Corrections

- The Battering Ram no longer inherits the tank's anti-armor/anti-infantry role. It has its own breacher class and a building bonus.
- Artillery now gains damage against infantry. Long-range siege units have a 2.5-tile minimum firing distance, enforced both when winding up and releasing a shot. Ordinary attacks reposition; Hold respects the restricted firing distance.
- Building, armor, light-target and air weapon tags all change actual damage. Bonuses are +40%, +35%, +30% and +35% respectively, applied on top of the class matchup before target armor. They do not grant targeting permissions.
- Splash uses each secondary victim's own class and armor. Hitting a building no longer lends its damage multiplier to nearby infantry. Ground and air splash remain separate; allies, embarked passengers and internal miners are excluded. Projectile damage information survives destruction of the launcher. Old saved projectiles without the newer fields retain their previous fallback damage.
- The IFV uses an anti-light bonus. The Machine Juggernaut is a vehicle; the Hydra remains a creature. All ships use their own naval category and role counters instead of inheriting ground tank or anti-air infantry advantages.
- Firepot Thrower and Goblin Sapper attacks have small explosive splash. Single-projectile Harpy Raider and Flying Stinger attacks no longer inherit gunship splash.
- Gameplay help and the art-review page use the same matchup function as combat. Target restrictions and minimum range are explained alongside useful targets and threats.

## Verification

- Eight unit-counter regression groups passed: real ram damage; all **120** bonus-tagged units; mixed-target splash; minimum range; all **237** help entries; naval counters across twelve civilizations; command-driven battles; targeting restrictions for all **196** armed definitions.
- Command-driven battles verify that a warship beats an escort, an escort stops a gunship, melee defeats an exposed catapult at close range, heavy infantry beats light melee, and a catapult at range defeats clustered rifle infantry.
- All **27** simulation regression files passed, including simulation, legacy gameplay, combat orders, graphics/weapons, mines/naval and saves. The expanded counter suite was rerun after the full pass.
- Browser tests verify the actual Ram/Catapult training tooltips, gathering, building, training, controls, save/load, faction renderers and offline launch.

This is a roster-wide rules and purpose audit, not exhaustive cost-balanced certification of every possible army matchup. The separate AI difficulty tournament remains documented in the gameplay checklist.
