'use strict';

(()=>{

const $=id=>document.getElementById(id),D=FD,{Game,dist,hash}=FractureSim,{Art,poly,ellipse,unitScale}=FractureArt,art=new Art(),world=$('world'),ctx=world.getContext('2d'),mini=$('minimap'),mc=mini.getContext('2d');

const attackCursor='url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><g stroke="#101719" stroke-width="3" stroke-linejoin="round"><path fill="#f3c490" d="M5 3 L12 6 L26 24 L23 27 L8 9 Z"/><path fill="#d98776" d="M27 3 L20 6 L6 24 L9 27 L24 9 Z"/></g><path d="M18 23 L25 17 M7 17 L14 23" stroke="#f3dfac" stroke-width="2"/></svg>')+'") 16 16, crosshair';

let actionUsed=new Set();

const colors=['#6eb8c6','#cb756a','#b6a16e','#ad8ec4','#8fbb75','#ddae66','#77a7d0','#cd8fae','#a9c29b','#bf9c77','#9d9bd2','#c5cbd0','#8d9692'],symbols=['◆','◒','⬡','✧'],names=['ORE','LASTRIAN OIL','AETHERITE','RIFT CRYSTALS'];

let loading=false,pendingView=null,lastReadyView=null;

let game=new Game({seed:48122,size:48,factions:['humans','reptilians']}),terrain=art.terrain(game),playing=false,selection=[],tab='orders',formation='line',mode=null,buildType=null,fortificationDrag=null,cam={x:0,y:0},zoom=1,mouse={x:-1,y:-1},drag=null,rightDrag=null,middle=null,keys=new Set(),groups={},lastGroup=null,lastGroupTime=0,lastFrame=performance.now(),uiAt=0,toastUntil=0,resultShown=false,hover=null,fps=60,manualWasPaused=false;

function viewport(){return{w:innerWidth-(playing?300:0),h:innerHeight-(playing?75:0),top:playing?48:0};}

function resize(){world.width=innerWidth;world.height=innerHeight;}window.addEventListener('resize',resize);resize();

function point(x,y,z){const v=viewport(),p=art.project(x,y,z===undefined?game.surfaceHeight(x,y):z);return{x:(p.x-cam.x)*zoom+v.w/2,y:(p.y-cam.y)*zoom+v.h/2+v.top};}

function unproject(sx,sy){const v=viewport(),px=(sx-v.w/2)/zoom+cam.x,py=(sy-v.top-v.h/2)/zoom+cam.y;let x=px/48+py/24,y=py/24-px/48;for(let k=0;k<3;k++){const h=game.surfaceHeight(x,y);x=px/48+py/24+h*8/24;y=py/24-px/48+h*8/24;}return{x:Math.round(x*1e6)/1e6,y:Math.round(y*1e6)/1e6};}

function center(e){pendingView=null;cam=art.project(e.x,e.y,game.surfaceHeight(e.x,e.y));}

center(game.starts[0]);

function isVisible(e){if(e.embarkedBy||e.insideMine)return false;if(e.pendingSite)return e.owner===0||game.options.spectate;return game.options.spectate||(game.visible(0,e)&&game.detectable(0,e));}function isKnown(e){return game.options.spectate||game.known(0,e);}

let visibleStaticCache=null;
function visibleDrawList(){
 const c=visibleStaticCache;if(!c||c.game!==game||c.source!==game.entities||c.count!==game.entities.length||c.vision!==game.visionRevision||c.nav!==game.navVersion||c.spectate!==game.options.spectate){
  const objects=game.entities.filter(e=>e.kind!=='unit'&&e.hp>0&&isVisible(e)),memory=game.options.spectate?[]:Object.values(game.players[0].knowledge).filter(e=>!isVisible(e));
  visibleStaticCache={game,source:game.entities,count:game.entities.length,vision:game.visionRevision,nav:game.navVersion,spectate:game.options.spectate,objects:[...objects,...memory]};
 }
 return [...visibleStaticCache.objects,...game.entitiesByKind('unit').filter(e=>e.hp>0&&isVisible(e))].sort((a,b)=>a.x+a.y-b.x-b.y);
}

function selected(){return selection.map(id=>game.entity(id)).filter(Boolean);}function ownUnits(){return selected().filter(e=>e.kind==='unit'&&e.owner===0&&!e.embarkedBy);}function workers(){return ownUnits().filter(e=>D.units[e.type].worker);}

function toast(text){$('toast').textContent=text;$('toast').hidden=false;toastUntil=performance.now()+3300;}

function execute(result){if(result&&!result.ok)toast(result.reason);uiAt=0;}

function price(cost){return cost.map((v,i)=>v?`${v} ${['ore','oil','aether','rift'][i]}`:'').filter(Boolean).join(' · ');}

function setTab(value){tab=value;uiAt=0;}

function choose(ids){selection=ids;window.FractureAudio?.selected(ids);const s=selected()[0];if(s?.kind==='building'&&s.owner===0)tab=game.def(s).kind==='wall'?'orders':'train';else if(s?.kind==='unit'&&D.units[s.type].worker)tab='build';else tab='orders';uiAt=0;}

function cursor(){if(!playing)return;let text='Move · right-drag to set facing',type='default';const u=ownUnits();if(buildType){type='crosshair';text='Place '+D.buildings[buildType].name+' · right-click to cancel';}else if(mode){type='crosshair';text=mode==='attackMove'?'Attack-move · left-click destination':mode==='patrol'?'Patrol · left-click destination':mode==='clearMines'?'Clear mines: click an area to inspect':'Choose destination';}else if(hover){const campaignHint=window.FractureCampaignUI?.siteHint(hover);if(campaignHint&&u.length){text=campaignHint;type=hover.campaignLocked?'not-allowed':'cell';}else if(hover.kind==='resource'){text=workers().length?(hover.resource===1&&!oilWellReady(hover)?'Oil: build an extraction well beside this deposit first':'Gather '+names[hover.resource].toLowerCase()):names[hover.resource]+' deposit';type=workers().length?'cell':'pointer';}else if(hover.owner!==undefined&&game.hostile(0,hover.owner)&&u.length){text='Attack '+(hover.campaignName||game.def(hover).name);type=attackCursor;}else if(hover.kind==='building'&&hover.owner===0&&workers().length&&hover.progress<1){text='Construct '+game.def(hover).name;type='progress';}else if(hover.kind==='building'&&hover.owner===0&&game.def(hover).resource==='oil'&&hover.progress>=1&&workers().length){text='Collect oil at this extraction well';type='cell';}else{type='pointer';text=hover.campaignName||game.def(hover)?.name||(hover.kind==='tree'?FractureEnvironments.name(game.options,hover):'Scenery');}}else if(u.length)type='crosshair';world.style.cursor=type;$('message').textContent=text;}

function oilWellReady(node){return game.entities.some(b=>b.kind==='building'&&b.owner===0&&b.hp>0&&b.progress>=1&&game.def(b).resource==='oil'&&dist(b,node)<6);}

function gatherOrder(node){game.order(workers().map(u=>u.id),{kind:'gather',target:node.id});if(node.resource===1&&!oilWellReady(node))toast('Oil needs a completed Lastrian extraction well nearby. Workers will start collecting once it is ready.');}

function pick(x,y){let best=null,score=Infinity;for(const e of game.entities){if(e.kind==='tree'||e.hp<=0||!isVisible(e))continue;const p=point(e.x,e.y),d=game.def(e);

 // Match ground pools and tall crystalline deposits to their different visible silhouettes.

 const vs=e.kind==='unit'?unitScale(d):1,airOffset=e.kind==='unit'&&d.air&&e.action!=='land'?23:0,oil=e.kind==='resource'&&e.resource===1,h=e.kind==='building'?d.size*32:e.kind==='unit'?22*vs:oil?10:32,w=e.kind==='building'?d.size*36:e.kind==='resource'?27:13*vs;

 const cy=e.kind==='building'?p.y-h*zoom*.65:e.kind==='unit'?p.y-(10*vs+airOffset)*zoom:oil?p.y-3*zoom:p.y-13*zoom;

 const dd=Math.hypot((x-p.x)/(w*zoom),(y-cy)/(h*zoom));if(dd<1.12){const priority=dd+(e.kind==='building'?.3:0);if(priority<score){score=priority;best=e;}}}return best;}



function drawGround(){const n=game.n,v=viewport();if(terrain.draw){terrain.draw(ctx,cam,zoom,v);return;}ctx.drawImage(terrain,(-n*24-48-cam.x)*zoom+v.w/2,(-40-cam.y)*zoom+v.h/2+v.top,terrain.width*zoom,terrain.height*zoom);}

function render(){if(playing&&terrain.ensure){const ready=terrain.ensure(cam,zoom,viewport());if(!ready){pendingView={cam:{...cam},zoom};$('terrainBusy').hidden=false;if(lastReadyView){cam={...lastReadyView.cam};zoom=lastReadyView.zoom;}else return;}else{lastReadyView={cam:{...cam},zoom};pendingView=null;$('terrainBusy').hidden=true;}terrain.suspendPrefetch=!!pendingView;}ctx.imageSmoothingEnabled=false;ctx.fillStyle='#0a1117';ctx.fillRect(0,0,world.width,world.height);const v=viewport();ctx.save();ctx.beginPath();ctx.rect(0,v.top,v.w,v.h);ctx.clip();drawGround();window.FractureCampaignLandmarks?.drawGround(ctx,game,point,zoom); if(!game.options.spectate){if(terrain.drawFog)terrain.drawFog(ctx,cam,zoom,v);else{const fog=art.fog(game),n=game.n;ctx.drawImage(fog,(-n*24-48-cam.x)*zoom+v.w/2,(-40-cam.y)*zoom+v.h/2+v.top,fog.width*zoom,fog.height*zoom);}}

 art.liveRendering=true;
 // Wreckage is ground detail: units and newly placed buildings draw above it.
 for(const e of game.effects){if(e.kind!=='ruin'||!isVisible(e))continue;const d=D.buildings[e.type],f=D.factions[e.campaignFaction||game.players[e.owner]?.faction];if(!d||!f)continue;const p=point(e.x,e.y);if(p.x<-200||p.y<-150||p.x>v.w+200||p.y>v.top+v.h+150)continue;const scale=d.size*.53;ctx.save();ctx.translate(p.x,p.y);ctx.scale(zoom,zoom);ctx.globalAlpha=Math.min(1,e.time/2);ctx.drawImage(art.ruin(d,f,e.variant||0),-120*scale,-181*scale,240*scale,220*scale);ctx.restore();}
 art.liveRendering=true;const list=visibleDrawList();const wallMasks=window.FractureFortificationArt?.connectionProfiles(game,list)||new Map();

 for(const e of list){const p=point(e.x,e.y);if(p.x<-150||p.y<-180||p.x>v.w+150||p.y>v.top+v.h+180)continue;ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));ctx.scale(zoom,zoom);const d=game.def(e),s=selection.includes(e.id),team=colors[e.owner]||'#a4b17d';

 if(e.kind==='resource'){if(e.amount<=0){ctx.globalAlpha=.5;ctx.drawImage(art.resource(e),-19.2,-20,38.4,30);ctx.globalAlpha=1;if(s){ctx.fillStyle='#dbc995';ctx.font='11px Segoe UI';ctx.fillText('Exhausted deposit',-40,-25);}}else ctx.drawImage(art.resource(e),-38.4,-55.2,76.8,72);if(s){ctx.strokeStyle='#c5c795';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,25,12,0,0,6.28);ctx.stroke();}}

 else if(e.kind==='tree'){const covered=list.some(u=>u.kind==='unit'&&isVisible(u)&&Math.abs(u.x-e.x)<2&&Math.abs(u.y-e.y)<2&&u.x+u.y<e.x+e.y);ctx.globalAlpha=covered?.35:1;ctx.drawImage(art.tree(e,game.options),-48,-96);}

 else if(e.kind==='building'&&e.pendingSite){const w=d.size*22;ctx.setLineDash([5,4]);poly(ctx,[[-w*1.6,0],[0,-w*.8],[w*1.6,0],[0,w*.8]],'#89b3c41a',team);ctx.setLineDash([]);ctx.fillStyle='#c6d7d6';ctx.font='10px Segoe UI';ctx.textAlign='center';ctx.fillText('SITE CHECK PENDING',0,-12);}

 else if(e.kind==='building'){const f=D.factions[e.campaignFaction||game.players[e.owner].faction];ctx.globalAlpha=isVisible(e)?1:.5;const w=d.size*22;poly(ctx,[[-w*1.6,0],[0,-w*.8],[w*1.6,0],[0,w*.8]],'#797d5c20');for(let j=0;j<12;j++){ctx.fillStyle=j%2?'#79805a80':'#8e917469';const x=(hash(e.id,j,3)-.5)*w*2.8,y=(hash(e.id,j,5)-.5)*w*.9;ctx.fillRect(x,y,2,2);}

 if(s){poly(ctx,[[-w*1.6,0],[0,-w*.8],[w*1.6,0],[0,w*.8]],null,team);}if(e.progress<1)ctx.globalAlpha*=.35+e.progress*.65;

 const scale=d.size*.53;if(e.progress<1){ctx.globalAlpha=isVisible(e)?1:.5;ctx.drawImage(art.construction(d,f,e.progress,false),-120*scale,-181*scale,240*scale,220*scale);ctx.globalAlpha*=.35+e.progress*.65;}if(!window.FractureCampaignLandmarks?.drawObject(ctx,game,e,d))ctx.drawImage(FractureArt.paintOwner(art.building(d,f,d.kind==='wall'?(wallMasks.get(e.id)||0):null),team),-120*scale,-181*scale,240*scale,220*scale);window.FractureCampaignLandmarks?.drawAdornment(ctx,game,e,d);if(e.progress<1){ctx.globalAlpha=isVisible(e)?1:.5;ctx.drawImage(art.construction(d,f,e.progress,true),-120*scale,-181*scale,240*scale,220*scale);}

 ctx.globalAlpha=isVisible(e)?1:.5;

 const extensionJob=e.queue?.find(q=>q.kind==='extension'),extensionDef=f.extensions.find(x=>x.name===e.extension||x.id===extensionJob?.type);

 if(extensionDef){

  const ex=point(e.x+d.size+1.2,e.y),ox=(ex.x-p.x)/zoom,oy=(ex.y-p.y)/zoom,progress=e.extension?1:Math.max(.06,Math.min(1,1-extensionJob.remaining/extensionJob.total));

  const start=point(e.x+d.size*.64,e.y),sx=(start.x-p.x)/zoom,sy=(start.y-p.y)/zoom,dx=ox-sx,dy=oy-sy,len=Math.hypot(dx,dy)||1,nx=-dy/len*6,ny=dx/len*6;
  // Low foundation apron joins both bases; no raised pipe between buildings.
  const paving=f.id==='reptilians'?'#8a8e70':f.id==='machines'?'#465c64':'#75878a',edge=f.id==='reptilians'?'#b5ad86':'#a4b3ad';
  poly(ctx,[[sx-nx,sy-ny],[ox-nx,oy-ny],[ox+nx,oy+ny],[sx+nx,sy+ny]],paving,'#35464a');
  ctx.strokeStyle=edge;ctx.lineWidth=.65;for(let t=.15;t<1;t+=.18){ctx.beginPath();ctx.moveTo(sx+dx*t-nx,sy+dy*t-ny);ctx.lineTo(sx+dx*t+nx,sy+dy*t+ny);ctx.stroke();}

  if(progress<1)ctx.drawImage(art.construction(extensionDef,f,progress,false),ox-78,oy-117.65,156,143);ctx.globalAlpha*=.35+progress*.65;ctx.drawImage(art.extension(extensionDef,f),ox-52,oy-72.8,104,91);ctx.globalAlpha=isVisible(e)?1:.5;

  if(progress<1){ctx.drawImage(art.construction(extensionDef,f,progress,true),ox-78,oy-117.65,156,143);ctx.fillStyle='#25383c';ctx.fillRect(ox-17,oy-38,34,3);ctx.fillStyle='#c9b67b';ctx.fillRect(ox-17,oy-38,34*progress,3);}

 }



 if(d.kind==='deepMine'&&e.progress>=1&&isVisible(e)){const pile=Math.min(6,Math.ceil((e.stockpile||0)/24));for(let i=0;i<pile;i++){ctx.fillStyle=['#b7aa83','#626d75','#87b7ac','#b9a0d1'][D.resources.indexOf(d.resource)];ctx.fillRect(9+(i%3)*4,4-Math.floor(i/3)*4,3,3);}if(game.time-(e.lastExtraction||-100)<1.2){ctx.fillStyle='#d2bf7c';ctx.fillRect(9,0,3,3);}}
 if(e.progress<1){ctx.fillStyle='#111a20';ctx.fillRect(-25,17,50,4);ctx.fillStyle='#b8b17a';ctx.fillRect(-25,17,50*e.progress,4);}

 if(!['wall','trap'].includes(d.kind)){ctx.fillStyle=team;ctx.fillRect(3,-d.size*36-10,9,5);ctx.strokeStyle='#84928a';ctx.beginPath();ctx.moveTo(3,-d.size*36-11);ctx.lineTo(3,-d.size*36+5);ctx.stroke();}

 if(s||e.hp<e.maxHp){ctx.fillStyle='#111a1e';ctx.fillRect(-25,-d.size*37-14,50,4);ctx.fillStyle='#87a86c';ctx.fillRect(-25,-d.size*37-14,50*Math.max(0,e.hp/e.maxHp),4);}if(s&&e.rally&&!['wall','trap'].includes(d.kind)){const r=point(e.rally.x,e.rally.y);ctx.strokeStyle=team+'80';ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo((r.x-p.x)/zoom,(r.y-p.y)/zoom);ctx.stroke();ctx.setLineDash([]);}}

 else if(e.kind==='unit'){const f=D.factions[e.campaignFaction||game.players[e.owner].faction],air=d.air&&e.action!=='land',alt=air?23:0,vs=unitScale(d);ellipse(ctx,2,2,d.role==='giant'?17:vs>1?11*vs:6,d.role==='giant'?6:vs>1?4.5*vs:2.7,'#15201b40');if(s){ctx.strokeStyle=team;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,d.role==='giant'?18:vs>1?12*vs:9,d.role==='giant'?7:vs>1?5*vs:4,0,0,6.28);ctx.stroke();}const frame=e.windup?(e.windup.fired?(e.windup.time<.12?3:2):(e.windup.time>.45?0:1)):Math.floor((air&&e.action==='idle'?game.time*6:e.action==='heal'?game.time*5:e.phase||0))%(['gather','build','heal'].includes(e.action)?4:6);ctx.save();const hitAge=game.time-(e.hitAt??-10),recoil=hitAge<.24?Math.sin(hitAge/.24*Math.PI)*3:0,thrust=d.range<2&&e.windup?Math.sin((.65-e.windup.time)/.65*Math.PI)*2.5:0;const rx=Math.cos(e.hitFace||0)*recoil+Math.cos(e.face)*thrust,ry=Math.sin(e.hitFace||0)*recoil+Math.sin(e.face)*thrust;ctx.translate(rx-ry,(rx+ry)*.5);ctx.drawImage(FractureArt.paintOwner(art.unit(e.campaignEmperor?{...d,id:d.id+'-emperor-'+(e.campaignTailShed?'shed':'whole'),campaignEmperor:true,campaignTailShed:!!e.campaignTailShed}:d,f,e.face,e.action,frame,d.transport?game.transportLoad(e).length:0),team),-44.8*vs,-69.6*vs-alt,89.6*vs,89.6*vs);ctx.restore();if(s||game.time-e.hitAt<3){const y=-Math.max(34,30*vs)-alt;ctx.fillStyle='#10171b';ctx.fillRect(-12,y,24,3);ctx.fillStyle=e.hp/e.maxHp>.3?'#8fa77c':'#bc7962';ctx.fillRect(-12,y,24*e.hp/e.maxHp,3);}if(e.carry>0){ctx.fillStyle=['#ada17e','#606254','#87b7ac','#b9a0d1'][e.carryType];ctx.fillRect(4,-12,4,4);}if(e.action==='heal'){ctx.strokeStyle='#8abca47a';ctx.beginPath();ctx.arc(0,-12,9+Math.sin(game.time*4)*2,0,6.28);ctx.stroke();}}

 ctx.restore();}

 for(const e of game.effects){if(e.kind==='ruin'||!isVisible(e))continue;const p=point(e.x,e.y);ctx.save();ctx.translate(p.x,p.y);ctx.scale(zoom,zoom);ctx.globalAlpha=Math.min(1,e.time*2);if(e.kind==='impact'){FractureProjectiles.impact(ctx,e);}else if(e.kind==='corpse'){const d=D.units[e.type],f=D.factions[e.campaignFaction||game.players[e.owner].faction],vs=unitScale(d);ctx.drawImage(FractureArt.paintOwner(art.unit(d,f,e.face,'dead',0),colors[e.owner]||'#a4b17d'),-44.8*vs,-69.6*vs,89.6*vs,89.6*vs);}else if(e.kind==='slash'){ctx.strokeStyle='#e8d2a2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-12,11,e.face,e.face+1.7);ctx.stroke();}else{const r=(1-e.time/e.max)*(e.kind==='explosion'?20:8)+2;ellipse(ctx,0,-5,r,r*.7,e.kind==='heal'?'#a6d1bc80':'#e6ae6080');ellipse(ctx,0,-7,r*.35,r*.4,'#efdaa1');}ctx.restore();}

 for(const q of game.projectiles){if(!isVisible(q))continue;const src=game.entity(q.source),d=src?game.def(src):null,shot=q.shot||{...FractureProjectiles.categories[q.weapon||'spell'],kind:q.weapon||'spell',muzzle:{x:20,y:0,z:24}},a=q.face??Math.atan2(q.toY-q.fromY,q.toX-q.fromX),vs=unitScale(d),m=d&&!q.building?(art.releaseUnit(d,D.factions[d.faction],a).weaponMuzzle||shot.muzzle):shot.muzzle,facing=Math.round(a/(Math.PI/4))*Math.PI/4,ca=Math.cos(facing),sa=Math.sin(facing),ox=q.building?0:(m.x*ca-m.y*sa)*.0266667*vs,oy=q.building?0:(m.x*sa+m.y*ca)*.0266667*vs,start=point(q.fromX+ox,q.fromY+oy),end=point(q.toX,q.toY),t=Math.min(1,q.elapsed/q.flight),launch=(q.building?(d?.size||1)*35:m.z*.8*vs+(q.air?23:0))*zoom,arc=shot.arc*zoom;

 const x=start.x*(1-t)+end.x*t,y=(start.y-launch)*(1-t)+(end.y-12*zoom)*t-Math.sin(t*Math.PI)*arc,dx=end.x-start.x,dy=end.y-12*zoom-(start.y-launch)-Math.cos(t*Math.PI)*Math.PI*arc;ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(dy,dx));ctx.scale(zoom,zoom);FractureProjectiles.draw(ctx,shot,t,q.elapsed*9);ctx.restore();}





 if(buildType&&mouse.x>=0){

 const raw=unproject(mouse.x,mouse.y),w=game.snapWallPoint(buildType,0,{x:Math.round(raw.x*4)/4,y:Math.round(raw.y*4)/4}),d=D.buildings[buildType],err=w.snapId?null:game.placement(buildType,0,w.x,w.y),p=point(w.x,w.y);

 // Preview the full surveyed foundation, not a smaller decorative diamond.

 const footprint=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{const radius=d.kind==='wall'?.5:d.size,q=point((d.kind==='wall'?Math.floor(w.x)+.5:w.x)+x*radius,(d.kind==='wall'?Math.floor(w.y)+.5:w.y)+y*radius);return[q.x,q.y];});

 poly(ctx,footprint,err?'#be615433':'#a5c39433',err?'#d18779':'#cad8aa');
 if(Object.values(D.extensions).some(ex=>ex.building===d.id)){const ex=w.x+d.size+1.2,ey=w.y;ctx.setLineDash([5,3]);poly(ctx,[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,y])=>{const q=point(ex+x,ey+y);return[q.x,q.y];}),err?'#c65b3c33':'#c7a85d44','#ead08a');ctx.setLineDash([]);const ep=point(ex,ey);ctx.font='11px Segoe UI';ctx.fillStyle='#ead08a';ctx.fillText('Reserved extension',ep.x+12,ep.y);}

 for(const obstacle of game.placementBlockers(buildType,0,w.x,w.y)){const q=point(obstacle.x,obstacle.y),r=obstacle.size+.4;ctx.strokeStyle='#ef8e76';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.ellipse(q.x,q.y,r*34*zoom,r*17*zoom,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=1;}

 const trees=game.entities.filter(e=>e.kind==='tree'&&e.hp>0&&isVisible(e)&&dist(e,w)<(e.size||.4)+d.size+.4);

 const label=err||(w.snapId?'Snapped to existing wall - drag to extend':d.name)+(!(d.kind==='wall'?game.constructionSiteVisible(0,Math.floor(w.x)+.5,Math.floor(w.y)+.5,.49):game.constructionSiteVisible(0,w.x,w.y,d.size))?' · site check on arrival; full refund if blocked':trees.length?' · clears decorative trees':'');ctx.font='11px Segoe UI';ctx.fillStyle='#101b20e8';ctx.fillRect(p.x+9,p.y-27,ctx.measureText(label).width+10,21);ctx.fillStyle=err?'#f1baaa':'#e0e3d4';ctx.fillText(label,p.x+14,p.y-12);

 }

 if(fortificationDrag){const end=unproject(mouse.x,mouse.y);for(const c of game.fortificationPlan(fortificationDrag.type,fortificationDrag,end)){const p=point(c.x,c.y),err=game.snapWallPoint(fortificationDrag.type,0,c).snapId?null:game.placement(fortificationDrag.type,0,c.x,c.y);poly(ctx,[[p.x,p.y-12*zoom],[p.x+24*zoom,p.y],[p.x,p.y+12*zoom],[p.x-24*zoom,p.y]],err?'#b85c5344':'#9abf7855',err?'#dc8777':'#c4d7a0');}}
 if(rightDrag&&dist({x:rightDrag.x,y:rightDrag.y},mouse)>10){const dest=unproject(rightDrag.x,rightDrag.y),aim=unproject(mouse.x,mouse.y),face=Math.atan2(aim.y-dest.y,aim.x-dest.x);for(const slot of game.formationLayout(ownUnits(),formation,dest,face)){const q=point(slot.x,slot.y),ok=!game.blocked(slot.x,slot.y,game.def(slot.unit).air,0);ctx.strokeStyle=ok?'#d5cd98':'#e18065';ctx.beginPath();ctx.ellipse(q.x,q.y,7*zoom,3.5*zoom,0,0,Math.PI*2);ctx.stroke();const tip=point(slot.x+Math.cos(slot.face)*.5,slot.y+Math.sin(slot.face)*.5);ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(tip.x,tip.y);ctx.stroke();}ctx.strokeStyle='#d5cd98';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(rightDrag.x,rightDrag.y);ctx.lineTo(mouse.x,mouse.y);ctx.stroke();const a=Math.atan2(mouse.y-rightDrag.y,mouse.x-rightDrag.x);poly(ctx,[[mouse.x,mouse.y],[mouse.x-Math.cos(a-.4)*12,mouse.y-Math.sin(a-.4)*12],[mouse.x-Math.cos(a+.4)*12,mouse.y-Math.sin(a+.4)*12]],'#d5cd98');}

 ctx.restore();art.liveRendering=false;

 }

