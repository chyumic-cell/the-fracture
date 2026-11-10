'use strict';
require('./browser-runtime.cjs');
const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/pc1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=process.env.FRACTURE_URL||'http://127.0.0.1:4088';
const started=Date.now(),stage=name=>console.log('MAP STAGE '+((Date.now()-started)/1000).toFixed(1)+'s: '+name);
const frames=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function cacheState(page){
 return page.evaluate(()=>{
  const layer=fracture.terrain||fracture.art.terrainLayer;
  if(!layer||!(layer.chunks instanceof Map)||!(layer.fogChunks instanceof Map))throw Error('The active large map must expose bounded terrain and fog chunk caches');
  const entries=[...layer.chunks.values(),...layer.fogChunks.values()],canvases=entries.map(e=>e.canvas);
  if(canvases.some(c=>!(c instanceof HTMLCanvasElement)))throw Error('A terrain/fog cache entry has no canvas');
  return {n:fracture.game.n,terrain:layer.chunks.size,fog:layer.fogChunks.size,maxChunks:layer.maxChunks,maxFogChunks:layer.maxFogChunks,workerFailed:layer.workerFailed,readyChunks:layer.readyChunks,readyEntries:[...layer.chunks.values()].filter(e=>e.ready).length,queued:layer.queue?.size,inFlight:!!layer.inFlight,maxWidth:Math.max(0,...canvases.map(c=>c.width)),maxHeight:Math.max(0,...canvases.map(c=>c.height)),bytes:canvases.reduce((s,c)=>s+c.width*c.height*4,0),keys:[...layer.chunks.keys()]};
 });
}
async function detailed(page){await page.waitForFunction(()=>{const l=fracture.terrain||fracture.art.terrainLayer;if(l.workerFailed)throw Error('Terrain worker failed');return l.readyChunks>0&&l.fogChunks.size>0&&document.getElementById('terrainBusy').hidden;});}
function bounded(s){
 assert.equal(s.workerFailed,false,'The terrain worker must function without the synchronous fallback');
 assert(s.maxChunks>0&&s.maxChunks<=48,'Terrain cache limit must be declared and bounded');
 assert(s.maxFogChunks>0&&s.maxFogChunks<=48,'Fog cache limit must be declared and bounded');
 assert(s.terrain>0&&s.terrain<=s.maxChunks,'Terrain cache grew beyond its limit');
 assert(s.fog>0&&s.fog<=s.maxFogChunks,'Fog cache grew beyond its limit');
 assert(s.maxWidth<=768&&s.maxHeight<=768,'A cached canvas grew toward full-world size');
}
async function minimap(page,qx,qy){
 const box=await page.locator('#minimap').boundingBox();assert(box);
 await page.mouse.click(box.x+(50+qx*170)/270*box.width,box.y+(10+qy*170)/190*box.height);
 await page.mouse.move(500,350);await frames(page);
 await page.waitForFunction(([qx,qy])=>{const p=fracture.point(fracture.game.n*qx,fracture.game.n*qy);return Math.hypot(p.x-(innerWidth-300)/2,p.y-(innerHeight-75)/2-48)<2;},[qx,qy],{timeout:60000});
 const offset=await page.evaluate(([qx,qy])=>{const p=fracture.point(fracture.game.n*qx,fracture.game.n*qy);return Math.hypot(p.x-(innerWidth-300)/2,p.y-(innerHeight-75)/2-48);},[qx,qy]);
 assert(offset<2,'Minimap click did not center the selected map location: '+offset);
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],report={sizes:[],pan:[],fog:null};
  page.on('pageerror',e=>errors.push(e.message));
  stage('loading browser');await page.goto(url);await page.waitForFunction(()=>window.fracture&&window.FractureSim);stage('setup loaded');
  await page.evaluate(()=>{
   window.mapDrawTimings={cold:[],warm:[]};const proto=FractureTerrain.Layer.prototype,draw=proto.draw;
   proto.draw=function(...args){const before=new Set(this.chunks.keys()),start=performance.now(),result=draw.apply(this,args),ms=performance.now()-start,added=[...this.chunks.keys()].filter(key=>!before.has(key)).length;if(added)mapDrawTimings.cold.push({size:this.game.n,chunks:added,ms});else if(mapDrawTimings.warm.length<4000)mapDrawTimings.warm.push(ms);return result;};
  });
  assert.deepEqual(await page.locator('#size option').evaluateAll(options=>options.map(o=>Number(o.value))),[100,200,300,400,500,600,700]);
  assert.equal(await page.locator('#size').inputValue(),'200');
  assert.deepEqual(await page.locator('#size option').allTextContents(),['Tiny','Small','Medium','Large','Huge','Massive','Colossal']);
  assert.deepEqual(await page.locator('#layout option').evaluateAll(options=>options.map(o=>o.value)),['natural','mountain-passes','steppes','labyrinth']);
  await page.locator('#layout').selectOption('labyrinth');
  await page.locator('#size').selectOption('700');await page.locator('#seed').fill('48122');await page.locator('#start').click();await page.waitForFunction(()=>fracture.playing&&!fracture.loading,{},{timeout:120000});
  await page.evaluate(()=>{fracture.game.paused=true;fracture.game.players.forEach(p=>p.ai=false);});await frames(page);
  assert.equal(await page.evaluate(()=>fracture.game.n),700);assert.equal(await page.evaluate(()=>fracture.game.options.layout),'labyrinth');stage('UI largest-map deployment with labyrinth layout');
  for(const size of [100,200,300,400,500,600,700]){
   await page.evaluate(size=>{const g=new FractureSim.Game({size,seed:48122,factions:['humans','machines']});g.paused=true;g.players.forEach(p=>p.ai=false);fracture.activate(g);},size);
   await frames(page);await detailed(page);const state=await cacheState(page);bounded(state);assert(state.readyEntries>0);report.sizes.push(state);stage(size+' rendered');
  }
  // Real minimap input traverses the whole world, forcing cache turnover.
  const initial=await cacheState(page),visited=new Set(initial.keys);let evicted=false;
  for(const [x,y] of [[.02,.02],[.98,.02],[.98,.98],[.02,.98],[.25,.25],[.5,.25],[.75,.25],[.25,.5],[.5,.5],[.75,.5],[.25,.75],[.5,.75],[.75,.75]]){
   await minimap(page,x,y);const s=await cacheState(page);bounded(s);for(const key of s.keys)visited.add(key);if(initial.keys.some(key=>!s.keys.includes(key)))evicted=true;report.pan.push({x,y,terrain:s.terrain,fog:s.fog,bytes:s.bytes});stage('pan '+x+','+y+' caches '+s.terrain+'/'+s.fog);
  }
  stage('normal-zoom pan complete');assert(visited.size>initial.maxChunks,'Pan did not visit enough distinct terrain chunks to exercise eviction');
  assert(evicted,'Old terrain chunks were never evicted');
  await minimap(page,.5,.5);
  const marker=()=>page.evaluate(()=>fracture.point(fracture.game.n/2,fracture.game.n/2).x);
  const beforeKeyboard=await marker();await page.keyboard.down('ArrowRight');
  try{await page.waitForFunction(x=>fracture.point(fracture.game.n/2,fracture.game.n/2).x<x-10,beforeKeyboard,{timeout:30000});}finally{await page.keyboard.up('ArrowRight');}
  const beforeEdge=await marker();await page.mouse.move(1136,350);
  try{await page.waitForFunction(x=>fracture.point(fracture.game.n/2,fracture.game.n/2).x<x-10,beforeEdge,{timeout:30000});}finally{await page.mouse.move(500,350);}
  const zoom=()=>page.evaluate(()=>{const a=fracture.point(10,10,0),b=fracture.point(11,10,0);return Math.hypot(a.x-b.x,a.y-b.y)/Math.hypot(24,12);});
  stage('keyboard and edge panning passed; zooming out');for(let i=0;i<10;i++){await page.mouse.wheel(0,300);await frames(page);}await page.waitForFunction(()=>{const a=fracture.point(10,10,0),b=fracture.point(11,10,0);return Math.abs(Math.hypot(a.x-b.x,a.y-b.y)/Math.hypot(24,12)-.65)<.001;},{},{timeout:30000});assert(Math.abs(await zoom()-.65)<.001,'Zoom-out limit');
  for(const p of [[.2,.2],[.8,.2],[.8,.8],[.2,.8],[.5,.5]]){await minimap(page,...p);bounded(await cacheState(page));stage('minimum-zoom pan '+p.join(','));}
  for(let i=0;i<14;i++){await page.mouse.wheel(0,-300);await frames(page);}await page.waitForFunction(()=>{const a=fracture.point(10,10,0),b=fracture.point(11,10,0);return Math.abs(Math.hypot(a.x-b.x,a.y-b.y)/Math.hypot(24,12)-2)<.001;},{},{timeout:30000});assert(Math.abs(await zoom()-2)<.001,'Zoom-in limit');bounded(await cacheState(page));
  stage('both zoom limits passed');
  // Sample fog itself so sprites and terrain colors cannot mask opacity errors.
  report.fog=await page.evaluate(()=>{
   const g=fracture.game,p=g.players[0],layer=fracture.terrain||fracture.art.terrainLayer,c=document.createElement('canvas');c.width=400;c.height=300;
   const ctx=c.getContext('2d',{willReadFrequently:true}),cam=fracture.art.project(g.n/2,g.n/2,g.surfaceHeight(g.n/2,g.n/2)),v={w:400,h:300,top:0},out={};
   for(const state of ['unknown','explored','visible','exploredAgain']){
    p.explored.fill(state==='unknown'?0:1);p.visible.fill(state==='visible'?1:0);g.visionRevision++;
    ctx.clearRect(0,0,c.width,c.height);const begin=performance.now();layer.drawFog(ctx,cam,1,v);const ms=performance.now()-begin,alphas=[],data=ctx.getImageData(50,50,300,200).data;
    for(let y=0;y<200;y+=7)for(let x=0;x<300;x+=7)alphas.push(data[(y*300+x)*4+3]);
    out[state]={min:Math.min(...alphas),max:Math.max(...alphas),mean:alphas.reduce((a,b)=>a+b)/alphas.length,ms};
   }
   g.updateVision();return out;
  });
  assert(report.fog.unknown.min>=250,'Unknown fog must be opaque');
  assert(report.fog.visible.max<=3,'Visible land retains fog');
  for(const state of ['explored','exploredAgain']){const f=report.fog[state];assert(f.mean>100&&f.mean<170,'Explored fog opacity');assert(f.max-f.min<=3,'Explored fog has seams or compounded opacity');}
  assert(Math.abs(report.fog.explored.mean-report.fog.exploredAgain.mean)<=1,'Visibility revision failed to restore explored fog');
  await frames(page);bounded(await cacheState(page));stage('fog opacity and revisions passed');
  report.draws=await page.evaluate(()=>{const t=mapDrawTimings,w=t.warm.slice().sort((a,b)=>a-b);return {cold:t.cold,warm:{count:w.length,mean:w.reduce((a,b)=>a+b,0)/w.length,p95:w[Math.floor(w.length*.95)]}};});
  console.log('MAP DRAW TIMINGS '+JSON.stringify(report.draws));
  assert.deepEqual(errors,[],'Browser errors: '+errors.join('; '));
  await page.evaluate(()=>localStorage.removeItem('the-fracture-save-v1'));
  const saveStart=Date.now();await page.keyboard.press('F5');report.save=await page.evaluate(()=>{const text=localStorage.getItem('the-fracture-save-v1');return text?{characters:text.length,version:JSON.parse(text).version}:null;});assert(report.save,'700-map local save exceeded storage or failed');assert.equal(report.save.version,2);report.save.wallMs=Date.now()-saveStart;
  await page.keyboard.press('F9');await page.waitForFunction(()=>!fracture.loading,{},{timeout:120000});await page.evaluate(()=>{fracture.game.paused=true;});await frames(page);await detailed(page);assert.equal(await page.evaluate(()=>fracture.game.n),700);bounded(await cacheState(page));stage('700-map local save/load passed');
  // Direct-file, network-offline launch exercises the same largest-map renderer.
  stage('offline largest-map launch');const offline=await browser.newContext({viewport:{width:1440,height:900},offline:true}),file=await offline.newPage();
  file.on('pageerror',e=>errors.push(e.message));
  await file.goto('file:///D:/TheFracture/index.html');await file.waitForFunction(()=>window.fracture);
  await file.locator('#layout').selectOption('mountain-passes');await file.locator('#size').selectOption('700');await file.locator('#seed').fill('42');await file.locator('#start').click();await file.waitForFunction(()=>fracture.playing&&!fracture.loading,{},{timeout:120000});
  await file.evaluate(()=>{fracture.game.paused=true;});await frames(file);await detailed(file);assert(await file.evaluate(()=>fracture.playing&&fracture.game.n===700&&fracture.game.options.layout==='mountain-passes'));bounded(await cacheState(file));await minimap(file,.9,.9);bounded(await cacheState(file));
  assert.deepEqual(errors,[],'Browser errors: '+errors.join('; '));
  stage('offline launch and pan passed');console.log('MAP BROWSER METRICS '+JSON.stringify(report));
  console.log('PASS browser maps: 100/200/300/400/500/600/700, real minimap/keyboard/edge panning, zoom limits, cache eviction, uniform fog/revisions, layouts, local save/load700, offline700');
  await offline.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

