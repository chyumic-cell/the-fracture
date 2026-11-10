'use strict';
const assert=require('node:assert/strict'),D=require('../src/data.js'),{Game,dist}=require('../src/simulation.js');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
const named=name=>Object.values(D.units).find(d=>d.name===name),humanBuilding=kind=>D.factions.humans.buildings.find(d=>d.kind===kind);
function arena(faction='symbiotes'){
 const g=new Game({factions:[faction,'humans'],size:48,seed:42});g.players.forEach(p=>p.ai=false);g.entities=[];g.map.forEach(t=>{t.height=0;t.water=false;});
 g.spawnBuilding(D.factions[faction].buildings[0].id,0,5,5,true);g.spawnBuilding(humanBuilding('hq').id,1,42,42,true);return g;
}
function chart(g){g.rebuildNav();g.updateVision();for(const p of g.players){p.explored.fill(1);p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>(t.water?128:0)|t.height));}}
function run(g,seconds,step=.05){for(let i=0;i<Math.ceil(seconds/step);i++)g.tick(step);}
function duel(name='Spore Dart',kind='hq',angle=0,alignment=0,startGap=4.6){
 const d=named(name),g=arena(d.faction),b=g.spawnBuilding(humanBuilding(kind).id,1,24+alignment,24+alignment,true);b.hp=b.maxHp=100000;
 if(d.naval)g.map.forEach((t,i)=>{const x=i%g.n+.5,y=Math.floor(i/g.n)+.5;t.water=Math.hypot(x-b.x,y-b.y)>b.size+.7&&Math.hypot(x-5,y-5)>4&&Math.hypot(x-42,y-42)>4;});
 const r=b.size+startGap,u=g.spawnUnit(d.id,0,b.x+Math.cos(angle)*r,b.y+Math.sin(angle)*r);chart(g);g.order([u.id],{kind:'attack',target:b.id});return{g,u,b,d};
}
function ready(){const x=duel('Spore Dart','hq',0,0,2.5);x.g.tick(.05);assert(x.u.windup&&!x.u.windup.fired);x.g.tick(.15);let shots=0;const strike=x.g.strike.bind(x.g);x.g.strike=(u,t)=>{if(u.id===x.u.id&&t.id===x.b.id)shots++;strike(u,t);};x.shots=()=>shots;return x;}

test('Every ground-capable damaging roster unit can complete a manual building attack',()=>{
 const failures=[];let sampled=0;for(const f of Object.values(D.factions))for(const d of f.units){if(!d.damage||d.airOnly)continue;for(const kind of ['house','hq']){const angle=(sampled%8)*Math.PI/4,{g,u,b}=duel(d.name,kind,angle,sampled%2*.5);run(g,12);if(b.hp===b.maxHp)failures.push({unit:d.name,building:kind,angle:sampled%8,at:[u.x,u.y],distance:dist(u,b),reach:g.range(u)+b.size,action:u.action});sampled++;}}
 assert.equal(failures.length,0,JSON.stringify({sampled,failures:failures.slice(0,16)}));console.log('  '+sampled+' roster/building combinations');
});

test('Symbiote melee approaches work at every bearing and both grid alignments',()=>{
 const failures=[];let sampled=0;for(const name of ['Talon','Husk','Stalker','Carapace Beast'])for(const kind of ['house','lab','inf','hq'])for(const alignment of [0,.5])for(let dir=0;dir<8;dir++){
 const {g,u,b}=duel(name,kind,dir*Math.PI/4,alignment);run(g,10);if(b.hp===b.maxHp)failures.push({name,kind,alignment,dir,distance:dist(u,b),reach:g.range(u)+b.size});sampled++;}
 assert.equal(failures.length,0,JSON.stringify({sampled,failures:failures.slice(0,16)}));console.log('  '+sampled+' melee approach combinations');
});

test('A crowded melee group surrounding a structure makes sustained attacks',()=>{
 const g=arena(),b=g.spawnBuilding(humanBuilding('hq').id,1,24,24,true);b.hp=b.maxHp=100000;const us=[];for(let i=0;i<24;i++){const a=i*Math.PI/12,r=b.size+3.2+(i%2)*.7;us.push(g.spawnUnit(named(i%2?'Husk':'Talon').id,0,b.x+Math.cos(a)*r,b.y+Math.sin(a)*r));}chart(g);g.order(us.map(u=>u.id),{kind:'attack',target:b.id});const hitters=new Set(),strike=g.strike.bind(g);g.strike=(u,t)=>{hitters.add(u.id);strike(u,t);};run(g,20);assert(b.maxHp-b.hp>100);assert(hitters.size>=8,'Only '+hitters.size+' of 24 attackers could reach the building');
});

test('A mixed army clustered around an enemy base damages defenders and the structure',()=>{
 const g=arena(),b=g.spawnBuilding(humanBuilding('hq').id,1,24,24,true);b.hp=b.maxHp=100000;const enemy=g.spawnUnit(named('Engineer').id,1,29,25);enemy.hp=enemy.maxHp=500;
 const names=['Talon','Husk','Stalker','Carapace Beast','Spore Dart','Listener','Spitter','Brute','Neural Binder','Root Colossus'],us=[];
 for(let i=0;i<24;i++){const a=i*Math.PI/12,r=6.2+(i%2)*.6;us.push(g.spawnUnit(named(names[i%names.length]).id,0,24+Math.cos(a)*r,24+Math.sin(a)*r));}
 chart(g);g.order(us.map(u=>u.id),{kind:'attackMove',x:b.x,y:b.y,formation:'line'});const attackers=new Set(),strike=g.strike.bind(g);g.strike=(u,t)=>{attackers.add(g.range(u)<1.2?'melee':'ranged');strike(u,t);};run(g,20);
 assert(enemy.hp<enemy.maxHp,'The mixed army never damaged an enemy unit');assert(b.maxHp-b.hp>100,'The mixed army never damaged the enemy structure');assert(attackers.has('melee')&&attackers.has('ranged'),'Both melee and ranged units should participate');
});
test('Repeated orders for the same attack target do not cancel weapon release',()=>{
 const {g,u,b,shots}=ready();for(let i=0;i<120;i++){g.order([u.id],{kind:'attack',target:b.id});g.tick(.05);}assert(shots()>=3&&b.hp<b.maxHp,'Repeated same-target attack orders prevented sustained fire');
});

