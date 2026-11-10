const assert=require('node:assert/strict'),D=require('../src/data.js'),{Game,dist}=require('../src/simulation.js');
let samples=0;
for(const seed of [42,48122,213301])for(let resource=0;resource<4;resource++){
 const g=new Game({factions:['humans','insects'],size:64,seed});g.players.forEach(p=>p.ai=false);
 const h=g.starts[0],workers=g.entities.filter(e=>e.owner===0&&e.kind==='unit'),t=g.entities.filter(e=>e.kind==='resource'&&e.resource===resource).sort((a,b)=>dist(a,h)-dist(b,h))[0];
 if(resource===1){const d=D.factions.humans.buildings.find(b=>b.resource==='oil');let built=false;for(let y=-5;y<=5&&!built;y+=.5)for(let x=-5;x<=5&&!built;x+=.5)if(!g.placement(d.id,0,t.x+x,t.y+y)){g.spawnBuilding(d.id,0,t.x+x,t.y+y,true);built=true;}assert(built);g.rebuildNav();g.updateVision();}
 const deposits=new Map(g.entities.filter(e=>e.kind==='resource').map(e=>[e.id,e]));g.order(workers.map(u=>u.id),{kind:'gather',target:t.id});let worked=new Set();
 for(let i=0;i<1000;i++){g.tick(.1);for(const u of workers)if(u.action==='gather'){const deposit=deposits.get(u.order.target);assert(dist(u,deposit)<deposit.size+1.02,'Worker gathers outside tool reach');worked.add(u.id);samples++;}}
 assert(worked.size>=4,`Crowded deposit failed: seed ${seed}, resource ${resource}, workers ${worked.size}`);assert(g.players[0].gathered[resource]>24,`No deliveries for ${seed} / ${resource}`);
}
console.log('PASS 12 crowded-deposit scenarios: close working distance, all four resources, deliveries; '+samples+' working samples');
