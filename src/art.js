'use strict';
(function(root){
const D=root.FD, {hash,noise}=root.FractureSim;
const palettes={Kareth:['#606753','#68755b','#777565','#42777b'],Elyndra:['#5f7045','#708158','#82836b','#416d7a'],Morvane:['#51575a','#606660','#73736c','#425c68']};
function rgb(hex){return hex.match(/\w\w/g).map(x=>parseInt(x,16));}function tint(hex,n){return '#'+rgb(hex).map(v=>Math.max(0,Math.min(255,Math.round(v+n))).toString(16).padStart(2,'0')).join('');}
// World presentation scales distinguish a multi-ton chassis from a standing soldier.
const vehicleScales={'Infantry Fighting Vehicle':1.5,'Main Battle Tank':1.65,'Self-Propelled Artillery':1.6,'Fighter Aircraft':1.35,'Gunship':1.35,'Imperial Tank':1.6,'Siege Walker':1.35,'Winged Hunter':1.25,'Heavy Walker':1.35,'Siege Crawler':1.4,'Juggernaut':1.4,'Hunter-Killer':1.3,'Interceptor Drone':1.15,'Sentinel':1.2,'Battering Ram':1.3,'Heavy Catapult':1.35,'Runic Siege Engine':1.35,'Advanced Dwarven Artillery':1.45,'Nightbreaker Combat Vehicle':1.55};
function unitScale(d){return vehicleScales[d?.name]||1;}
function mixColor(a,b,t=.5){const aa=rgb(a),bb=rgb(b);return '#'+aa.map((x,i)=>Math.round(x+(bb[i]-x)*t).toString(16).padStart(2,'0')).join('');}
function unitLivery(d,f){const rows=f.units.filter(u=>u.role===d.role),i=Math.max(0,rows.findIndex(u=>u.id===d.id)),base={worker:'#9b865d',scout:'#60785e',melee:'#8a5c50',rifle:'#5a7b8b',heavy:'#687184',aa:'#92704e',support:'#a8ad92',stealth:'#475f64',fighter:'#657c99',gunship:'#88666e',siege:'#928159',elite:'#857292',tank:'#6e7a68',giant:'#73685a'}[d.role]||'#7e8170';return {primary:tint(base,i%2?17:-i*6),trim:tint(base,45-i*4),variant:i};}
function buildingLivery(d,f){const i=Math.max(0,f.buildings.filter(b=>b.kind===d.kind).findIndex(b=>b.id===d.id)),colors=['#5c7884','#956d52','#788257','#866b8e','#69938d'],base={hq:'#717b8b',house:'#988262',inf:'#816b55',armor:'#8a6251',air:'#647f87',lab:colors[i%5],elite:'#8d7692',defense:'#717764',depot:'#9a895b',counter:'#736477',support:'#93a38a',extractor:{ore:'#958361',oil:'#53716d',aether:'#7ba6a1',rift:'#9578ae'}[d.resource]||'#898b78'}[d.kind]||colors[i%5];return {primary:i&&d.kind!=='lab'?mixColor(base,colors[i%5],.6):base,variant:i};}
// Recolor only pixels lying on authored model surfaces; no floating markers or extra sprite cache.
function paintOwner(c,color){const p=c.ownerPaint;if(!p||p.color===color)return c;const col=rgb(color),data=p.data.data;for(let j=0;j<p.indices.length;j++){const i=p.indices[j];for(let k=0;k<3;k++)data[i+k]=Math.min(255,Math.round(col[k]*p.light[j]));}c.getContext('2d').putImageData(p.data,p.x,p.y);p.color=color;return c;}
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d',{willReadFrequently:true});return c;}
function poly(c,p,fill,stroke){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);c.fill();}
class Art{
 constructor(){this.cache=new Map();this.tiles={};root.FractureAsyncArt?.attach(this);}
 project(x,y,z=0){return{x:(x-y)*24,y:(x+y)*12-z*8};}
 tile(theme,water,h,variant){const key=[theme,water,h,variant].join();if(this.cache.has(key))return this.cache.get(key);const c=canvas(50,26),ctx=c.getContext('2d'),p=palettes[theme]||palettes.Kareth;const base=rgb(water?p[3]:p[0]);if(!water){base[0]+=(variant-5)*2.4;base[1]+=(variant-5)*.7;base[2]+=(variant-5)*1.6;}const data=ctx.createImageData(50,26);
 for(let y=0;y<26;y++)for(let x=0;x<50;x++){if(Math.abs(x-25)/25+Math.abs(y-13)/13>1.04)continue;const coarse=noise((x+variant*27)/18,(y+variant*13)/11,82),v=hash(x,y,variant*7+3)*27+coarse*6-17+(h-1)*2;const i=(y*50+x)*4;for(let k=0;k<3;k++)data.data[i+k]=base[k]+v;data.data[i+3]=255;}ctx.putImageData(data,0,0);if(water){ctx.strokeStyle='#8aa9a52b';ctx.lineWidth=.6;for(let i=0;i<5;i++){let x=10+hash(i,variant,4)*25,y=8+hash(i,variant,5)*10;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+7,y);ctx.stroke();}}this.cache.set(key,c);return c;}
 terrain(game,region=null){if(!region&&root.FractureTerrain&&game.n>=32)return new root.FractureTerrain.Layer(this,game);const n=game.n,r=region||{x:-n*24-48,y:-40,w:n*48+96,h:n*24+80};if(root.FractureTerrain?.renderRegion)return root.FractureTerrain.renderRegion(this,game,r);const c=canvas(r.w,r.h),ctx=c.getContext('2d',{willReadFrequently:true});ctx.translate(-r.x,-r.y);ctx.imageSmoothingEnabled=false;
 const triangle=(im,src,dst)=>{ctx.save();ctx.beginPath();const mid={x:(dst[0].x+dst[1].x+dst[2].x)/3,y:(dst[0].y+dst[1].y+dst[2].y)/3};dst.forEach((q,i)=>{const dx=q.x-mid.x,dy=q.y-mid.y,r=Math.hypot(dx,dy),x=q.x+dx/r*.65,y=q.y+dy/r*.65;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.clip();const [u,v,w]=src,[a,b,d]=dst,det=(v[0]-u[0])*(w[1]-u[1])-(w[0]-u[0])*(v[1]-u[1]);const A=((b.x-a.x)*(w[1]-u[1])-(d.x-a.x)*(v[1]-u[1]))/det,B=((b.y-a.y)*(w[1]-u[1])-(d.y-a.y)*(v[1]-u[1]))/det,C=((d.x-a.x)*(v[0]-u[0])-(b.x-a.x)*(w[0]-u[0]))/det,E=((d.y-a.y)*(v[0]-u[0])-(b.y-a.y)*(w[0]-u[0]))/det;ctx.transform(A,B,C,E,a.x-A*u[0]-C*u[1],a.y-B*u[0]-E*u[1]);im.canvas?ctx.drawImage(im.canvas,im.x,im.y,50,26,0,0,50,26):ctx.drawImage(im,0,0);ctx.restore();};
 for(let sum=Math.max(0,Math.floor((r.y-30)/12));sum<=Math.min(n*2-2,Math.ceil((r.y+r.h+64)/12));sum++)for(let x=Math.max(0,sum-n+1,Math.floor((r.x+sum*24-26)/48));x<=Math.min(n-1,sum,Math.ceil((r.x+r.w+sum*24+26)/48));x++){const y=sum-x;if(y>=n)continue;const t=game.tile(x,y),h=t.height,corners=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]],v=corners.map(([xx,yy])=>this.project(xx,yy,game.cornerHeight(xx,yy,h))),center=this.project(x+.5,y+.5,game.surfaceHeight(x+.5,y+.5));
 const im=root.FractureTerrain?root.FractureTerrain.surface(this,game,x,y):this.tile(game.options.theme,t.water,h,Math.floor(noise(x/9,y/9,game.options.seed+8)*11)),source=[[25,1],[49,13],[25,25],[1,13]];
 // A shared corner mesh makes one-level hills continuous, without vertical stair faces.
 poly(ctx,v.map(q=>[q.x,q.y]),t.water?'#416d73':'#65715a');const flat=corners.every(([xx,yy])=>game.cornerHeight(xx,yy,h)===h);if(flat){if(im.canvas)ctx.drawImage(im.canvas,im.x,im.y,50,26,v[0].x-25,v[0].y-1,50,26);else ctx.drawImage(im,v[0].x-25,v[0].y-1);}else for(let j=0;j<4;j++)triangle(im,[source[j],source[(j+1)%4],[25,13]],[v[j],v[(j+1)%4],center]);
 if(!t.water){const heights=corners.map(([xx,yy])=>game.cornerHeight(xx,yy,h)),dx=(heights[1]+heights[2]-heights[0]-heights[3])*.5,dy=(heights[2]+heights[3]-heights[0]-heights[1])*.5,shade=dx*.075+dy*.035;if(Math.abs(shade)>.008)poly(ctx,v.map(q=>[q.x,q.y]),shade>0?'rgba(23,35,31,'+Math.min(.24,shade)+')':'rgba(221,211,163,'+Math.min(.16,-shade)+')');}

 for(const [dx,dy,i,j] of [[1,0,1,2],[0,1,2,3]]){const other=game.tile(x+dx,y+dy);if(!other||h-other.height<2)continue;const [a,b]=[v[i],v[j]],lowA=this.project(...corners[i],game.cornerHeight(...corners[i],other.height)),lowB=this.project(...corners[j],game.cornerHeight(...corners[j],other.height));
 poly(ctx,[[a.x,a.y],[b.x,b.y],[lowB.x,lowB.y],[lowA.x,lowA.y]],dx?'#635e4d':'#4b4b3d');
 for(let k=0;k<3;k++){const f=k/3,g=(k+1)/3,top={x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f},bottom={x:lowA.x+(lowB.x-lowA.x)*f,y:lowA.y+(lowB.y-lowA.y)*f},next={x:lowA.x+(lowB.x-lowA.x)*g,y:lowA.y+(lowB.y-lowA.y)*g},z=hash(x+k,y,43),mid=(top.y+bottom.y)*.5;
 poly(ctx,[[top.x,top.y+2],[a.x+(b.x-a.x)*g,a.y+(b.y-a.y)*g+1],[next.x-1,next.y],[bottom.x,bottom.y]],['#837c63','#6f7056','#8c866d'][(k+x+y)%3]);
 poly(ctx,[[top.x,mid],[next.x-2,mid+3],[next.x,next.y],[bottom.x,bottom.y]],k%2?'#525341':'#686a53');
 ctx.strokeStyle='#484a3d';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(top.x+z*3,top.y+3);ctx.lineTo(top.x+4,mid);ctx.lineTo(bottom.x+2,bottom.y-2);ctx.moveTo(top.x,mid+1);ctx.lineTo(next.x-1,mid+3);ctx.stroke();
 }
 ctx.strokeStyle='#969476';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 }
 return c;}
 // One composited veil: overlapping cell geometry never compounds opacity.
 fog(game){const player=game.players[0],n=game.n;
 if(this.fogGame===game&&this.fogRevision===game.visionRevision)return this.fogCanvas;
 this.fogGame=game;this.fogRevision=game.visionRevision;
 const c=this.fogCanvas||(this.fogCanvas=canvas(n*48+96,n*24+80));
 if(c.width!==n*48+96||c.height!==n*24+80){c.width=n*48+96;c.height=n*24+80;}
 const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#0b1117';ctx.fillRect(0,0,c.width,c.height);
 ctx.save();ctx.translate(n*24+48,40);ctx.globalCompositeOperation='destination-out';
 const cut=(cells,opacity)=>{ctx.beginPath();for(let y=0;y<n;y++)for(let x=0;x<n;x++){
 if(!cells[y*n+x])continue;const p=this.project(x+.5,y+.5,game.height(x,y)),drop=game.height(x,y)*8+2;
 ctx.moveTo(p.x-25,p.y);ctx.lineTo(p.x,p.y-13);ctx.lineTo(p.x+25,p.y);ctx.lineTo(p.x+25,p.y+drop);ctx.lineTo(p.x,p.y+13+drop);ctx.lineTo(p.x-25,p.y+drop);ctx.closePath();}
 ctx.globalAlpha=opacity;ctx.filter='blur(3px)';ctx.fill();ctx.filter='none';};
 cut(player.explored,.44);cut(player.visible,1);ctx.restore();return c;}
 resource(e){
 const key='r4_'+e.resource+'_'+(e.id%4);if(this.cache.has(key))return this.cache.get(key);
 const c=canvas(96,90),ctx=c.getContext('2d'),seed=e.id%4,rand=(j,k)=>hash(j,seed,k);
 if(e.resource===1){
 // Oil remains a shallow pool; its bank and reflection never change the picking silhouette.
 ellipse(ctx,48,68,27,8,'#17221c44');
 const outline=Array.from({length:18},(_,j)=>{const a=j*Math.PI/9,r=1+(rand(j,3)-.5)*.14;return[48+Math.cos(a)*24*r,65+Math.sin(a)*9*r];});
 poly(ctx,outline,'#4e5140','#777861');
 poly(ctx,outline.map(([x,y])=>[48+(x-48)*.9,64+(y-65)*.82]),'#18292c','#344947');
 poly(ctx,[[28,65],[35,61],[48,60],[60,62],[53,63],[42,62],[33,65]],'#4f6560');
 poly(ctx,[[34,66],[43,64],[57,65],[67,63],[65,67],[53,69],[39,68]],'#22373a');
 poly(ctx,[[42,61],[48,60],[59,62],[55,63],[48,62]],'#7c8170');
 for(let j=0;j<9;j++){const a=j*2.4,r=21+rand(j,7)*3,x=48+Math.cos(a)*r,y=65+Math.sin(a)*8;poly(ctx,[[x-3,y],[x-1,y-2],[x+2,y-1],[x+3,y+1],[x,y+2]],j%3?'#67684e':'#89836a');}
 }else{
 const M=new root.FractureSpriteMesh(ctx,0,false,{originX:48,originY:69,logicalWidth:96});
 const rock=(x,y,z,rx,ry,h,col,j)=>{const low=[],high=[],n=7;for(let k=0;k<n;k++){const a=k*Math.PI*2/n,r=.78+rand(j*11+k,21)*.32;low.push([x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r,z]);high.push([x+Math.cos(a+.1)*rx*r*.69,y+Math.sin(a+.1)*ry*r*.69,z+h*(.64+rand(j*13+k,33)*.28)]);}M.material('fur');for(let k=0;k<n;k++){const next=(k+1)%n;M.face([low[k],low[next],high[next],high[k]],tint(col,(k%3-1)*6));M.face([high[k],high[next],[x-rx*.15,y+ry*.13,z+h]],tint(col,k%2?9:1));}};
 const base=e.resource===0?'#8f8d75':e.resource===2?'#637e76':'#736f83';
 for(let j=0;j<13;j++){const a=j*2.4,r=6+rand(j,6)*19,x=Math.cos(a)*r,y=Math.sin(a)*r*.73;rock(x,y,0,4+rand(j,8)*5,3+rand(j,9)*4,3+rand(j,11)*5,tint(base,-14),j);}
 if(e.resource===0){
 for(let j=0;j<7;j++){const a=j*2.4,r=j===0?0:8+rand(j,4)*12,x=Math.cos(a)*r,y=Math.sin(a)*r*.65;rock(x,y,2,7+rand(j,14)*6,6+rand(j,15)*6,10+rand(j,16)*13,tint(base,j%3*9-8),j+23);}
 // Veins follow exposed faces and read as mineral seams rather than scattered dots.
 M.material('metal');for(let j=0;j<8;j++){const x=-17+j*4.7,y=2+rand(j,43)*6,z=5+rand(j,45)*6;M.seg([x,y,z],[x+3,y+2,z+3],'#b3a478',.8);}
 }else{
 const col=e.resource===2?'#81bfb2':'#ae96c8';
 const shard=(x,y,z,r,h,j)=>{const bottom=[],shoulder=[];for(let k=0;k<6;k++){const a=k*Math.PI/3;bottom.push([x+Math.cos(a)*r*.75,y+Math.sin(a)*r*.75,z]);shoulder.push([x+Math.cos(a)*r,y+Math.sin(a)*r,z+h*.68]);}const tip=[x+r*.25,y-r*.18,z+h];M.material('glass');for(let k=0;k<6;k++){const next=(k+1)%6;M.face([bottom[k],bottom[next],shoulder[next],shoulder[k]],tint(col,(k%3-1)*19));M.face([shoulder[k],shoulder[next],tip],tint(col,k%2?17:2));}M.material('glow');M.seg(shoulder[4],tip,tint(col,32),.45);};
 for(let j=0;j<7;j++){const a=j*2.4,r=j===0?0:9+rand(j,30)*10;shard(Math.cos(a)*r,Math.sin(a)*r*.7,3,3.4+rand(j,27)*2.5,j===0?(e.resource===3?43:35):15+rand(j,28)*17,j);}
 }
 M.finish();ctx.save();ctx.globalCompositeOperation='destination-over';ellipse(ctx,48,70,28,8,'#15211c50');ctx.restore();
 }
 this.cache.set(key,c);return c;
 }
 tree(e,theme){
 const special=root.FractureEnvironmentArt?.tree(e,theme,this);if(special)return special;theme=typeof theme==='string'?theme:theme?.theme;
 const key='tree4_'+theme+'_'+e.variant;if(this.cache.has(key))return this.cache.get(key);
 const c=canvas(96,112),ctx=c.getContext('2d'),M=new root.FractureSpriteMesh(ctx,0,false,{originX:48,originY:95,logicalWidth:96}),v=e.variant,rand=(j,k)=>hash(j,v,k),wide=v%3===2,spread=v%3===0?1.22:v%3===1?1:1.36,flatten=wide?.88:1,lean=(rand(1,73)-.5)*8,leaf=theme==='Morvane'?'#576254':theme==='Elyndra'?'#637849':'#657245',wood=theme==='Morvane'?'#72695b':'#80694c';
 const limb=(a,b,w)=>{M.material('wood');M.limb(a,b,wood,w);},trunk=(rings)=>{M.material('wood');M.loft(rings,wood,9);};
 trunk([[0,0,0,5.3,4.8],[lean*.2,1,9,3.8,3.4],[lean*.4,0,25,3.1,2.8],[lean,-1,41,2.2,1.8],[lean+1,-3,58,1,1]]);
 for(let j=0;j<6;j++){const a=j*Math.PI/3+.3,x=Math.cos(a)*13,y=Math.sin(a)*10;limb([lean*.1,0,8],[x*.55,y*.55,2.3],3.8);limb([x*.55,y*.55,2.3],[x,y,.4],1.8);}
 const crowns=[[-14,2,47,wide?14:12,11,12],[15,4,49,wide?14:12,11,13],[-9,-13,56,12,11,13],[11,-11,62,11,10,13],[1,9,61,14,12,13],[-6,0,72,12,11,11],[18,-4,55,10,10,10],[-19,-5,59,10,9,11]].map(([x,y,z,rx,ry,rz])=>[x*spread,y*(wide?1.15:1),z*flatten,rx*(wide?1.05:1),ry,rz*.9]);
 for(let j=0;j<crowns.length;j++){const [x,y,z]=crowns[j];limb([lean*.35,0,24+j%3*5],[x*.57,y*.62,z-15],3.6-j%3*.5);limb([x*.57,y*.62,z-15],[x+lean,y,z],2);if(j%2===0)limb([x*.57,y*.62,z-15],[x+lean+6,y-3,z-3],1.4);}
 // Ragged, overlapping leaf masses keep a connected canopy with openings around the forks.
 const crown=(x,y,z,rx,ry,rz,col,j)=>{const rings=[-.85,-.35,.25,.72,1].map((t,k)=>Array.from({length:9},(_,q)=>{const a=q*Math.PI*2/9,r=([.4,.92,1,.65,.06][k])*(.87+rand(j*17+q,k+81)*.24);return[x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r,z+t*rz];}));M.material('fur');M.rings(rings,col,true);};
 for(let j=0;j<crowns.length;j++){let [x,y,z,rx,ry,rz]=crowns[j];x+=lean;z+=(rand(j,101)-.5)*5;crown(x,y,z,rx,ry,rz,tint(leaf,(j%3-1)*9-4),j);for(let k=0;k<8;k++){const a=k*2.4+j,xx=x+Math.cos(a)*rx*.77,yy=y+Math.sin(a)*ry*.77,zz=z+rz*.25+rand(j*8+k,109)*5;crown(xx,yy,zz,3+rand(j+k,110)*2.2,3+rand(j+k,111)*2.3,3+rand(j+k,112)*2.2,tint(leaf,(k%3-1)*10+8),j*11+k+30);}}
 // A few bark ridges and bare twigs reinforce the trunk's twist at normal map scale.
 M.material('wood');for(let j=0;j<3;j++){const y=-2+j*2;M.seg([1,y,3],[lean*.4+2,y,24],tint(wood,j%2?17:-20),.6);M.seg([lean*.4+2,y,24],[lean+1,y-1,39],tint(wood,-17),.55);}
 M.finish();ctx.save();ctx.globalCompositeOperation='destination-over';ellipse(ctx,48,95,22,7,'#15201945');ctx.restore();this.cache.set(key,c);return c;
 }
 construction(d,f,progress,front){const stage=Math.min(2,Math.floor(progress*3)),key=['construction4',f.id,d.building?'extension':['defense','extractor'].includes(d.kind)?'small':'large',stage,front].join();if(this.cache.has(key))return this.cache.get(key);const c=canvas(480,440);root.FractureConstructionArt.render(c.getContext('2d'),d,f,stage,front);this.cache.set(key,c);return c;}
 extension(d,f){const key='extension4_'+d.id;if(this.cache.has(key))return this.cache.get(key);const c=canvas(320,280);root.FractureExtensionArt.render(c.getContext('2d'),d,f);this.cache.set(key,c);return c;}
 ruin(d,f,variant=0){this.ruinCache??=new Map();const key=d.id+'_'+f.id+'_'+variant; if(this.ruinCache.has(key))return this.ruinCache.get(key);if(this.liveRendering&&this.deferRuin?.(key,d,f,variant))return this.emptyRuin??=(canvas(1,1));const c=canvas(320,294);root.FractureRuinsArt.render(c.getContext('2d'),d,f,variant);this.ruinCache.set(key,c);while(this.ruinCache.size>64)this.ruinCache.delete(this.ruinCache.keys().next().value);return c;}
 gatePortrait(d,f,angle=0,color='#6eb8c6'){const key=['gatePortrait',d.id,angle,color].join(':');if(this.cache.has(key))return this.cache.get(key);const c=canvas(480,440),ctx=c.getContext('2d'),unit=30/(d.size*.53),scale=.65;ctx.imageSmoothingEnabled=false;for(const role of [-1,0,1]){const im=paintOwner(this.building(d,f,{mask:17,gate:{angle,role,open:true}}),color),dx=role*(Math.cos(angle)-Math.sin(angle))*unit*.8*2,dy=role*(Math.cos(angle)+Math.sin(angle))*unit*.4*2;ctx.drawImage(im,84+dx*scale,77+dy*scale,480*scale,440*scale);}this.cache.set(key,c);return c;}
 building(d,f,wallMask=null){if(d.kind==='wall')d={...d,wallMask:wallMask?.mask??wallMask??17,wallArms:wallMask?.arms,wallGate:wallMask?.gate};const key='architecture6_'+d.id+(d.kind==='wall'?'_'+d.wallMask+'_'+JSON.stringify(d.wallArms||[])+'_'+JSON.stringify(d.wallGate||null):'');if(this.cache.has(key))return this.cache.get(key);
 if(root.FractureBuildingArt){const c=canvas(480,440);root.FractureBuildingArt.render(c.getContext('2d'),d,f);this.cache.set(key,c);return c;}
 const c=canvas(240,220),ctx=c.getContext('2d'),p=(x,y,z=0)=>[120+(x-y)*.8,181+(x+y)*.4-z],col=f.color,style=f.style,kind=d.kind;
 const technical=['industrial','machine','reptile','night'].includes(style),organic=['insect','fungal'].includes(style);
 const mat=({industrial:'#737e7a',machine:'#647b81',reptile:'#85896b',night:'#696677',wizard:'#858699',elder:'#8b9680',myth:'#afa88c',dragon:'#8c7560',ape:'#84745a',demon:'#72635c',insect:'#8c7853',fungal:'#86917c'})[style];
 const line=(a,b,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...p(...a));ctx.lineTo(...p(...b));ctx.stroke();};
 const face=(points,color,edge='#263231')=>{const shape=points.map(a=>p(...a));poly(ctx,shape,color,edge);if(!color)return;ctx.save();ctx.beginPath();shape.forEach((q,i)=>i?ctx.lineTo(...q):ctx.moveTo(...q));ctx.closePath();ctx.clip();const xs=shape.map(q=>q[0]),ys=shape.map(q=>q[1]),left=Math.floor(Math.min(...xs)),top=Math.floor(Math.min(...ys)),width=Math.max(...xs)-left,height=Math.max(...ys)-top;
 // Surface-aligned materials distinguish stone, wood and sheet metal.
 if(points.length===4&&width*height>210){const a=points[0],b=points[1],d=points[3],wa=Math.hypot(...b.map((v,i)=>v-a[i])),hb=Math.hypot(...d.map((v,i)=>v-a[i])),metal=['industrial','machine'].includes(style),wood=style==='ape',bw=wood?5:metal?19:14,bh=wood?hb:metal?13:6.5;
 const sample=(u,v)=>p(...a.map((n,i)=>n+(b[i]-n)*u/wa+(d[i]-n)*v/hb));
 if(wa>10&&hb>9)for(let row=0;row*bh<hb;row++){const v=row*bh,off=!metal&&!wood&&row%2?bw/2:0;for(let u=-off;u<wa;u+=bw){const left=Math.max(.5,u+.5),right=Math.min(wa-.5,u+bw-.4),bottom=v+.4,top=Math.min(hb-.3,v+bh-.4);if(left>=right||bottom>=top)continue;const shade=(hash(Math.floor(u*3),row,53)-.5)*(metal?9:18);poly(ctx,[sample(left,bottom),sample(right,bottom),sample(right,top),sample(left,top)],tint(color,shade));ctx.strokeStyle=tint(color,metal?14:9);ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(...sample(left,top));ctx.lineTo(...sample(right,top));ctx.stroke();
 if(metal&&right-left>8&&top-bottom>8)for(const uv of [[left+1,bottom+1],[right-1,top-1]]){const q=sample(...uv);ctx.fillStyle=tint(color,39);ctx.fillRect(Math.round(q[0]),Math.round(q[1]),1,1);}
 if(wood){ctx.strokeStyle=tint(color,-17);ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(...sample(left+1,bottom));ctx.lineTo(...sample(left+1.6,top));ctx.stroke();}
 }} }
 // Fixed pixel chips and worn mortar/paint stay inside each structural plane.
 for(let j=0;j<width*height/11;j++){const x=left+Math.floor(hash(j,left,37)*width),y=top+Math.floor(hash(j,top,41)*height);ctx.fillStyle=tint(color,(j%5===0?12:j%3===0?-13:-4));ctx.fillRect(x,y,j%7===0?2:1,1);}ctx.restore();};
 const prism=(x,y,w,l,h,z=0,color=mat)=>{
 face([[x-w,y+l,z],[x+w,y+l,z],[x+w,y+l,z+h],[x-w,y+l,z+h]],tint(color,-15));
 face([[x+w,y-l,z],[x+w,y+l,z],[x+w,y+l,z+h],[x+w,y-l,z+h]],tint(color,-34));
 face([[x-w,y-l,z+h],[x+w,y-l,z+h],[x+w,y+l,z+h],[x-w,y+l,z+h]],tint(color,15));
 line([x-w,y+l,z+h],[x+w,y+l,z+h],tint(color,38));line([x+w,y-l,z+h],[x+w,y+l,z+h],tint(color,24));if(technical&&w>16&&l>12){for(let xx=x-w+10;xx<x+w;xx+=13)line([xx,y-l+1,z+h+.1],[xx,y+l-1,z+h+.1],tint(color,2),.65);for(let yy=y-l+10;yy<y+l;yy+=13)line([x-w+1,yy,z+h+.1],[x+w-1,yy,z+h+.1],tint(color,4),.65);}
 if(h>12){for(let zz=z+7;zz<z+h-3;zz+=8){line([x-w+1,y+l+.1,zz],[x+w-1,y+l+.1,zz],tint(color,-24));line([x+w+.1,y-l+1,zz],[x+w+.1,y+l-1,zz],tint(color,-41));}
 for(let xx=x-w+4;xx<x+w;xx+=12){line([xx,y+l+.2,z+3],[xx,y+l+.2,z+h-3],tint(color,-22),.65);}}
 };
 const window=(x,y,z,w=5,h=7)=>{face([[x-w,y,z],[x+w,y,z],[x+w,y,z+h],[x-w,y,z+h]],'#23363b','#a8aaa0');line([x-w+1,y+.2,z+h-2],[x+w-1,y+.2,z+h-2],tint(col,32));line([x,y+.3,z],[x,y+.3,z+h],'#667b7b');};
 const door=(x,y,z,w=9,h=20)=>{face([[x-w,y,z],[x+w,y,z],[x+w,y,z+h],[x-w,y,z+h]],'#1a292b',tint(mat,32));
 for(let zz=z+3;zz<z+h-1;zz+=4)line([x-w+1,y+.3,zz],[x+w-1,y+.3,zz],'#455351');
 for(const xx of [x-w-2,x+w+2])for(let zz=z+2;zz<z+h;zz+=6)line([xx,y+.5,zz],[xx,y+.5,zz+3],technical?'#c3ad6d':tint(col,15),2);
 };
 const vent=(x,y,z,w=9,l=7)=>{prism(x,y,w,l,2,z,'#485653');for(let j=-l+2;j<l;j+=3)line([x-w+2,y+j,z+2.2],[x+w-2,y+j,z+2.2],'#9aa298');};
 const stripe=(x,y,z,w)=>face([[x-w,y,z],[x+w,y,z],[x+w,y,z+3],[x-w,y,z+3]],col);
 const antenna=(x,y,z)=>{line([x,y,z],[x,y,z+29],'#303c3c',2);line([x,y,z+1],[x,y,z+29],'#b7beb0');line([x-9,y,z+23],[x+9,y,z+23],'#9da89e');const q=p(x,y,z+30);ctx.fillStyle=col;ctx.fillRect(q[0]-1,q[1]-1,2,2);};
 const spire=(x,y,z,h=32)=>{prism(x,y,7,7,h,z,mat);face([[x-11,y-11,z+h],[x+11,y-11,z+h],[x,y,z+h+21]],tint(col,-15));face([[x+11,y-11,z+h],[x+11,y+11,z+h],[x,y,z+h+21]],tint(col,-40));face([[x+11,y+11,z+h],[x-11,y+11,z+h],[x,y,z+h+21]],tint(col,5));};
 const crystal=(x,y,z,h=24)=>{face([[x-6,y,z],[x,y-5,z+h*.8],[x,y,z+h],[x+6,y,z]],tint(col,36));face([[x+6,y,z],[x,y,z+h],[x,y+5,z+h*.8],[x,y+5,z-4]],tint(col,-25));};
 const roof=(x,y,w,l,z,rise,color)=>{face([[x-w,y-l,z],[x+w,y-l,z],[x+w,y,z+rise],[x-w,y,z+rise]],tint(color,9));face([[x-w,y+l,z],[x+w,y+l,z],[x+w,y,z+rise],[x-w,y,z+rise]],tint(color,-14));face([[x+w,y-l,z],[x+w,y+l,z],[x+w,y,z+rise]],tint(mat,-15));for(let xx=x-w+3;xx<x+w;xx+=5){line([xx,y-l,z],[xx,y,z+rise],tint(color,25),.65);line([xx,y+l,z],[xx,y,z+rise],tint(color,5),.8);}for(let t=.2;t<1;t+=.2){line([x-w,y+l*(1-t),z+rise*t],[x+w,y+l*(1-t),z+rise*t],tint(color,-28),.75);}line([x-w,y,z+rise],[x+w,y,z+rise],tint(color,39),1.5);};
 const arch=(x,y,z,w,h,color='#303b38')=>{const points=[[x-w,y,z],[x+w,y,z],[x+w,y,z+h-w]];for(let i=0;i<=8;i++){const a=i*Math.PI/8;points.push([x+Math.cos(a)*w,y,z+h-w+Math.sin(a)*w]);}face(points,color,tint(mat,31));for(let i=0;i<7;i++){const a=i*Math.PI/7,b=(i+1)*Math.PI/7;face([[x+Math.cos(a)*w,y+.2,z+h-w+Math.sin(a)*w],[x+Math.cos(b)*w,y+.2,z+h-w+Math.sin(b)*w],[x+Math.cos(b)*(w+3),y+.2,z+h-w+Math.sin(b)*(w+3)],[x+Math.cos(a)*(w+3),y+.2,z+h-w+Math.sin(a)*(w+3)]],tint(mat,i%2?15:2));}};
 const tower=(x,y,z,r,h,color=mat)=>{const ring=Array.from({length:10},(_,i)=>[x+Math.cos(i*Math.PI/5)*r,y+Math.sin(i*Math.PI/5)*r]);for(let i=0;i<10;i++){const a=ring[i],b=ring[(i+1)%10];if(a[0]+a[1]+b[0]+b[1]<2*(x+y))continue;face([[...a,z],[...b,z],[...b,z+h],[...a,z+h]],tint(color,12-Math.floor(i*4)));for(let zz=z+7;zz<z+h;zz+=7)line([...a,zz],[...b,zz],tint(color,-25),.6);}face(ring.map(q=>[...q,z+h]),tint(color,24));for(let i=0;i<10;i+=2){const a=ring[i];prism(a[0],a[1],2,2,4,z+h,color);}};
 const pipe=(x,y,z,xx,yy,zz,color='#9da99b',width=3)=>{line([x,y,z],[xx,yy,zz],tint(color,-35),width+2);line([x,y,z],[xx,yy,zz],color,width);};
 const banner=(x,y,z,color=col)=>{line([x,y,z-20],[x,y,z+4],'#b6b196',1);face([[x,y,z],[x+8,y,z-1],[x+8,y,z-14],[x+4,y,z-11],[x,y,z-14]],color);};
 const w=kind==='defense'?20:kind==='extractor'?29:['hq','armor','elite','air'].includes(kind)?45:36,l=['hq','air'].includes(kind)?36:28;
 // Small stepped foundations and entry aprons, without a large floating shadow.
 if(organic){const rim=Array.from({length:24},(_,i)=>{const a=i*Math.PI/12,r=1+(i%3)*.035;return p(Math.cos(a)*(w+4)*r,Math.sin(a)*(l+5)*r,1);});poly(ctx,rim,tint(mat,-36));for(let j=0;j<35;j++){const a=j*2.4,q=p(Math.cos(a)*(w+4)*(j/35),Math.sin(a)*(l+6)*(j/35),2);ctx.fillStyle=j%2?tint(mat,-18):tint(mat,-27);ctx.fillRect(q[0],q[1],3,1);}}else{prism(0,0,w+4,l+4,3,0,tint(mat,-28));prism(0,l+8,13,7,2,0,tint(mat,-12));}
 if(organic){
 const mound=(x,y,z,rx,ry,color)=>{const q=p(x,y,z),ox=Math.round(q[0]),oy=Math.round(q[1]),tones=Array.from({length:12},(_,i)=>tint(color,i*7-42));
 // Quantized surface light and sparse stippling give chitin a sculpted sprite surface.
 for(let py=-Math.ceil(ry);py<=ry;py++)for(let px=-Math.ceil(rx);px<=rx;px++){const nx=px/rx,ny=py/ry,r=nx*nx+ny*ny;if(r>1)continue;const nz=Math.sqrt(1-r),light=-nx*.42-ny*.55+nz*.58,grain=hash(px+ox,py+oy,71);let band=Math.max(0,Math.min(11,Math.floor(light*6+3+(grain>.86?1:grain<.12?-1:0))));if(r>.94)band=Math.max(0,band-2);ctx.fillStyle=tones[band];ctx.fillRect(ox+px,oy+py,1,1);}};
 const rib=(x,y,z,height,width=15)=>{mound(x,y,z,width,height,mat);for(let j=-2;j<=2;j++)line([x+j*5,y+4,z-height*.5],[x+j*3,y-2,z+height*.65],tint(mat,25),1.5);};
 const mouth=(x,y,z,rx=10,ry=12)=>{const q=p(x,y,z);ellipse(ctx,...q,rx+2,ry+2,tint(mat,22));ellipse(ctx,...q,rx,ry,'#192923');ellipse(ctx,q[0],q[1]+4,rx*.6,ry*.6,'#334439');};
 const egg=(x,y,z=10,size=7)=>{mound(x,y,z,size,size*1.3,style==='fungal'?'#b7bc99':'#c6b48a');line([x-2,y,z-3],[x-2,y,z+4],'#eee1b1');};
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;line([Math.cos(a)*10,Math.sin(a)*10,8],[Math.cos(a)*(w+1),Math.sin(a)*(l+1),2],tint(mat,-16),4);line([Math.cos(a)*10,Math.sin(a)*10,9],[Math.cos(a)*(w+1),Math.sin(a)*(l+1),3],tint(mat,16),1);}
 if(kind==='hq'){rib(0,-8,38,36,38);for(const side of [-1,1]){rib(side*29,9,21,22,18);line([side*25,-7,40],[side*35,-7,76],tint(col,20),4);line([side*35,-7,76],[side*25,-5,69],tint(mat,-12),3);}mouth(0,17,19,13,17);for(let j=-1;j<=1;j++)egg(j*14,25,7,5);}
 else if(kind==='house'){mound(0,0,16,35,19,mat);for(let j=0;j<7;j++)egg((j%3-1)*18,Math.floor(j/3)*10-9,12,8);mouth(0,27,7,9,6);}
 else if(kind==='inf'&&/Nursery|Hatch|Spawning/i.test(d.name)){mound(0,0,12,38,16,tint(mat,-10));for(let j=0;j<6;j++)egg((j%3-1)*21,Math.floor(j/3)*23-8,16,10);rib(-28,-15,30,22,11);rib(28,-15,30,22,11);}
 else if(kind==='inf'){for(const x of [-25,0,25]){rib(x,-3,x===0?30:21,x===0?31:22,16);mouth(x,13,14,9,13);}for(const x of [-37,37])line([x,14,5],[x,14,34],tint(col,24),3);}
 else if(kind==='depot'||kind==='counter'){mound(0,0,12,36,18,mat);for(const x of [-25,0,25])mound(x,-5,22,12,16,'#869a67');mouth(0,23,8,17,7);for(let j=-2;j<=2;j++)line([j*9,24,2],[j*9,24,12],tint(mat,32),2);}
 else if(kind==='lab'&&/Relay|Signal|Network|Beacon/i.test(d.name)){rib(0,0,40,39,14);for(const x of [-22,22]){line([0,0,38],[x,0,65],mat,6);mound(x,0,67,12,9,tint(col,12));line([x,0,69],[x*1.4,0,82],tint(col,38),2);}mound(0,0,82,7,8,tint(col,25));}
 else if(kind==='lab'){rib(-16,0,30,29,22);rib(20,2,24,23,19);for(const x of [-18,18]){mound(x,4,32,10,14,'#89a796');line([x,4,24],[x,4,39],'#c2d6ae',1.5);}mouth(0,23,10,10,8);for(let j=-1;j<=1;j++)egg(j*12,-17,42,5);}
 else if(kind==='armor'){mound(0,0,20,45,25,tint(mat,-10));for(let j=-2;j<=2;j++)rib(j*16,-5,30,24,9);mouth(0,23,16,22,17);for(const side of [-1,1]){line([side*31,24,4],[side*29,20,36],tint(mat,28),4);line([side*29,20,36],[side*19,20,29],tint(mat,13),3);}}
 else if(kind==='air'){for(const x of [-26,0,26]){rib(x,0,41,38,x===0?14:11);mouth(x,7,49,7,13);}for(const side of [-1,1])face([[side*9,0,57],[side*52,-8,78],[side*43,20,45]],tint(col,-18),tint(col,28));egg(0,22,11,8);}
 else if(kind==='elite'){rib(0,-4,44,41,29);for(const side of [-1,1]){rib(side*29,7,27,26,15);line([side*20,-7,65],[side*29,-5,94],tint(col,21),4);}mound(0,0,86,15,10,tint(col,21));mouth(0,23,24,12,21);for(let j=-1;j<=1;j++)egg(j*13,24,8,6);}
 else if(kind==='defense'){rib(0,0,38,34,16);line([0,0,55],[28,0,66],mat,13);mound(29,0,65,10,8,'#a4b77b');mouth(32,-1,65,5,5);for(const x of [-16,16])line([x,0,12],[x,0,40],tint(mat,30),3);}
 else if(kind==='extractor'){rib(-13,-3,24,23,18);mouth(-13,15,14,9,11);const res=d.resource;
 if(res==='oil'){mound(17,4,19,16,21,'#6c784e');for(let j=0;j<3;j++)line([13+j*4,4,20],[22+j*4,18,3],tint(col,12),3);}
 else if(res==='ore'){for(let j=0;j<3;j++){line([10+j*9,0,5],[10+j*8,0,26],tint(mat,25),4);face([[6+j*9,0,20],[10+j*9,0,32],[14+j*9,0,20]],'#b8af88');}}
 else if(res==='aether'){for(const x of [7,20,30]){mound(x,1,19,8,14,'#7ba89b');crystal(x,1,31,12);}}
 else{rib(19,0,38,32,9);crystal(19,0,67,22);for(const x of [7,31])line([x,0,10],[x,0,49],tint(col,29),2);}}
 if(style==='fungal'){// Fungal colonies use layered caps instead of insect chitin.
 const caps=kind==='air'?3:kind==='house'?5:2;for(let j=0;j<caps;j++){const x=(j-(caps-1)/2)*20,z=kind==='house'?29:kind==='hq'?67:48;line([x,-9,12],[x,-9,z],tint(mat,-12),5);mound(x,-9,z,kind==='hq'?24:16,7,tint(mat,18));const q=p(x,-9,z);for(let k=-2;k<=2;k++){ctx.fillStyle='#c6c6a0';ctx.fillRect(q[0]+k*4,q[1]-2+(k%2),2,1);}}}
 }else if(kind==='extractor'){
 prism(-13,-5,12,17,19,3);door(-13,13,3,7,13);stripe(-13,13.2,18,10);
 if(d.resource==='oil'){prism(13,0,10,14,10,3,'#455451');for(const y of [-8,8]){line([8,y,12],[13,y,50],'#a8aa89',3);line([24,y,12],[13,y,50],'#66796f',3);}line([-2,0,51],[30,0,44],'#929c8b',5);line([30,0,44],[30,0,10],'#aeb5a0',2);vent(-13,-5,23,8,11);}
 else{prism(14,0,10,15,7,3,tint(mat,-10));if(d.resource==='ore'){face([[5,-13,12],[23,-13,12],[23,14,29],[5,14,29]],'#303d3d');for(let y=-12;y<15;y+=4)line([5,y,13+(y+13)*.6],[23,y,13+(y+13)*.6],'#9b9d84',2);}else{crystal(14,0,20,d.resource==='rift'?41:22);for(const y of [-12,12])line([5,y,12],[5,y,d.resource==='rift'?54:37],tint(mat,25),2);if(d.resource==='rift'){for(const z of [35,47]){const q=p(14,0,z);ctx.strokeStyle='#afa0c3';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(q[0],q[1],17,6,0,0,Math.PI*2);ctx.stroke();}}else{for(const x of [9,19])crystal(x,8,14,12);}}}
 }else if(style==='machine'){
 const radius=kind==='defense'?18:kind==='house'?25:kind==='air'?39:43,levels=kind==='hq'||kind==='elite'?3:2;
 const hex=(r,z,h,color)=>{const ring=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3)*r,Math.sin(i*Math.PI/3)*r]);for(let j=0;j<6;j++){const a=ring[j],b=ring[(j+1)%6];if(a[0]+a[1]+b[0]+b[1]<0)continue;face([[...a,z],[...b,z],[...b,z+h],[...a,z+h]],tint(color,j%2?-22:-8));pipe(a[0],a[1],z+h-3,b[0],b[1],z+h-3,tint(col,10),1);}face(ring.map(q=>[...q,z+h]),tint(color,16));};
 for(let j=0;j<levels;j++)hex(radius-j*10,3+j*15,13,tint(mat,j*5));
 for(const side of [-1,1]){prism(side*(radius-3),0,6,16,22,3,tint(mat,-13));vent(side*(radius-3),0,26,4,13);pipe(side*24,0,22,side*35,15,8,'#96aa9c',2);}
 if(kind==='hq'||kind==='elite'){hex(12,48,18,'#526e72');crystal(0,0,68,kind==='elite'?33:22);for(const x of [-24,24])antenna(x,0,35);}
 else if(kind==='lab'){for(const x of [-15,0,15]){prism(x,0,4,13,28,29,'#445e65');stripe(x,13.3,45,3);stripe(x,13.3,52,3);}if(/Signal/.test(d.name))antenna(0,0,68);}
 else if(kind==='air'){for(const side of [-1,1]){prism(0,side*20,22,7,8,29,'#506d71');for(let j=-2;j<=2;j++)vent(j*8,side*20,38,3,5);}}
 else if(kind==='defense'){prism(0,0,12,10,9,34,mat);for(const side of [-1,1])pipe(0,side*5,41,35,side*5,44,'#9bb2a5',3);}
 else if(kind==='house'){for(let j=-1;j<=1;j++){prism(j*12,0,4,9,14,29,'#4b6266');stripe(j*12,9.3,36,3);}}
 else{door(0,radius*.85,4,kind==='armor'?16:9,20);vent(0,0,33,14,14);}
 }else if(style==='reptile'){
 for(let j=0;j<(kind==='hq'||kind==='elite'?3:2);j++)prism(0,0,w-j*9,l-j*7,12,3+j*12,tint(mat,j*6));
 const top=kind==='hq'||kind==='elite'?39:27;
 for(const side of [-1,1]){prism(side*(w-7),0,5,l,8,3,'#777757');for(let j=-1;j<=1;j++)face([[side*(w-7),j*15,11],[side*(w-7),j*15,23],[side*(w-2),j*15+3,11]],'#b8a56f');}
 if(kind==='house'){for(const x of [-17,17]){arch(x,l-6,4,8,17);roof(x,-3,16,14,28,12,'#7b895a');}}
 else if(kind==='counter'){for(let x=-w+5;x<w;x+=7)line([x,l+1,4],[x,l+1,29],'#b3ad87',2);prism(0,-10,16,12,22,27,mat);}
 else if(kind==='air'){tower(0,0,28,19,36);for(const side of [-1,1])face([[0,0,62],[side*40,0,78],[side*31,17,51]],'#8e9a66');}
 else if(kind==='armor'&&/Kennel/.test(d.name)){arch(-15,l-6,4,13,25);arch(15,l-6,4,13,25);roof(0,-3,31,20,28,16,'#8d865c');}
 else if(kind==='defense'){tower(0,0,26,12,35);crystal(0,0,65,17);}
 else{prism(0,-3,w-18,l-13,22,top,mat);roof(0,-3,w-15,l-10,top+23,14,'#818c62');arch(0,l-3,4,12,23);for(const x of [-19,19])banner(x,l,30);if(kind==='lab')crystal(0,0,top+38,17);if(kind==='hq'||kind==='elite'){tower(-25,-8,15,9,36);tower(25,-8,15,9,36);}}
 }else if(style==='night'){
 if(kind==='house'){for(const x of [-22,0,22]){prism(x,0,10,20,34+(x===0?7:0),3,'#817983');roof(x,0,12,23,38+(x===0?7:0),18,'#655e70');arch(x,20.5,3,4,16);for(const z of [23,33])window(x,20.8,z,3,6);}}
 else if(kind==='inf'&&!/Lycan/.test(d.name)){prism(0,-8,w,l-10,30,3);roof(0,-8,w+2,l-8,34,19,'#645f73');for(const side of [-1,1]){tower(side*32,20,3,8,33,'#86818b');banner(side*32,23,38,'#a47785');}prism(0,25,24,2,12,3,'#7c7882');arch(0,27,3,9,19);for(let x=-18;x<=18;x+=12)window(x,16,20,3,9);}
 else if(/Lycan/.test(d.name)){prism(-18,-5,19,20,28,3,'#756f66');roof(-18,-5,22,23,32,20,'#5f5c68');arch(-18,16,3,10,23);prism(22,-8,15,18,22,3,'#756f66');roof(22,-8,18,21,26,14,'#5f5c68');for(let x=2;x<43;x+=6)line([x,24,3],[x,24,19],'#aaa38a',2);for(const x of [-36,40])banner(x,20,33,'#9e806a');}
 else if(kind==='armor'){prism(0,0,w,l,32,3);roof(0,0,w+2,l+2,36,16,'#535b65');arch(0,l+.4,3,18,28);for(const x of [-23,23]){tower(x,-8,38,7,24);pipe(x,-8,50,x,-8,78,'#8b9690',4);}if(/Laboratory/.test(d.name)){const q=p(0,0,58);ellipse(ctx,...q,17,12,'#6c8c80');}}
 else{const h=kind==='house'?28:kind==='defense'?42:38;prism(0,0,w,l,h,3);roof(0,0,w+3,l+3,h+4,22,'#5a596d');const tz=kind==='hq'||kind==='elite'?70:kind==='lab'?58:49;tower(-w+9,-5,3,10,tz);spire(-w+9,-5,tz+3,12);if(kind==='hq'||kind==='elite')spire(w-8,-8,3,57);arch(0,l+.3,3,9,27);for(const x of [-20,20]){arch(x,l+.5,18,4,14,'#7c8d91');line([x,l+1,19],[x,l+1,30],'#c7b295',1);}banner(w-3,l+2,h+9,'#956474');if(kind==='air'){for(const side of [-1,1])face([[0,0,h+23],[side*37,0,h+49],[side*29,15,h+19]],'#718d8f');}if(/Blood/.test(d.name)){for(const x of [-15,15]){const q=p(x,0,h+12);ellipse(ctx,...q,9,14,'#8e5b66');pipe(x,0,h+6,x,18,14,'#b7a293',2);}}}
 }else if(style==='dragon'){
 const rock=(x,y,z,w,h)=>{face([[x-w,y-6,z],[x-w*.6,y-8,z+h],[x+w*.5,y-3,z+h-3],[x+w,y+7,z],[x,y+12,z-3]],'#716b5b');face([[x-w*.6,y-8,z+h],[x+w*.5,y-3,z+h-3],[x+w,y+7,z],[x,y+12,z-3]],'#938672');};
 if(kind==='armor'){for(const side of [-1,1])rock(side*26,0,7,17,27);const q=p(0,5,8);ellipse(ctx,...q,23,12,'#756b4d');for(let j=0;j<5;j++){const q=p((j%3-1)*12,Math.floor(j/3)*12,18);ellipse(ctx,...q,6,9,'#b3a37a');}}
 else if(kind==='air'){for(let j=0;j<3;j++)rock(0,-j*4,3+j*18,31-j*7,22);for(const side of [-1,1]){pipe(0,0,61,side*30,0,82,'#c2b18a',2);for(let j=0;j<4;j++)pipe(side*(8+j*6),0,68+j*3,side*(15+j*5),12,54+j*2,'#ad9d76',1);}}
 else{for(let j=-2;j<=2;j++)rock(j*17,-4,5,15,kind==='hq'||kind==='elite'?42-Math.abs(j)*5:28);prism(0,0,w-10,l-7,19,3,'#796c57');arch(0,l-6,3,kind==='house'?8:16,kind==='house'?20:28);for(const side of [-1,1]){pipe(side*20,l-7,18,side*27,l-7,45,'#c9b68a',4);pipe(side*27,l-7,45,side*19,l-7,52,'#d8c59a',2);}for(let j=0;j<25;j++){const q=p((hash(j,5,1)-.5)*35,l+2+hash(j,7,2)*10,3);ctx.fillStyle=j%2?'#c1a65f':'#e0c77b';ctx.fillRect(q[0],q[1],2,1);}if(kind==='lab'){crystal(0,-5,45,25);if(/Furnace/.test(d.name)){tower(23,-8,3,11,58,'#846e57');arch(23,4,8,7,13,'#c08249');pipe(23,-8,60,23,-8,76,'#a38e6b',5);}}
 if(kind==='hq'){prism(0,-15,18,12,24,31,'#8c7959');roof(0,-15,22,16,56,16,'#a68c5b');for(const x of [-30,30])banner(x,0,53,'#bb8c55');}
 if(kind==='elite'){for(const side of [-1,1]){rock(side*28,-7,24,17,42);pipe(side*25,0,45,side*17,0,77,'#dac598',3);}}
 if(kind==='house'){for(const x of [-20,20]){arch(x,l-5,3,5,13);roof(x,-4,13,17,23,12,'#a38b60');}}if(kind==='defense'){tower(0,0,29,10,28,'#80715a');crystal(0,0,62,15);}if(kind==='inf')roof(0,-6,24,19,36,14,'#89714e');}
 }else if(style==='demon'){
 const obs='#625b58';for(let j=0;j<2;j++)prism(0,0,w-j*8,l-j*7,12,3+j*12,obs);for(const side of [-1,1]){face([[side*(w-3),0,5],[side*(w-7),-4,63],[side*(w+5),4,5]],tint(obs,13));pipe(side*24,0,25,side*36,0,58,'#a18b67',3);pipe(side*36,0,58,side*27,0,69,'#c1ab80',1.7);}arch(0,l-6,3,15,29,'#402a26');for(let j=-2;j<=2;j++)line([j*10,l-2,4],[j*10+4,l-2,16],'#b77a47',2);
 if(kind==='air'){for(const side of [-1,1])face([[0,0,42],[side*40,0,68],[side*31,19,33]],'#88705c');}
 else if(kind==='house'||kind==='depot'){const q=p(0,0,29);ellipse(ctx,...q,23,11,'#a36340');ellipse(ctx,...q,13,6,'#ddaa5f');}
 else if(kind==='armor'&&/Kennel/.test(d.name)){for(const x of [-15,15])arch(x,l-4,4,8,18);}
 else if(kind==='hq'||kind==='elite'){prism(0,-5,17,16,24,27,obs);spire(0,-5,51,18);banner(0,l,38,'#ac7152');}
 else if(kind==='lab'){crystal(0,0,32,30);for(let j=0;j<6;j++){const a=j*Math.PI/3;prism(Math.cos(a)*22,Math.sin(a)*16,3,3,6,28,'#a58c67');}}
 else if(kind==='defense'){tower(0,0,27,10,28,obs);crystal(0,0,60,20);}else roof(0,-4,25,20,29,18,'#825d49');
 }else if(technical){
 if(kind==='defense'){prism(0,0,17,17,12,3);prism(0,0,10,10,27,15);prism(0,0,17,13,9,42,tint(mat,8));for(const y of [-6,6]){line([7,y,47],[37,y,47],'#243433',5);line([7,y,48],[37,y,48],'#abb3a5',2);}stripe(0,13.4,43,12);}
 else if(kind==='air'){prism(-21,-6,21,23,27,3);door(-21,17.5,3,16,22);prism(-21,-6,23,25,3,30);vent(-23,-8,33,14,15);prism(24,5,18,26,3,3,'#495b58');const q=[[13,-13,7],[13,23,7],[35,23,7],[35,-13,7]];face(q,null,'#aeb39a');line([18,-5,7],[18,16,7],col,2);line([30,-5,7],[30,16,7],col,2);line([18,5,7],[30,5,7],col,2);antenna(-32,-12,35);}
 else if(kind==='armor'){prism(0,-2,w,l,32,3);door(-15,l-1,3,17,27);door(24,l-1,3,10,23);prism(0,-2,w+2,l+2,4,35,tint(mat,6));for(let j=-2;j<=2;j++)prism(j*16,-4,3,l-2,3,39,tint(mat,10));prism(30,-14,7,7,25,39,'#4b5b59');vent(-15,-5,42,12,15);stripe(0,l+1,30,w-3);}
 else if(kind==='hq'){prism(0,0,w,l,25,3);prism(-8,-4,29,24,23,28);prism(-8,-4,31,26,3,51);for(let x=-28;x<=12;x+=10)window(x,20.6,36,4,10);prism(33,-12,8,12,45,3);vent(33,-12,49,6,9);door(4,l+.5,3,10,21);stripe(0,l+.6,23,41);for(const x of [-30,30])window(x,l+.7,10,6,8);antenna(-22,-8,54);const q=p(6,-3,57);ellipse(ctx,...q,11,4,'#344747');poly(ctx,[[q[0]-11,q[1]],[q[0]-8,q[1]-10],[q[0]+10,q[1]-7],[q[0]+11,q[1]]],'#94aaa5','#c7ccc1');}
 else if(kind==='lab'||kind==='elite'){prism(0,0,w,l,23,3);door(0,l+.5,3,8,18);for(const x of [-24,24])window(x,l+.5,8,7,10);prism(-14,-4,16,17,22,26);vent(-14,-4,49,12,13);prism(23,-4,9,12,38,26,tint(mat,-5));stripe(23,8.4,54,8);const q=p(23,-4,69);ellipse(ctx,...q,8,4,'#c2d8c9');for(let j=0;j<3;j++)line([17,-4,30+j*10],[29,-4,30+j*10],col,2);if(kind==='elite'){antenna(-23,-10,52);crystal(23,-4,72,18);}}
 else{const h=kind==='house'?24:30;prism(0,0,w,l,h,3);prism(0,0,w+2,l+2,3,h+3);door(0,l+.5,3,8,20);for(const x of [-24,24])window(x,l+.5,10,6,8);stripe(0,l+.4,h-2,w-2);vent(-17,-3,h+7,10,16);vent(14,-7,h+7,9,12);if(kind==='inf'){prism(34,12,7,12,10,3,tint(mat,-12));antenna(24,-17,h+8);}if(kind==='counter')for(let x=-30;x<33;x+=8)line([x,l+3,3],[x,l+3,25],'#8c9989',2);}
 // Bolted edges and power conduits shared with the mechanical unit palette.
 if(style==='industrial'&&kind==='inf'){roof(-7,12,29,17,22,9,'#6b7f77');for(const x of [-32,20])pipe(x,l+8,3,x,l+8,24,'#b2b7a0',2);banner(30,l+8,31);for(let j=0;j<3;j++)prism(-22+j*14,l+8,4,3,3,3,'#87896e');}
 if(style==='industrial'&&kind==='house'){prism(-13,-3,24,19,18,30,'#8f9790');for(const z of [16,37])for(let x=-30;x<=4;x+=11)window(x,16.8,z,3,7);prism(-13,-3,26,21,2,48,'#a1a797');}
 if(style==='industrial'&&kind==='lab'){for(const x of [-27,5])pipe(x,17,8,x,17,50,'#bdad74',3);pipe(-27,17,50,5,17,50,'#c5b47c',3);pipe(-12,17,50,-12,17,29,'#b6beb0',1);prism(-12,17,4,3,4,25,'#6d837c');}
 if(kind!=='defense'){for(let x=-w+5;x<w;x+=9){const q=p(x,l+.8,6);ctx.fillStyle='#bcc1a6';ctx.fillRect(Math.round(q[0]),Math.round(q[1]),1,1);}line([w+2,-l+3,7],[w+2,l-3,7],tint(col,-25),2);}
 }else{
 // Civilian homes, training courts, workshops and towers have different floor plans.
 const timber=style==='ape',classical=style==='myth',arcane=style==='wizard',roofColor=timber?'#a18a59':classical?'#a27658':arcane?'#69698b':'#6e8a71',stone=timber?'#8c795a':classical?'#b8ad90':arcane?'#9a9399':'#999b83';
 const hall=(x,y,ww,ll,h)=>{prism(x,y,ww,ll,h,3,stone);roof(x,y,ww+3,ll+3,h+4,timber?20:classical?13:18,roofColor);if(classical||arcane)arch(x,y+ll+.4,3,Math.min(8,ww*.4),Math.min(25,h-2));else door(x,y+ll+.4,3,Math.min(8,ww*.4),Math.min(23,h-2));for(const side of [-1,1])if(ww>16)window(x+side*(ww-8),y+ll+.7,13,3,7);};
 const colonnade=(x,y,ww,z,h)=>{for(let xx=x-ww;xx<=x+ww;xx+=12){prism(xx,y,3,3,3,z,'#d3c4a2');pipe(xx,y,z+3,xx,y,z+h,'#c7bb9e',4);prism(xx,y,4,4,3,z+h,'#dfcfac');}};
 if(kind==='hq'){hall(0,-9,25,26,43);hall(-35,7,12,19,24);hall(35,7,12,19,24);for(let j=0;j<4;j++)prism(0,l+7-j*3,12,3,2+j*2,0,stone);if(arcane){tower(0,-15,45,12,31,stone);spire(0,-15,76,8);}else if(classical){colonnade(0,20,24,3,38);roof(0,20,29,13,44,18,roofColor);}else if(timber){for(const side of [-1,1]){pipe(side*27,9,5,side*27,9,57,'#746442',5);banner(side*27,9,63);}}else{tower(-25,-7,23,10,38,stone);spire(25,-7,28,22);}}
 else if(kind==='house'){hall(-17,-5,16,19,24);hall(18,11,14,16,20);if(arcane)spire(-24,-10,29,16);if(classical){colonnade(-18,15,12,3,21);prism(18,11,16,18,2,26,stone);}if(timber)for(let j=0;j<4;j++)prism(-27+j*8,25,3,4,5,2,'#a58f61');}
 else if(kind==='depot'){prism(0,0,35,26,4,3,stone);for(const x of [-28,28])for(const y of [-18,18])pipe(x,y,6,x,y,35,timber?'#927b51':stone,4);roof(0,-3,38,28,35,18,roofColor);for(let j=0;j<7;j++)prism(-24+j%4*14,-8+Math.floor(j/4)*16,5,5,9+j%3*3,7,'#9b8863');if(classical)colonnade(0,25,24,3,29);}
 else if(kind==='inf'){hall(0,-13,38,17,27);prism(0,20,34,14,2,3,tint(stone,-14));for(const x of [-27,27]){pipe(x,24,5,x,24,26,'#ae9a70',2);banner(x,24,33);}for(let j=-1;j<=1;j++){pipe(j*13,23,5,j*13,23,18,'#8e7951',2);const q=p(j*13,23,20);ellipse(ctx,...q,4,5,'#ac9975');ellipse(ctx,...q,2.5,3,'#716746');}if(/Elven/.test(d.name)){for(const side of [-1,1]){pipe(side*34,-5,4,side*30,-5,63,'#776b4c',5);const q=p(side*30,-5,62);ellipse(ctx,...q,18,12,'#708958');ellipse(ctx,q[0]-5,q[1]-4,11,8,'#8e9c69');}}if(/Orc/.test(d.name))for(const side of [-1,1]){pipe(side*17,5,4,side*23,5,39,'#c7b68d',5);pipe(side*23,5,39,side*16,5,49,'#e0cf9d',2);}}
 else if(kind==='armor'){hall(-4,-5,35,27,33);arch(-3,23,3,17,27,'#263431');for(const x of [-29,27])pipe(x,27,3,x,27,44,'#8f7854',4);pipe(-29,27,44,27,27,44,'#b39a6f',4);pipe(16,27,44,16,27,21,'#c6bb95',1);prism(16,27,4,4,4,17,'#797a66');if(/Creatures|Troll|Beast/.test(d.name)){for(let x=-25;x<25;x+=6)pipe(x,25,4,x,25,24,'#a9a38a',1.5);}if(/Siege|Stoneworks|Artifice/.test(d.name)){for(let j=0;j<3;j++){const q=p(31,5+j*10,7);ellipse(ctx,...q,6,6,'#796e52');ellipse(ctx,...q,3,3,'#b7a577');}}}
 else if(kind==='air'){prism(0,0,39,30,6,3,tint(stone,-10));for(const side of [-1,1]){tower(side*29,-10,9,7,39,stone);pipe(side*29,-10,49,side*29,23,49,'#ad9b73',3);}prism(0,6,25,19,3,38,stone);for(let j=0;j<5;j++)prism(0,29-j*4,14,3,5+j*6,3,stone);if(arcane){roof(0,-5,35,19,51,22,roofColor);for(let j=-2;j<=2;j++)pipe(j*10,10,43,j*10,28,45,'#b7a16a',2);}else if(style==='elder'){for(let j=0;j<8;j++){const a=j*Math.PI/4;crystal(Math.cos(a)*22,5+Math.sin(a)*14,44,12);}}else{const q=p(0,2,44);ellipse(ctx,...q,18,8,'#927f56');for(let j=-2;j<=2;j++)pipe(j*7,-7,45,j*6,15,44,'#c0ab7b',1);}}
 else if(kind==='defense'){tower(0,0,3,16,55,stone);prism(0,0,21,18,4,58,stone);for(const side of [-1,1])pipe(side*16,0,62,side*16,0,79,stone,3);roof(0,0,23,21,80,18,roofColor);if(arcane||classical)crystal(0,3,64,18);else{arch(0,13,18,5,13);banner(0,20,58);}}
 else if(kind==='lab'){if(timber||/Dwarven|Artifice/.test(d.name)){hall(-12,-3,24,23,29);tower(25,-11,3,10,58,stone);arch(25,0,7,7,16,'#b87742');pipe(25,-11,61,25,-11,73,'#9c8d72',4);prism(11,25,8,7,6,3,'#777c70');prism(11,25,13,5,4,9,'#abb09b');}else if(classical){hall(0,-8,29,22,39);colonnade(0,18,24,3,36);roof(0,18,31,10,42,15,roofColor);tower(0,-17,43,10,19,stone);crystal(0,-17,65,18);}else{hall(4,2,28,24,30);tower(-27,-10,3,10,62,stone);spire(-27,-10,65,8);tower(29,-10,3,8,40,stone);roof(29,-10,12,12,44,19,roofColor);for(let j=0;j<3;j++)window(-23+j*20,26.6,17,3,8);crystal(0,0,49,21);}}
 else if(kind==='elite'){hall(0,1,30,26,42);for(const side of [-1,1]){tower(side*31,-6,3,11,60,stone);spire(side*31,-6,63,7);banner(side*25,25,48);}if(classical){colonnade(0,29,24,3,37);roof(0,29,32,12,43,17,roofColor);}else if(timber)roof(0,0,36,30,51,29,roofColor);else crystal(0,-2,67,25);}
 else{hall(0,0,32,25,28);if(kind==='support'){for(const x of [-15,15]){const q=p(x,4,46);ellipse(ctx,...q,9,12,x<0?'#8baf9c':'#ad99b5');pipe(x,4,41,x,22,17,'#c0ad7f',2);}}}
 }
 // Root seams, ventilation pores and veins connect biological architecture to its material.
 if(organic){for(let j=0;j<7;j++){const a=j*Math.PI*2/7,x=Math.cos(a)*30,y=Math.sin(a)*23;pipe(x*.65,y*.65,12,x,y,3,tint(mat,j%2?19:-9),2);pipe(x,y,3,x*1.25,y*1.2,2,tint(mat,-15),1);}
 if(kind==='hq'||kind==='elite'){for(const side of [-1,1])for(let j=0;j<3;j++){const q=p(side*(19-j*3),5,31+j*8);ellipse(ctx,...q,3,2,'#3b4632');ellipse(ctx,q[0]-.5,q[1]-.6,1.8,.7,'#b3a879');}}
 if(style==='fungal'){for(let j=0;j<5;j++){const x=(j-2)*11,q=p(x,10,kind==='house'?28:47);ctx.strokeStyle='#4d604e';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(q[0]-6,q[1]);ctx.lineTo(q[0],q[1]+4);ctx.lineTo(q[0]+6,q[1]);ctx.stroke();}}
 }
 // Role-specific props remain part of the structure, including support and storage branches.
 if(!organic&&kind==='depot'){for(let j=0;j<4;j++){const x=-22+j*13;prism(x,l+9,5,5,8+j%2*5,2,'#8a8062');line([x-4,l+14,4],[x+4,l+14,10],'#c5b98b');}prism(-22,-5,7,8,9,37,tint(mat,-15));}
 if(kind==='support'){if(organic){crystal(0,0,46,25);}else{for(const x of [-16,16]){prism(x,-4,8,9,12,38,tint(mat,-12));const q=p(x,-4,58);ellipse(ctx,...q,8,11,'#87ac9c');ellipse(ctx,q[0]-2,q[1]-3,3,5,'#c2d8b9');line([x,-4,61],[x,-4,72],'#aab2a0',3);}line([-16,-4,45],[16,-4,45],'#b5a581',2);}}
 if(organic&&kind==='counter'){const q=p(0,14,17);ellipse(ctx,...q,22,11,'#283a32');ellipse(ctx,...q,18,7,'#7e9b6d');for(const x of [-24,24])line([x,14,6],[x,14,42],tint(mat,30),4);}
 const siblings=f.buildings.filter(b=>b.kind===kind&&b.kind!=='extractor'),branch=siblings.findIndex(b=>b.id===d.id);
 if(!organic&&branch>0){const x=-w+4,y=l-5,z=technical?32:40;prism(x,y,8+branch*2,8,16+branch*5,3,tint(mat,-10));if(technical){vent(x,y,21+branch*5,6,6);antenna(x,y,z);}else spire(x,y,19,18+branch*5);}
 // Sparse stone chips / painted metal wear: fixed texels, never blurry noise overlays.
 ctx.globalCompositeOperation='source-atop';for(let i=0;i<900;i++){const x=Math.floor(hash(i,2,19)*240),y=Math.floor(hash(i,5,23)*220);ctx.fillStyle=i%3?'#0d171a14':'#eee4b71c';ctx.fillRect(x,y,1,1);}ctx.globalCompositeOperation='source-over';
 this.cache.set(key,c);return c;}

 releaseUnit(d,f,angle){const deferred=this.liveRendering;this.liveRendering=false;try{return this.unit(d,f,angle,'attack',2);}finally{this.liveRendering=deferred;}}
 archiveUnit(key,c){
 if(!c?.getContext)return;this.unitArchive??=new Map();if(this.unitArchive.has(key))return;
 const ctx=c.getContext('2d'),full=ctx.getImageData(0,0,c.width,c.height);let x0=c.width,y0=c.height,x1=-1,y1=-1;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(full.data[(y*c.width+x)*4+3]){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<0)return;const pixels=ctx.getImageData(x0,y0,x1-x0+1,y1-y0+1),p=c.ownerPaint,owner=p?{x:p.x,y:p.y,w:p.data.width,h:p.data.height,indices:p.indices,light:p.light,color:p.color}:null;
 this.unitArchive.set(key,{x:x0,y:y0,pixels,owner,weaponMuzzle:c.weaponMuzzle});this.unitArchiveBytes=(this.unitArchiveBytes||0)+pixels.data.byteLength;
 while(this.unitArchiveBytes>64*1024*1024){const k=this.unitArchive.keys().next().value;this.unitArchiveBytes-=this.unitArchive.get(k).pixels.data.byteLength;this.unitArchive.delete(k);}
 }
 restoreUnit(key){const a=this.unitArchive?.get(key);if(!a)return null;this.unitArchive.delete(key);this.unitArchive.set(key,a);const c=canvas(336,336),ctx=c.getContext('2d');ctx.putImageData(a.pixels,a.x,a.y);if(a.owner){const p=a.owner;c.ownerPaint={x:p.x,y:p.y,data:ctx.getImageData(p.x,p.y,p.w,p.h),indices:p.indices,light:p.light,color:p.color};}if(a.weaponMuzzle)c.weaponMuzzle=a.weaponMuzzle;return this.keepUnit(key,c);}
 keepUnit(key,c){while(this.unitArchiveBytes>64*1024*1024){const k=this.unitArchive.keys().next().value;this.unitArchiveBytes-=this.unitArchive.get(k).pixels.data.byteLength;this.unitArchive.delete(k);}this.unitKeys??=new Set();if(!this.cache.has(key))this.archiveUnit(key,c);this.unitKeys.delete(key);this.unitKeys.add(key);this.cache.set(key,c);while(this.unitKeys.size>160){const oldest=this.unitKeys.values().next().value;this.unitKeys.delete(oldest);this.cache.delete(oldest);}return c;}

 unit(d,f,angle,action,frame,occupancy=0){if(['attack','gather','build','heal'].includes(action))frame%=4;if(action==='dead'||action==='idle'&&!d.air)frame=0;const dir=((Math.round(angle/(Math.PI/4))%8)+8)%8,key=['u',d.id,dir,action,frame,Math.ceil(occupancy/3.4)].join();if(this.cache.has(key))return this.keepUnit(key,this.cache.get(key));const archived=this.restoreUnit(key);if(archived)return archived;if(this.liveRendering&&this.deferUnit){const pending=this.deferUnit(key,d,f,dir*Math.PI/4,action,frame,occupancy);if(pending)return pending;}const c=canvas(336,336),ctx=c.getContext('2d'),a=dir*Math.PI/4,ca=Math.cos(a),sa=Math.sin(a),walk=action==='walk'?Math.sin(frame/6*Math.PI*2):0,attack=action==='attack',working=['gather','build'].includes(action),lift=attack?[3,18,12,2][frame%4]:working?[3,17,23,8][frame%4]:0,dead=action==='dead';
 if(root.FractureExpansionArt?.unit(ctx,d,f,angle,action,frame,occupancy))return this.keepUnit(key,c);
 if(root.FractureIdentity?.render(ctx,d,f,angle,action,frame))return this.keepUnit(key,c);
 ctx.scale(3,3);
 const p=(x,y,z)=>{let xx=x*ca-y*sa,yy=x*sa+y*ca;return[56+(xx-yy)*.8,87+(xx+yy)*.4-(dead?z*.2:z)];};
 const segment=(from,to,color,width)=>{let v=p(...from),w=p(...to);ctx.strokeStyle='#1c2424';ctx.lineWidth=width+1.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...v);ctx.lineTo(...w);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(v[0]-.4,v[1]-.6);ctx.lineTo(w[0]-.4,w[1]-.6);ctx.stroke();};
 const ball=(x,y,z,rx,ry,color)=>{const q=p(x,y,z);ellipse(ctx,q[0],q[1],rx,ry,tint(color,-30));ellipse(ctx,q[0]-.35,q[1]-.6,rx*.87,ry*.86,color);ellipse(ctx,q[0]-rx*.25,q[1]-ry*.34,rx*.51,ry*.33,tint(color,30));};
 const box=(x,y,w,l,h,z,color)=>{poly(ctx,[p(x-w,y-l,z),p(x+w,y-l,z),p(x+w,y-l,z+h),p(x-w,y-l,z+h)],tint(color,-20),'#1c2222');poly(ctx,[p(x-w,y+l,z),p(x+w,y+l,z),p(x+w,y+l,z+h),p(x-w,y+l,z+h)],tint(color,-6),'#1c2222');poly(ctx,[p(x+w,y-l,z),p(x+w,y+l,z),p(x+w,y+l,z+h),p(x+w,y-l,z+h)],tint(color,-31),'#1c2222');poly(ctx,[p(x-w,y-l,z+h),p(x+w,y-l,z+h),p(x+w,y+l,z+h),p(x-w,y+l,z+h)],tint(color,17),'#b6b7a179');};
 const style=f.style,color=f.color,mech=style==='machine',bug=style==='insect',fungal=style==='fungal',vehicle=(['tank','siege','gunship','fighter'].includes(d.role)&&['industrial','machine','night','reptile'].includes(style))||/Ram|Catapult|Siege Engine|Dwarven Artillery/.test(d.name),large=['tank','giant'].includes(d.role),scale=large?1.4:d.role==='heavy'?1.15:1,roleIndex=Object.keys(D.units).filter(id=>D.units[id].faction===d.faction&&D.units[id].role===d.role).indexOf(d.id);
 if(vehicle){const chassis=d.role==='tank'&&roleIndex===0?23:d.role==='siege'?21:18;const base=style==='night'?'#626270':style==='reptile'?'#747c5d':'#77827b';if(d.air){box(0,0,18,5,6,9,base);poly(ctx,[p(8,0,12),p(-10,-22,10),p(-16,-23,10),p(-5,0,12),p(-16,23,10),p(-10,22,10)],tint(base,-3),'#adb3a0');ball(11,0,16,5,3,'#6d999e');if(d.role==='gunship'){const r=frame*Math.PI/3;segment([-Math.cos(r)*24,-Math.sin(r)*24,30],[Math.cos(r)*24,Math.sin(r)*24,30],'#b5b8a4',1);segment([Math.sin(r)*24,-Math.cos(r)*24,30],[-Math.sin(r)*24,Math.cos(r)*24,30],'#8a9083',1);}}
 else{box(0,-10,17,4,6,1,'#333d3c');box(0,10,17,4,6,1,'#333d3c');for(let i=-12;i<=12;i+=6){ball(i,-13,4,3,3,'#72786a');ball(i,13,4,3,3,'#72786a');for(const side of [-1,1]){const r=action==='walk'?frame*.9:0;segment([i-Math.cos(r)*2,side*13,4-Math.sin(r)*2],[i+Math.cos(r)*2,side*13,4+Math.sin(r)*2],'#b3b49e',.8);}}box(0,0,chassis,9,7,5,base);box(1,0,d.role==='tank'&&roleIndex===0?12:9,7,d.role==='tank'&&roleIndex===0?4:6,12,tint(base,8));if(roleIndex>0){box(-8,0,6,5,2,13,tint(base,-18));for(const side of [-1,1])box(0,side*10,14,2,3,8,tint(base,-8));}segment([4,0,18],[d.role==='siege'?34:28,0,attack?18-frame%4:18],tint(base,20),4);ball(3,0,20,4,2,'#3c4640');for(const side of [-1,1]){segment([-14,side*9,13],[13,side*9,13],tint(base,24),1);box(-4,side*6,4,1,1,19,tint(color,-14));}segment([6,0,21],[9,0,21],'#b8c4b1',1);for(let j=-1;j<=1;j++)box(-10,j*5,3,1,1,13,'#45514a');}segment([-12,-6,15],[-12,-6,28],'#4d5551',1);ball(-12,-6,28,1.5,1.5,color);}
 else if(mech||bug||fungal){
 const role=d.role,termite=/Termite|Bombardier/.test(d.name),col=mech?'#708387':fungal?'#8b9a77':termite?'#ad9870':'#8d704a';
 const mass=role==='giant'?1.9:['tank','siege','heavy'].includes(role)?1.4:role==='scout'?.7:role==='worker'?.9:1;
 const segments=mech?role==='tank'?4:2:3;
 for(let j=0;j<segments;j++)for(const side of [-1,1]){const x=(j-(segments-1)/2)*7*mass,step=walk*(j%2?1:-1)*4;segment([x,side*4,12],[x+step,side*12*mass,7],tint(col,-12),2);segment([x+step,side*12*mass,7],[x+step+3,side*18*mass,1],col,2);}
 ball(-9*mass,0,12,9*mass,6*mass,tint(col,-20));ball(0,0,15,6*mass,6*mass,col);ball(9,0,17,role==='melee'?7:5,role==='melee'?5:4,tint(col,6));
 if(mech){box(-7,0,7*mass,5*mass,5,14,tint(col,-9));segment([-8,0,20],[-8,0,27],color,1);ball(-8,0,27,1.5,1.5,'#a9d9d0');}
 if(d.air){for(const side of [-1,1]){poly(ctx,[p(0,side*3,20),p(-8,side*(role==='fighter'?32:24),27+walk*6),p(-19,side*19,15),p(-7,side*3,16)],mech?'#839a9b':'#a5b09c','#d0c9a0');segment([0,side*3,20],[-8,side*28,25+walk*6],tint(col,29),1);}}
 if(role==='worker'){for(const side of [-1,1]){segment([10,side*3,17],[17+lift*.15,side*7,12+lift*.4],tint(col,27),2);segment([17,side*7,13],[21,side*4,13],tint(col,40),1.5);}ball(-12,0,14,6,5,tint(col,15));}
 else if(role==='scout'){for(const side of [-1,1]){segment([11,side*2,19],[18,side*9,29],tint(col,23),1);ball(18,side*9,29,1.3,1.3,color);}}
 else if(role==='melee'){for(const side of [-1,1]){segment([10,side*3,19],[23-lift*.2,side*9,15+lift*.5],tint(col,35),3);segment([23-lift*.2,side*9,15+lift*.5],[24,side*2,13+lift*.5],'#d1bb8d',2);}}
 else if(role==='heavy'||role==='tank'){for(let j=0;j<4;j++){ball(-11+j*5,0,19,6*mass,5*mass,tint(col,j%2?12:-9));segment([-12+j*5,-7*mass,19],[-12+j*5,7*mass,19],tint(col,-27),.8);}for(const side of [-1,1])segment([9,side*5,20],[18,side*8,27],tint(col,35),3);}
 else if(role==='siege'){const mortar=roleIndex>0;ball(-8,0,20,13,10,tint(col,9));for(const side of mortar?[-1,1]:[0]){segment([-3,side*4,24],[mortar?4:18,side*4,mortar?38:26],tint(col,20),mortar?6:5);ball(mortar?4:18,side*4,mortar?38:26,2.5,2.5,'#293d32');}}
 else if(role==='aa'){segment([4,0,20],[27,0,32+lift*.2],tint(col,35),3);for(const side of [-1,1])segment([8,side*4,23],[17,side*11,32],color,2);}
 else if(role==='elite'){for(let j=-1;j<=1;j++)segment([0,j*5,20],[-6,j*8,34],tint(col,38),2);for(const side of [-1,1])segment([8,side*5,22],[23,side*7,23+lift*.2],color,3);}
 else if(role==='stealth'){ball(-9,0,18,12,5,tint(col,-18));for(const side of [-1,1])ball(-12,side*7,14,4,5,'#b89b62');segment([7,0,19],[16,0,17+lift*.3],col,2);}
 else{segment([6,0,19],[19,0,19+lift*.1],mech?'#8a9da0':color,3);ball(-8,0,20,6,5,role==='support'?'#a7c6aa':tint(col,16));}
 if(fungal)for(let j=0;j<3;j++){segment([-7+j*4,0,18],[-9+j*5,3,27+j%2*4],col,2);ball(-9+j*5,3,27+j%2*4,4,2,tint(col,24));}
 if(roleIndex>0)for(let j=0;j<roleIndex;j++)segment([-8-j*4,0,22],[-11-j*4,0,31+j*2],tint(col,30),2);
 if(!mech){for(const side of [-1,1]){ball(12,side*3,19,1.8,1.4,'#343b29');ball(12.5,side*3,19.6,.7,.6,'#dfcd92');segment([12,side*2,17],[17,side*4,14],tint(col,26),1.2);segment([17,side*4,14],[19,side*1,14],'#d7c294',1);}
 for(let j=0;j<4;j++)segment([-15+j*3,-4,15],[-15+j*3,4,15],tint(col,-24),.65);
 if(fungal){for(let j=0;j<6;j++){const x=-12+j*4;ball(x,j%2?4:-4,21+j%3,1.8,1.6,j%2?'#c4c498':'#5e715b');}}
 if(d.name==='Acid Spitter'||d.name==='Spitter'){ball(-10,0,23,7,5,'#a5ad68');for(let j=-1;j<=1;j++)segment([-10,j*3,24],[-4,j*3,21],'#d2cc90',.7);}
 }ball(11,-2,18,1.4,1.4,mech?'#82e3e3':'#c8bd7d');}

 else if(large||/Drake|Wyvern|Dragon Whelp|Harpy|Chimera|Hellhound/.test(d.name)||d.air&&style==='dragon'){
 if(roleIndex>0)for(let j=0;j<roleIndex+2;j++){segment([-12+j*7,0,22],[-15+j*7,0,35+roleIndex*3],tint(color,26),3);}const col=style==='dragon'?'#9a7d5a':style==='ape'?'#796759':style==='demon'?'#865b4c':color;for(const side of [-1,1])for(const x of [-8,9]){segment([x,side*5,13],[x+walk*(x>0?4:-4),side*8,2],tint(col,-15),4);}ball(-1,0,17,large?17:12,large?12:8,col);segment([-12,0,15],[-28,3+walk*2,6],tint(col,-9),4);segment([11,0,20],[17,0,28],col,6);ball(19,0,29,7,5,tint(col,9));segment([22,0,29],[28,0,25],tint(col,-7),4);for(const s of [-1,1])segment([15,s*3,32],[13,s*7,40],tint(col,29),2);if(d.air){for(const s of [-1,1]){poly(ctx,[p(0,s*5,23),p(-2,s*31,30+walk*8),p(-23,s*22,17),p(-12,s*5,19)],tint(col,-15),'#b2a17e');segment([0,s*5,23],[-2,s*31,30+walk*8],tint(col,20),2);}}}
 else{let skin=style==='reptile'?'#8c9a68':style==='ape'?'#81715c':style==='demon'?'#a77f65':style==='dragon'?'#aa9271':'#c0b39a';let cloth=d.worker?'#a49870':style==='wizard'?'#696982':style==='night'?'#555663':tint(color,-22);const hh=style==='ape'?21:24,wide=style==='ape'?6:d.role==='heavy'?5:3.5;const coat=['wizard','night'].includes(style)||/Spell|Mage|Wizard|Seer/.test(d.name);if(coat)poly(ctx,[p(0,-5,hh-7),p(0,5,hh-7),p(-2,7,4),p(-2,-7,4)],cloth,'#2d3336');
 for(const side of [-1,1]){const stride=walk*side*5;segment([0,side*3,12],[-stride*.5,side*3,6],tint(cloth,-14),3);segment([-stride*.5,side*3,6],[stride,side*3,1],tint(cloth,-5),3);segment([stride,side*3,1],[stride+3,side*3,1],'#393d37',3);}
 ball(0,0,hh-6,wide*1.4,7,cloth);segment([1,-3,hh-2],[1,3,hh-13],d.worker?'#685e48':'#455650',1);segment([2,-3,hh-12],[2,3,hh-12],'#393e36',1.5);for(const side of [-1,1])box(1,side*3,1.4,1.1,2,hh-13,d.worker?'#b2a27c':tint(cloth,15));if(!d.worker&&!coat){segment([2,-2,hh-3],[2,2,hh-3],tint(cloth,43),1);}if(d.role==='heavy')for(const side of [-1,1])ball(0,side*5,hh-3,4,3,tint(color,8));if(d.worker)box(-3,0,3,3,8,hh-11,'#8e8263');else if(d.role==='aa'){box(-4,0,3,5,10,hh-14,'#58675c');segment([-5,-5,hh-10],[-5,-5,hh+7],'#a8b49b',3);}else if(d.role==='support'){box(-4,0,3,4,7,hh-12,'#c5c5aa');segment([-5,-3,hh-7],[-5,3,hh-7],color,2);}else if(d.role==='scout'){segment([-3,0,hh-4],[-3,0,hh+10],'#9eae95',1);box(-3,0,3,3,6,hh-10,'#647267');}else if(d.role==='elite'){for(const side of [-1,1])box(0,side*5,3,2,4,hh-4,tint(color,23));}else if(d.role==='stealth'){poly(ctx,[p(-2,-5,hh-1),p(-2,5,hh-1),p(-5,6,5),p(-5,-6,5)],tint(cloth,-17),'#303a39');}if(roleIndex>0){segment([-2,0,hh+5],[-3,0,hh+11+roleIndex*2],tint(color,25),2);box(-3,0,2+roleIndex,4,6,hh-10,tint(cloth,-10));}if(style==='reptile'||style==='dragon')segment([-2,0,9],[-14,walk,2],skin,3);
 for(const side of [-1,1]){const swinging=working||attack,handX=swinging?7+frame%2*3:-walk*side*3,handZ=swinging?hh-12+lift:hh-15;segment([0,side*5,hh-5],[3,side*6,hh-11],cloth,2.5);segment([3,side*6,hh-11],[handX,side*4,handZ],skin,2);}
 ball(1,0,hh+2,3.5,4.2,skin);const head=p(1,0,hh+5);if(['industrial','reptile','elder','night'].includes(style)&&!d.worker){ellipse(ctx,head[0],head[1],4.2,2.2,tint(cloth,20));}if(d.worker&&style==='industrial'){ellipse(ctx,head[0],head[1],4.2,2.4,'#c5ae58');}if(style==='wizard'){poly(ctx,[p(-3,-3,hh+3),p(-3,3,hh+3),p(0,0,hh+15)],tint(cloth,-2),'#a2a6ad');}if(style==='demon'){segment([0,-2,hh+5],[-2,-4,hh+11],'#c0b08a',1);segment([0,2,hh+5],[-2,4,hh+11],'#c0b08a',1);}const face=p(4,0,hh+2);ellipse(ctx,face[0],face[1],1.3,1.2,'#292d27');
 const hand=[working||attack?9:3,4,working||attack?hh-12+lift:hh-14];
 if(d.worker){if(working){segment(hand,[hand[0]+5,4,hand[2]+9],'#9b8b60',1.5);segment([hand[0]+1,4,hand[2]+9],[hand[0]+11,4,hand[2]+9],'#abb1a4',2);}else segment([1,4,8],[6,4,16],'#827758',1.5);}
 else if(/Archer/.test(d.name)){const bx=attack?12:4,z=attack?19:9;let top=p(bx,0,z+7),bottom=p(bx,0,z-7),mid=p(bx+3,0,z);ctx.strokeStyle='#b8a273';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(...top);ctx.quadraticCurveTo(mid[0]+3,mid[1],...bottom);ctx.stroke();const draw=p(bx-(attack&&frame<2?6:0),0,z);ctx.strokeStyle='#c6bd9e';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(...top);ctx.lineTo(...draw);ctx.lineTo(...bottom);ctx.stroke();}
 else if(d.range<1.2){const tip=attack?[hand[0]+14-lift*.5,4,hand[2]+10]:[4,4,4];segment(hand,tip,'#c5c5ac',2);segment([hand[0]-2,2,hand[2]],[hand[0]+2,6,hand[2]],'#88785a',2);if(d.role==='melee'&&d.variant%2)ball(0,-7,14,4.5,6,tint(cloth,-8));}
 else if(d.heal||['wizard','myth','elder'].includes(style)&&/Spell|Seer|Hexer|Mage|Wizard/.test(d.name)){segment([4,5,4],[8,5,hh+10],'#9b9677',1.5);ball(8,5,hh+11,2.4,2.4,'#a9d3c1');}
 else{const z=attack?20:11,xx=attack?9:3;segment([xx-4,4,z],[xx+10,4,z+(attack?0:-6)],'#6d7772',d.role==='aa'?3:2);box(xx,4,3,1.5,2,z-1,'#434f4c');if(attack&&frame===2)ball(xx+12,4,z,3,2,'#f2d896');}
 }
 ctx.globalCompositeOperation='source-atop';for(let j=0;j<130;j++){ctx.fillStyle=j%2?'#ffffff0b':'#00000014';ctx.fillRect(23+hash(j,8,d.variant)*66,30+hash(j,9,d.variant)*60,1,1);}ctx.globalCompositeOperation='source-over';return this.keepUnit(key,c);}
}
root.FractureArt={Art,poly,ellipse,tint,unitScale,mixColor,unitLivery,buildingLivery,paintOwner};
})(globalThis);
