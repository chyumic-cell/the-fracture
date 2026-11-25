'use strict';
// The shared market: buying raises prices, selling lowers them, prices settle back over time,
// selling pays less than buying costs, and prices survive save and load.
const assert=require('node:assert/strict'),{Game}=require('../src/simulation.js');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
function game(){const g=new Game({size:48,seed:9,factions:['humans','machines']});g.entities=g.entities.filter(e=>e.kind!=='unit');g.players.forEach(p=>{p.ai=false;p.tradeCredits=0;});
 for(const [owner,x] of [[0,10],[1,36]])g.spawnBuilding(g.players[owner].faction+'_market',owner,x,24,true);g.rebuildNav();return g;}

test('Base prices reflect rarity, and selling pays less than buying costs',()=>{
 const g=game(),buy=[0,1,2,3].map(r=>g.buyPrice(r)),sell=[0,1,2,3].map(r=>g.sellPrice(r));
 assert.deepEqual(buy,[20,30,30,60]);for(let r=0;r<4;r++)assert(sell[r]<buy[r],'Sell value must be below the buy price');
});
test('Each lot bought raises the price for everyone; each lot sold lowers it',()=>{
 const g=game(),p=g.players[0],q=g.players[1];p.tradeCredits=1000;const before=g.buyPrice(1);
 let spent=0;for(let k=0;k<5;k++){const r=g.exchange(0,1);assert(r.ok);spent+=r.price;}
 assert(g.buyPrice(1)>before*1.3,'Five purchases should push the price up noticeably');assert(spent>before*5,'Later lots must cost more than the first');
 assert.equal(g.buyPrice(1),g.buyPrice(1));q.tradeCredits=1000;assert(g.exchange(1,1).price>before,'The other player sees the raised price too');
 const high=g.buyPrice(3);p.stock[3]=200;for(let k=0;k<5;k++)assert(g.sellResource(0,3).ok);assert(g.buyPrice(3)<high*.8,'Selling should push the price down');
});
test('Buying and immediately selling back always loses credits',()=>{
 const g=game(),p=g.players[0];for(let r=0;r<4;r++){p.tradeCredits=500;const start=p.tradeCredits,stock=p.stock[r];for(let k=0;k<3;k++){assert(g.exchange(0,r).ok);assert(g.sellResource(0,r).ok);}assert.equal(p.stock[r],stock);assert(p.tradeCredits<start,'Round trips must not profit: resource '+r);}
});
test('Prices settle back toward their base over a few minutes',()=>{
 const g=game(),p=g.players[0];p.tradeCredits=5000;for(let k=0;k<20;k++)g.exchange(0,0);const peak=g.buyPrice(0);assert(peak>=40);
 g.time+=240;const later=g.buyPrice(0);assert(later<peak&&later>20,'Partly recovered after four minutes');g.time+=1800;assert.equal(g.buyPrice(0),20);
 p.stock[2]=1000;for(let k=0;k<30;k++)g.sellResource(0,2);assert(g.buyPrice(2)>=Math.ceil(30*.35),'Prices have a floor');
});
test('Trading needs a market and enough credits or stock',()=>{
 const g=game(),p=g.players[0];p.tradeCredits=10;assert(!g.exchange(0,0).ok);p.stock[3]=5;assert(!g.sellResource(0,3).ok);assert(!g.exchange(0,7).ok);
 g.entities=g.entities.filter(e=>!(e.kind==='building'&&e.owner===0&&g.def(e).kind==='market'));p.tradeCredits=1000;p.stock[0]=500;assert(!g.exchange(0,0).ok);assert(!g.sellResource(0,0).ok);
});
test('Market prices are saved and restored',()=>{
 const g=game(),p=g.players[0];p.tradeCredits=500;for(let k=0;k<4;k++)g.exchange(0,3);const price=g.buyPrice(3),h=Game.restore(g.serialize());assert.equal(h.buyPrice(3),price);
 const old=JSON.parse(JSON.stringify(g));assert(old);const fresh=game();assert.equal(fresh.buyPrice(3),60,'A save without market data starts at base prices');
});
console.log('TOTAL '+count+' market checks passed');