let miniColors=null,miniTerrain=null,miniGame=null,miniRevision=-1,miniSpectate=null;

function drawMini(){

 mc.fillStyle='#091117';mc.fillRect(0,0,270,190);const scale=170/game.n,ox=50;

 if(miniGame!==game){miniTerrain=document.createElement('canvas');miniTerrain.width=miniTerrain.height=game.n;miniGame=game;miniColors=FractureEnvironments.miniColors(game);miniRevision=-1;}

 if(miniRevision!==game.visionRevision||miniSpectate!==game.options.spectate){const c=miniTerrain.getContext('2d'),im=c.createImageData(game.n,game.n),p=game.players[0];for(let i=0;i<game.map.length;i++){if(!game.options.spectate&&!p.explored[i])continue;const j=i*4,k=i*3;im.data[j]=miniColors[k];im.data[j+1]=miniColors[k+1];im.data[j+2]=miniColors[k+2];im.data[j+3]=game.options.spectate||p.visible[i]?255:115;}c.putImageData(im,0,0);miniRevision=game.visionRevision;miniSpectate=game.options.spectate;}

 mc.imageSmoothingEnabled=false;mc.drawImage(miniTerrain,ox,10,170,170);for(const e of game.entities){if(e.hp<=0||!isVisible(e)||e.kind==='tree')continue;mc.fillStyle=e.kind==='resource'?['#c2b27a','#52646c','#8fcab2','#ba9bda'][e.resource]:colors[e.owner];const sz=e.kind==='building'?4:2;mc.fillRect(ox+e.x*scale-sz/2,10+e.y*scale-sz/2,sz,sz);}window.FractureCampaignUI?.miniMarkers(mc,game,scale,ox);const v=viewport(),corners=[[0,48],[v.w,48],[v.w,v.h+48],[0,v.h+48]].map(([x,y])=>unproject(x,y)).map(p=>[ox+p.x*scale,10+p.y*scale]);poly(mc,corners,null,'#dfdcc0');}



