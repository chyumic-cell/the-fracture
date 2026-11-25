'use strict';
// Reuse the exact authored meshes in a worker; only the rasterization moves off-thread.
globalThis.document={createElement:()=>new OffscreenCanvas(1,1)};
importScripts('combat.js','expansion-data.js','data.js','tactics.js','projectiles.js','map-layouts.js','save-codec.js','simulation.js','environments.js','art.js','sprite-mesh.js','environment-art.js','detail-art.js','specialist-art.js','machine-art.js','symbiote-art.js','symbiote-host-art.js','primate-art.js','reptilian-art.js','identity-art.js','trade-art.js','expansion-art.js','ruins-art.js');
const art=new FractureArt.Art();
// Jobs arrive as ids, not whole definitions: this worker already imports data.js, so cloning the
// faction and unit objects across postMessage was pure main-thread cost.
const lookUp=q=>{const f=q.faction?FD.factions[q.faction]:q.f;
 let d=q.unit?(q.kind==='ruin'?FD.buildings[q.unit]:FD.units[q.unit]):q.d;
 if(d&&q.extra)d={...d,...q.extra};return{d:d||q.d,f:f||q.f};};
onmessage=({data:q})=>{try{const {d:qd,f:qf}=lookUp(q);if(q.kind==='ruin'){const c=art.ruin(qd,qf,q.variant),bitmap=c.transferToImageBitmap();postMessage({key:q.key,bitmap},[bitmap]);art.ruinCache.clear();return;}const c=art.unit(qd,qf,q.angle,q.action,q.frame,q.occupancy),archive=art.unitArchive?.get(q.key),owner=c.ownerPaint,bitmap=c.transferToImageBitmap(),transfer=[bitmap];if(archive)transfer.push(archive.pixels.data.buffer);if(owner)transfer.push(owner.data.data.buffer);postMessage({key:q.key,bitmap,owner,archive,weaponMuzzle:c.weaponMuzzle},transfer);art.cache.clear();art.unitKeys?.clear();art.unitArchive?.clear();art.unitArchiveBytes=0;}catch(e){postMessage({key:q.key,error:e.message});}};
