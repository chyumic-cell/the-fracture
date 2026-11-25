'use strict';
// Units drawn by the background sprite worker must match the main thread pixel for pixel.
// A renderer missing from the worker's importScripts makes sprites flip between two looks.
require('./browser-runtime.cjs');
const assert=require('node:assert/strict'),{chromium}=require('C:/Users/pc1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4088');await page.waitForFunction(()=>!!window.fracture);
 const report=await page.evaluate(async()=>{
  const worker=new Worker('src/sprite-worker.js'),pending=new Map();worker.onmessage=({data})=>{pending.get(data.key)?.(data);pending.delete(data.key);};
  const ask=job=>new Promise(resolve=>{pending.set(job.key,resolve);worker.postMessage(job);});
  const pixels=source=>{const c=document.createElement('canvas');c.width=source.width;c.height=source.height;const x=c.getContext('2d');x.drawImage(source,0,0);return x.getImageData(0,0,c.width,c.height).data;};
  const out=[];let n=0;
  for(const [fid,f] of Object.entries(FD.factions))for(const d of f.units)for(const [action,frame,angle] of [['idle',0,Math.PI/4],['walk',2,Math.PI*1.25],['attack',1,Math.PI/2]]){
   const art=new FractureArt.Art(),main=art.unit(d,f,angle,action,frame),key='parity'+n++,reply=await ask({key,unit:d.id,faction:fid,angle,action,frame});
   if(reply.error){out.push({unit:d.id,error:reply.error});continue;}
   const a=pixels(main),b=pixels(reply.bitmap);let diff=a.length===b.length?0:Infinity;if(diff===0)for(let i=0;i<a.length;i++)if(a[i]!==b[i])diff++;
   if(diff)out.push({unit:d.id,name:d.name,faction:fid,action,diff});
  }
  worker.terminate();return{checked:n,mismatches:out};
 });
 assert.deepEqual(errors,[]);
 assert.deepEqual(report.mismatches,[],'Worker sprites differ from main-thread sprites: '+JSON.stringify(report.mismatches.slice(0,12)));
 console.log('PASS sprite worker matches the main thread for '+report.checked+' unit poses across every faction');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