function button(label,detail,callback,disabled=false,tip='',icon=null){const host=$('actions');let b=[...host.querySelectorAll('button.action')].find(x=>x.dataset.actionLabel===label&&x.dataset.faction===game.players[0].faction);const fresh=!b;if(fresh){b=document.createElement('button');b.dataset.actionLabel=label;b.dataset.faction=game.players[0].faction;b.className='action';}actionUsed.add(b);b.classList.remove('active');b.disabled=disabled;b.dataset.tip=tip||(label==='Cancel foundation'?'Remove this unfinished building and refund 75% of its construction cost.':label);b.setAttribute('aria-description',b.dataset.tip);const text=b.querySelector('div')||document.createElement('div');const markup=`<strong>${label}</strong><small>${detail}</small>`;if(text.innerHTML!==markup)text.innerHTML=markup;if(icon&&fresh){const c=document.createElement('canvas');c.width=50;c.height=50;const cc=c.getContext('2d');cc.imageSmoothingEnabled=false;if(icon.kind==='unit'){const d=icon.def,im=FractureArt.paintOwner(art.unit(d,D.factions[game.players[0].faction],0,'idle',0),colors[0]);cc.drawImage(im,54,51,228,228,0,0,50,50);}else if(icon.kind==='extension'){const im=art.extension(icon.def,D.factions[game.players[0].faction]);cc.drawImage(im,60,70,210,190,0,0,50,46);}else{const d=icon.def,im=FractureArt.paintOwner(art.building(d,D.factions[game.players[0].faction]),colors[0]);cc.drawImage(im,40,130,400,300,0,2,50,40);}b.appendChild(c);}if(!text.parentNode)b.appendChild(text);b.onclick=callback;if(fresh)host.appendChild(b);return b;}

