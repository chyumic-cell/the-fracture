'use strict';
(function(root){
const directions=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
// Use the rendered, fog-filtered list so unseen demolition cannot reveal itself.
function connectionMasks(game,list){
 const walls=list.filter(e=>e.kind==='building'&&!e.pendingSite&&game.def(e)?.kind==='wall'),grid=new Map(),masks=new Map();
 const key=(x,y,owner)=>owner+':'+Math.floor(x)+','+Math.floor(y);
 for(const e of walls)grid.set(key(e.x,e.y,e.owner),e);
 for(const e of walls){let mask=0;for(let i=0;i<8;i++){const [x,y]=directions[i],neighbor=grid.get(key(e.x+x,e.y+y,e.owner));if(!neighbor)continue;
  // An existing orthogonal corner already joins these cells. Avoid cross-braces.
  if(x&&y&&(grid.has(key(e.x+x,e.y,e.owner))||grid.has(key(e.x,e.y+y,e.owner))))continue;
  if(Math.abs(game.height(e.x,e.y)-game.height(neighbor.x,neighbor.y))>=2)continue;
  mask|=1<<i;
 }masks.set(e.id,mask);}return masks;
}
function connectionProfiles(game,list){const masks=connectionMasks(game,list),grid=new Map(list.filter(e=>masks.has(e.id)).map(e=>[e.owner+':'+Math.floor(e.x)+','+Math.floor(e.y),e])),out=new Map(),byId=new Map(list.map(e=>[e.id,e]));for(const e of list){if(!masks.has(e.id))continue;const mask=masks.get(e.id),arms=[];directions.forEach(([x,y],i)=>{if(!(mask&(1<<i)))return;const other=grid.get(e.owner+':'+Math.floor(e.x+x)+','+Math.floor(e.y+y));if(other)arms.push([Number((other.x-e.x).toFixed(5)),Number((other.y-e.y).toFixed(5))]);});// Carry a terminal span to the map or water boundary, matching its blocked cell.
if(arms.length===1){const dx=-arms[0][0],dy=-arms[0][1],ax=Math.floor(e.x)+Math.sign(dx),ay=Math.floor(e.y)+Math.sign(dy),next=game.tile(ax,ay);if(!next||next.water){const tx=dx?((dx>0?Math.floor(e.x)+1:Math.floor(e.x))-e.x)/dx:Infinity,ty=dy?((dy>0?Math.floor(e.y)+1:Math.floor(e.y))-e.y)/dy:Infinity,t=Math.min(tx,ty);if(Number.isFinite(t)&&t>=0)arms.push([dx*t*2,dy*t*2]);}}
const center=e.gateId&&byId.get(e.gateId),gate=center?{angle:e.gateAngle,role:e.gateRole,open:!e.ghost&&list.some(u=>u.kind==='unit'&&!game.def(u)?.air&&!game.hostile(e.owner,u.owner)&&Math.hypot(u.x-center.x,u.y-center.y)<3)}:null;out.set(e.id,{mask,arms,gate});}return out;}
const palettes={
 industrial:['#829293','#c0c5b6','#354a50','#9dc7cf','metal'],
 reptile:['#8a8c5a','#d2ba76','#434f35','#b5c480','metal'],
 machine:['#42515b','#92a6a9','#1b2934','#73d8d1','metal'],
 insect:['#9b7747','#cdb46c','#654d31','#cbba74','chitin'],
 ape:['#806444','#c4a173','#453b2c','#a0a475','wood'],
 wizard:['#92909a','#cfc6b1','#56516b','#b3a2ed','stone'],
 elder:['#a9b39a','#e1d8b7','#486a58','#90bbaa','stone'],
 myth:['#b9aa8c','#e5cfa1','#71644e','#b4a56a','stone'],
 dragon:['#706a5a','#c2ae7b','#413c34','#b59464','stone'],
 night:['#777483','#b3a8a1','#39353e','#ae7189','stone'],
 demon:['#4e4850','#8c7875','#261f29','#d07543','stone'],
 fungal:['#4d4357','#89758c','#302b3b','#b794d5','skin']
};
function render(ctx,d,f){
 if(!['wall','trap'].includes(d.kind))return false;
 const M=new root.FractureSpriteMesh(ctx,0,false,{originX:120,originY:181,logicalWidth:240}),style=f.style,organic=['insect','fungal'].includes(style),wood=style==='ape',machine=['industrial','machine','reptile','night'].includes(style),[base,trim,dark,accent,material]=palettes[style]||palettes.industrial;
 M.material(material);
 if(d.kind==='wall'&&d.wallGate){
  const gate=d.wallGate,unit=30/(d.size*.53),ux=Math.cos(gate.angle),uy=Math.sin(gate.angle),at=(t,side=0,z=0)=>[ux*t-uy*side,uy*t+ux*side,z];
  const beam=(a,b,w,z,h,c)=>{const v=[at(a,w,z),at(a,-w,z),at(b,-w,z),at(b,w,z)];M.rings([v,v.map(q=>[q[0],q[1],q[2]+h])],c);};
  const arms=d.wallArms||[],lo=arms.length?Math.min(-unit*.5,...arms.map(a=>(a[0]*ux+a[1]*uy)*unit*.5)): -unit*.5,hi=arms.length?Math.max(unit*.5,...arms.map(a=>(a[0]*ux+a[1]*uy)*unit*.5)):unit*.5;
  M.unit=d;M.ownership([{x:[-200,200],y:[-200,200],z:[57,61]}]);beam(lo,hi,12,0,2,dark);beam(lo,hi,12,54,8,base);beam(lo,hi,13,61,3,trim);beam(lo,hi,12.2,58,2,f.color);
  // Each of the original paid sections retains its HP, with a matching gate leaf.
  if(!gate.open){beam(lo,hi,5,3,48,wood?base:dark);for(let t=lo+3;t<hi;t+=9){beam(t,t+3,6,5,45,trim);for(const side of [-1,1])M.seg(at(t,side*6.3,12),at(Math.min(hi,t+8),side*6.3,40),base,1.4);}for(const z of [10,42])beam(lo,hi,6.3,z,2,base);}
  else{beam(lo,hi,5,45,8,dark);for(let t=lo+4;t<hi;t+=9)beam(t,t+2,6,45,8,trim);}
  if(gate.role){const t=gate.role*unit*.32;beam(t-9,t+9,16,0,66,base);beam(t-11,t+11,18,0,6,dark);beam(t-11,t+11,18,65,5,trim);
   if(wood)for(const z of [14,37,58]){M.seg(at(t-10,-17,z),at(t+10,17,z+3),trim,1.4);M.seg(at(t+10,-17,z+3),at(t-10,17,z),trim,1.4);}
   else if(organic){for(let j=0;j<5;j++)M.limb(at(t-7+j*3,-17,3),at(t-8+j*4,-17,65),trim,1.2);M.orb(...at(t,0,71),6,6,7,accent);}
   else if(machine){M.box(...at(t,0,70),7,7,5,dark);M.orb(...at(t,-17,48),2,2,3,accent);for(const z of [9,25,41,57])M.seg(at(t-9,-16.3,z),at(t+9,-16.3,z),trim,1);}
   else{for(const z of [16,31,46])for(const side of [-1,1])M.seg(at(t-9,side*16.2,z),at(t+9,side*16.2,z),dark,.8);M.cylinder(...at(t,0,70),6,style==='wizard'?15:8,style==='wizard'?accent:base,6,2);}
  }
 }else if(d.kind==='wall'){
  M.unit=d;M.ownership([{x:[-200,200],y:[-200,200],z:[33,36]}]);
  const mask=d.wallMask??17,arms=d.wallArms||directions.filter((v,i)=>mask&(1<<i)),straight=arms.length===2&&Math.abs(arms[0][0]*arms[1][1]-arms[0][1]*arms[1][0])<.001&&arms[0][0]*arms[1][0]+arms[0][1]*arms[1][1]<0,unit=30/(d.size*.53),halfWidth=11,height=54;
  const prism=(a,b,w,z,h,color)=>{const len=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/len*w,ny=(b[0]-a[0])/len*w;M.rings([z,z+h].map(zz=>[[a[0]+nx,a[1]+ny,zz],[a[0]-nx,a[1]-ny,zz],[b[0]-nx,b[1]-ny,zz],[b[0]+nx,b[1]+ny,zz]]),color);};
  for(const [dx,dy]of arms){
   const length=Math.hypot(dx,dy)*unit*.5+1,ux=dx/Math.hypot(dx,dy),uy=dy/Math.hypot(dx,dy),at=(t,side=0,z=0)=>[ux*t-uy*side,uy*t+ux*side,z],bar=(from,to,w,z,h,color)=>prism(at(from),at(to),w,z,h,color);
   bar(0,length,halfWidth+3,0,5,dark);bar(0,length,halfWidth,3,height-3,base);
   if(style==='fungal'){
    bar(0,length,halfWidth+1,12,13,dark);bar(0,length,halfWidth-2,height-4,6,trim);
    for(const side of [-1,1])for(let j=0;j<6;j++){const z=8+j*7;M.limb(at(0,side*12,z),at(length*.48,side*(12+j%2),z+5),j%2?trim:base,1.2);M.limb(at(length*.48,side*13,z+5),at(length,side*12,z-1),j%2?base:trim,1.1);}
    for(let t=12;t<length;t+=23){M.orb(...at(t,11,24+t%11),3.8,2.6,4,accent);M.limb(at(t,12,16),at(t+5,17,1),base,2);}
   }else if(style==='ape'){
    for(let t=4;t<length;t+=9){M.cylinder(...at(t,0,3),5.8,height+3,base,7,4.8);M.cylinder(...at(t,0,height+6),4.8,9,trim,7,0);}
    for(const side of [-1,1])for(const z of [16,40])M.seg(at(0,side*12,z),at(length,side*12,z),dark,4);
    for(let t=7;t<length;t+=18)for(const side of [-1,1])M.seg(at(t-2,side*14,35),at(t+2,side*14,45),trim,1.1);
   }else if(style==='insect'){
    bar(0,length,halfWidth+2,37,10,trim);for(let t=7;t<length;t+=19){M.orb(...at(t,0,48),10,10,10,base);for(const side of [-1,1]){M.cylinder(...at(t,side*8,48),3,15,trim,6,0);M.orb(...at(t,side*11,24),5,3,9,dark);}}
   }else if(style==='industrial'||style==='machine'||style==='reptile'){
    bar(0,length,halfWidth+2,48,7,trim);for(let t=5;t<length;t+=20){bar(t,Math.min(length,t+13),halfWidth+.2,9,32,style==='machine'?dark:base);for(const side of [-1,1]){M.seg(at(t,side*12,9),at(t+11,side*12,39),trim,1);for(const z of [11,38])M.orb(...at(t+2,side*12,z),.7,.7,.7,trim);}}
    for(const side of [-1,1])M.seg(at(0,side*12,43),at(length,side*12,43),style==='machine'?accent:f.color,style==='machine'?2:1.5);
    if(style==='reptile')for(let t=10;t<length;t+=20){bar(t-5,t+5,9,55,5,base);M.cylinder(...at(t,0,60),4,9,trim,4,0);}
    if(style==='machine')for(let t=12;t<length;t+=27)M.box(...at(t,0,54),5,4,8,dark);
   }else{
    bar(0,length,halfWidth+1,height,3,trim);
    for(const side of [-1,1])for(let z=11,row=0;z<height;z+=11,row++){M.seg(at(0,side*11.15,z),at(length,side*11.15,z),dark,.6);for(let t=10+(row%2)*10;t<length;t+=20)M.seg(at(t,side*11.2,z),at(t,side*11.2,Math.min(height,z+10)),dark,.5);}
    for(let t=10;t<length;t+=22){
     if(style==='dragon'){M.cylinder(...at(t,0,54),5,17,trim,5,0);bar(t-7,t+7,12,44,7,base);}
     else if(style==='night'){M.cylinder(...at(t,0,56),2,12,dark,6,0);for(const side of [-1,1]){M.seg(at(t,side*11.7,16),at(t,side*11.7,37),dark,3);M.seg(at(t-3,side*11.7,34),at(t,side*11.7,42),trim,.8);M.seg(at(t,side*11.7,42),at(t+3,side*11.7,34),trim,.8);}}
     else if(style==='demon'){M.cylinder(...at(t,0,53),6,13+(t%3),base,4,0);for(const side of [-1,1]){M.seg(at(t-2,side*11.8,6),at(t+3,side*11.8,22),accent,1);M.seg(at(t+3,side*11.8,22),at(t-2,side*11.8,39),accent,.7);}}
     else if(style==='elder'){M.cylinder(...at(t,0,55),4,10,trim,5,0);for(const side of [-1,1]){M.seg(at(t-5,side*12,5),at(t,side*12,29),dark,2);M.seg(at(t,side*12,29),at(t+5,side*12,42),dark,1);M.orb(...at(t+3,side*12,35),2.5,1,5,accent);}}
     else{bar(t-5,t+5,halfWidth+1,57,7,base);if(style==='wizard')for(const side of [-1,1]){M.seg(at(t-3,side*11.8,27),at(t,side*11.8,35),accent,1);M.seg(at(t,side*11.8,35),at(t+3,side*11.8,27),accent,1);M.seg(at(t+3,side*11.8,27),at(t-3,side*11.8,27),accent,1);}if(style==='myth')for(const side of [-1,1])M.seg(at(t,side*12,5),at(t,side*12,45),trim,2);}
    }
   }
  }
  const post=arms.length===0?17:straight?halfWidth:14;
  if(style==='fungal'){M.loft([[0,0,0,post+4,post+4],[0,0,23,post,post],[0,0,50,post-2,post-2],[0,0,61,5,5]],base,9);for(let j=0;j<5;j++)M.limb([Math.cos(j)*post,Math.sin(j)*post,5],[Math.cos(j+.3)*(post-2),Math.sin(j+.3)*(post-2),55],trim,1);M.orb(0,0,57,3,3,4,accent);}
  else if(style==='insect'){M.loft([[0,0,0,post+3,post+3],[0,0,35,post,post],[0,0,58,post-3,post-3],[0,0,67,4,4]],base,6);}
  else if(style==='ape'){M.box(0,0,0,post,post,6,dark);for(const x of [-5,5])M.cylinder(x,0,3,5,59,base,7,4);M.seg([-8,-6,40],[8,6,40],trim,1.8);}
  else{M.box(0,0,0,post,post,height+2,base);M.box(0,0,height+2,post+1,post+1,3,trim);if(!straight){
   if(style==='wizard'){M.cylinder(0,0,58,7,4,dark,8);M.loft([[0,0,63,0,0],[0,0,69,5,5],[0,0,80,0,0]],accent,5);}
   else if(style==='machine'){M.box(0,0,59,7,7,6,dark);M.seg([-5,-7.1,62],[5,-7.1,62],accent,2);}
   else if(style==='industrial')M.box(0,0,59,8,8,4,dark);
   else if(style==='elder')M.cylinder(0,0,58,5,15,trim,5,0);
   else if(style==='night'){M.cylinder(0,0,58,6,7,dark,8,3);M.cylinder(0,0,65,3,12,trim,6,0);}
   else if(style==='demon')M.cylinder(0,0,58,7,15,base,4,0);
   else if(style==='dragon')for(const x of [-8,8])M.seg([x,0,58],[x*1.4,0,74],trim,4);
   else for(const x of [-1,1])for(const y of [-1,1])M.box(x*(post-4),y*(post-4),height+5,4,4,7,base);
  }for(const y of [-1,1])M.seg([-post,y*(post+.15),34],[post,y*(post+.15),34],f.color,1.4);}
 }else{
  M.cylinder(0,0,0,42,5,base,12);
  if(wood){M.box(0,0,5,29,29,1,'#262e25');for(let x=-24;x<=24;x+=8)M.seg([x,-28,7],[x,28,7],'#71855b',2);}
  else if(organic){for(let j=0;j<7;j++)M.orb(Math.cos(j)*25,Math.sin(j)*25,9,9,9,8,f.color);}
  else{M.cylinder(0,0,5,24,8,'#44564e',12);M.cylinder(0,0,13,9,2,f.color,10);for(let j=0;j<6;j++)M.seg([Math.cos(j)*26,Math.sin(j)*26,7],[Math.cos(j)*36,Math.sin(j)*36,6],'#c4b576',2);}
 }
 M.finish();return true;
}
root.FractureFortificationArt={render,connectionMasks,connectionProfiles,directions};
})(globalThis);
