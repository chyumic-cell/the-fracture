"use strict";
require('./browser-runtime.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('C:/Users/pc1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4088');await page.waitForFunction(()=>window.fracture);
  await page.evaluate(()=>{
   const c=document.getElementById('world').getContext('2d'),draw=c.drawImage.bind(c),save=c.save.bind(c),restore=c.restore.bind(c),clip=c.clip.bind(c);let masks=0,stack=[];
   window.cliffDraws=[];
   c.save=function(){stack.push(masks);return save()};c.restore=function(){masks=stack.pop()||0;return restore()};
   c.clip=function(...args){if(args[0]==='evenodd')masks++;return clip(...args)};
   c.drawImage=function(...args){const m=c.getTransform();if(window.captureCliffs)cliffDraws.push({x:m.e,y:m.f,zoom:m.a,alpha:c.globalAlpha,masks,args:args.slice(1)});return draw(...args)};
   window.cliffFixture=function(kind,upper=false,visible=true,remembered=false){
    const g=new FractureSim.Game({size:48,seed:42,factions:['humans','reptilians']});g.entities=[];g.players.forEach(p=>{p.ai=false;p.knowledge={};p.visible.fill(visible?1:0);p.explored.fill(1)});
    g.map.forEach((t,i)=>{const x=i%g.n,y=Math.floor(i/g.n);Object.assign(t,{height:x+y>=43&&x+y<=51?9:0,water:false,road:false})});
    const x=22,y=upper?24:19;let e;
    if(kind==='building')e=g.spawnBuilding('humans_b0',visible?0:1,x,y,true);
    else if(kind==='unit')e=g.spawnUnit('humans_u0',visible?0:1,x,y);
    else e=g.add({kind:'resource',resource:kind==='oil'?1:2,x,y,hp:1,amount:600,maxAmount:600,size:.85});
    if(remembered)g.players[0].knowledge[e.id]={...e,queue:[],ghost:true};
    g.rebuildNav();g.paused=true;g.starts[0]={x:22,y:22};fracture.activate(g);fracture.choose([]);window.cliffEntity=e;window.cliffKind=kind;window.captureCliffs=false;
   };
  });
  async function capture(kind,upper=false,visible=true,remembered=false){
   await page.evaluate(args=>cliffFixture(...args),[kind,upper,visible,remembered]);
   await page.waitForFunction(()=>document.getElementById('terrainBusy').hidden,{},{timeout:60000});
   return page.evaluate(async()=>{cliffDraws=[];captureCliffs=true;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));captureCliffs=false;const p=fracture.point(cliffEntity.x,cliffEntity.y);return cliffDraws.filter(d=>Math.abs(d.x-Math.round(p.x))<.1&&Math.abs(d.y-Math.round(p.y))<.1&&d.args.length===4)});
  }
  for(const kind of ['building','resource','oil','unit']){
   const draws=await capture(kind);assert(draws.some(d=>d.alpha>.2&&d.alpha<.45&&d.masks===0),kind+' has a translucent silhouette behind terrain');assert(draws.some(d=>d.alpha===1&&d.masks>0),kind+' opaque sprite is clipped by foreground cliff');
   const upper=await capture(kind,true);assert(upper.some(d=>d.alpha===1&&d.masks===0),kind+' on plateau stays solid');assert(!upper.some(d=>d.alpha>.1&&d.alpha<.4),kind+' on plateau has no ghost');
   const hidden=await capture(kind,false,false);assert.equal(hidden.length,0,kind+' hidden by fog is not revealed');
   console.log('PASS '+kind+': lower cliff masking, visible ghost, upper elevation and fog privacy');
  }
  await capture('resource');await page.evaluate(()=>{fracture.game.tick=()=>{};fracture.game.paused=false});
  const pick=await page.evaluate(()=>fracture.point(cliffEntity.x,cliffEntity.y));await page.mouse.click(pick.x,pick.y-10);assert(await page.evaluate(()=>fracture.selection.includes(cliffEntity.id)),'resource behind cliff remains selectable');
  await page.mouse.move(pick.x,pick.y);await page.mouse.wheel(0,300);await page.waitForTimeout(100);
  const zoomDraws=await page.evaluate(async()=>{cliffDraws=[];captureCliffs=true;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));captureCliffs=false;return cliffDraws.filter(d=>d.args[2]===76.8&&d.args[3]===72)});
  assert(zoomDraws.some(d=>d.alpha>.2&&d.alpha<.45&&d.masks===0));assert(zoomDraws.some(d=>d.alpha===1&&d.masks>0));console.log('PASS covered resource selection and zoomed cliff masking');
  const memory=await capture('building',false,false,true);assert(memory.some(d=>d.alpha>.1&&d.alpha<.2&&d.masks===0),'remembered building has dimmer silhouette');assert(memory.some(d=>d.alpha===.5&&d.masks>0),'remembered building retains normal fog dimming');
  // Use normal, existing sprites for a visual review, with distinct elevations.
  await page.evaluate(()=>{cliffFixture('building');const g=fracture.game;g.add({kind:'resource',resource:2,x:17,y:24,hp:1,amount:600,maxAmount:600,size:.85});g.add({kind:'resource',resource:1,x:14,y:27,hp:1,amount:600,maxAmount:600,size:.85});g.spawnUnit('humans_u0',0,19,22);g.spawnBuilding('humans_b2',0,28,18,true);g.rebuildNav();});
  await page.waitForFunction(()=>document.getElementById('terrainBusy').hidden,{},{timeout:60000});await page.waitForTimeout(150);fs.mkdirSync('.art-work',{recursive:true});await page.screenshot({path:'.art-work/cliff-buildings-resources-review.png'});
  assert.deepEqual(errors,[]);console.log('PASS remembered-building fog dimming and rendered cliff review');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