function updateUI(){if(!playing)return;const p=game.players[0],f=D.factions[p.faction],list=selected(),e=list[0],d=e?game.def(e):null;$('resources').innerHTML=p.stock.map((n,i)=>`<div class="resource"><i>${symbols[i]}</i><div><small>${names[i]}</small><b>${Math.floor(n)}</b></div></div>`).join('')+`<div class="resource"><div><small>POPULATION</small><b>${game.population(0)} / ${game.capacity(0)}</b></div></div>`+`<div class="resource"><div><small>TRADE CREDITS</small><b>${Math.floor(p.tradeCredits||0)}</b></div></div>`+(f.counter?`<div class="resource"><div><small>${f.counter.toUpperCase()}</small><b>${p.special}</b></div></div>`:'');$('clock').textContent=Math.floor(game.time/60).toString().padStart(2,'0')+':'+Math.floor(game.time%60).toString().padStart(2,'0');$('factionLabel').textContent=f.name;$('mapseed').textContent='SEED '+game.options.seed;$('pause').textContent=game.paused?'▶':'Ⅱ';

 let title='No selection',details='Click a unit or drag to select a group.',stats='';if(e?.kind==='resource'){title=names[e.resource];details=e.amount<=0?'EXHAUSTED · research Subsurface Extraction for a worker-operated deep facility':`${Math.ceil(e.amount)} remaining · finite deposit`;stats=e.resource===1?(oilWellReady(e)?'Extraction ready · right-click with workers.':'Build a Lastrian extraction well beside this deposit.'):'Right-click with workers to gather.';}else if(e){title=list.length>1?list.length+' units selected':e.campaignName||d.name;details=e.kind==='unit'?d.role.toUpperCase()+' · '+D.factions[e.campaignFaction||game.players[e.owner].faction].name:e.progress<1?'UNDER CONSTRUCTION · '+Math.floor(e.progress*100)+'%':d.kind.toUpperCase()+(e.extension?' · '+e.extension:'');stats=e.kind==='unit'?`ATK ${d.damage} · ARM ${d.armor||0} · RANGE ${d.range}<br>${e.blockReason||e.order?.kind||'Standing by'}`:d.kind==='defense'?'ATK 23 · RANGE 8 · ground & air':e.kind==='building'&&e.queue.length?e.queue.length+' queued':'Right-click ground to set rally point';}

 if(e?.gateId){title='Gate';details='FRIENDLY PASSAGE';stats='Opens for friendly ground units. Enemy ground units remain blocked.';}
 if(e?.campaignName){const hint=window.FractureCampaignUI?.siteHint(e);if(hint)stats=hint;}
 if(e?.kind==='unit'&&d.damage>0&&!d.worker){const counter=FractureHelp.unit(d).match(/Strong against: ([^.]+)/);if(counter)stats+='<br><strong>Strong against:</strong> '+counter[1];}
 $('selection').innerHTML=`<canvas id="portrait" width="90" height="90"></canvas><div><h3>${title}</h3><p>${details}</p>${e&&e.kind!=='resource'?`<div class="hp"><div style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></div></div><p>${Math.ceil(e.hp)} / ${e.maxHp} HP</p>`:''}<p>${stats}</p></div>`;

 if(e){const c=$('portrait').getContext('2d');c.imageSmoothingEnabled=false;if(e.kind==='unit')c.drawImage(FractureArt.paintOwner(art.unit(d,D.factions[e.campaignFaction||game.players[e.owner].faction],0,'idle',0),colors[e.owner]||'#a4b17d'),54,51,228,228,0,0,90,85);else if(e.kind==='building')c.drawImage((e.gateId?art.gatePortrait(d,D.factions[e.campaignFaction||game.players[e.owner].faction],e.gateAngle,colors[e.owner]||'#a4b17d'):FractureArt.paintOwner(art.building(d,D.factions[e.campaignFaction||game.players[e.owner].faction]),colors[e.owner]||'#a4b17d')),10,80,450,350,0,10,90,68);else if(e.kind==='resource')c.drawImage(art.resource(e),0,0,90,85);}

 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));actionUsed=new Set();$('actions').querySelectorAll('.hint').forEach(h=>h.remove());$('queue').replaceChildren();

 if(e?.owner===0&&d?.kind==='wall'&&!e.gateId){const gate=game.gatePlan(e.id,0);button('Convert to gate','3 WALL SECTIONS',()=>{const r=game.convertWallToGate(e.id,0);execute(r);if(r.ok)toast('Gate ready. Friendly units can pass.');},!gate.ok,gate.ok?'Instantly convert this wall section and one neighbor on each side. No worker or extra cost. Existing damage is preserved.':gate.reason);}
 if(tab==='orders'){const units=ownUnits();if(units.some(u=>game.def(u).disarmsMines))button('Clear mines','INSPECT AREA',()=>{mode='clearMines';toast('Choose a small area to inspect. Dismantling takes 12 seconds per mine.');},false,'Specialist infantry inspect nearby ground and dismantle concealed enemy mines. Each mine takes 12 uninterrupted seconds; these soldiers are vulnerable while working. A normal move order risks detonation.');if(units.some(u=>game.def(u).transport))button('Unload passengers','U',()=>{mode='unload';toast('Choose an open landing area beside the transport.');},false,'Move beside a shoreline or open ground, then choose where your actual passengers should disembark.');for(const [label,key,order] of [['Move','M','move'],['Attack move','A','attackMove'],['Hold position','H','hold'],['Stop','S','stop'],['Patrol','P','patrol'],['Field ability','Q','ability']]){const b=button(label,key,()=>{if(order==='ability')game.ability(units.map(u=>u.id));else if(['hold','stop'].includes(order))game.order(units.map(u=>u.id),{kind:order});else mode=order;uiAt=0;},!units.length,FractureHelp.orders[order]);b.classList.add('order-btn');}

 for(const name of ['line','column','wedge','circle']){const b=button(name[0].toUpperCase()+name.slice(1),'FORMATION',()=>{formation=name;uiAt=0;},!units.length,FractureHelp.formations[name]);b.classList.add('order-btn');if(formation===name)b.classList.add('active');}$('actions').insertAdjacentHTML('beforeend','<div class="hint">Right-drag to face your formation.<br>Ctrl + number saves. Shift + number adds a saved group.</div>');}

 if(tab==='build'){for(const b of f.buildings.filter(b=>!game.campaign||!FractureCampaign.restriction(game,b,'building'))){const missing=game.missing(0,b),disabled=!workers().length||!game.affordable(0,b.cost)||missing.length;button(b.name,price(b.cost),()=>{buildType=b.id;mode=null;toast('Place '+b.name+'. Right-click cancels.');},disabled,b.name+'\n'+FractureHelp.building(b,f)+'\n\n'+price(b.cost)+'\n'+b.time+' seconds'+(missing.length?'\nRequires '+missing.join(', '):'')+(!workers().length?'\nSelect a worker.':''),{kind:'building',def:b});}}

 if(['train','research'].includes(tab)){if(!e||e.kind!=='building'||e.owner!==0){$('actions').innerHTML='<div class="hint">Select one of your buildings to see its units and technologies. Each production branch has its own requirements.</div>';}else if(tab==='train'){const options=f.units.filter(u=>u.building===e.type&&(!game.campaign||!FractureCampaign.restriction(game,u,'unit')));for(const u of options){const miss=game.missing(0,u,e),disabled=e.progress<1||miss.length||!game.affordable(0,u.cost)||p.special<(u.special||0)||game.population(0)+u.pop>game.capacity(0);button(u.name,price(u.cost)+(u.special?' · '+u.special+' '+f.counter:''),()=>execute(game.queue(e.id,u.id)),disabled,`${u.name}\n${FractureHelp.unit(u)}\n\nHP ${u.hp} · damage ${u.damage} · range ${u.range}\n${u.pop} population · ${u.time}s\n${price(u.cost)}${miss.length?'\nRequires '+miss.join(', '):''}`+(game.population(0)+u.pop>game.capacity(0)?'\nBuild more population housing.':''),{kind:'unit',def:u});}if(!options.length)$('actions').innerHTML='<div class="hint">This building does not train units. Open TECH to view available research.</div>';}

 else{for(const r of f.research.filter(r=>r.building===e.type)){const done=p.tech.includes(r.id),queued=game.entities.some(b=>b.owner===0&&b.queue?.some(q=>q.type===r.id)),miss=game.missing(0,r);button(r.name,done?'COMPLETED':queued?'RESEARCHING':price(r.cost),()=>execute(game.queue(e.id,r.id,'research')),done||queued||miss.length||!game.affordable(0,r.cost)||e.progress<1,`${r.name}\n${r.kind==='weapons'?'+12% damage per level':r.kind==='armor'?'+2 armor per level':r.kind==='economy'?'+30% gathering rate':r.kind==='training'?'+20% training speed in this building':r.kind==='range'?'+15% range for units from this building':r.kind==='endurance'?'+45 seconds flight endurance after refueling':r.kind==='healing'?'+4 healing per second':'Unlocks advanced branch units'}\n${r.time}s · ${price(r.cost)}${miss.length?'\nRequires '+miss.join(', '):''}`);}

 for(const x of f.extensions.filter(x=>x.building===e.type)){const miss=game.missing(0,x,e),pending=e.queue.some(q=>q.kind==='extension');button(x.name,e.extension===x.name?'ATTACHED':price(x.cost),()=>execute(game.queue(e.id,x.id,'extension')),!!e.extension||pending||miss.length||!game.extensionFits(e)||!game.affordable(0,x.cost)||e.progress<1,`${x.name}\nPhysical extension. One per building. Needs clear land to the east.\nUnlocks: ${f.units.filter(u=>u.building===e.type&&u.extension===x.name).map(u=>u.name).join(', ')}${miss.length?'\nRequires '+miss.join(', '):''}`,{kind:'extension',def:x});}if(!$('actions').children.length)$('actions').innerHTML='<div class="hint">No research in this building. Select a laboratory, academy or production building with an extension slot.</div>';}}

 if(d?.kind==='neutral'){button('Recruit volunteer','120 Ore � 30 Aetherite',()=>execute(game.recruitNeutral(e.id)),(e.recruits?.[0]||0)>=2,'Bring a unit within six tiles. Recruit up to two local volunteers per settlement; normal population limits apply.');$('selection').lastElementChild.lastElementChild.textContent='Neutral refuge � '+(2-(e.recruits?.[0]||0))+' volunteers available. Bring a unit nearby to recruit.';}
 if(e?.owner===0&&d?.transport){$('selection').lastElementChild.lastElementChild.textContent='Passengers '+game.transportLoad(e).length+' / '+d.transport+' · U to unload';}
 if(e?.owner===0&&d?.kind==='deepMine'){$('selection').lastElementChild.lastElementChild.textContent='Loading area: '+Math.floor(e.stockpile||0)+' / 144 � '+game.entities.filter(u=>u.order?.kind==='extract'&&u.order.target===e.id).length+' workers assigned';}if(e?.owner===0&&d?.kind==='deepMine')button('Assign workers','RIGHT-CLICK',()=>{const idle=game.entities.filter(u=>u.owner===0&&u.kind==='unit'&&game.def(u).worker&&!u.order).slice(0,4);game.order(idle.map(u=>u.id),{kind:'extract',target:e.id});toast(idle.length?'Assigned '+idle.length+' idle workers.':'Select workers and right-click this mine.');},false,'Workers enter the mine, bring six resources to the loading area, and haul them to a collection building. With a group, miners and haulers divide the work.');
 if(e?.owner===0&&d?.kind==='market')for(let ri=0;ri<4;ri++)button('Buy '+names[ri],'20 credits → 10',()=>execute(game.exchange(0,ri)),(p.tradeCredits||0)<20,'Spend trade-only credits on ten '+names[ri]+'. Credits cannot pay directly for military production.');
 // Destructive actions live behind a separate disclosure, only in Orders.
 let management=$('selectionManagement');
 if(tab==='orders'&&list.some(v=>v.owner===0&&['unit','building'].includes(v.kind))){
  if(!management){management=document.createElement('details');management.id='selectionManagement';management.innerHTML='<summary>Manage selection</summary><p>Removing completed units or buildings is permanent.</p>';$('actions').appendChild(management);}
  const selectionKey=selection.join(',');if(management.dataset.selection!==selectionKey){management.open=false;management.dataset.selection=selectionKey;}
  const remove=button('Delete / demolish','DELETE',()=>{execute(game.demolish(selected().map(v=>v.id),0));choose([]);},false,'Remove selected owned units or buildings. Completed items are not refunded. Unfinished construction and queued work return their unused cost. No kills, Captives or Biomass are awarded.');remove.classList.add('destructive-action');management.appendChild(remove);$('actions').appendChild(management);
 }else management?.remove();
 if(e?.queue&&e.owner===0)for(const [qi,q] of e.queue.entries()){const def=(q.kind==='unit'?D.units:q.kind==='research'?D.research:D.extensions)[q.type];$('queue').insertAdjacentHTML('beforeend',`<div class="queue-item"><i style="width:${100*(1-q.remaining/q.total)}%"></i><span>${def.name} · ${Math.ceil(q.remaining)}s</span><button data-cancel-queue="${qi}" data-tip="Cancel this queued item and refund its unused production cost. Already completed work is not refunded." aria-label="Cancel queued production">×</button></div>`);}document.querySelectorAll('[data-cancel-queue]').forEach(b=>b.onclick=()=>{game.cancelQueue(e.id,Number(b.dataset.cancelQueue));uiAt=0;});if(e?.kind==='building'&&e.owner===0&&e.progress<1)button(e.pendingSite?'Cancel planned building':'Cancel foundation',e.pendingSite?'Full refund':'75% refund',()=>{game.cancelConstruction(e.id);choose([]);},false,e.pendingSite?'Cancel this planned building and return its full reserved cost.':'Remove this unfinished foundation and refund 75% of its cost.');$('actions').querySelectorAll('button.action').forEach(b=>{if(!actionUsed.has(b))b.remove();});drawMini();cursor();

}

