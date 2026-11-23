'use strict';
(function(root){
const workerURL=new URL('sprite-worker.js',document.currentScript.src).href;
function attach(art){
 const pending=new Map(),queue=[],workers=[];let disabled=false;
 function start(){if(disabled||workers.length)return;try{if(!root.Worker||!root.OffscreenCanvas||location.protocol==='file:'){disabled=true;return;}for(let i=0;i<2;i++){const slot={worker:new Worker(workerURL),busy:false};slot.worker.onmessage=({data:r})=>{slot.busy=false;const q=pending.get(r.key);pending.delete(r.key);if(!r.error&&q){const c=document.createElement('canvas');c.width=r.bitmap.width;c.height=r.bitmap.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(r.bitmap,0,0);r.bitmap.close();if(r.owner)c.ownerPaint=r.owner;if(r.archive){art.unitArchive??=new Map();if(!art.unitArchive.has(r.key)){art.unitArchive.set(r.key,r.archive);art.unitArchiveBytes=(art.unitArchiveBytes||0)+r.archive.pixels.data.byteLength;}}if(r.weaponMuzzle)c.weaponMuzzle=r.weaponMuzzle;if(q.kind==='ruin'){art.ruinCache??=new Map();art.ruinCache.set(q.cacheKey,c);while(art.ruinCache.size>64)art.ruinCache.delete(art.ruinCache.keys().next().value);}else art.keepUnit(r.key,c);}else if(r.error){disabled=true;console.warn('Background sprite rendering unavailable:',r.error);}pump();};slot.worker.onerror=()=>{disabled=true;for(const s of workers)s.worker.terminate();pending.clear();queue.length=0;};workers.push(slot);}}catch{disabled=true;}}
 // Post ids rather than whole objects. The worker imports the same data, so cloning a faction (with
 // every unit, building, research and extension definition) for each sprite job was a long synchronous
 // main-thread task and the largest single source of frame freezes.
 const slim=q=>{const D=root.FD,base=q.kind==='ruin'?D?.buildings?.[q.d?.id]:D?.units?.[q.d?.id];
  const job={key:q.key,kind:q.kind,angle:q.angle,action:q.action,frame:q.frame,occupancy:q.occupancy,variant:q.variant};
  if(base&&D.factions?.[q.f?.id]){job.unit=q.d.id;job.faction=q.f.id;
   let extra=null;for(const k of Object.keys(q.d)){const v=q.d[k];if(v!==base[k]&&(v===null||typeof v!=='object'))(extra??={})[k]=v;}
   if(extra)job.extra=extra;
  }else{job.d=q.d;job.f=q.f;}
  return job;};
 function pump(){if(disabled)return;for(const slot of workers){if(slot.busy)continue;let q;while(queue.length){q=queue.shift();if(pending.has(q.key))break;q=null;}if(!q)break;slot.busy=true;slot.worker.postMessage(slim(q));}}
 art.deferUnit=function(key,d,f,angle,action,frame,occupancy){start();if(disabled)return null;
  if(!pending.has(key)){const q={key,d,f,angle,action,frame,occupancy};pending.set(key,q);if(action==='dead')queue.unshift(q);else queue.push(q);}
  // Prefer a frame in the same facing and action; otherwise retain a real idle pose.
  const prefix=key.split(',').slice(0,4).join(',')+',',unitPrefix=key.split(',').slice(0,3).join(',')+',';let fallback=null;
  for(const [k,c]of art.cache)if(k.startsWith(prefix)){fallback=c;break;}
  if(!fallback)for(const [k,c]of art.cache)if(k.startsWith(unitPrefix)){fallback=c;break;}
  // Iterate the archive keys directly; spreading them into an array ran once per deferred unit per frame.
  if(!fallback&&art.unitArchive){let hit=null;for(const k of art.unitArchive.keys())if(k.startsWith(unitPrefix)){hit=k;break;}if(hit)fallback=art.restoreUnit(hit);}
  if(action==='attack'&&frame<2){const parts=key.split(',');parts[4]='2';const release=parts.join(',');if(!art.cache.has(release)&&!art.unitArchive?.has(release)&&!pending.has(release)){const q={key:release,d,f,angle,action,frame:2,occupancy};pending.set(release,q);queue.unshift(q);}}if(action==='dead'&&fallback){const corpseKey='fallen:'+unitPrefix;if(!art.fallenCache)art.fallenCache=new Map();if(!art.fallenCache.has(corpseKey)){const c=document.createElement('canvas');c.width=fallback.width;c.height=fallback.height;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.translate(c.width*.5,c.height*87/112);ctx.scale(.62,.38);ctx.rotate(Math.PI/2);ctx.drawImage(fallback,-c.width*.5,-c.height*87/112);art.fallenCache.set(corpseKey,c);while(art.fallenCache.size>48)art.fallenCache.delete(art.fallenCache.keys().next().value);}fallback=art.fallenCache.get(corpseKey);}pump();return fallback;
 };
 art.deferRuin=function(cacheKey,d,f,variant){start();if(disabled)return false;const key='ruin:'+cacheKey;if(!pending.has(key)){const q={kind:'ruin',key,cacheKey,d,f,variant};pending.set(key,q);queue.unshift(q);}pump();return true;};
 art.backgroundSprites={get pending(){return pending.size;},get available(){return !disabled;}};
}
root.FractureAsyncArt={attach};
})(globalThis);
