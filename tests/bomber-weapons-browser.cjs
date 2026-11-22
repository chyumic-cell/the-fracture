'use strict';
const assert=require('node:assert/strict'),{chromium}=require('C:/Users/pc1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const p=await b.newPage({viewport:{width:1200,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4088/art-review.html?faction=humans&category=units');
 const card=p.locator('[data-asset="humans_bomber"]');await card.waitFor();await card.scrollIntoViewIfNeeded();
 assert.equal(await card.locator('h3').textContent(),'Bomber');assert.equal(await card.locator('small').textContent(),'Air / Bombs');
 const profiles=await p.evaluate(()=>Object.values(FD.factions).map(f=>({id:f.id,kind:FractureProjectiles.profile(FD.units[f.id+'_bomber'],f).kind})));
 assert(profiles.every(p=>p.kind==='bomb'));await card.screenshot({path:'D:/TheFracture/docs/bomber-label-review.png'});
 await p.goto('http://127.0.0.1:4088');await p.waitForFunction(()=>window.fracture);
 await p.evaluate(()=>{const g=new FractureSim.Game({size:48,seed:42,factions:['humans','humans']});g.entities=[];g.map.forEach(t=>{t.water=false;t.height=0;});g.players.forEach(p=>p.ai=false);
  g.spawnBuilding('humans_b0',0,8,8,true);g.spawnBuilding('humans_b0',1,40,40,true);
  const u=g.spawnUnit('humans_bomber',0,25,25),target=g.spawnBuilding('humans_b1',1,28.5,25,true);g.rebuildNav();g.updateVision();g.strike(u,target);
  const shot=g.projectiles[0];shot.elapsed=shot.flight*.55;shot.x=shot.fromX+(shot.toX-shot.fromX)*.55;shot.y=shot.fromY+(shot.toY-shot.fromY)*.55;
  g.paused=true;u.action='attack';u.face=0;fracture.activate(g);fracture.center({x:26,y:25});fracture.choose([u.id]);
 });await p.waitForTimeout(1500);await p.screenshot({path:'D:/TheFracture/docs/bomber-drop-review.png'});
 assert.equal(await p.evaluate(()=>fracture.game.projectiles[0].weapon),'bomb');assert.deepEqual(errors,[]);
 console.log('PASS browser: Bomber / Air-Bombs label, all twelve bomb profiles, live bomb-drop renderer, no page errors');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