function setupPreview(){const f=D.factions[$('faction').value];$('universe').textContent=f.universe;$('factionName').textContent=f.name;$('factionDescription').textContent=f.description;const c=$('factionArt').getContext('2d');c.clearRect(0,0,230,180);c.imageSmoothingEnabled=false;c.drawImage(art.building(f.buildings[0],f),0,-20,230,210);}

for(const f of Object.values(D.factions)){for(const id of ['faction','opponent']){const o=document.createElement('option');o.value=f.id;o.textContent=f.name+' — '+f.universe;$(id).appendChild(o);}}$('opponent').value='reptilians';$('faction').onchange=setupPreview;setupPreview();$('randomFaction').onclick=()=>{const ids=Object.keys(D.factions);$('faction').value=ids[Math.floor(Math.random()*ids.length)];setupPreview();};

function activate(g,preparedTerrain=null){pendingView=null;lastReadyView=null;terrain.dispose?.();game=g;playing=true;window.FractureAudio?.update(game);selection=[];mode=null;buildType=null;groups=game.controlGroups||{};resultShown=false;terrain=preparedTerrain||art.terrain(game);zoom=1.2;center(game.starts[0]);$('setup').hidden=true;for(const id of ['hud','command','status'])$(id).hidden=false;choose(game.entities.filter(e=>e.owner===0&&e.kind==='unit'&&D.units[e.type].worker).map(e=>e.id));toast(game.campaign?'Mission ready. Your objectives are at the upper left.':game.options.startingResources===false?'Five workers ready. Scout for resource clusters and secure a deposit.':'Five workers ready. Right-click Ore to begin gathering.');uiAt=0;window.dispatchEvent(new Event('fracture-ready'));}

