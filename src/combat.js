'use strict';
(function(root){
function category(d,building=false){if(building||d.kind)return'building';if(d.worker)return'worker';if(d.weaponRole==='ram')return'breacher';if(d.air)return'air';if(d.naval)return'ship';if(d.role==='giant')return d.biological?'creature':'vehicle';if(d.biological&&d.role==='tank')return'creature';if(d.role==='siege')return'artillery';if(d.armored||d.role==='tank')return'vehicle';if(d.role==='heavy'||d.role==='elite')return'heavy';return d.range<1.2?'melee':'ranged';}
const matrix={
 worker:{building:.25,vehicle:.3,heavy:.5,creature:.4},
 melee:{building:.55,ranged:1.55,artillery:1.75,vehicle:.45,heavy:.8,creature:.65,breacher:1.5},
 ranged:{building:.3,melee:1.1,heavy:.7,vehicle:.35,creature:.65,breacher:.35},
 heavy:{building:.65,melee:1.35,ranged:1.1,vehicle:.6,creature:.9,breacher:1.35},
 vehicle:{building:1.45,melee:1.15,ranged:1.25,heavy:1.3,artillery:1.4,creature:1.2,breacher:1.5},
 artillery:{building:2,melee:1.35,ranged:1.4,heavy:1.15,vehicle:.8,creature:1.05,breacher:1.2},
 breacher:{building:2.2,worker:.25,melee:.2,ranged:.2,heavy:.25,vehicle:.35,artillery:.4,creature:.35,breacher:.4},
 creature:{building:1.8,melee:1.3,ranged:1.25,heavy:1.2,vehicle:1.1,breacher:1.5},
 air:{building:.65,melee:1.1,ranged:1.1,vehicle:.9,artillery:1.4,breacher:1.4},
 building:{building:.4,vehicle:.65,creature:.8,breacher:.3}
};
const shipMatrix={scout:{ship:.55,building:.3,melee:1.1,ranged:1.1,heavy:.7,vehicle:.45,creature:.6,artillery:1},escort:{air:2,ship:.65,building:.3,melee:.8,ranged:.8,heavy:.7,vehicle:.7,creature:.7,artillery:.9},warship:{ship:1.45,building:1.45,melee:1.1,ranged:1.25,heavy:1.1,vehicle:1.1,creature:1.1,artillery:1.1},siege:{ship:.8,building:2,melee:1.35,ranged:1.4,heavy:1.15,vehicle:.8,artillery:1.1}};
for(const [c,m]of Object.entries({worker:.25,melee:.45,ranged:.35,heavy:.5,vehicle:1,artillery:.8,breacher:.2,creature:1,air:1.3,building:.65}))matrix[c].ship=m;
const bonusScale={building:1.4,armor:1.35,light:1.3,air:1.35};
function bonusApplies(bonus,target,targetBuilding=false){const c=category(target,targetBuilding);return bonus==='building'?c==='building':bonus==='armor'?c!=='building'&&!target.air&&(target.armored||target.armor>=3||c==='vehicle'||c==='breacher'):bonus==='light'?['worker','melee','ranged'].includes(c)&&!target.naval&&(target.armor||0)<3:bonus==='air'?!!target.air:false;}
function multiplier(attacker,target,targetBuilding=false){const a=category(attacker),b=category(target,targetBuilding);let m=matrix[a]?.[b]??1;
 if(attacker.role==='scout'&&!attacker.air&&!attacker.naval&&b==='artillery')m=2.4;
 if(attacker.role==='aa'&&!attacker.naval)m=({air:2,vehicle:1.65,creature:1.6,building:.3,melee:.6,ranged:.65,heavy:.9,artillery:.9,breacher:1.65,ship:.9})[b]??1;
 if(attacker.naval&&shipMatrix[attacker.navalRole])m=shipMatrix[attacker.navalRole][b]??1;
 if(attacker.airOnly&&b==='air')m=1.35;
 if(bonusApplies(attacker.bonus,target,targetBuilding))m*=bonusScale[attacker.bonus];
 return m;
}
const targets=[
 ['Unarmored workers',{worker:true,role:'worker',range:.75,armor:0}],
 ['Light melee infantry',{role:'melee',range:1,armor:0}],
 ['Ranged infantry',{role:'rifle',range:5,armor:0}],
 ['Heavy infantry',{role:'heavy',range:1,armor:3}],
 ['Armored vehicles & constructs',{role:'tank',range:5,armored:true,biological:false,armor:6}],
 ['Warships',{naval:true,navalRole:'warship',role:'tank',range:7,armor:5}],
 ['Artillery',{role:'siege',range:10,armor:0}],
 ['Large armored creatures',{role:'tank',range:1,biological:true,armored:true,armor:6}],
 ['Battering rams',{role:'tank',range:1,weaponRole:'ram',armor:6}],
 ['Aircraft & flying creatures',{role:'gunship',range:5,air:true,armor:0}],
 ['Buildings & walls',{kind:'house',armor:2}]
];
function matchups(d){if(!d.damage||d.worker)return[];return targets.filter(([,t])=>(!t.air||d.aa)&&(!d.airOnly||t.air)).map(([label,t])=>({label,multiplier:multiplier(d,t,!!t.kind)}));}
function describe(d){if(!d.damage||d.worker)return'';let text='';
 if(d.weaponRole==='ram')text='Breaching engine: powerful against buildings and walls, with very low damage against troops. Needs an escort against melee attackers and armor.';
 else if(d.role==='siege'&&d.naval)text='Long-range coastal bombardment against buildings and grouped ground troops. Vulnerable to aircraft and faster warships.';
 else if(category(d)==='artillery')text='Long-range bombardment against buildings and grouped infantry. Splash rewards clustered targets; fast infantry and scouts are dangerous once they close the distance.';
 const table=matchups(d),strong=table.filter(t=>t.multiplier>=1.15).map(t=>t.label.toLowerCase()),poor=table.filter(t=>t.multiplier<.8).map(t=>t.label.toLowerCase());
 function compact(list){const infantry=['light melee infantry','ranged infantry','heavy infantry'];if(infantry.every(x=>list.includes(x)))return ['infantry',...list.filter(x=>!infantry.includes(x))];return list;}
 if(strong.length)text+=(text?'\n':'')+'Effective against: '+compact(strong).join(', ')+'.';
 if(poor.length)text+='\nReduced damage against: '+(d.weaponRole==='ram'?'all ground units':compact(poor).join(', '))+'.';
 if(d.bonus)text+='\nWeapon bonus: +'+Math.round((bonusScale[d.bonus]-1)*100)+'% damage against '+({building:'buildings and walls',armor:'armored ground units',light:'lightly armored infantry and workers',air:'aircraft and flying creatures'})[d.bonus]+'.';
 const threat=d.naval?(d.navalRole==='escort'?'Warships and coastal artillery':'Warships and air attacks'):d.role==='aa'?'Close-range infantry and concentrated artillery':({breacher:'Melee troops, armor and air attacks',artillery:'Fast melee troops, scouts and air attacks',air:'Anti-air units and interceptors',vehicle:'Armor-piercing specialists',creature:'Armor-piercing specialists',melee:'Heavy infantry and armored vehicles',ranged:'Melee attackers, artillery and armored vehicles',heavy:'Armored vehicles and massed artillery'})[category(d)];if(threat)text+='\nThreats: '+threat+'.';
 if(d.minRange)text+='\nMinimum firing distance: '+d.minRange+' tiles. Protect it from enemies inside that distance.';
 if(!d.aa)text+='\nCannot attack flying targets.';
 if(d.airOnly)text+='\nAttacks flying targets only.';
 return text.trim();
}
function apply(D){for(const b of Object.values(D.buildings)){b.hp=Math.round(b.hp*(b.kind==='hq'?2.4:b.kind==='defense'?2.3:1.8));b.armor=b.kind==='wall'?6:b.kind==='trap'?0:b.kind==='hq'?5:b.kind==='defense'?4:2;if(['hq','defense'].includes(b.kind)){b.damage=b.kind==='hq'?14:23;b.range=b.kind==='hq'?7:8;b.cooldown=b.kind==='hq'?1.8:1.5;b.aa=true;}}
 for(const u of Object.values(D.units)){
  if(u.name==='Battering Ram'){u.weaponRole='ram';u.bonus='building';u.description='Armored close-range siege engine for breaching buildings and walls. Slow and ineffective against troops; escort it.';}
  if(u.name==='Infantry Fighting Vehicle')u.bonus='light';
  if(u.name==='Firepot Thrower')u.splash=.85;
  if(u.name==='Goblin Sapper'){u.splash=.85;u.bonus='light';u.description='Concealed firepot skirmisher against grouped infantry. Fragile and ineffective against armored enemies.';}
  if(['Harpy Raider','Flying Stinger'].includes(u.name))u.splash=0;
  if(u.role==='siege'&&u.range>=8&&!u.air)u.minRange=2.5;
  u.combatClass=category(u);
 }
}
root.FractureCombat={category,multiplier,bonusApplies,bonusScale,apply,matrix,matchups,describe};if(typeof module!=='undefined')module.exports=root.FractureCombat;
})(globalThis);
