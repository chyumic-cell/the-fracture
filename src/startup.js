'use strict';
(function(root){
const yieldToUI=()=>new Promise(resolve=>setTimeout(resolve,0));
async function prepare(art,game,report){
 const start=game.starts[0],cam=art.project(start.x,start.y,game.surfaceHeight(start.x,start.y)),view={w:innerWidth-300,h:innerHeight-75,top:48},zoom=1.2,layer=art.terrain(game),jobs=[],seen=new Set(),stats={assets:0,maxAssetMs:0};
 const add=(key,job)=>{if(!seen.has(key)){seen.add(key);jobs.push(job);}};
 // Build-menu thumbnails share the same expensive meshes as battlefield structures.
 // Warm them one at a time before play instead of making the first UI frame draw all of them.
 const D=root.FD,own=D.factions[game.players[0].faction];
 for(const d of own.buildings)add('b'+d.id,()=>art.building(d,own));
 for(const environment of root.FractureEnvironments.types(game.options))for(let variant=0;variant<4;variant++)add('tree'+environment+variant,()=>art.tree({variant},{...game.options,environment}));
 for(let resource=0;resource<4;resource++)for(let id=0;id<4;id++)add('resource'+resource+','+id,()=>art.resource({resource,id}));
 // Keep a real pose ready before a new unit type first enters view.
 for(const id of new Set(game.players.map(p=>p.faction))){const f=D.factions[id];for(const d of f.units)for(let direction=0;direction<8;direction++)add('portrait'+d.id+','+direction,()=>art.unit(d,f,direction*Math.PI/4,'idle',0));}

 for(const d of own.extensions)add('x'+d.id,()=>art.extension(d,own));
 const frames=[own.buildings[0],own.buildings.find(d=>['defense','extractor'].includes(d.kind)),own.extensions[0]].filter(Boolean);for(const d of frames)for(const progress of [.1,.5,.9])for(const front of [false,true])add('scaf'+d.id+progress+front,()=>art.construction(d,own,progress,front));
 for(const e of game.entities){if(e.hp<=0||!(game.options.spectate||e.owner===0||game.visible(0,e)))continue;const p=art.project(e.x,e.y,game.surfaceHeight(e.x,e.y));if(Math.abs(p.x-cam.x)>view.w/(2*zoom)+180||Math.abs(p.y-cam.y)>view.h/(2*zoom)+180)continue;
  const d=game.def(e),f=e.owner===undefined?null:D.factions[game.players[e.owner].faction];
  if(e.kind==='building'){add('b'+d.id,()=>art.building(d,f));const x=f.extensions.find(x=>x.name===e.extension||e.queue?.some(q=>q.kind==='extension'&&q.type===x.id));if(x)add('x'+x.id,()=>art.extension(x,f));}
  if(e.kind==='tree')add('t'+root.FractureEnvironments.scenery(game.options,e.x,e.y)+e.variant,()=>art.tree(e,game.options));
  if(e.kind==='resource')add('r'+e.resource+'_'+e.id%4,()=>art.resource(e));
  if(e.kind==='unit'){
   const actions=d.worker?['idle','walk','gather','build']:['idle','walk'];
   for(let direction=0;direction<8;direction++)for(const action of actions)for(let frame=0;frame<(action==='idle'&&!d.air?1:['gather','build'].includes(action)?4:6);frame++)add(['u',d.id,direction,action,frame].join(),()=>art.unit(d,f,direction*Math.PI/4,action,frame));
   add('current'+d.id+e.action+e.face,()=>art.unit(d,f,e.face,e.action,Math.floor(e.phase||0)%6));
  }
 }
 let ground=0,completed=0;const update=()=>report(.15+.85*(ground*.45+(jobs.length?completed/jobs.length:1)*.55),ground<1?'Drawing terrain and preparing units':'Preparing buildings and units');
 const terrainReady=layer.prepare?layer.prepare(cam,zoom,view,p=>{ground=p;update();}):Promise.resolve();
 // Attach rejection handling immediately, even while asset work is still running.
 let terrainError;const checkedTerrain=terrainReady.catch(e=>{terrainError=e;});
 try{for(const job of jobs){await yieldToUI();const began=performance.now();job();stats.maxAssetMs=Math.max(stats.maxAssetMs,performance.now()-began);completed++;stats.assets++;update();}await checkedTerrain;if(terrainError)throw terrainError;
  // Prepare starting fog too; no hidden-world simulation advances during preparation.
  if(layer.drawFog){const c=document.createElement('canvas');c.width=view.w;c.height=view.h;layer.drawFog(c.getContext('2d'),cam,zoom,view);}
  layer.startupStats=stats;return layer;
 }catch(error){layer.dispose?.();throw error;}
}
root.FractureStartup={prepare};
})(globalThis);