async function launchMatch(create){if(loading)return;loading=true;$('loading').hidden=false;$('loadingProgress').value=0;$('loadingText').textContent='Preparing the battlefield';const report=(value,text)=>{$('loadingProgress').value=value;$('loadingText').textContent=text;};

 try{await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));const g=create();report(.15,'Drawing terrain');const prepared=await FractureStartup.prepare(art,g,report);activate(g,prepared);updateUI();render();report(1,'Ready');}

 catch(error){toast('Could not prepare this match: '+error.message);console.error(error);}

 finally{loading=false;lastFrame=performance.now();$('loading').hidden=true;}

}

const rememberedEnvironments={Kareth:'varied',Elyndra:'varied',Morvane:'hell'};
$('theme').onchange=()=>{const theme=$('theme').value;$('environment').replaceChildren(...FractureEnvironments.choices(theme).map(e=>new Option(e.name,e.id)));$('environment').value=rememberedEnvironments[theme];};
$('environment').onchange=()=>{rememberedEnvironments[$('theme').value]=$('environment').value;};
$('start').onclick=()=>{const ids=Object.keys(D.factions),n=$('players').value==='team'?4:Number($('players').value),fs=[$('faction').value,$('opponent').value];while(fs.length<n)fs.push(ids[(fs.length*3+Math.floor(Math.random()*ids.length))%ids.length]);launchMatch(()=>new Game({factions:fs,size:Number($('size').value),theme:$('theme').value,environment:$('environment').value,layout:$('layout').value,resourceAmount:Number($('resourceAmount').value),resourcePlacement:$('resourcePlacement').value,startingResources:$('startingResources').checked,neutralSettlements:$('neutralSettlements').checked,seed:Number($('seed').value)||Math.floor(Math.random()*999999),difficulty:$('difficulty').value,teams:$('players').value==='team'?[0,1,0,1]:fs.map((_,i)=>i),spectate:$('spectate').checked}));};

function save(){if(game.campaign)return window.FractureCampaignUI?.save();try{localStorage.setItem('the-fracture-save-v1',game.serialize());toast('Match saved on this computer.');}catch(e){toast('Local save failed. Use Export Save File instead.');}}

function load(){if(playing&&game.campaign)return window.FractureCampaignUI?.load();try{const text=localStorage.getItem('the-fracture-save-v1');if(!text){toast('No saved match yet.');return;}launchMatch(()=>Game.restore(text));}catch(e){toast('Could not load this save: '+e.message);}}

