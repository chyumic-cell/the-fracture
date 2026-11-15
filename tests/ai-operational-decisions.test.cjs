"use strict";
const assert=require('node:assert/strict'),D=require('../src/data'),{Game}=require('../src/simulation'),A=require('../src/ai'),C=require('../src/ai-combat');
function arena(){const g=new Game({size:64,seed:42,factions:['humans','humans'],difficulty:'apocalypse'});g.entities=[];g.map.forEach(t=>Object.assign(t,{water:false,height:0}));g.players.forEach(p=>{p.ai=false;p.knowledge={}});g.players[0].home={x:12,y:20};g.spawnBuilding('humans_b0',0,12,20,true);g.spawnBuilding('humans_b0',1,58,58,true);g.time=220;return g;}
function chart(g){g.rebuildNav();g.updateVision();for(const p of g.players){p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>(t.water?128:0)|t.height))}}
function rifle(g,owner,x,y){return g.spawnUnit('humans_u2',owner,x,y)}
{
 const g=arena(),p=g.players[0],u=rifle(g,0,30,30),bait=g.spawnUnit('humans_u0',1,36.4,30),tower=g.spawnBuilding('humans_b7',1,39.5,30,true);chart(g);g.order([u.id],{kind:'attackMove',x:50,y:30});C.step(g,p,A.context(g,p));assert.equal(u.order.kind,'hold','isolated soldier must not follow bait into visible tower fire');
 // Hidden defensive structures must not influence the controller.
 const visible=g.visible.bind(g);g.visible=(owner,e)=>e.id===tower.id?false:visible(owner,e);g.time+=2;C.step(g,p,A.context(g,p));assert.equal(u.order.target,bait.id);console.log('PASS controlled pursuit uses visible defenses, never hidden towers');
}
{
 const g=arena(),p=g.players[0],u=rifle(g,0,30,30),bait=g.spawnUnit('humans_u0',1,36.4,30);g.spawnBuilding('humans_b7',1,39.5,30,true);chart(g);g.order([u.id],{kind:'attackMove',x:50,y:30});C.step(g,p,A.context(g,p));assert.equal(u.order.kind,'hold');bait.x=55;g.time+=2;C.step(g,p,A.context(g,p));assert.equal(u.order.kind,'attackMove');assert.equal(u.order.x,50);console.log('PASS a temporary pursuit hold resumes the original advance when the contact leaves');
}
{
 const g=arena(),p=g.players[0],u=rifle(g,0,30,30),bait=g.spawnUnit('humans_u0',1,36.4,30);g.spawnBuilding('humans_b7',1,39.5,30,true);for(let i=0;i<10;i++)g.spawnUnit('humans_u6',0,29+i*.1,31);chart(g);C.step(g,p,A.context(g,p));assert.equal(u.order.target,bait.id);console.log('PASS overwhelming nearby support permits pursuit rather than blanket passivity');
}
{
 const g=arena(),p=g.players[0],troops=Array.from({length:12},(_,i)=>rifle(g,0,42+i*.1,38)),reserves=[rifle(g,0,19,20),rifle(g,0,20,21)];rifle(g,1,23,20);chart(g);const target=A.context(g,p).targets.find(t=>t.type==='humans_b0');p.operation={ids:troops.map(u=>u.id),initial:20,phase:'advance',changed:g.time,rally:{x:30,y:30},target,flank:[]};
 for(let i=0;i<3;i++){C.step(g,p,A.context(g,p));g.time+=2;assert.equal(p.operation.initial,20);assert.equal(p.operation.ids.length,12);assert(p.defenseIds.every(id=>reserves.some(u=>u.id===id)));}console.log('PASS local reserves answer raids without repeatedly shrinking offensive casualty accounting');
}
{
 const g=arena(),p=g.players[0];for(let i=0;i<12;i++)rifle(g,0,30+i*.1,30);const strong=g.spawnBuilding('humans_b2',1,50,30,true),soft=g.spawnBuilding('humans_b2',1,45,42,true);for(let i=0;i<5;i++)g.spawnBuilding('humans_b7',1,49+i,28,true);chart(g);const ctx=A.context(g,p);p.operation={ids:ctx.military.map(u=>u.id),initial:12,phase:'advance',changed:g.time,rally:{x:30,y:30},target:{id:strong.id,x:strong.x,y:strong.y},flank:[]};C.step(g,p,ctx);assert.equal(p.operation.target.id,soft.id);assert(p.operation.ids.length===12);console.log('PASS a fortified objective is replaced with a reachable vulnerable production target');
}

{
 const g=arena(),p=g.players[0];for(let i=0;i<12;i++)rifle(g,0,30+i*.1,30);const strong=g.spawnBuilding('humans_b2',1,50,30,true),hidden=g.spawnBuilding('humans_b2',1,45,42,true);for(let i=0;i<5;i++)g.spawnBuilding('humans_b7',1,49+i,28,true);chart(g);const visible=g.visible.bind(g);g.visible=(owner,e)=>e.id===hidden.id?false:visible(owner,e);p.knowledge={};const ctx=A.context(g,p);p.operation={ids:ctx.military.map(u=>u.id),initial:12,phase:'advance',changed:g.time,rally:{x:30,y:30},target:{id:strong.id,x:strong.x,y:strong.y},flank:[]};C.step(g,p,ctx);assert.equal(p.operation.target.id,strong.id);console.log('PASS reassessment cannot discover an unobserved vulnerable production building');
}
{
 const g=arena(),p=g.players[0],u=rifle(g,0,30,30),bait=g.spawnUnit('humans_u0',1,36.4,30);g.spawnBuilding('humans_b7',1,39.5,30,true);chart(g);g.order([u.id],{kind:'attackMove',x:50,y:30});C.step(g,p,A.context(g,p));const saved=Game.restore(g.serialize()),restored=saved.entity(u.id);assert.equal(restored.aiPursuitHeld,true);assert.equal(restored.aiPursuitResume.x,50);console.log('PASS temporary pursuit orders are preserved by save serialization');
}

{
 const g=arena(),p=g.players[0],u=rifle(g,0,30,30);g.spawnUnit('humans_u0',1,36.4,30);g.spawnBuilding('humans_b7',1,39.5,30,true);chart(g);g.players[1].visible.fill(0);g.order([u.id],{kind:'attackMove',x:50,y:30});C.step(g,p,A.context(g,p));assert.equal(u.order.kind,'hold');console.log('PASS pursuit assessment does not read the opponent private vision map');
}