test('Attack-move, patrol and Hold preserve an already committed shot',()=>{
 for(const kind of ['attackMove','patrol','hold']){const {g,u,b}=ready(),time=u.windup.time,cooldown=u.cooldown;g.order([u.id],{kind,x:b.x+2,y:b.y+2});assert(u.windup&&!u.windup.fired,kind+' lost its active shot');assert(u.windup.time<=time+1e-9,kind+' restarted its wind-up');assert.equal(u.cooldown,cooldown,kind+' changed cooldown');run(g,.75);assert(b.hp<b.maxHp,kind+' never released its committed shot');}
});

test('Frequent AI-style attack-move refreshes cannot suppress fire',()=>{
 const {g,u,b,shots}=ready();for(let i=0;i<160;i++){if(i%4===0)g.order([u.id],{kind:'attackMove',x:b.x,y:b.y});g.tick(.05);}assert(shots()>=4&&b.hp<b.maxHp,'Repeated combat movement orders suppressed attacks');
});

test('Move and Stop deliberately cancel pending shots; Stop then permits reacquisition',()=>{
 for(const kind of ['move','stop']){const {g,u,b}=ready(),before=b.hp;g.order([u.id],kind==='move'?{kind,x:u.x+5,y:u.y+4}:{kind});assert(!u.windup,kind+' kept an unfired shot');assert.equal(g.projectiles.length,0);if(kind==='move'){run(g,1);assert.equal(b.hp,before);assert(u.x>b.x+4.9);}else{assert(!u.order,'Stop should clear the old attack order');run(g,3);assert(b.hp<before,'Stopped unit did not defend itself after canceling its prior command');}}
});

test('An explicit different target cancels the old wind-up and attacks the new target',()=>{
 const {g,u,b}=ready(),other=g.spawnBuilding(humanBuilding('house').id,1,u.x+1,u.y+3,true);other.hp=other.maxHp=10000;chart(g);g.order([u.id],{kind:'attack',target:other.id});assert(!u.windup||u.windup.target!==b.id,'Old target kept its committed shot');run(g,3);assert.equal(b.hp,b.maxHp,'Canceled target still took damage');assert(other.hp<other.maxHp,'Explicit replacement target was ignored');
});

test('Patrol engages an enemy on its route and resumes patrol after the kill',()=>{
 const g=arena('humans'),d=named('Rifleman'),u=g.spawnUnit(d.id,0,14,20),enemy=g.spawnUnit(named('Engineer').id,1,17,20);enemy.hp=1;chart(g);g.order([u.id],{kind:'patrol',x:25,y:20});run(g,4);assert(enemy.hp<=0,'Patrol ignored an enemy beside the route');assert.equal(u.order?.kind,'patrol');const x=u.x;run(g,2);assert(u.x>x+.5,'Patrol did not resume movement after combat');
});

test('An AI flank aimed at a worker or support entity remains an attack-move order',()=>{
 for(const name of ['Engineer','Medic']){const g=arena('humans'),d=named('Rifleman'),main=g.spawnUnit(d.id,0,18,18),wing=g.spawnUnit(d.id,0,18,21),soft=g.spawnUnit(named(name).id,1,25,21);soft.hp=soft.maxHp=10000;chart(g);
 const p=g.players[0];p.operation={ids:[main.id,wing.id],initial:2,phase:'advance',changed:g.time,rally:{x:18,y:20},target:{x:32,y:25},flank:[wing.id],side:{x:18,y:21},flankCommitted:false};
 assert(g.operationStep(p,[soft]));assert(p.operation.flankCommitted);assert.equal(wing.order?.kind,'attackMove',name+' entity kind replaced the combat order');assert.equal(wing.order.x,soft.x);assert.equal(wing.order.y,soft.y);const before=dist(wing,soft);run(g,1.2);assert(dist(wing,soft)<before-.75,name+' flank did not approach its target');run(g,3);assert(soft.hp<soft.maxHp,name+' flank did not engage after approaching');}
});
test('Zero-damage support units do not begin attacks against a manually selected enemy',()=>{
 for(const d of Object.values(D.units).filter(d=>!d.damage)){const {g,u,b}=duel(d.name,'hq',0,0,2);run(g,2);assert(!u.windup,d.name+' began a zero-damage attack');assert.equal(b.hp,b.maxHp,d.name+' damaged an enemy');assert.equal(g.projectiles.length,0,d.name+' created a zero-damage projectile');}
});

test('Air-only fighters cannot damage ground buildings',()=>{
 for(const d of Object.values(D.units).filter(d=>d.airOnly)){const {g,u,b}=duel(d.name,'hq',0,0,2);run(g,2);assert(!u.windup,d.name+' attacked an invalid ground target');assert.equal(b.hp,b.maxHp);}
});
console.log('TOTAL '+count+' combat order/approach regression checks passed');