$('load').onclick=load;$('save').onclick=save;$('export').onclick=()=>{if(game.campaign)return window.FractureCampaignUI?.export();const url=URL.createObjectURL(new Blob([game.serialize()],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='The-Fracture-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};$('import').onchange=async e=>{try{const file=e.target.files[0];if(file){const text=await file.text();$('pauseMenu').close();await launchMatch(()=>Game.restore(text));}}catch(err){toast('Invalid save: '+err.message);}};

function openMenu(){if(!playing)return;game.paused=true;$('pauseMenu').showModal();}function resume(){game.paused=false;$('pauseMenu').close();}function setup(){if(window.FractureCampaignUI)document.getElementById('campaignObjectives').hidden=true;playing=false;game.paused=true;window.FractureAudio?.update(game);$('setup').hidden=false;for(const id of ['hud','command','status'])$(id).hidden=true;$('pauseMenu').close();$('result').close();}

$('menuButton').onclick=openMenu;$('resume').onclick=resume;$('quit').onclick=setup;$('another').onclick=setup;$('pause').onclick=()=>{game.paused=!game.paused;uiAt=0;};$('pauseMenu').addEventListener('cancel',()=>game.paused=false);

function manual(){manualWasPaused=game.paused;game.paused=true;$('help').showModal();}$('helpButton').onclick=manual;$('manual').onclick=manual;$('closeHelp').onclick=()=>$('help').close();$('help').addEventListener('close',()=>{game.paused=manualWasPaused;});

 document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));

world.oncontextmenu=e=>e.preventDefault();world.addEventListener('pointerdown',e=>{if(!playing||loading||game.paused||e.clientX>viewport().w)return;mouse={x:e.clientX,y:e.clientY};world.setPointerCapture(e.pointerId);if(e.button===1){middle={x:e.clientX,y:e.clientY,cam:{...cam}};return;}if(e.button===2){if(buildType||mode){buildType=null;fortificationDrag=null;mode=null;return;}rightDrag={x:e.clientX,y:e.clientY};return;}if(e.button!==0)return;const w=unproject(e.clientX,e.clientY);if(buildType&&['wall','trap'].includes(D.buildings[buildType].kind)){fortificationDrag={...game.snapWallPoint(buildType,0,w),type:buildType};return;}if(buildType){w.x=Math.round(w.x*4)/4;w.y=Math.round(w.y*4)/4;const r=game.build(buildType,0,w.x,w.y,workers().map(u=>u.id));execute(r);if(r.ok&&r.pending)toast('Workers will check the site on arrival. Blocked sites receive a full refund.');if(r.ok&&!e.shiftKey)buildType=null;return;}if(mode){game.order(ownUnits().map(u=>u.id),{kind:mode,...w,formation});mode=null;return;}drag={x:e.clientX,y:e.clientY,shift:e.shiftKey||e.ctrlKey};});

world.addEventListener('pointermove',e=>{mouse={x:e.clientX,y:e.clientY};if(middle){cam.x=middle.cam.x-(e.clientX-middle.x)/zoom;cam.y=middle.cam.y-(e.clientY-middle.y)/zoom;}if(drag){const box=$('dragbox');box.hidden=false;box.style.left=Math.min(drag.x,mouse.x)+'px';box.style.top=Math.min(drag.y,mouse.y)+'px';box.style.width=Math.abs(mouse.x-drag.x)+'px';box.style.height=Math.abs(mouse.y-drag.y)+'px';}hover=pick(mouse.x,mouse.y);cursor();});

world.addEventListener('pointerup',e=>{if(!playing)return;if(e.button===1){middle=null;return;}if(e.button===0&&fortificationDrag){const start=fortificationDrag,end=unproject(e.clientX,e.clientY);fortificationDrag=null;const result=game.buildFortification(start.type,0,start,end,workers().map(u=>u.id));execute(result);if(result.placed)toast('Placed '+result.placed+' defenses'+(result.reason?'. Stopped: '+result.reason:''));if(result.ok&&!e.shiftKey)buildType=null;uiAt=0;return;}if(e.button===2&&rightDrag){const w=unproject(rightDrag.x,rightDrag.y),dest=unproject(e.clientX,e.clientY),facing=dist(rightDrag,{x:e.clientX,y:e.clientY})>14,hit=pick(rightDrag.x,rightDrag.y),ids=ownUnits().map(u=>u.id);if(ids.length){if(facing)game.order(ids,{kind:'move',...w,face:Math.atan2(dest.y-w.y,dest.x-w.x),formation});else if(hit?.owner===0&&game.def(hit)?.transport)execute(game.board(ids,hit.id,0));else if(hit?.kind==='building'&&hit.owner===0&&game.def(hit).kind==='deepMine'&&hit.progress>=1)game.order(workers().map(u=>u.id),{kind:'extract',target:hit.id});else if(hit?.kind==='building'&&game.def(hit).kind==='market'&&!game.hostile(0,hit.owner))game.order(ids,{kind:'trade',target:hit.id});else if(window.FractureCampaignUI?.commandSite(hit,ids)){}else if(hit?.kind==='resource'&&workers().length)gatherOrder(hit);else if(hit?.kind==='building'&&hit.owner===0&&game.def(hit).resource==='oil'&&hit.progress>=1&&workers().length){const node=game.entities.filter(n=>n.kind==='resource'&&n.resource===1&&n.amount>0&&isVisible(n)&&dist(n,hit)<6).sort((a,b)=>dist(a,hit)-dist(b,hit))[0];if(node)gatherOrder(node);else toast('No visible oil deposit beside this well.');}else if(hit?.owner===0&&hit.kind==='building'&&workers().length&&hit.hp<hit.maxHp)game.order(workers().map(u=>u.id),{kind:hit.progress<1?'build':'repair',target:hit.id});else if(hit?.owner!==undefined&&game.hostile(0,hit.owner))game.order(ids,{kind:'attack',target:hit.id});else game.order(ids,{kind:'move',...w,formation});}else{for(const b of selected().filter(b=>b.kind==='building'&&b.owner===0))b.rally={...w};}rightDrag=null;uiAt=0;return;}

 if(e.button===0&&drag){$('dragbox').hidden=true;let ids=[];if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5){ids=game.entities.filter(u=>{if(u.kind!=='unit'||u.owner!==0||!isVisible(u))return false;const p=point(u.x,u.y);return p.x>=Math.min(drag.x,e.clientX)&&p.x<=Math.max(drag.x,e.clientX)&&p.y-12>=Math.min(drag.y,e.clientY)&&p.y-12<=Math.max(drag.y,e.clientY);}).map(u=>u.id);}else{const hit=pick(e.clientX,e.clientY);if(hit)ids=[hit.id];}choose(drag.shift?[...new Set([...selection,...ids])]:ids);drag=null;}});

world.addEventListener('dblclick',e=>{const hit=pick(e.clientX,e.clientY);if(hit?.kind==='unit'&&hit.owner===0)choose(game.entities.filter(u=>u.kind==='unit'&&u.type===hit.type&&u.owner===0&&isVisible(u)).map(u=>u.id));});world.addEventListener('wheel',e=>{if(!playing||loading)return;e.preventDefault();if(pendingView)zoom=pendingView.zoom;zoom=Math.max(.65,Math.min(2,zoom*(e.deltaY>0?.9:1.1)));if(pendingView)pendingView.zoom=zoom;},{passive:false});world.addEventListener('pointerleave',()=>{if(!drag&&!rightDrag&&!middle)mouse={x:-1,y:-1};});

mini.addEventListener('pointerdown',e=>{const r=mini.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*270,y=(e.clientY-r.top)/r.height*190,s=170/game.n,ox=(270-game.n*s)/2;center({x:Math.max(0,Math.min(game.n,(x-ox)/s)),y:Math.max(0,Math.min(game.n,(y-10)/s))});});

