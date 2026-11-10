const assert=require('node:assert/strict'),A=require('../src/ai'),D=require('../src/data'),{Game}=require('../src/simulation');
const baseline=['standard','Standard',1.6,14,56,8,1.15,85,1,1,2];
assert.deepEqual(['id','name','think','workerTarget','maxMilitary','minAttack','attackRatio','memory','scouts','techPace','productionLimit'].map(k=>A.configs.standard[k]),baseline);
console.log('PASS preserved Standard baseline');
for(const c of A.levels){
 const g=new Game({size:48,seed:42,factions:['humans','humans'],difficulty:c.id});g.entities=[];g.map.forEach(t=>{t.water=true;t.height=0;});g.rebuildNav();
 const p=g.players[1];p.ai=true;p.explored.fill(0);p.visible.fill(0);p.knownTiles.fill(0);p.knownNav.fill(0);p.navigationRevision=0;
 const ship=g.spawnUnit('humans_transport_ship',1,10.5,10.5),goal={x:30.5,y:10.5};
 for(let y=8;y<=12;y++)for(let x=8;x<=12;x++){p.explored[y*g.n+x]=1;p.knownTiles[y*g.n+x]=128;}
 const route=g.path(ship,goal);g.tile(24,10).water=false;g.spawnBuilding('humans_wall',0,25.5,10.5,true);g.rebuildNav();g.pathCache.clear();
 assert.equal(g.blocked(24.5,10.5,'water',1),false);assert.equal(g.blocked(24.5,10.5,'water',1,true),true);assert.deepEqual(g.path(ship,goal),route,c.id+' hidden geography affected routing');
 const index=10*g.n+24;p.explored[index]=1;p.knownTiles[index]=0;p.navigationRevision++;
 assert.equal(g.blocked(24.5,10.5,'water',1),true);assert(!g.path(ship,goal).some(q=>q.x===24.5&&q.y===10.5));
 assert.equal(g.aiEconomicRate(1,'gather'),1);assert.equal(g.aiEconomicRate(1,'production'),1);
 g.spawnBuilding('humans_b0',1,6,6,true);const dock=g.spawnBuilding('humans_dock',1,8,8,true);p.stock=[1000,1000,1000,1000];const before=[...p.stock],d=D.units.humans_transport_ship;assert(g.queue(dock.id,d.id).ok);assert.deepEqual(p.stock,before.map((n,i)=>n-d.cost[i]));g.tickBuilding(dock,1);assert.equal(dock.queue[0].remaining,d.time-1);
}
console.log('PASS all ten levels: no hidden naval terrain/obstacle knowledge, discovered-route refresh, full transport prices and normal production speed');
