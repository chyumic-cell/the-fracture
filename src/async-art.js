'use strict';
(function(root){
const workerURL=new URL('sprite-worker.js',document.currentScript.src).href;
function attach(art){
 const pending=new Map(),queue=[],workers=[];let disabled=false;
 function start(){if(disabled||workers.length)return;try{if(!root.Worker||!root.OffscreenCanvas||location.protocol==='file:'){disabled=true;return;}for(let i=0;i<2;i++){const slot={worker:new Worker(workerURL),busy:false};slot.worker.onmessage=({data:r})=>{slot.busy=false;const q=pending.get(r.key);pending.delete(r.key);if(!r.error&&q){const c=document.createElement('canvas');c.width=r.bitmap.width;c.height=r.bitmap.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(r.bitmap,0,0);r.bitmap.close();if(r.owner)c.ownerPaint=r.owner;if(r.archive){art.unitArchive??=new Map();if(!art.unitArchive.has(r.key)){art.unitArchive.set(r.key,r.archive);art.unitArchiveBytes=(art.unitArchiveBytes||0)+r.archive.pixels.data.byteLength;}}if(r.weaponMuzzle)c.weaponMuzzle=r.weaponMuzzle;if(q.kind==='ruin'){art.ruinCache??=new Map();art.ruinCache.set(q.cacheKey,c);while(art.ruinCache.size>64)art.ruinCache.delete(art.ruinCache.keys().next().value);}else art.keepUnit(r.key,c);}else if(r.error){disabled=true;console.warn('Background sprite rendering unavailable:',r.error);}pump();};slot.worker.onerror=()=>{disabled=true;for(const s of workers)s.worker.terminate();pending.clear();queue.length=0;};workers.push(slot);}}catch{disabled=true;}}
 function pump(){if(disabled)return;for(const slot of workers){if(slot.busy)continue;let q;while(queue.length){q=queue.shift();if(pending.has(q.key))break;q=null;}if(!q)break;slot.busy=true;slot.worker.postMessage(q);}}
 art.deferUnit=function(key,d,f,angle,action,frame,occupancy){start();if(disabled)return null;
  if(!pending.has(key)){const q={key,d,f,angle,action,frame,occupancy};pending.set(key,q);queue.push(q);}
  // Prefer a frame in the same facing and action; otherwise retain a real idle pose.
  const prefix=key.split(',').slice(0,4).join(',')+',',unitPrefix=key.split(',').slice(0,3).join(',')+',';let fallback=null;
  for(const [k,c]of art.cache)if(k.startsWith(prefix)){fallback=c;break;}
  if(!fallback)for(const [k,c]of art.cache)if(k.startsWith(unitPrefix)){fallback=c;break;}
  if(!fallback){const k=[...(art.unitArchive?.keys()||[])].find(k=>k.startsWith(unitPrefix));if(k)fallback=art.restoreUnit(k);}
  if(action==='attack'&&frame<2){const parts=key.split(',');parts[4]='2';const release=parts.join(',');if(!art.cache.has(release)&&!art.unitArchive?.has(release)&&!pending.has(release)){const q={key:release,d,f,angle,action,frame:2,occupancy};pending.set(release,q);queue.unshift(q);}}pump();return fallback;
 };
 art.deferRuin=function(cacheKey,d,f,variant){start();if(disabled)return false;const key='ruin:'+cacheKey;if(!pending.has(key)){const q={kind:'ruin',key,cacheKey,d,f,variant};pending.set(key,q);queue.unshift(q);}pump();return true;};
 art.backgroundSprites={get pending(){return pending.size;},get available(){return !disabled;}};
}
root.FractureAsyncArt={attach};
})(globalThis);