window.addEventListener('keydown',e=>{if(!playing||loading||document.querySelector('#campaignMenu[open],#campaignBriefing[open],#campaignResult[open],#cinematic[open]')||document.activeElement?.matches('input,select'))return;const k=e.key.toLowerCase();if(['f5','f9',' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();if(k==='f5'){save();return;}if(k==='f9'){load();return;}if(k==='escape'){if(buildType||mode){buildType=null;mode=null;}else if(!$('help').open&&!$('pauseMenu').open&&!$('result').open)openMenu();return;}if($('pauseMenu').open||$('help').open)return;keys.add(k);if(e.repeat)return;

 const digit=/^Digit([1-9])$/.exec(e.code)?.[1]||(/^[1-9]$/.test(k)?k:null);if(digit){const k=digit;e.preventDefault();if(e.ctrlKey){groups[k]=selection.filter(id=>game.entity(id)?.owner===0);game.controlGroups=groups;}else if(groups[k]){const saved=groups[k].filter(id=>game.entity(id));choose(e.shiftKey?[...new Set([...selection,...saved])]:saved);if(!e.shiftKey&&lastGroup===k&&performance.now()-lastGroupTime<700&&selected()[0])center(selected()[0]);lastGroup=e.shiftKey?null:k;lastGroupTime=performance.now();}return;}

 if(k===' '){const targets=selected().filter(e=>e.owner===0||isVisible(e));if(targets.length)center({x:targets.reduce((n,e)=>n+e.x,0)/targets.length,y:targets.reduce((n,e)=>n+e.y,0)/targets.length});return;}

 if(k==='u'){mode='unload';return;}if(k==='delete'){e.preventDefault();execute(game.demolish(selected().map(u=>u.id),0));choose([]);return;}if(k==='a'){mode='attackMove';}if(k==='m')mode='move';if(k==='p')mode='patrol';if(k==='h'||k==='s')game.order(ownUnits().map(u=>u.id),{kind:k==='h'?'hold':'stop'});if(k==='q')game.ability(ownUnits().map(u=>u.id));if(k==='pause')game.paused=!game.paused;uiAt=0;});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();mouse={x:-1,y:-1};});

// Shared explanations work in setup, the command panel and modal menus, including disabled controls.

for(const [id,tip] of Object.entries(FractureHelp.buttons)){const b=$(id);if(b){b.dataset.tip=tip;b.setAttribute('aria-description',tip);if(!b.textContent.trim()||['pause','randomFaction','closeHelp'].includes(id))b.setAttribute('aria-label',tip.split('.')[0]);}}

document.querySelectorAll('[data-tab]').forEach(b=>{b.dataset.tip=FractureHelp.tabs[b.dataset.tab];b.setAttribute('aria-description',b.dataset.tip);});

const inputHelp={faction:'Your civilization determines your buildings, army and technology branches.',opponent:'Choose the first opposing civilization.',difficulty:'Gentle through Apocalypse: ten increasingly demanding opponents. Higher difficulties plan faster, build larger economies, research sooner, reinforce more often and use flanks, target priorities and ranged spacing. Apocalypse is the strongest setting. All levels use the same gathering, carrying, construction, training and research rates as the player. Stronger opponents manage more workers, keep production busy and make better tactical decisions. Everyone pays full costs, consumes deposits and scouts through private fog.',theme:'Choose Kareth, Elyndra or Morvane. Each world has its own environment choices.',environment:'Kareth and Elyndra offer temperate countryside, desert, arctic snow, or a map with all three climates. Morvane offers red Hell with stalagmites, or a gray Moon with rock pillars. These decorative obstacles follow tree rules and are cleared when you build on them. Environment does not change resources, water navigation or unit bonuses.',layout:'Natural: broad flat countryside, lakes and occasional flat plateaus with marked ramps. Mountain Passes: broad valleys linked by narrow cliff crossings. Steppes: different plateau heights connected by ramps. Labyrinth: winding corridors, chambers and dead ends. Mediterranean: warm shores around an inland sea. Continental: large landmasses across navigable sea. Coastal: mainland along a winding shoreline. Small and Large Islands require naval or air transport for distant land. Layout and world theme are independent.',size:'Tiny: 100 × 100. Small: 200 × 200. Medium: 300 × 300. Large: 400 × 400. Huge: 500 × 500. Massive: 600 × 600. Colossal: 700 × 700. Larger battlefields take longer to scout and cross.',players:'Choose a duel, a free-for-all, or two teams of two.',resourceAmount:'Choose how many resource clusters appear across the map. Scarce has about half the standard districts; Rich has twice as many; Abundant has four times as many. Starting deposits are controlled separately.',resourcePlacement:'Random clusters can favor any part of the map. Balanced territories plan comparable expansion deposits around each player. Contested frontiers favor areas between neighboring players. All resources stay clustered by type.',startingResources:'Place the usual opening deposits beside every headquarters. Turn this off to scout for all resources.',seed:'Enter a number to recreate the same map layout. Leave blank for a random map.',neutralSettlements:'Add a few neutral refuges with limited paid recruitment. No new civilizations are introduced.',spectate:'Let the AI control every civilization and reveal the battlefield so you can observe.',import:'Load an exported JSON save file. This replaces the current match.',minimap:'Click a location to move the battlefield camera there.'};

for(const [id,tip] of Object.entries(inputHelp)){const e=$(id);if(e){e.dataset.tip=tip;e.setAttribute('aria-description',tip);if(id==='import')e.parentElement.dataset.tip=tip;}}

function showTip(b,x,y){const tip=$('tooltip');if(!b?.dataset.tip){tip.hidden=true;return;}const parent=b.closest('dialog[open]')||document.body;if(tip.parentElement!==parent)parent.appendChild(tip);tip.textContent=b.dataset.tip;tip.hidden=false;tip.style.whiteSpace='pre-line';const width=tip.offsetWidth,height=tip.offsetHeight;tip.style.left=Math.max(8,Math.min(innerWidth-width-8,x>innerWidth/2?x-width-14:x+14))+'px';tip.style.top=Math.max(8,Math.min(innerHeight-height-8,y+18))+'px';}

document.addEventListener('pointermove',e=>showTip(e.target.closest('[data-tip]'),e.clientX,e.clientY));

document.addEventListener('focusin',e=>{const b=e.target.closest('[data-tip]');if(b){const r=b.getBoundingClientRect();showTip(b,r.left,r.bottom);}});

document.addEventListener('focusout',()=>$('tooltip').hidden=true);document.addEventListener('pointerdown',()=>$('tooltip').hidden=true);document.addEventListener('keydown',e=>{if(e.key==='Escape')$('tooltip').hidden=true;});document.documentElement.addEventListener('pointerleave',()=>$('tooltip').hidden=true);



function frame(now){const dt=Math.max(0,Math.min(.1,(now-lastFrame)/1000));lastFrame=now;fps=fps*.95+(1/Math.max(.001,dt))*.05;if(playing&&!loading){if(pendingView){cam={...pendingView.cam};zoom=pendingView.zoom;}game.tick(dt);window.FractureAudio?.update(game);window.FractureCampaignUI?.update(game,now);const v=viewport(),speed=420*dt/zoom;if(keys.has('arrowleft')||mouse.x>=0&&mouse.x<10)cam.x-=speed;if(keys.has('arrowright')||mouse.x>v.w-10&&mouse.x<v.w)cam.x+=speed;if(keys.has('arrowup')||mouse.y>=48&&mouse.y<58)cam.y-=speed;if(keys.has('arrowdown')||mouse.y>v.h+38&&mouse.y<v.h+48)cam.y+=speed;if(now>uiAt){updateUI();uiAt=now+350;$('fps').textContent=Math.round(fps)+' FPS · '+game.entities.filter(e=>e.kind==='unit').length+' UNITS';}if(!game.campaign&&game.winner!==null&&!resultShown){resultShown=true;$('resultTitle').textContent=game.options.spectate?'Team '+(game.winner+1)+' wins':game.winner===game.players[0].team?'Victory':'Defeat';$('resultStats').innerHTML=game.players.map(p=>`<div>${D.factions[p.faction].name} · ${p.kills} kills · ${p.lost} losses · ${Math.floor(p.gathered.reduce((a,b)=>a+b,0))} gathered</div>`).join('');$('result').showModal();}}

 if(now>toastUntil)$('toast').hidden=true;if(!loading&&playing){render();window.FractureCampaignUI?.markers(ctx,point,game);}requestAnimationFrame(frame);}

window.fracture={get game(){return game;},get selection(){return selection;},get terrain(){return terrain;},activate,launchMatch,setup,center,toast,point,unproject,choose,art,get playing(){return playing;},get loading(){return loading;}};requestAnimationFrame(frame);

})();


