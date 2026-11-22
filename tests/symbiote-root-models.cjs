require('./browser-runtime.cjs');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/pc1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4088');const report=await p.evaluate(()=>{
 const art=new FractureArt.Art(),f=FD.factions.symbiotes,bad=[],checks=[];let samples=0;
 const inspect=(c,label)=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let filled=0,edge=0,hash=2166136261;for(let i=0;i<data.length;i+=4){if(data[i+3]>100){filled++;const v=i/4,x=v%c.width,y=Math.floor(v/c.width);if(!x||!y||x===c.width-1||y===c.height-1)edge++;}hash=Math.imul(hash^data[i],16777619);hash=Math.imul(hash^data[i+3],16777619);}if(filled<100||edge>3)bad.push({label,filled,edge});samples++;return hash;};
 for(const d of f.units){for(let dir=0;dir<8;dir++)for(const [act,frame]of [['idle',0],['idle',3],['attack',2],['walk',4],['dead',0]])inspect(art.unit(d,f,dir*Math.PI/4,act,frame),d.id+'/'+dir+'/'+act+'/'+frame);
  const hashes=[];for(let frame=0;frame<6;frame++)hashes.push(inspect(art.unit(d,f,0,'idle',frame),d.id+'/pulse/'+frame));if(new Set(hashes).size<3)bad.push({label:d.id,issue:'missing pulse'});
  if(art.unit(d,f,0,'idle',100)!==art.unit(d,f,0,'idle',4))bad.push({label:d.id,issue:'unbounded idle cache'});
  checks.push({id:d.id,pulseFrames:new Set(hashes).size});art.cache.clear();art.unitArchive.clear();art.unitKeys.clear();art.unitArchiveBytes=0;
 }
 for(const d of f.buildings)inspect(art.building(d,f),d.id);
 return{bad,checks,samples};
 });report.errors=errors;fs.writeFileSync('docs/symbiote-root-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));assert.deepEqual(errors,[]);assert.deepEqual(report.bad,[]);console.log('PASS symbiote root growth, six pulse frames, cache bounds, all facings, buildings and building bounds');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
