'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),D=require('../src/data'),{Game}=require('../src/simulation');
const rows=[],factions=Object.keys(D.factions).filter(id=>!process.env.ISLAND_FACTIONS||process.env.ISLAND_FACTIONS.split(',').includes(id));
for(const faction of factions){const size=+(process.env.ISLAND_SIZE||100),seed=+(process.env.ISLAND_SEED||42),layout=process.env.ISLAND_LAYOUT||'small-islands',g=new Game({size,seed,layout,factions:[faction,'humans'],resourceAmount:2,difficulty:'standard'}),made=[],landings=[],spawn=g.spawnUnit,unload=g.unload;let paid=0;const pay=g.pay;g.players[0].ai=true;g.players[1].ai=false;
 g.spawnUnit=function(type,owner,x,y){if(owner===0)made.push({type,at:Math.round(this.time)});return spawn.call(this,type,owner,x,y);};
 g.pay=function(owner,cost){const ok=pay.call(this,owner,cost);if(ok&&owner===0)paid+=cost.reduce((a,b)=>a+b,0);return ok;};
 g.unload=function(t,q){const n=unload.call(this,t,q);if(n&&t.owner===0&&Math.hypot(q.x-this.players[0].home.x,q.y-this.players[0].home.y)>15)landings.push({at:Math.round(this.time),n,naval:!!this.def(t).naval,x:q.x,y:q.y});return n;};
 for(let i=0;i<+(process.env.ISLAND_SECONDS||1200)/.15&&g.winner===null;i++)g.tick(.15);
 const crossing=g.entities.filter(t=>t.owner===0&&g.def(t)?.transport&&g.transportLoad(t).length>=3&&t.order?.kind==='unload'&&t.stuck<2&&Math.hypot(t.x-g.players[0].home.x,t.y-g.players[0].home.y)>20).map(t=>({type:t.type,passengers:g.transportLoad(t).length}));
 const row={crossing,faction,size,seed,layout,time:Math.round(g.time),winner:g.winner,ships:made.filter(e=>D.units[e.type].naval),landings,paid};rows.push(row);fs.writeFileSync('docs/'+(process.env.ISLAND_REPORT||'island-standard-matrix')+'.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(row));
 if(!landings.length||g.winner!==0)fs.writeFileSync('.art-work/island-standard-'+faction+'-'+size+'.json',g.serialize());
}
for(const row of rows){assert(row.ships.some(s=>D.units[s.type].transport),row.faction+' never built a paid sea transport');assert(row.landings.length||row.winner===0&&row.crossing.length,row.faction+' neither landed nor sailed a loaded assault before victory');assert.equal(row.winner,0,row.faction+' failed passive island opponent');assert(row.paid>0);}
console.log('PASS '+rows.length+' Standard island openings with paid transport, landing or loaded crossing before victory (passive opponents, not a balance tournament)');
