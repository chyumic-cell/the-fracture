'use strict';
const assert=require('node:assert/strict'),D=require('../src/data'),P=require('../src/projectiles'),C=require('../src/combat'),{Game}=require('../src/simulation');
function arena(f){const g=new Game({size:64,seed:42,factions:[f,f]});g.entities=[];g.players.forEach(p=>p.ai=false);g.map.forEach(t=>Object.assign(t,{water:false,height:0}));g.spawnBuilding(f+'_b0',0,8,8,true);g.spawnBuilding(f+'_b0',1,55,55,true);return g;}
for(const f of Object.values(D.factions)){
 const d=D.units[f.id+'_bomber'];assert(d.bomber);const shot=P.profile(d,f);assert.equal(shot.kind,'bomb',f.id);assert.deepEqual(shot.muzzle,{x:0,y:0,z:9});assert.equal(shot.arc,0);
 const g=arena(f.id),b=g.spawnUnit(d.id,0,30,30),target=g.spawnBuilding(f.id+'_b1',1,34,30,true),near=g.spawnUnit(f.units.find(u=>u.worker).id,1,34,30.9),friend=g.spawnUnit(f.units.find(u=>u.worker).id,0,34,30.7);
 b.cooldown=100;g.rebuildNav();g.updateVision();const hp=target.hp,other=near.hp,own=friend.hp;
 g.strike(b,target);assert.equal(b.bombs,1);assert.equal(g.projectiles[0].weapon,'bomb');assert(g.projectiles[0].flight>=.65);assert.equal(target.hp,hp,'Damage arrived before the bomb');
 const flight=g.projectiles[0].flight;for(let t=0;t<flight+.05;t+=.05)g.tick(.05);
 assert(target.hp<hp,f.id+' bomb did no damage');assert(near.hp<other,f.id+' bomb had no area damage');assert.equal(friend.hp,own,'Bomb damaged a friendly');assert(g.effects.some(e=>e.projectileKind==='bomb'));
 g.strike(b,target);assert.equal(b.bombs,0);assert(b.returning,'Empty bomber must return to rearm');
}
assert.equal(D.units.humans_bomber.name,'Bomber');
{
 const g=arena('humans'),b=g.spawnUnit('humans_bomber',0,30,30),u=g.spawnUnit('humans_u0',1,34,30);b.cooldown=100;g.rebuildNav();g.updateVision();
 g.strike(b,u);const hp=u.hp,shot=g.projectiles[0];u.x=45;u.y=45;
 for(let t=0;t<1;t+=.05)g.tick(.05);
 assert.equal(shot.toX,34,'A falling bomb must not home in on a moving target');assert.equal(shot.toY,30);assert.equal(u.hp,hp,'The target moved outside the blast');
}
console.log('PASS all twelve bomber equivalents drop explosive bombs, splash only enemies, miss escaped targets and return to rearm');
