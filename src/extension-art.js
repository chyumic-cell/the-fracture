'use strict';
// Physical production extensions. All geometry is original and cached like the main structures.
(function(root){
function render(ctx,d,f){
 const M=new root.FractureSpriteMesh(ctx,0,false,{originX:80,originY:112,logicalWidth:160}),{box,line,orb,face,tube,ring,fan}=root.FractureDetailArt.kit(M),name=d.name;
 const machine=f.id==='machines',reptile=f.id==='reptilians',base=machine?'#4b606b':reptile?'#8b9470':'#82969c',edge=machine?'#acbbc2':reptile?'#d2c08f':'#c5cbc1',dark=machine?'#23323d':reptile?'#435648':'#344b56',glow=machine?'#e97063':reptile?'#b8d090':'#afd9da',team=f.color;
 const hatch=(x,y,z,w=9,h=14)=>{box(x,y,z,w+1,1,h+2,edge);face([[x-w,y+1.1,z],[x+w,y+1.1,z],[x+w,y+1.1,z+h],[x-w,y+1.1,z+h]],dark);for(let j=2;j<h;j+=3)line([x-w+.6,y+1.3,z+j],[x+w-.6,y+1.3,z+j],base,.65);};
 const hull=(x,y,z,w,l,h)=>{box(x,y,z,w,l,h,base);box(x,y,z+h,w+.5,l+.5,2,edge);};
 const lamp=(x,y,z)=>{box(x,y,z,1.2,1.2,2,dark);orb(x,y,z+2.3,.9,.9,1,glow,'glow');};
 const piston=(x,y,z,h)=>{tube(x,y,z,2,h*.6,dark);tube(x,y,z+h*.55,1.2,h*.45,edge);};
 const dish=(x,y,z,r=7)=>{tube(x,y,z,1.4,8,edge);M.material('metal');M.loft([[x,y,z+8,1,1],[x,y,z+11,r,r],[x,y,z+12,r,r]],base,12);ring(x,y,z+12,r,edge);line([x,y,z+9],[x,y,z+17],edge,.8);orb(x,y,z+17,1,1,1,glow,'glow');};
 box(0,0,0,23,19,2.4,dark);box(0,0,2.4,22,18,1.3,base);
 // Low foundation threshold meets the paved apron.
 box(-21,0,2,3,7,1.5,edge);
 if(name==='Medical Wing'){
  hull(-6,-3,4,14,13,18);hatch(-6,10,4,5,13);box(-6,-3,24,10,9,1.5,dark);
  box(-6,-3,25.6,6,1.7,1,'#ece6d2','paint');box(-6,-3,25.6,1.7,6,1,'#ece6d2','paint');
  for(const y of [-8,4]){tube(15,y,4,4,14,edge);ring(15,y,8,4.4,base);ring(15,y,15,4.4,base);orb(15,y,20,3.8,3.8,3,'#99c3bb','glass');line([15,y,4],[6,y,6],dark,1.2);}lamp(-16,10,23);
 }else if(name==='Weapons Wing'){
  hull(-5,-6,4,15,9,15);hatch(-5,3,4,10,12);fan(-6,-7,21,6,edge);
  for(let j=0;j<3;j++){const x=-13+j*10;box(x,12,4,3.6,5,3,dark);line([x,8,8],[x,17,13],edge,2.5);line([x,8,8],[x,17,13],base,1.3);}
  for(const x of [-19,19]){piston(x,9,4,22);line([x,9,26],[0,9,26],edge,1.7);}lamp(18,-8,6);
 }else if(name==='Armor Bay'||name==='Armor Workshop'){
  hull(0,-7,4,19,9,12);hatch(0,2,4,14,10);fan(10,-7,18,5,edge);
  for(const s of [-1,1]){box(s*13,10,4,4,8,3,dark);piston(s*15,12,6,15);line([s*15,12,21],[s*5,12,21],edge,1.8);box(s*6,12,18,3,4,3,base);}
  box(0,12,5,7,5,5,base);for(const x of [-5,0,5])line([x,8,10],[x,16,10],edge,.6);
  if(reptile){for(const s of [-1,1])face([[s*18,-13,18],[s*11,-13,28],[s*13,-7,18]],edge);}
 }else if(name==='Siege Bay'||name==='Siege Workshop'){
  hull(-9,-2,4,11,14,17);hatch(-9,12,4,7,15);fan(-10,-3,23,6,edge);
  for(const s of [-1,1]){box(12,s*9,4,7,2,2,dark);piston(13,s*9,6,15);line([12,s*8,21],[21,s*8,21],edge,2);}
  line([12,-4,15],[19,4,31],base,6);line([19,4,31],[21,6,35],dark,4);ring(-10,-3,23,7,edge);lamp(-17,12,22);
 }else if(name==='Aerospace Workshop'){
  hull(-10,-2,4,10,15,17);hatch(-10,13,4,6,14);dish(-10,-5,23,6);
  box(11,0,4,9,16,2,edge);box(11,0,6,7,13,1,dark);
  for(const s of [-1,1]){line([10,s*10,8],[10,s*10,17],edge,1);face([[10,s*2,18],[21,s*13,15],[15,s*13,15],[7,s*2,18]],base);}
  line([10,-13,18],[10,13,18],edge,2);lamp(19,14,6);
 }else if(name==='Helicopter Hangar'){
  hull(-11,-5,4,9,12,19);hatch(-11,7,4,6,16);fan(-11,-5,25,5,edge);
  tube(9,5,4,12,2,dark);ring(9,5,6,11,edge,.6);for(const x of [5,13])line([x,-1,6.3],[x,11,6.3],edge,.8);line([5,5,6.3],[13,5,6.3],edge,.8);
  piston(-2,-11,5,23);line([-2,-11,28],[20,-11,28],edge,1.6);line([19,-11,28],[19,-11,12],dark,.5);for(const s of [-1,1])lamp(18,s*13,5);
 }else if(name==='Shock Wing'){
  hull(-4,-4,4,15,12,14);hatch(-4,8,4,7,12);
  for(const s of [-1,1]){tube(s*9,-5,20,3,12,dark);for(let z=22;z<33;z+=3)ring(s*9,-5,z,4.5,edge);orb(s*9,-5,35,3.5,3.5,4,glow,'glass');line([s*9,-5,20],[s*16,10,5],edge,1.4);}box(0,14,4,8,3,4,base);
 }else if(name==='Control Wing'){
  hull(-7,-4,4,12,13,22);hatch(-7,9,4,6,14);dish(-7,-4,28,8);
  for(let j=0;j<3;j++){box(14,-10+j*10,4,4,3,8,dark);face([[10,-7+j*10,10],[18,-7+j*10,10],[18,-8+j*10,14],[10,-8+j*10,14]],glow,'glass');}lamp(-17,10,29);
 }else if(name==='War-Breeding Chamber'){
  hull(-12,-4,4,8,12,12);hatch(-12,8,4,5,10);
  for(const y of [-7,9]){tube(9,y,4,8,2,dark);orb(9,y,15,7,7,11,'#7a9d89','glass');for(const s of [-1,1])line([9+s*7,y,6],[9+s*5,y,23],edge,1.2);ring(9,y,23,5,edge);orb(9,y,25,4,4,2,base);line([-4,y,8],[3,y,8],dark,2);}
 }else if(machine){
  // Six machine attachments use independent silhouettes and recognizable equipment.
  hull(-12,-6,4,8,11,12);hatch(-12,5,4,5,10);fan(-12,-6,18,5,edge);
  if(name==='Recon Module'){dish(7,0,5,10);for(const s of [-1,1]){line([s*17,12,4],[s*17,12,26],edge,.9);for(let z=16;z<26;z+=4)line([s*17-3,12,z],[s*17+3,12,z],edge,.65);}lamp(7,0,31);}
  if(name==='Interceptor Module'){for(const s of [-1,1]){box(9,s*10,4,7,5,7,dark);fan(9,s*10,12,5,edge);face([[4,s*10,14],[17,s*17,25],[17,s*6,23]],base);line([4,s*10,14],[17,s*17,25],edge,1);}lamp(5,0,7);}
  if(name==='Walker Module'){for(const s of [-1,1]){box(11,s*11,4,8,4,3,base);piston(7,s*11,7,12);line([7,s*11,19],[15,s*11,27],edge,3);box(14,s*11,23,5,3,6,dark);}line([14,-11,29],[14,11,29],edge,2);}
  if(name==='Siege Module'){box(10,2,4,9,14,5,dark);for(let y=-8;y<15;y+=4)line([3,y,10],[17,y,10],edge,.9);tube(11,2,10,7,3,base);line([11,2,14],[11,2,31],edge,5);for(const z of [17,24,29])ring(11,2,z,3.5,dark,1.2);}
  if(name==='Sentinel Module'){tube(9,3,4,10,4,base);piston(9,3,8,20);for(const z of [14,22,30]){ring(9,3,z,10-(z-14)*.25,edge,1);for(const s of [-1,1])orb(9+s*(10-(z-14)*.25),3,z,1.2,1.2,1.2,glow,'glow');}orb(9,3,33,3,3,4,glow,'glass');}
  if(name==='Combat Module'){for(let j=0;j<3;j++){const y=-10+j*10;box(10,y,4,9,3,7+j%2*4,base);line([5,y,13],[19,y,18],edge,2.2);orb(19,y,18,1,1.4,1.4,glow,'glow');}piston(-1,14,4,23);line([-1,14,27],[18,14,27],edge,1.5);}
 }
 // Junction bolts, team stripe, cabling and a clear access ramp anchor the attachment.
 for(const x of [-20,20])for(const y of [-16,16])tube(x,y,3.8,.8,.5,edge);
 face([[-8,18,4],[8,18,4],[8,23,0],[-8,23,0]],base);for(let y=19;y<23;y++)line([-7,y,4*(23-y)/5],[7,y,4*(23-y)/5],edge,.35);
 box(-19,-12,5,.6,4,1.2,team,'paint');line([-19,-13,6],[-19,12,6],dark,1.1);lamp(-19,14,5);
 M.finish();return true;
}
root.FractureExtensionArt={render};
})(globalThis);
