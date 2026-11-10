'use strict';
// Collapsed, passable architecture, authored with the same materials as live buildings.
(function(root){
const palettes={industrial:['#84918d','#c0c5b3','#354447','#966647'],reptile:['#85885e','#c2af72','#3f4936','#6f6a4b'],machine:['#45535e','#94a7ad','#202c35','#618c95'],ape:['#806344','#b49769','#493e2d','#6c7050'],insect:['#927644','#c1a66b','#55452d','#828965'],fungal:['#665363','#9b8890','#342f3d','#9685af'],wizard:['#9390a0','#cbc4b8','#555266','#9b85c4'],elder:['#97a08b','#d1cbb0','#4e6756','#82a293'],myth:['#b6a78c','#e0cbaa','#736653','#9f8c6b'],dragon:['#796f60','#b7a17d','#403d36','#997253'],night:['#75707c','#aaa09c','#39353e','#866475'],demon:['#62545a','#99837b','#30262d','#bc7955']};
function render(ctx,d,f,variant=0){
 const [base,light,dark,accent]=palettes[f.style]||palettes.industrial,style=f.style,wood=style==='ape',organic=['insect','fungal'].includes(style),metal=['industrial','machine','reptile'].includes(style),M=new root.FractureSpriteMesh(ctx,0,false,{originX:120,originY:181,logicalWidth:240,detail:false});
 const seed=[...d.id].reduce((n,c)=>n+c.charCodeAt(0),variant*137),rand=(i,k=0)=>root.FractureSim.hash(i,seed,k+98),tint=root.FractureArt.tint;
 const mat=wood?'wood':organic?(style==='insect'?'chitin':'skin'):metal?'metal':'stone';
 const wall=d.kind==='wall',small=['wall','trap','defense'].includes(d.kind),w=wall?43:small?27:43,l=wall?10:small?25:36;
 function chunk(x,y,z,rx,ry,h,i,col=base){const n=5,low=[],high=[];for(let j=0;j<n;j++){const a=j*2*Math.PI/n,r=.72+rand(i*7+j,2)*.28;low.push([x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r,z]);high.push([x+Math.cos(a+.13)*rx*r*.8,y+Math.sin(a+.13)*ry*r*.8,z+h*(.6+rand(j+i,5)*.4)]);}M.rings([low,high],col);}
 function plank(a,b,width,col=base){const len=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/len*width,ny=(b[0]-a[0])/len*width,v=[[a[0]+nx,a[1]+ny,a[2]],[a[0]-nx,a[1]-ny,a[2]],[b[0]-nx,b[1]-ny,b[2]],[b[0]+nx,b[1]+ny,b[2]]];M.rings([v,v.map(p=>[p[0],p[1],p[2]+1.2])],col);M.seg(a.map((q,i)=>q+(i===2?1.3:0)),b.map((q,i)=>q+(i===2?1.3:0)),tint(col,14),.35);}
 // Broken ground slabs and scattered chips have irregular edges, never an opaque square decal.
 M.material(organic?'skin':wood?'wood':'stone');
 for(let i=0;i<18;i++){const x=(rand(i,11)-.5)*w*2.1,y=(rand(i,12)-.5)*l*2.1;chunk(x,y,0,6+rand(i,13)*8,4+rand(i,14)*6,.6+rand(i,15)*2,i,tint(dark,rand(i,16)*13));}
 M.material(mat);
 for(let i=0;i<30;i++){const a=i*2.4,r=.25+rand(i,20)*.87,x=Math.cos(a)*w*r,y=Math.sin(a)*l*r;chunk(x,y,1,2+rand(i,21)*6,2+rand(i,22)*5,2+rand(i,23)*6,i+30,tint(base,(rand(i,24)-.5)*25));}
 if(wood){
  // Splintered lodge posts, collapsed rafters, rope lashings and torn woven thatch.
  for(let i=0;i<9;i++){const x=(rand(i,31)-.5)*w*1.6,y=(rand(i,32)-.5)*l*1.5;plank([x-12,y-8,3],[x+16,y+7,5+rand(i,33)*6],2+rand(i,34)*2,i%3?base:dark);}
  for(const [x,y,h]of [[-w+6,-l+5,23],[w-8,-l+7,13],[-w+6,l-6,10]]){M.cylinder(x,y,1,3.2,h,base,7,2.3);M.face([[x-3,y-2,h],[x+1,y-3,h+4],[x+3,y+2,h-1],[x-2,y+3,h+1]],light);for(let z=h-6;z<h-2;z+=1.3)M.seg([x-3,y-3,z],[x+3,y+3,z+1],light,.6);}
  for(let i=0;i<11;i++)plank([-13+i*2.1,-13,6],[3+i*2.1,2+rand(i,36)*5,3],1,light);
 }else if(organic){
  if(style==='insect'){
   // Open resin shell arcs expose the interior instead of leaving miniature intact hives.
   for(let j=0;j<3;j++){const x=(j-1)*21,y=j%2*16-10,r=12+j*2;for(let i=0;i<7;i++){const a=(i/6*1.3+.1)*Math.PI,b=a+.21;M.face([[x+Math.cos(a)*r,y+Math.sin(a)*r,2],[x+Math.cos(b)*r,y+Math.sin(b)*r,2],[x+Math.cos(b)*r*.65,y+Math.sin(b)*r*.65,8+rand(i+j,41)*8],[x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65,8+rand(i+j+1,41)*8]],i%2?base:light);M.seg([x+Math.cos(a)*r,y+Math.sin(a)*r,2],[x+Math.cos(a)*r*.65,y+Math.sin(a)*r*.65,13],dark,1);}}
  }else{
   for(let i=0;i<13;i++){const a=i*2.4,x=Math.cos(a)*w*.9,y=Math.sin(a)*l*.9,b=[x*.45,y*.45,5+rand(i,44)*6];M.limb([x,y,1],b,i%2?base:dark,2);M.limb(b,[x*.1+9,y*.1-6,3],accent,1.1);}
   for(let i=0;i<4;i++){const x=(i-1.5)*16,y=i%2*15-7;M.limb([x,y,2],[x+6,y+5,10],light,5);M.face([[x-8,y-8,4],[x+8,y-4,12],[x+12,y+8,7],[x-2,y+9,2]],base);for(let j=0;j<4;j++)M.seg([x-5+j*3,y-5,4],[x+3+j*2,y+4,7],accent,.6);}
  }
 }else{
  // Surviving back-corner courses stay low, leaving the center and foreground open.
  for(let row=0;row<3;row++)for(let j=0;j<6-row*2;j++){const x=-w+8+j*9+row%2*3,y=-l+5;chunk(x,y,2+row*4,4.7,3.8,4.5,80+j+row*9,row===2?light:base);}
  for(let j=0;j<4;j++)chunk(-w+5,-l+14+j*9,2,4,5,6+rand(j,51)*8,100+j,base);
  if(metal){
   for(let j=0;j<4;j++){const x=-19+j*13,y=(j%2)*16-8;M.face([[x-10,y-9,2],[x+8,y-8,3],[x+7,y+2,8+j],[x-8,y+7,4]],j%2?base:light);M.seg([x-9,y-8,3],[x+6,y-7,4],dark,1.5);for(let k=0;k<3;k++)M.seg([x-6+k*4,y-6,4],[x-5+k*4,y+2,7],dark,.65);}
   M.material('metal');M.seg([-w+8,-l+7,4],[-w+5,-l+10,27],dark,2.2);M.seg([-w+5,-l+10,27],[-14,-5,7],base,2.1);M.seg([18,-15,2],[27,-12,20],dark,1.8);M.seg([27,-12,20],[39,-2,10],light,1.2);
   if(style==='machine')for(let i=0;i<5;i++){M.seg([-7+i*2,4,8],[i*4-8,20,1],accent,.8);}
   if(['armor','air','deepMine','extractor','dock'].includes(d.kind)){M.cylinder(15,9,3,9,6,dark,12,8);for(let i=0;i<8;i++){const a=i*Math.PI/4;M.seg([15,9,9],[15+Math.cos(a)*7,9+Math.sin(a)*7,9],light,.8);}}
  }else{
   const x=19,y=-8;M.cylinder(x,y,2,6,11,base,style==='myth'?10:7,5);M.cylinder(x,y,13,7,3,light,8,6);M.seg([-10,10,4],[15,20,6],base,11);M.seg([-10,10,4],[15,20,6],light,1);
   if(['wizard','elder'].includes(style)){M.material('glass');for(let j=0;j<4;j++)chunk(-7+j*5,3+j%2*5,3,2,2,5+j%2*4,j+130,accent);}
   if(['dragon','demon','night'].includes(style)){M.material(style==='dragon'?'bone':'stone');M.loft([[22,13,1,5,4],[27,16,7,3,2],[33,15,10,.2,.2]],light,6);}
  }
 }
 // Fine rubble and localized char marks make contact with the terrain without a blanket shadow.
 M.material('stone');for(let i=0;i<25;i++){const a=i*2.4,r=.65+rand(i,60)*.55;chunk(Math.cos(a)*w*r,Math.sin(a)*l*r,.1,1+rand(i,61)*2.2,1+rand(i,62)*1.7,1+rand(i,63)*1.4,i+160,i%3?base:dark);}
 M.finish();
}
root.FractureRuinsArt={render};
})(globalThis);
