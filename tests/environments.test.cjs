"use strict";
const assert=require('node:assert/strict'),crypto=require('node:crypto'),E=require('../src/environments.js'),D=require('../src/data.js'),{Game}=require('../src/simulation.js');
const variants=['Kareth','Elyndra','Morvane'].flatMap(theme=>E.choices(theme).map(e=>({theme,environment:e.id})));let checks=0;
const digest=g=>crypto.createHash('sha256').update(JSON.stringify([g.map,g.starts,g.entities,g.nav,g.rng.s])).digest('hex');
for(const layout of ['natural','mountain-passes','steppes','labyrinth','mediterranean','continental','coastal','small-islands','large-islands']){
 const options={size:48,seed:42,factions:['humans','reptilians'],layout},reference=digest(new Game(options));
 for(const v of variants){const g=new Game({...options,...v});assert.equal(digest(g),reference,JSON.stringify({...v,layout})+' changed map physics, resources or RNG');checks++;}
}
for(const v of variants){
 const g=new Game({size:48,seed:7,...v});g.entities=[];for(const t of g.map)Object.assign(t,{water:false,height:0});g.players.forEach(p=>{p.ai=false;p.stock=[3000,3000,3000,3000];p.knowledge={};});g.spawnBuilding('humans_b0',0,8,8,true);g.spawnBuilding('humans_b0',1,42,42,true);const w=g.spawnUnit('humans_u0',0,20.5,23.5),tree=g.add({kind:'tree',x:20.5,y:20.5,hp:1,size:.4,variant:0});g.rebuildNav();g.updateVision();assert.equal(g.nav[20*g.n+20],1);assert.equal(g.placement('humans_b1',0,20.5,20.5),null);assert.equal(tree.hp,1);
 const stock=[...g.players[0].stock];g.players[0].stock.fill(0);assert(!g.build('humans_b1',0,20.5,20.5,[w.id]).ok);assert.equal(tree.hp,1);g.players[0].stock=[...stock];assert(g.build('humans_b1',0,20.5,20.5,[w.id]).ok);assert.equal(tree.hp,0);assert.deepEqual(g.players[0].stock,stock.map((x,i)=>x-D.buildings.humans_b1.cost[i]));
 const restored=Game.restore(g.serialize());assert.equal(restored.options.environment,v.environment);assert.equal(restored.options.theme,v.theme);assert(!restored.entity(tree.id));checks++;
}
for(const theme of ['Kareth','Elyndra'])for(const size of [100,200,700])for(const seed of [7,42,48122]){const o={theme,environment:'varied',size,seed};assert.equal(E.scenery(o,size/2,0),'arctic');assert.equal(E.scenery(o,size/2,size/2),'temperate');assert.equal(E.scenery(o,size/2,size-1),'desert');for(let y=1;y<size;y++){const a=E.palette(o,size/2,y-.001),b=E.palette(o,size/2,y+.001);for(let k=0;k<3;k++)assert(Math.abs(a.grass[k]-b.grass[k])<.1,'Climate color field must be continuous');}checks++;}
assert.equal(E.resolve({theme:'Morvane'}),'hell');assert.equal(E.resolve({theme:'Kareth'}),'temperate');assert.equal(E.resolve({theme:'Elyndra',environment:'moon'}),'temperate');assert.equal(E.resolve({theme:'Morvane',environment:'arctic'}),'hell');
for(const layout of ['natural','mediterranean'])for(const environment of ['hell','moon']){const o={theme:'Morvane',environment,layout,size:48,seed:42},g=new Game(o),p=E.palette(o),mini=E.miniColors(g);assert.equal(p.scenery,environment);for(let i=0;i<mini.length;i+=3)if(environment==='moon')assert(mini[i]===mini[i+1]&&mini[i]===mini[i+2]);else assert(mini[i]>mini[i+1]*1.5);checks++;}
console.log('PASS '+checks+' environment cases: all layouts preserve map/nav/deposit/RNG data, all scenery follows paid tree clearing, saves persist choices, smooth climates and coherent minimap palettes.');
