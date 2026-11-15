"use strict";
const assert=require('node:assert/strict'),path=require('path'),{Game}=require(path.join(path.resolve(process.env.AI_SOURCE||'src'),'simulation.js'));
const g=new Game({size:64,seed:17,factions:['humans','humans']});g.entities=[];g.players.forEach(p=>p.ai=false);g.map.forEach(t=>{t.water=false;t.height=0;});g.spawnBuilding('humans_b0',0,5,5,true);g.spawnBuilding('humans_b0',1,5,40,true);
const units=Array.from({length:18},(_,i)=>g.spawnUnit('humans_u3',0,42+i*.35,59+(i%3)*.4));g.rebuildNav();g.updateVision();
g.order(units.map(u=>u.id),{kind:'move',x:63,y:63,formation:'line',face:.7});
for(let i=0;i<600;i++){g.tick(.1);for(const u of units){assert(Number.isFinite(u.x)&&Number.isFinite(u.y)&&u.x>=0&&u.y>=0&&u.x<64&&u.y<64);if(u.march&&u.order)assert(u.order.x>=.5&&u.order.y>=.5&&u.order.x<=63.5&&u.order.y<=63.5,'March slots must remain inside the playable grid');}}
const u=units[0];delete u.march;u.x=17.598;u.y=63.894;u.destination={x:17.751,y:64.138};u.path=[{...u.destination}];u.pathVersion=g.navVersion;u.nextPathAt=g.time+100;assert.doesNotThrow(()=>g.go(u,u.destination,.2));assert(u.y<64);assert.equal(u.path.length,0);
g.order([u.id],{kind:'move',x:16,y:60});for(let i=0;i<100;i++)g.tick(.1);assert(Math.hypot(u.x-16,u.y-60)<1);
const p=g.players[0];p.explored.fill(0);u.x=63.9;u.y=10.1;u.destination={x:64.2,y:10.1};u.path=[{...u.destination}];u.pathVersion=g.navVersion;u.nextPathAt=g.time+100;g.go(u,u.destination,.2);assert.equal(p.explored.reduce((a,b)=>a+b,0),0,'An invalid edge step must not reveal a wrapped grid cell');
console.log('PASS moving formations stay within map edges; stale out-of-bounds paths recover without crashing');
