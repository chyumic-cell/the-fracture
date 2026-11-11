'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('../src/campaign-missions.js'),C=require('../src/campaign.js'),{Game}=require('../src/simulation.js'),D=require('../src/data.js');
let passed=0;function test(name,fn){fn();console.log('PASS '+name);passed++;}
test('Opening explains the invasion, has four causal stages, and leaves Scene One after the battle',()=>{
 const m=M.get(1);assert.match(m.prelude.join(' '),/Kareth.*Elyndra.*Morvane/);assert.match(m.prelude.join(' '),/conquer/);assert.equal(m.stages.length,4);assert.equal(m.postMissionCinematic,'scene_01');assert(m.emperorEncounter);assert(m.objectives.find(o=>o.id==='repel').requiresTailShed);assert(!m.events.some(e=>e.id==='tail-record'));assert(!/tail|containment/i.test(m.briefing));
});
test('Real damage sheds the tail exactly once, changes the living sprite, and survives save/load',()=>{
 const g=C.create(1);g.campaign.stage=3;g.campaign.stageStarted[3]=0;g.campaign.objectives.find(o=>o.id==='battery').complete=true;C.update(g,.1);
 const emperor=g.entity(g.campaign.emperor.id);assert(emperor&&!emperor.campaignTailShed);g.damage(emperor,9999,g.entities.find(e=>e.owner===0&&e.kind==='unit'));
 assert(emperor.hp>0);assert(emperor.campaignTailShed);assert.equal(g.campaign.landmarks.filter(l=>l.kind==='shed-tail').length,1);assert.equal(g.campaign.emperor.tailShed,true);assert.equal(g.campaign.focus.x,emperor.x);
 const h=Game.restore(g.serialize());assert.equal(h.entity(emperor.id).campaignTailShed,true);assert.deepEqual(h.campaign.emperor,g.campaign.emperor);h.damage(h.entity(emperor.id),9999,{owner:0});assert.equal(h.campaign.landmarks.filter(l=>l.kind==='shed-tail').length,1);
 for(let t=0;t<120&&h.campaign.emperor.phase!=='escaped';t+=.15)h.tick(.15);assert.equal(h.campaign.emperor.phase,'escaped');assert(h.campaign.events.some(e=>e.id==='emperor-escaped'));
});
test('Every mission has a story bridge, all advertised new faction units/buildings resolve',()=>{
 for(const m of M.missions){assert(m.prelude?.join('').length>80,m.id);for(const o of m.objectives){if(o.entityType)assert(D.units[o.entityType]||D.buildings[o.entityType]);}for(const w of m.waves)assert(m.stageMinimums[w.stage]>=w.at+35||m.number===6);}
 assert.match(M.get(3).briefing,/uncontrolled/);assert.match(M.get(16).prelude.join(' '),/shared consciousness/);assert.equal(M.get(25).month,18);
});
test('Campaign harbors have actual water, usable ships, and a valid paid dock replacement',()=>{
 for(const n of [10,21,22]){const g=C.create(n),h=g.campaign.harbor;assert(h);const ferry=g.entity(h.ferry),dock=g.entity(h.dock);assert(g.def(ferry).naval);assert(!g.blocked(ferry.x,ferry.y,'water'));assert.equal(g.def(dock).kind,'dock');assert(g.campaign.objectives.some(o=>o.id==='fleet'&&!o.optional));const d=D.buildings[dock.type];assert(g.entities.some(e=>e.owner===0&&g.def(e)?.kind==='lab'));assert(g.queue(dock.id,g.players[0].faction+'_warship').ok);}
});
console.log('TOTAL '+passed+' campaign revision groups passed');
