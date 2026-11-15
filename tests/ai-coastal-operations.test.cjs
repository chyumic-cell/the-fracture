const assert=require('node:assert/strict'),D=require('../src/data'),{Game}=require('../src/simulation'),A=require('../src/ai'),C=require('../src/ai-domain-combat'),L=require('../src/ai-logistics');
function coast(faction='humans',difficulty='standard'){
 const g=new Game({size:64,seed:17,factions:[faction,'humans'],difficulty});g.entities=[];g.players.forEach(p=>{p.ai=false;p.stock=[0,0,0,0];p.knowledge={}});for(let y=0;y<64;y++)for(let x=0;x<64;x++)Object.assign(g.tile(x,y),{water:x<35,height:0});const p=g.players[0];p.home={x:5,y:55};g.spawnBuilding(faction+'_b0',0,5,55,true);g.spawnBuilding('humans_b0',1,58,58,true);const target=g.spawnBuilding('humans_b2',1,41,28,true),ship=g.spawnUnit(faction+'_siege_ship',0,10,28);g.spawnUnit(faction+'_transport_ship',0,6,50);g.rebuildNav();g.updateVision();p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>t.water?128:0));p.knowledge[target.id]={...target};g.time=300;return{g,p,ship,target};
}
for(const faction of Object.keys(D.factions)){
 const {g,p,ship,target}=coast(faction);let ctx=A.context(g,p);assert(C.bombard(g,p,ship,ctx),faction+' never planned a firing position');assert.equal(ship.order.kind,'move');assert(!g.blocked(ship.order.x,ship.order.y,'water',0));assert(Math.hypot(ship.order.x-target.x,ship.order.y-target.y)<=g.attackReach(ship,target));assert(Math.hypot(ship.order.x-6,ship.order.y-50)>15,'must not follow an empty transport');
 const hp=target.hp;for(let i=0;i<500&&target.hp===hp;i++){g.tick(.15);if(i%10===0)C.bombard(g,p,ship,A.context(g,p));}assert(target.hp<hp,faction+' must physically navigate and damage the coastal target');
}
console.log('PASS all twelve factions physically bombard coast targets with unchanged weapons');
{
 const {g,p,ship,target}=coast('humans','relaxed');assert.equal(C.bombard(g,p,ship,A.context(g,p)),false);assert(!ship.aiBombardment);
}
console.log('PASS Relaxed controller remains unchanged');
{
 const {g,p,ship,target}=coast();p.knowledge={};p.visible.fill(0);assert.equal(C.bombard(g,p,ship,A.context(g,p)),false);assert(!ship.order);
}
console.log('PASS hidden coastal buildings cannot create bombardment missions');
{
 const {g,p,ship,target}=coast();for(let y=0;y<64;y++)for(let x=20;x<24;x++)g.tile(x,y).water=false;g.rebuildNav();p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>t.water?128:0));assert.equal(C.bombard(g,p,ship,A.context(g,p)),false);
}
console.log('PASS disconnected waterways cannot produce a false bombardment route');
