'use strict';
(function(root){
const resources=['ore','oil','aether','rift'];
const roles={
 worker:{hp:65,damage:4,range:.75,speed:1.7,pop:1,time:10,cost:[50,0,0,0],worker:true},
 scout:{hp:70,damage:5,range:2.8,speed:2.7,pop:1,time:9,cost:[45,0,0,0],vision:11,detector:true},
 melee:{hp:140,damage:19,range:.9,speed:1.9,pop:1,time:12,cost:[65,0,0,0],bonus:'light'},
 rifle:{hp:85,damage:13,range:5,speed:1.65,pop:1,time:12,cost:[60,0,0,0],aa:true},
 aa:{hp:100,damage:27,range:6.4,speed:1.55,pop:2,time:17,cost:[80,20,0,0],aa:true,bonus:'armor'},
 support:{hp:90,damage:0,range:4.5,speed:1.7,pop:1,time:16,cost:[50,0,35,0],heal:9},
 heavy:{hp:200,damage:24,range:3.8,speed:1.3,pop:2,time:20,cost:[100,25,0,0],armor:3,bonus:'light'},
 tank:{hp:410,damage:48,range:5.8,speed:1.3,pop:4,time:30,cost:[170,70,0,0],armor:6,armored:true,bonus:'armor'},
 siege:{hp:180,damage:76,range:10,speed:1,pop:3,time:28,cost:[140,55,15,0],splash:1.1,bonus:'building',cooldown:3.2},
 fighter:{hp:160,damage:32,range:6,speed:3.1,pop:3,time:27,cost:[110,55,20,0],air:true,aa:true,airOnly:true,bonus:'air'},
 gunship:{hp:220,damage:30,range:5,speed:2.3,pop:3,time:30,cost:[135,60,30,0],air:true,splash:.6},
 elite:{hp:240,damage:35,range:5.2,speed:1.8,pop:3,time:32,cost:[120,30,65,20],aa:true,armor:2},
 stealth:{hp:95,damage:24,range:4.4,speed:2,pop:2,time:25,cost:[80,25,35,10],stealth:true,detector:true},
 giant:{hp:820,damage:85,range:4.5,speed:.9,pop:8,time:60,cost:[320,100,150,70],armor:7,armored:true,splash:1.3},
};
const raw=[
['humans','Humans','Kareth','#6fa9b0','industrial','Coordinated infantry, armor and aviation. Physical extensions specialize each production building.',
'Command Center:hq|Residential Block:house|Barracks:inf|Engineering Depot:lab|Vehicle Factory:armor|Airfield:air|Advanced Research Center:elite|Defensive Turret:defense',
'Engineer:worker:0|Scout:scout:2|Rifleman:rifle:2|Rocket Infantry:aa:2|Medic:support:2:Medical Wing|Heavy Gunner:heavy:2:Weapons Wing|Infantry Fighting Vehicle:tank:4|Main Battle Tank:tank:4:Armor Bay|Self-Propelled Artillery:siege:4:Siege Bay|Fighter Aircraft:fighter:5:Aerospace Workshop|Gunship:gunship:5:Helicopter Hangar|Commando:stealth:6',
'Precision Rifling|Composite Ballistics|Modular Extraction|Heavy Armor Research'],
['reptilians','Reptilians','Kareth','#91aa62','reptile','An imperial army of scaled legionaries, war-beasts and neural domination. Eligible biological kills yield Captives.',
'Imperial Seat:hq|Brood Quarters:house|Legion Barracks:inf|Dominion Armory:lab|Capture Pens:counter|Beast Kennels:armor|War Foundry:armor|Sky Aerie:air|Imperial Sanctum:elite|Watch Spire:defense',
'Laborer:worker:0|Skink Scout:scout:2|Legionnaire:melee:2|Venom Rifleman:rifle:2|Shock Guard:heavy:2:Shock Wing|Subjugator:elite:2:Control Wing|Mind-Jacked Thrall:melee:4|Thrall Enforcer:heavy:4|War-Beast:tank:5:War-Breeding Chamber|Imperial Tank:tank:6:Armor Workshop|Siege Walker:siege:6:Siege Workshop|Winged Hunter:fighter:7|Imperial Guard:elite:8',
'Venom Catalysis|Scale Lamination|Imperial Logistics|Neural Conditioning'],
['machines','Machines','Kareth','#77bbc0','machine','Nonhumanoid autonomous constructs. Nearby nodes form a repair network; repairs consume Ore.',
'Central Kernel:hq|Charge Node:house|Reclamation Station:depot|Fabricator:inf|Logic Array:lab|Assembly Foundry:armor|Drone Hive:air|Signal Spire:lab|Replication Core:elite|Defense Node:defense',
'Construction Drone:worker:0|Recon Spider:scout:3:Recon Module|Blade Drone:melee:3|Pulse Sentry:rifle:3|Repair Drone:support:3|Interceptor Drone:fighter:6:Interceptor Module|Heavy Walker:tank:5:Walker Module|Siege Crawler:siege:5:Siege Module|Sentinel:gunship:6:Sentinel Module|Hunter-Killer:elite:3:Combat Module|Command Relay:scout:7|Juggernaut:giant:8',
'Coherent Pulse Arrays|Reactive Plating|Parallel Extraction|Distributed Coordination'],
['insects','Colony Insects','Kareth','#c59b5c','insect','Intelligent individuals organized into specialist castes. Resin armor, acid support and massed ground forces.',
'Queen Chamber:hq|Brood Mound:house|Nutrient Extractor:depot|Caste Nursery:inf|Soldier Warren:inf|Caste Research Chamber:lab|Pheromone Relay:lab|Resin Foundry:armor|Wing Hatchery:air|Royal Brood Chamber:elite|Acid Spire:defense',
'Worker Ant:worker:0|Scout Ant:scout:3|Soldier Ant:melee:4|Acid Spitter:rifle:3|Shield Termite:heavy:4|Warrior Lancer:aa:4|Sapper Termite:stealth:7|Winged Scout:fighter:8|Flying Stinger:gunship:8|Siege Termite:siege:9|Royal Guard:elite:9|Bombardier Caste:siege:7',
'Acid Glands|Reinforced Chitin|Caste Coordination|Siege Caste Development'],
['primates','Primates','Kareth','#ad9871','ape','Powerful infantry and practical craftsmanship. Javelins counter aircraft; stone siege breaks fortifications.',
'Great Lodge:hq|Communal Stores:house|Gathering Yard:depot|War Circle:inf|Hunting Grounds:inf|Toolsmith:lab|Stoneworks:armor|Powder Workshop:armor|Siege Yard:armor|Great War Council:elite|Cliff Watch:defense',
'Gatherer:worker:0|Runner:scout:4|Club Warrior:melee:3|Spear Warrior:aa:3|Slinger:rifle:4|Javelin Hunter:aa:4|Shieldback:heavy:3|Powder Gunner:rifle:7|Firepot Thrower:heavy:7|Battering Ram:tank:8|Heavy Catapult:siege:8|Silverback Champion:elite:9|Great Stone Thrower:giant:9',
'Balanced Throwing Arms|Forged Plate Harness|Cooperative Hauling|Torsion Engineering'],
['wizards','Wizards','Elyndra','#9297c5','wizard','A professional magical society. Separate academies develop healing, wards, transfiguration and offensive spells.',
'Wizarding Hall:hq|Wizarding Residences:house|Dueling Academy:inf|Charms Academy:lab|Potions Academy:support|Transfiguration Academy:armor|Magical Creatures Conservatory:armor|Broom Flight School:air|Grand Academy:elite|Ward Tower:defense',
'Apprentice Worker:worker:0|Familiar:scout:6|Spellguard:rifle:2|Duelist:melee:2|Healer:support:4|Hexer:aa:3|Wardbreaker:siege:3|Transfigurer:elite:5|Enchanted Golem:tank:5|Broom Rider:fighter:7|Magical Beast:heavy:6|Spell Artillery:siege:8|Grand Wizard:elite:8',
'Focused Evocation|Layered Wards|Object Levitation|Applied Transfiguration'],
['elders','Elder Races','Elyndra','#76ab85','elder','One alliance of five peoples. Guild combinations field elven archers, dwarven armor and runic siege.',
'High Council:hq|Guild Quarters:house|Resource Hall:depot|Mixed Barracks:inf|Dwarven Runeforge:lab|Elven Grove:inf|Orc War Hall:inf|Goblin Artifice Workshop:armor|Troll Hall:armor|Runic Transit Hub:air|Council of the Five:elite|Watchtower:defense',
'Goblin Worker:worker:0|Goblin Scout:scout:3|Dwarf Shieldbearer:heavy:3|Dwarf Crossbowman:rifle:3|Elf Archer:rifle:5|Elf Spellweaver:aa:5|Orc Warrior:melee:6|Orc Berserker:heavy:6|Goblin Sapper:stealth:7|Troll Brute:tank:8|Troll Siege Breaker:siege:8|Runic Siege Engine:siege:7|Advanced Dwarven Artillery:siege:10',
'Runic Weapon Binding|Mithril Lamination|Guild Conveyors|Runic Siege Engineering'],
['myth','Mythological Peoples','Elyndra','#c8b888','myth','A classical civilization of centaurs, satyrs, minotaurs and legendary beasts. Rites unlock heavier creatures.',
'Great Agora:hq|Storehouse:house|Sacred Resource Extractor:depot|Training Courtyard:inf|Labyrinth:armor|Oracle Temple:lab|Cyclops Quarry:armor|Harpy Aerie:air|Stone Circle:lab|Beast Sanctuary:armor|Great Pantheon:elite|Sentinel Statue:defense',
'Satyr Worker:worker:0|Centaur Scout:scout:3|Satyr Javelin Thrower:aa:3|Centaur Archer:rifle:3|Minotaur Guardian:heavy:4|Minotaur Champion:elite:4|Gorgon Seer:aa:5|Cyclops Stone Thrower:siege:6|Harpy Scout:fighter:7|Harpy Raider:gunship:7|Chimera:tank:9|Hydra:giant:10',
'Consecrated Blades|Bronze Aegis|Sacred Stewardship|Rites of the Pantheon'],
['dragons','Draconic Civilization','Elyndra','#b17d59','dragon','Kobolds and draconians defend a costly path to mighty dragons. Heavy creatures remain vulnerable to anti-armor weapons.',
'Hoard Throne:hq|Kobold Dens:house|Ember Well:depot|Scale Barracks:inf|Furnace Forge:lab|Hatchery:armor|Sky Roost:air|Treasure Vault:lab|Elder Lair:elite|Flame Tower:defense',
'Kobold Worker:worker:0|Kobold Scout:scout:3|Kobold Slinger:rifle:3|Draconian Spearman:aa:3|Draconian Flameguard:heavy:3|Drake:melee:5|Armored Drake:tank:5|Wyvern:fighter:6|Dragon Whelp:gunship:6|Dragon Sage:support:8|Mature Dragon:elite:6|Ancient Dragon:giant:8',
'Ember Sac Development|Obsidian Scales|Hoard Logistics|Elder Bloodline'],
['night','Night Kingdom','Morvane','#9b8eac','night','A modern gothic state: vampire marksmen, lycan assault troops, spectral support and armored industry.',
'Night Citadel:hq|Nocturnal Residences:house|Black Armory:lab|Vampire Military Academy:inf|Lycan Training Compound:inf|Blood Research Institute:lab|Revenant Laboratory:armor|Spectral Research Center:air|Night Foundry:armor|Elder Court:elite|Gothic Defense Tower:defense',
'Ghoul Laborer:worker:0|Vampire Operative:scout:3|Vampire Duelist:melee:3|Vampire Marksman:rifle:3|Lycan Tracker:scout:4|Lycan Assault Trooper:melee:4|Lycan Heavy Fighter:heavy:4|Blood Mage:support:5|Revenant Soldier:aa:6|Stitched Horror:tank:6|Ghost Scout:fighter:7|Wraith:gunship:7|Undead Knight:heavy:6|Ancient Vampire:elite:9|Nightbreaker Combat Vehicle:siege:8',
'Silver-Nitrate Munitions|Ballistic Weave|Nocturnal Industry|Hemogenic Stabilization'],
['infernal','Infernal Empire','Morvane','#bc7252','demon','Disciplined demon legions, hellforges and summoning rituals. Basic troops stay useful beneath costly greater demons.',
'Infernal Throne:hq|Cinder Pits:house|Soul Furnace:depot|Imp Warrens:inf|Legion Gate:inf|Hell Kennels:armor|Hellforge:lab|Gargoyle Roost:air|Sacrificial Altar:lab|Summoning Circle:armor|Abyssal Gate:elite|Ash Tower:defense',
'Imp Worker:worker:0|Imp Scout:scout:3|Imp Skirmisher:rifle:3|Demon Footsoldier:melee:4|Hellhound:melee:5|Flamecaster:aa:4|Infernal Guard:heavy:4|Gargoyle:fighter:7|Siege Fiend:siege:9|Tormentor:tank:9|Greater Demon:elite:10|Archdemon:giant:10',
'Hellfire Tempering|Basalt Carapace|Furnace Bellows|Greater Summoning'],
['symbiotes','Symbiotes','Fracture','#9da17e','fungal','One distributed intelligence operating many bodies. Biological kills provide Biomass for standardized reconstructed organisms.',
'Prime Heart:hq|Vein Colony:house|Digestive Pit:depot|Growth Pool:inf|Neural Lobe:lab|Reclamation Vat:counter|Graft Chamber:armor|Spore Canopy:air|Cortex Spire:elite|Spine Tower:defense',
'Harvester:worker:0|Prowler:scout:3|Talon:melee:3|Spore Dart:rifle:3|Listener:aa:4|Husk:melee:5|Stalker:heavy:5|Spitter:aa:5|Brute:tank:5|Carapace Beast:tank:6|Spore Flyer:gunship:7|Neural Binder:elite:8|Root Colossus:giant:8',
'Barbed Spore Evolution|Reinforced Tissue|Mycelial Transport|Advanced Neural Coordination']
];
const bstats={hq:[1000,2.4,260,40],house:[330,1.3,80,14],inf:[620,2,140,25],lab:[540,1.8,150,26],armor:[780,2.4,210,35],air:[620,2.3,200,35],elite:[900,2.6,260,45],defense:[420,1,110,22],depot:[420,1.5,80,18],support:[500,1.8,140,24],counter:[560,1.8,160,26]};
const factions={};
for(const [id,name,universe,color,style,description,bs,us,techText] of raw){
 const f={id,name,universe,color,style,description,buildings:[],units:[],research:[],extensions:[],counter:id==='reptilians'?'Captives':id==='symbiotes'?'Biomass':null};
 f.buildings=bs.split('|').map((s,i)=>{const[n,kind]=s.split(':'),[hp,size,ore,time]=bstats[kind];return{id:id+'_b'+i,name:n,kind,hp,size,time,cost:[ore,['armor','air','elite'].includes(kind)?45:0,kind==='elite'?60:0,0],requires:[]};});
 const inf=f.buildings.find(b=>b.kind==='inf').id, lab=f.buildings.find(b=>b.kind==='lab').id;
 for(const b of f.buildings){if(['armor','air','support','lab','counter'].includes(b.kind))b.requires=[inf];if(b.kind==='elite')b.requires=[lab,f.buildings.find(x=>x.kind==='armor').id];}
 f.units=us.split('|').map((s,i)=>{const[n,role,bi,extension]=s.split(':'),r=roles[role];const u={...r,cost:[...r.cost],id:id+'_u'+i,name:n,role,building:f.buildings[+bi].id,faction:id,variant:i,armor:r.armor||0,vision:r.vision||8,cooldown:r.cooldown||1.25,requires:[],research:null,extension:extension||null,biological:id!=='machines',special:0};if(['tank','siege','fighter','gunship','elite','giant'].includes(role))u.requires=[lab];if(['elite','giant'].includes(role)||n==='Main Battle Tank')u.research=id+'_advanced';if(['Mind-Jacked Thrall','Thrall Enforcer','Husk','Stalker','Spitter','Brute'].includes(n)){u.special=role==='tank'?4:role==='heavy'?2:1;u.cost=[25,0,0,0];u.reconstructed=true;} if(id==='dragons'&&['Mature Dragon','Ancient Dragon'].includes(n)){u.air=true;u.aa=true;}if(/War-Beast|Drake|Hydra|Chimera|Brute|Golem|Horror|Dragon|Fiend|Colossus/.test(n))u.armored=role==='tank'||role==='giant';return u;});
 for(const u of f.units.filter(u=>u.extension)){if(!f.extensions.find(e=>e.name===u.extension&&e.building===u.building))f.extensions.push({id:id+'_x'+f.extensions.length,name:u.extension,building:u.building,cost:[90,35,0,0],time:22});}
 const tn=techText.split('|');
 for(let n=1;n<=3;n++)for(const [k,idx] of [['weapons',0],['armor',1]]) f.research.push({id:id+'_'+k+n,name:tn[idx]+' '+['','I','II','III'][n],building:lab,cost:[90*n,25*n,15*n,n===3?20:0],time:24*n,kind:k,level:n,requires:n>1?[id+'_'+k+(n-1)]:[]});
 f.research.push({id:id+'_economy',name:tn[2],building:lab,cost:[110,30,20,0],time:30,kind:'economy',requires:[]});
 f.research.push({id:id+'_advanced',name:tn[3],building:lab,cost:[170,60,75,20],time:45,kind:'advanced',requires:[]});
 const support=f.buildings.find(b=>b.kind==='support');if(support)f.research.push({id:id+'_healing',name:'Restorative Enchantments',building:support.id,cost:[70,0,50,0],time:20,kind:'healing',requires:[]});
 for(const r of ['ore','oil','aether','rift'])f.buildings.push({id:id+'_'+r+'well',name:({ore:'Ore collection station',oil:'Lastrian extraction well',aether:'Aetherite mine',rift:'Rift observatory'})[r],kind:'extractor',resource:r,hp:420,size:1.25,time:18,cost:[r==='oil'?80:65,0,0,0],requires:[]});

 // Specialist research belongs to its own production branch, not a global age menu.
 const branchNames={industrial:['Combined-Arms Drill','Stabilized Turrets','External Fuel Tanks'],reptile:['Legion Discipline','Predator Targeting','Thermal Soaring'],machine:['Parallel Fabrication','Predictive Fire Control','High-Density Capacitors'],insect:['Caste Cohesion','Bombardier Optics','Wing Musculature'],ape:['War-Circle Training','Counterweight Engineering','Cliff Reconnaissance'],wizard:['Practical Dueling','Long-Form Invocation','Broom Endurance Charms'],elder:['Council Drills','Rune-Sighted Weapons','Transit Attunement'],myth:['Courtyard Discipline','Far-Sight Oracles','Aerial Endurance Rites'],dragon:['Clutch Training','Focused Flame Glands','High-Altitude Lungs'],night:['Night Operations','Spectral Targeting','Ectoplasmic Stability'],demon:['Legion Mustering','Hellfire Focus','Gargoyle Endurance'],fungal:['Synchronous Growth','Neural Trajectory Mapping','Spore Membrane Efficiency']};
 const bn=branchNames[style];
 for(const b of f.buildings){const index=b.kind==='inf'?0:b.kind==='armor'?1:b.kind==='air'?2:-1;if(index<0)continue;f.research.push({id:b.id+'_specialization',name:bn[index],building:b.id,cost:[100,35,index===0?15:40,0],time:32,kind:['training','range','endurance'][index],requires:[]});}
 for(const u of f.units){if(['Armored Drake','Dragon Whelp','Ancient Dragon','Spore Flyer','Root Colossus'].includes(u.name))u.bonus='building';if(u.name==='Infantry Fighting Vehicle'){u.hp=270;u.damage=23;u.range=4.8;u.speed=1.65;u.armor=3;u.pop=3;u.cost=[125,45,0,0];}if(id==='humans'&&['tank','siege','fighter','gunship'].includes(u.role)||/Imperial Tank|Siege Walker|Battering Ram|Heavy Catapult|Runic Siege Engine|Dwarven Artillery|Combat Vehicle|Enchanted Golem/.test(u.name))u.biological=false;if(['wizard','elder','myth','dragon','demon','fungal'].includes(style)&&u.cost[1]>0){const converted=Math.round(u.cost[1]*.45);u.cost[1]-=converted;u.cost[2]+=converted;}}
 factions[id]=f;
}
// Claws, mauls and shields must not inherit the ranged weapon of a generic stat role.
const closeCombat=new Set(['Lycan Tracker','Lycan Heavy Fighter','Armored Drake','War-Beast','Stitched Horror','Minotaur Guardian','Minotaur Champion','Shieldback','Silverback Champion','Dwarf Shieldbearer','Orc Berserker','Troll Brute','Enchanted Golem','Magical Beast','Chimera','Hellhound','Infernal Guard','Husk','Stalker','Carapace Beast','Battering Ram','Undead Knight']);
for(const f of Object.values(factions))for(const u of f.units)if(closeCombat.has(u.name)){u.range=1.05;u.aa=false;u.airOnly=false;}
const units=Object.fromEntries(Object.values(factions).flatMap(f=>f.units).map(u=>[u.id,u]));
const buildings=Object.fromEntries(Object.values(factions).flatMap(f=>f.buildings).map(b=>[b.id,b]));
const research=Object.fromEntries(Object.values(factions).flatMap(f=>f.research).map(r=>[r.id,r]));
const extensions=Object.fromEntries(Object.values(factions).flatMap(f=>f.extensions).map(e=>[e.id,e]));
root.FD={resources,roles,factions,units,buildings,research,extensions,version:'0.1 — First Contact'};
const expansion=root.FractureExpansionData||(typeof require!=='undefined'?require('./expansion-data.js'):null);if(expansion)expansion.apply(root.FD);
const combat=root.FractureCombat||(typeof require!=='undefined'?require('./combat.js'):null);if(combat)combat.apply(root.FD);
if(typeof module!=='undefined')module.exports=root.FD;
})(globalThis);
