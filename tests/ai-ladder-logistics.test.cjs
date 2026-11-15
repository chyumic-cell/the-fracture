const assert=require('node:assert/strict'),D=require('../src/data'),A=require('../src/ai'),L=require('../src/ai-logistics'),{Game}=require('../src/simulation');
function island(difficulty,stock){const g=new Game({size:100,layout:'small-islands',seed:1,factions:['humans','humans'],difficulty});g.entities=[];for(let y=0;y<100;y++)for(let x=0;x<100;x++){g.tile(x,y).height=0;g.tile(x,y).water=x>=30&&x<61;}g.players.forEach(p=>{p.ai=false;p.stock=[stock,500,500,50];});g.players[0].home={x:18,y:30};g.spawnBuilding('humans_b0',0,18,30,true);g.spawnBuilding('humans_b0',1,70,30,true);g.spawnBuilding('humans_dock',0,29,30,true);for(let i=0;i<8;i++)g.spawnUnit('humans_u0',0,23+i*.3,30);for(let i=0;i<10;i++)g.spawnUnit('humans_u2',0,26+i*.15,32);g.spawnUnit('humans_transport_ship',0,32,30);g.rebuildNav();g.updateVision();const p=g.players[0];p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);p.knownTiles.set(g.map.map(t=>(t.water?128:0)|t.height));p.aiSustainability={relocation:true,cost:[300,0,0,0],ids:[],remaining:[0,0,0,0]};p.aiReserve=[300,0,0,0];g.time=300;p.aiLogistics={next:0,nextExpansion:10000};return g;}
for(const [difficulty,stock,expected]of [['relaxed',1500,false],['easy',1500,true],['apocalypse',1500,true],['apocalypse',400,false]]){const g=island(difficulty,stock),p=g.players[0];L.step(g,p,A.context(g,p));console.log(difficulty,stock,p.aiLogistics.sortie?.phase);assert.equal(!!p.aiLogistics.sortie,expected);}
console.log('PASS funded island armies launch real transports; recovery reserves and Relaxed behavior are preserved');

for(const recent of [true,false]){
 const g=island('apocalypse',400),p=g.players[0],mine=g.spawnBuilding('humans_deep_ore',0,12,20,true);mine.lastExtraction=g.time-(recent?2:50);
 g.rebuildNav();g.updateVision();p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);L.step(g,p,A.context(g,p));
 assert.equal(!!p.aiLogistics.sortie,recent,'A working renewable economy permits combat voyages; an idle mine does not');
}
console.log('PASS recent real deep extraction releases military transport without weakening emergency reserves');

{
 const g=island('apocalypse',200),p=g.players[0];g.time=650;p.stock=[200,500,900,100];p.aiLogistics={next:0,nextExpansion:10000,nextSortie:10000};
 const mine=g.spawnBuilding('humans_deep_ore',0,21,24,true),n=g.add({kind:'resource',resource:0,x:21,y:24,hp:0,amount:0,size:.85});
 g.rebuildNav();g.updateVision();p.knowledge[n.id]={...n};p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);
 L.step(g,p,A.context(g,p));const miners=g.entities.filter(u=>u.owner===0&&u.order?.kind==='extract');
 assert.equal(miners.length,6,'Use six of eight workers on urgent renewable Ore, preserving two for other duties');
}
console.log('PASS depleted-island workers prioritize urgent renewable Ore over surplus materials');

{
 const g=island('apocalypse',200),p=g.players[0];g.time=650;p.stock=[200,500,900,100];p.aiLogistics={next:0,nextExpansion:10000,nextSortie:10000};
 const mines=[g.spawnBuilding('humans_deep_ore',0,21,24,true),g.spawnBuilding('humans_deep_ore',0,15,24,true)];
 for(let i=0;i<16;i++)g.spawnUnit('humans_u0',0,17+i*.2,26);
 for(const b of mines){const n=g.add({kind:'resource',resource:0,x:b.x,y:b.y,hp:1,amount:0,size:.85});p.knowledge[n.id]={...n};}
 g.rebuildNav();g.updateVision();p.explored.fill(1);p.visible.fill(1);p.knownNav.set(g.nav);L.step(g,p,A.context(g,p));
 const counts=mines.map(b=>g.entities.filter(u=>u.owner===0&&u.order?.kind==='extract'&&u.order.target===b.id).length);
 assert.deepEqual(counts,[11,11],'Spread twenty-two paid workers across both shafts, preserving two general workers');
 const before=p.gathered[0];for(let i=0;i<800;i++)g.tick(.1);
 assert(p.gathered[0]>before,'The assigned workforce must physically deliver mined Ore');
 assert(mines.every(b=>b.lastExtraction>700),'Both shafts must produce through ordinary extraction');
}
console.log('PASS multiple renewable shafts receive balanced workforces and deliver actual Ore');
