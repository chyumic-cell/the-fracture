'use strict';
// Purpose-built primate settlements: timber engineering, hide, rope and uncut stone.
(function(root){
function render(ctx,d,f){
 if(f.id!=='primates')return false;
 const M=new root.FractureSpriteMesh(ctx,0,false,{originX:120,originY:181,logicalWidth:240});
 const tint=root.FractureArt.tint,P={wood:'#76543b',cut:'#aa8158',dark:'#473b2c',rope:'#b7a17a',hide:'#ac956a',hideDark:'#786d4b',stone:'#7f8070',stoneLight:'#a7a38b',earth:'#675e43',iron:'#4f5c5b',team:'#657a4d'};
 const livery=root.FractureArt.buildingLivery(d,f);P.hide=root.FractureArt.mixColor(P.hide,livery.primary,.7);P.hideDark=tint(P.hide,-24);P.team=livery.primary;
 const box=(x,y,z,w,l,h,c=P.wood,m='wood')=>{M.material(m);M.box(x,y,z,w,l,h,c);};
 const face=(v,c,m='wood')=>{M.material(m);M.face(v,c);};
 const beam=(a,b,w=3,c=P.wood,m='wood')=>{M.material(m);M.seg(a,b,c,w);};
 const orb=(x,y,z,rx,ry,rz,c=P.stone,m='stone')=>{M.material(m);M.orb(x,y,z,rx,ry,rz,c);};
 const tube=(x,y,z,r,h,c=P.wood,m='wood',top=r)=>{M.material(m);M.cylinder(x,y,z,r,h,c,12,top);};
 const ring=(x,y,z,r,c=P.rope,w=.8,plane='xy',steps=16)=>{for(let j=0;j<steps;j++){const point=a=>plane==='xy'?[x+Math.cos(a)*r,y+Math.sin(a)*r,z]:plane==='xz'?[x+Math.cos(a)*r,y,z+Math.sin(a)*r]:[x,y+Math.cos(a)*r,z+Math.sin(a)*r];beam(point(j*Math.PI*2/steps),point((j+1)*Math.PI*2/steps),w,c,c===P.rope?'cloth':'wood');}};
 const lash=(x,y,z,r=2.4)=>{for(let j=-1;j<=1;j++)ring(x,y,z+j*1.3,r,P.rope,.65,'xy',8);};
 const pole=(x,y,z,h,w=4)=>{beam([x,y,z],[x+.5,y-.3,z+h],w);lash(x,y,z+h-4,w*.6);};
 const rock=(x,y,z,rx,ry,h,c=P.stone)=>{const rings=[0,.68,1].map((t,j)=>Array.from({length:7},(_,i)=>{const a=i*Math.PI*2/7,r=(j===2?.65:1)*(1+.1*Math.sin(i*7+j*5));return[x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r,z+h*t];}));M.material('stone');M.rings(rings,c);};
 const boardFloor=(x,y,z,w,l)=>{for(let j=-w;j<w;j+=4.5)box(x+j+2.1,y,z,2,l,2,tint(P.cut,(Math.round(j)%3)*3-9));beam([x-w,y-l,z],[x+w,y-l,z],3);beam([x-w,y+l,z],[x+w,y+l,z],3);};
 const stair=(x,y,z,w,n)=>{for(let j=0;j<n;j++)box(x,y+j*3.2,z,w,1.8,(n-j)*2,P.cut);};
 const ladder=(x,y,z,h,w=5)=>{beam([x-w,y,z],[x-w,y-5,z+h],2.4,P.cut);beam([x+w,y,z],[x+w,y-5,z+h],2.4,P.cut);for(let q=3;q<h;q+=5)beam([x-w,y-q/h*5,z+q],[x+w,y-q/h*5,z+q],1.5,P.cut);};
 const roofCone=(x,y,z,r,h,top=1,c=P.hide)=>{for(let j=0;j<16;j++){const a=j*Math.PI/8,b=(j+1)*Math.PI/8,lo=t=>[x+Math.cos(t)*r,y+Math.sin(t)*r,z],hi=t=>[x+Math.cos(t)*top,y+Math.sin(t)*top,z+h];face([lo(a),lo(b),hi(b),hi(a)],tint(c,j%3*5-5),'cloth');beam(lo(a),hi(a),.7,P.rope,'cloth');}ring(x,y,z,r,P.dark,1.2);};
 const awning=(x,y,z,w,l,h=6,c=P.hide)=>{for(const s of [-1,1]){pole(x+s*w,y-l,2,z-2,3);pole(x+s*w,y+l,2,z-4,3);face([[x+s*w,y-l,z],[x,y-l,z+h],[x,y+l,z+h-2],[x+s*w,y+l,z-2]],c,'cloth');beam([x+s*w,y-l,z],[x+s*w,y+l,z-2],1.2,P.rope,'cloth');}beam([x,y-l,z+h],[x,y+l,z+h-2],1.4,P.cut);for(let j=-w+3;j<w;j+=6)beam([x+j,y+l,z+h*(1-Math.abs(j)/w)-2],[x+j,y+l+1,z+h*(1-Math.abs(j)/w)-5],.65,P.rope,'cloth');};
 const barrel=(x,y,z,r=6,h=13)=>{M.material('wood');M.loft([[x,y,z,r*.8,r*.8],[x,y,z+h*.5,r,r],[x,y,z+h,r*.82,r*.82]],P.cut,12);for(const q of [.18,.78])ring(x,y,z+h*q,r*(q>.5?.94:.92),P.dark,1);tube(x,y,z+h,r*.8,.8,P.hideDark,'wood');for(let j=0;j<8;j++){const a=j*Math.PI/4;beam([x+Math.cos(a)*r*.82,y+Math.sin(a)*r*.82,z+.5],[x+Math.cos(a)*r*.82,y+Math.sin(a)*r*.82,z+h-.5],.5,P.dark);}};
 const basket=(x,y,z,r=7,h=10,c=P.hide)=>{M.material('cloth');M.loft([[x,y,z,r*.68,r*.68],[x,y,z+h,r,r]],c,10);for(let q=2;q<h;q+=2)ring(x,y,z+q,r*(.68+.32*q/h),P.rope,.55);ring(x,y,z+h,r,P.dark,.9);};
 const logStack=(x,y,z,count=4,len=24)=>{for(let row=0;row<3;row++)for(let j=0;j<count-row;j++){const xx=x+(j-(count-row-1)/2)*6,zz=z+3+row*5;beam([xx,y-len/2,zz],[xx,y+len/2,zz],5.4);orb(xx,y+len/2+.1,zz,2.6,.55,2.6,P.cut,'wood');}};
 const wheel=(x,y,z,r=10,plane='yz')=>{ring(x,y,z,r,P.dark,3,plane,18);ring(x,y,z,r-.6,P.cut,1.1,plane,18);for(let j=0;j<8;j++){const a=j*Math.PI/4,q=plane==='yz'?[x,y+Math.cos(a)*(r-1),z+Math.sin(a)*(r-1)]:[x+Math.cos(a)*(r-1),y,z+Math.sin(a)*(r-1)];beam([x,y,z],q,1.6,P.cut);}orb(x,y,z,plane==='yz'?2.7:3,plane==='yz'?3:2.7,3,P.dark,'wood');};
 const drum=(x,y,z,r=7,h=13)=>{tube(x,y,z,r,h,P.dark,'wood',r*.85);tube(x,y,z+h,r*.85,.8,P.hide,'cloth');ring(x,y,z+h,r*.9,P.rope,1);for(let j=0;j<10;j++){const a=j*Math.PI/5,b=a+.31;beam([x+Math.cos(a)*r,y+Math.sin(a)*r,z+1],[x+Math.cos(b)*r*.9,y+Math.sin(b)*r*.9,z+h],.7,P.rope,'cloth');}};
 const target=(x,y,z,r=7)=>{pole(x,y,z,19,3);orb(x,y+.5,z+19,r,1.4,r,P.hide,'cloth');ring(x,y+2,z+19,r*.63,P.dark,.8,'xz');ring(x,y+2.1,z+19,r*.27,'#9b5d3f',1,'xz');};
 const totem=(x,y,z,h=58)=>{tube(x,y,z,4.5,h,P.wood,'wood',3.5);for(let j=0;j<3;j++){const zz=z+10+j*(h-13)/3;box(x,y,zz,6,4.7,7,P.cut);box(x,y+4,zz+4,6.3,1.5,2,P.dark);for(const s of [-1,1])orb(x+s*2.8,y+5,zz+4.5,1.2,.6,.8,P.rope,'bone');box(x,y+5,zz,2,2,3,P.wood);beam([x-5,y+4,zz-1],[x+5,y+4,zz-1],1.2,P.dark);}beam([x-11,y,z+h-3],[x+11,y,z+h-3],3,P.cut);for(const s of [-1,1]){face([[x+s*10,y,z+h-2],[x+s*15,y,z+h+5],[x+s*4,y,z+h+1]],P.hide,'cloth');}lash(x,y,z+5,5);};
 const crystal=(x,y,z,r,h,c)=>{const low=Array.from({length:6},(_,j)=>[x+Math.cos(j*Math.PI/3)*r,y+Math.sin(j*Math.PI/3)*r,z+h*.3]),mid=low.map(p=>[p[0],p[1],z+h*.78]);for(let j=0;j<6;j++){face([[x,y,z],low[j],low[(j+1)%6]],tint(c,-18),'stone');face([low[j],mid[j],mid[(j+1)%6],low[(j+1)%6]],tint(c,j%2?10:-7),'glass');face([mid[j],[x-r*.16,y,z+h],mid[(j+1)%6]],tint(c,j%2?21:2),'glass');}};
 // Irregular ground patches keep open yards readable without a shared square pedestal.
 const n=Number(d.id.match(/b(\d+)$/)?.[1]||0),rx=d.kind==='defense'?28:d.kind==='extractor'?35:46,ry=d.kind==='defense'?24:31;
 for(let j=0;j<12;j++){const p=a=>[Math.cos(a)*rx*(1+.06*Math.sin(a*7+n)),Math.sin(a)*ry*(1+.06*Math.cos(a*5+n)),.2];face([[0,0,0],p(j*Math.PI/6),p((j+1)*Math.PI/6)],tint(P.earth,j%3*3-6),'cloth');}
 if(d.kind==='extractor'){
  if(d.resource==='ore'){
   // Inclined sorting chute and rope hoist over an exposed rock cut.
   for(const y of [-20,8]){pole(-15,y,2,45,4.5);pole(14,y,2,45,4.5);beam([-15,y,42],[14,y,42],4.5,P.cut);beam([-15,y,6],[14,y,40],2.3);}
   beam([-15,-20,47],[-15,8,47],4);beam([14,-20,47],[14,8,47],4);beam([0,-18,48],[0,11,48],3,P.cut);wheel(0,3,43,4,'xz');beam([0,3,43],[0,3,11],.9,P.rope,'cloth');basket(0,3,7,7,7,P.dark);
   face([[-11,9,31],[11,9,31],[11,29,7],[-11,29,7]],P.cut);for(const s of [-1,1])beam([s*12,9,32],[s*12,29,8],2.5,P.dark);for(let j=0;j<8;j++)rock(-25+j%3*10,-12+Math.floor(j/3)*10,1,5,5,6+j%3*3,tint(P.stone,j%3*10-5));basket(26,17,1,7,7);rock(26,17,8,5,4,4,P.stoneLight);
  }else if(d.resource==='oil'){
   // A counterweighted sweep draws oil into a skin-lined receiving vat.
   tube(-9,3,1,13,5,P.stone,'stone');tube(-9,3,6,10,1,'#242b29','cloth');for(const y of [-7,12]){beam([9,y,1],[13,y,42],5);beam([27,y,1],[13,y,42],4);lash(13,y,38,3.2);}
   beam([13,-9,42],[13,14,42],4.5,P.cut);beam([-26,3,54],[38,3,31],5,P.cut);beam([-26,3,54],[-26,3,14],1.1,P.rope,'cloth');basket(-26,3,8,5,7,P.dark);rock(36,3,19,7,7,13,P.stone);beam([28,3,35],[36,3,27],1.5,P.rope,'cloth');
   tube(7,25,1,10,14,P.hideDark,'cloth',11);tube(7,25,15,9,1,'#26312e','cloth');for(const z of [4,11])ring(7,25,z,10.5,P.rope,1);beam([-7,10,9],[7,16,15],2.5,P.cut);barrel(27,23,1,5,12);orb(-24,-15,1,8,5,.7,'#2f3430','cloth');
  }else if(d.resource==='aether'){
   // Low, split crystal trench with a narrow triangular lifting rig and sled.
   for(const s of [-1,1])for(let j=0;j<4;j++)rock(s*16,-19+j*11,1,7,6,6+j%2*3);crystal(-2,-4,2,8,32,'#88b8aa');crystal(-9,6,2,5,21,'#9ac6b5');crystal(8,5,2,4,15,'#6ca99f');
   beam([-24,-21,2],[-4,-21,55],4.5);beam([17,-21,2],[-4,-21,55],4.5);beam([-4,-21,55],[-4,15,39],3.5,P.cut);beam([-4,10,42],[-4,10,15],.8,P.rope,'cloth');lash(-4,-21,51,3);
   boardFloor(23,19,3,9,12);for(const s of [-1,1])beam([23+s*8,5,1],[23+s*8,34,1],2.4,P.dark);crystal(23,18,5,4,12,'#9ac8b9');for(let j=0;j<3;j++)box(-25,11+j*6,1,3,2.5,5,P.cut);beam([-28,6,4],[-21,24,13],2,P.iron,'metal');
  }else{
   // Open astronomical ring, carved marker stones and a suspended rift shard.
   for(let j=0;j<8;j++){const a=j*Math.PI/4;rock(Math.cos(a)*28,Math.sin(a)*23,1,5,4,8+(j%2)*6,P.stone);}
   for(const x of [-20,20]){pole(x,0,2,55,4.5);beam([x,0,50],[x*1.3,18,2],2.5);lash(x,0,49,3);}
   ring(0,0,40,22,P.cut,3,'xz',24);ring(0,0,40,17,P.rope,1,'yz',20);beam([-20,0,40],[20,0,40],2.1,P.dark);beam([0,0,61],[0,0,48],.8,P.rope,'cloth');crystal(0,0,23,6,25,'#b698c4');
   boardFloor(0,25,2,10,5);for(let j=-1;j<=1;j++)rock(j*10,-24,2,3,3,19-Math.abs(j)*5,P.stoneLight);face([[-7,27,5],[7,27,5],[7,23,10],[-7,23,10]],P.hide,'cloth');
  }
 }else if(d.id==='primates_aviary'){
  // Open cliff-side roost: a raised landing deck and two unequal nesting towers.
  // Air buildings deliberately do not use the numeric roster's Great Lodge fallback.
  for(const x of [-33,33])for(const y of [-23,23]){rock(x,y,0,7,6,9);pole(x,y,5,33,5);beam([x,y,8],[-x,y,33],2.4,P.cut);}
  boardFloor(0,1,34,38,29);boardFloor(0,39,32,15,12);ladder(-23,31,1,34,5);
  for(const x of [-36,36]){pole(x,29,35,16,3);pole(x,-27,35,16,3);beam([x,-27,48],[x,29,48],2.5,P.cut);for(let y=-23;y<28;y+=9)beam([x,y,35],[x,y,48],1.2,P.rope,'cloth');}
  for(const [x,y,z,r] of [[-22,-12,69,17],[22,-13,55,14]]){
   for(const side of [-1,1]){pole(x+side*11,y,35,z-31,4);beam([x+side*11,y,38],[x-side*9,y,z-3],2);lash(x+side*11,y,z-4,3);}
   boardFloor(x,y,z,r,r*.75);basket(x,y,z+2,r-2,7,P.hideDark);
   for(let j=0;j<17;j++){const a=j*2.4;beam([x+Math.cos(a)*(r-1),y+Math.sin(a)*(r-3),z+7],[x+Math.cos(a+.6)*(r+1),y+Math.sin(a+.6)*(r-2),z+9],.9,P.cut);}
   for(const side of [-1,1])pole(x+side*r,y-6,z,23,2.8);
   face([[x-r-3,y-11,z+24],[x,y-14,z+30],[x+r+3,y-11,z+24],[x+r+3,y+4,z+20],[x-r-3,y+4,z+20]],P.hide,'cloth');
   for(const side of [-1,1])beam([x+side*(r+3),y-11,z+24],[x+side*(r+3),y+4,z+20],1.4,P.cut);
   // Folded wings, white neck ruff and hooked beak identify resident condors.
   orb(x,y+1,z+15,6,8,7,'#3b3c35','fur');orb(x-3,y+3,z+14,3,7,5,'#555548','fur');
   orb(x+2,y+6,z+20,3.5,3,2,'#d0c7a5','fur');orb(x+3,y+7,z+24,2.8,3,3,'#a27e5a','skin');
   beam([x+4,y+9,z+24],[x+5,y+12,z+22],1.5,P.rope,'bone');
  }
  // Rope mesh at the back, with a fully open front approach and projecting launch perch.
  for(const x of [-37,0,37])pole(x,-27,36,38,3.5);
  for(let x=-35;x<=35;x+=7)beam([x,-27,37],[x,-27,71],.55,P.rope,'cloth');
  for(let z=40;z<74;z+=6)beam([-37,-27,z],[37,-27,z],.55,P.rope,'cloth');
  beam([-38,-27,74],[38,-27,74],3,P.cut);beam([-17,45,34],[17,45,34],4,P.cut);
  for(const x of [-12,12]){beam([x,24,35],[x,45,49],2.5);lash(x,43,47,2);}
  beam([-19,45,50],[19,45,50],3.5,P.cut);
  basket(-22,9,37,6,7);basket(25,14,37,7,9);barrel(25,2,36,5,10);
  face([[-12,39,34.3],[12,39,34.3],[12,44,34.3],[-12,44,34.3]],P.team,'cloth');
 }else if(n===0){
  // Great Lodge: a broad, two-tiered round communal hall.
  tube(0,-5,1,35,4,P.stone,'stone');for(let j=0;j<20;j++){const a=j*Math.PI/10,b=(j+1)*Math.PI/10;if(a>.8&&a<1.6)continue;face([[Math.cos(a)*31,-5+Math.sin(a)*31,5],[Math.cos(b)*31,-5+Math.sin(b)*31,5],[Math.cos(b)*31,-5+Math.sin(b)*31,32],[Math.cos(a)*31,-5+Math.sin(a)*31,32]],j%2?P.wood:P.cut);pole(Math.cos(a)*31,-5+Math.sin(a)*31,5,28,2.2);}
  roofCone(0,-5,33,42,19,17,P.hideDark);for(let j=0;j<8;j++){const a=j*Math.PI/4;pole(Math.cos(a)*14,-5+Math.sin(a)*14,51,9,2);}roofCone(0,-5,60,21,15,2,P.hide);pole(0,-5,74,8,2.5);face([[0,-5,82],[13,-5,79],[13,-5,71],[0,-5,73]],P.team,'cloth');
  for(const x of [-11,11]){pole(x,25,3,29,5);lash(x,25,25,3);}beam([-11,25,32],[11,25,32],4,P.cut);stair(0,30,0,11,4);for(const x of [-27,28])drum(x,25,3,5,10);
 }else if(n===1){
  // Communal Stores: three separate raised woven storage bins with connecting planks.
  for(const [x,y,z,r,h]of [[-22,-9,15,13,18],[9,-14,24,13,17],[21,17,9,12,17]]){for(const s of [-1,1])for(const t of [-1,1])pole(x+s*r*.66,y+t*r*.6,1,z,3);boardFloor(x,y,z,r,r);basket(x,y,z+2,r,h);roofCone(x,y,z+h+2,r+3,8,2,P.hideDark);for(let j=0;j<10;j++){const a=j*Math.PI/5;beam([x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7,z+2],[x+Math.cos(a)*r,y+Math.sin(a)*r,z+h+2],.8,P.cut);}}
  boardFloor(-5,-10,16,8,4);ladder(-22,12,1,15,5);ladder(9,7,1,24,4);basket(-15,22,1,7,9);basket(-2,26,1,6,7);
 }else if(n===2){
  // Gathering Yard: open hoist, split logs, pallets and baskets; no enclosing hall.
  for(const x of [-32,0]){pole(x,-12,2,43,5);beam([x,-12,2],[x,7,31],3);}beam([-37,-12,45],[6,-12,45],5,P.cut);wheel(-16,-10,39,5,'xz');beam([-16,-10,40],[-16,-10,19],1,P.rope,'cloth');boardFloor(-16,-10,16,9,7);for(const s of [-1,1])beam([-16+s*8,-5,17],[-16,-10,26],.7,P.rope,'cloth');
  logStack(23,-7,2,4,31);boardFloor(-16,22,1,13,9);for(let j=0;j<4;j++)basket(-25+j%2*15,17+Math.floor(j/2)*11,3,5.5,8);rock(27,23,1,8,6,8);rock(15,26,1,6,5,5);beam([-34,25,1],[-29,30,11],2,P.iron,'metal');
 }else if(n===3){
  // War Circle: an empty fighting arena surrounded by standing stones and practice weapons.
  tube(0,0,.5,29,1,'#8c7b58','cloth');for(let j=0;j<14;j++){const a=j*Math.PI/7;rock(Math.cos(a)*35,Math.sin(a)*27,1,5,4,j%4===0?22:6+j%3*2,tint(P.stone,j%3*7));}
  for(const x of [-19,1,20]){pole(x,-21,2,24,3);beam([x-7,-21,18],[x+7,-21,18],2.5,P.cut);orb(x,-20,23,4,3,4,P.hideDark,'cloth');box(x,-21,10,4,2.5,8,P.hide,'cloth');}
  for(let j=0;j<4;j++){beam([29,10+j*4,2],[33,10+j*4,29],2.5,P.cut);rock(33,10+j*4,29,2,2,4,P.stoneLight);}beam([31,8,18],[31,25,18],2,P.wood);drum(-29,16,2,6,12);
 }else if(n===4){
  // Hunting Grounds: target lanes and tall stretched hides with open terrain between them.
  for(const x of [-17,2,21]){target(x,-15,2,7);beam([x-5,-3,1],[x-5,28,1],1,P.cut);beam([x+5,-3,1],[x+5,28,1],1,P.cut);}
  for(const x of [-37,-22])pole(x,2,2,42,3.5);beam([-39,2,44],[-20,2,44],3,P.cut);face([[-36,3,40],[-24,3,39],[-23,4,22],[-27,4,17],[-32,4,20],[-36,4,17],[-37,3,32]],P.hide,'cloth');for(const x of [-35,-25])beam([x,3,42],[x,4,36],.7,P.rope,'cloth');
  for(let j=0;j<6;j++)beam([24+j*1.5,23,2],[27+j*1.5,15,17],.6,P.cut);basket(32,21,1,4,10);box(-20,25,1,9,4,4,P.dark);orb(-22,25,8,9,4,3,P.hideDark,'cloth');
 }else if(n===5){
  // Toolsmith: an exposed hearth, bellows and anvil beneath a small hide windbreak.
  awning(-19,-10,32,18,18,8,P.hideDark);for(const y of [-20,-9,2])rock(-31,y,1,6,6,15);for(let j=0;j<8;j++){const a=j*Math.PI/4;rock(-17+Math.cos(a)*11,-9+Math.sin(a)*9,1,4,4,10,P.stone);}
  tube(-17,-9,7,7,1,'#4c3730','stone');for(let j=0;j<8;j++)orb(-22+j%3*5,-13+Math.floor(j/3)*4,8,2.4,2,1.6,j%2?'#bd6d37':'#dd9b4e','glow');
  for(let j=0;j<5;j++)box(4+j*3,-9,5,1.5,7-j*.5,10-j*.9,j%2?P.hide:P.dark,'cloth');beam([1,-9,7],[-7,-9,8],2.7,P.iron,'metal');beam([11,-9,15],[19,-9,25],2.6,P.cut);
  rock(19,18,1,10,8,10);box(19,18,11,4,4,5,P.iron,'metal');box(19,18,16,11,5,4,P.iron,'metal');face([[8,13,16],[-2,18,18],[8,23,16],[8,23,20],[8,13,20]],P.iron,'metal');beam([25,28,2],[15,22,19],2.2,P.cut);box(15,22,19,4,2,3,P.iron,'metal');basket(-7,24,1,7,7,P.dark);for(let j=0;j<6;j++)rock(-11+j%3*4,21+Math.floor(j/3)*4,7,2.5,2.5,3,P.iron);
 }else if(n===6){
  // Stoneworks: an exposed quarry face and a tall, braced lifting crane.
  for(let j=0;j<3;j++)for(let k=0;k<3-j;k++)box(-27+j*8,-17+k*12,1+j*10,11,6,10,tint(P.stone,j*9),'stone');for(const y of [-18,-1]){beam([5,y,1],[16,y,66],6);beam([29,y,1],[16,y,66],5);beam([9,y,24],[24,y,39],2.5,P.cut);}beam([16,-21,65],[16,4,65],5,P.cut);beam([-17,-8,69],[42,-8,58],5,P.cut);beam([16,-8,65],[36,-8,59],1,P.rope,'cloth');wheel(37,-8,58,4,'xz');beam([37,-8,58],[37,-8,18],1,P.rope,'cloth');box(37,-8,5,8,7,11,P.stoneLight,'stone');for(const s of [-1,1])beam([37+s*7,-8,7],[37,-8,21],.8,P.rope,'cloth');
  for(const [x,y,w,h]of [[-20,22,10,9],[0,20,8,12],[19,25,7,6]]){box(x,y,1,w,7,h,P.stone,'stone');beam([x-w*.5,y+7,2],[x+w*.4,y+7,h],.6,P.dark,'stone');}beam([-34,13,5],[-25,24,16],2,P.cut);box(-25,24,16,4,2,2,P.iron,'metal');
 }else if(n===7){
  // Powder Workshop: a squat earth-backed powder store, isolated barrels and a grinding mill.
  for(const y of [-26,-16,-6])rock(-20,y,1,18,10,y===-16?18:13,P.earth);box(-17,-9,1,17,18,18,P.stone,'stone');box(-17,-9,19,19,20,4,P.stoneLight,'stone');face([[-25,10,2],[-9,10,2],[-9,10,17],[-25,10,17]],P.dark,'cloth');for(const x of [-26,-8])pole(x,11,1,18,2.5);beam([-27,11,19],[-7,11,19],3,P.cut);
  tube(22,-11,1,12,5,P.stone,'stone');tube(22,-11,6,11,4,P.stoneLight,'stone');pole(22,-11,10,25,3.5);beam([8,-11,24],[36,-11,24],3,P.cut);for(const x of [8,36])beam([x,-11,24],[x,7,24],2.5,P.cut);wheel(25,9,17,13,'yz');beam([25,-11,17],[25,9,17],3,P.wood);for(const [x,y]of [[-3,25],[13,27],[30,25]])barrel(x,y,1,6,13);basket(-34,20,1,5,8,P.dark);orb(-34,20,9,4,4,1,P.iron,'stone');
 }else if(n===8){
  // Siege Yard: a catapult under assembly, with full wheels and separate component racks.
  for(const x of [-15,15])beam([x,-24,7],[x,26,7],5,P.cut);for(const y of [-17,18]){beam([-21,y,9],[21,y,9],4,P.dark);wheel(-22,y,10,9);wheel(22,y,10,9);}for(const x of [-15,15]){beam([x,-17,9],[x,4,39],5);beam([x,23,9],[x,4,39],5);}beam([-18,4,38],[18,4,38],5,P.cut);beam([0,-23,13],[0,27,57],6,P.cut);basket(0,27,54,7,5,P.dark);rock(0,27,59,5,4,5,P.stone);for(let j=-1;j<=1;j++)ring(j*3,4,36,4,P.rope,.9,'yz');beam([0,-23,13],[0,-14,27],1.5,P.rope,'cloth');
  for(const x of [-38,-29])pole(x,-18,1,29,3);beam([-40,-18,28],[-27,-18,28],3);wheel(-34,-16,14,12,'xz');for(let j=0;j<3;j++)beam([25+j*4,-26,3],[25+j*4,5,24],2.8,P.cut);box(31,23,1,8,6,4,P.wood);for(let j=0;j<4;j++)rock(26+j%2*8,19+Math.floor(j/2)*8,5,4,4,5,P.stone);
 }else if(n===9){
  // Great War Council: an open, terraced gathering platform, ancestral poles and drums.
  tube(0,0,1,39,5,P.stone,'stone');tube(0,-5,6,33,5,P.stoneLight,'stone');boardFloor(0,-4,11,31,24);stair(0,24,1,15,5);totem(-28,-16,2,65);totem(28,-16,2,57);
  for(let j=0;j<5;j++){const a=Math.PI+j*Math.PI/4,x=Math.cos(a)*23,y=-3+Math.sin(a)*17;rock(x,y,14,5,5,5,P.stone);}
  for(const x of [-15,15])pole(x,-24,13,48,3.8);pole(0,-26,13,63,4);face([[-18,-24,60],[0,-27,77],[18,-24,60],[14,-8,49],[-14,-8,49]],P.hideDark,'cloth');for(const x of [-15,15])beam([x,-24,61],[x,-8,49],.9,P.rope,'cloth');
  drum(-22,19,13,6,15);drum(22,19,13,7,20);drum(0,-6,13,10,16);for(const x of [-9,9])beam([x,4,15],[x+3,0,33],1.5,P.cut);face([[-7,-9,31],[7,-9,31],[7,-3,31],[-7,-3,31]],P.team,'cloth');
 }else if(n===10){
  // Cliff Watch: an open timber lattice lookout with ladder and a small hide sunshade.
  for(const s of [-1,1])for(const t of [-1,1]){beam([s*18,t*16,1],[s*11,t*10,66],5);lash(s*12,t*11,58,3);}
  for(const y of [-13,13]){beam([-17,y,5],[12,y*.8,60],2.8,P.cut);beam([17,y,5],[-12,y*.8,60],2.8,P.cut);}for(const x of [-16,16]){beam([x,-14,6],[x*.75,10,56],2.5);beam([x,14,6],[x*.75,-10,56],2.5);}boardFloor(0,0,65,21,17);
  for(const x of [-19,19])for(const y of [-15,15])pole(x,y,67,18,3);for(const y of [-15,15])beam([-19,y,80],[19,y,80],2.8,P.cut);for(const x of [-19,19])beam([x,-15,80],[x,15,80],2.8,P.cut);awning(0,0,86,22,18,10,P.hideDark);ladder(0,20,1,65,6);pole(25,-4,66,30,2.5);face([[25,-4,96],[36,-4,93],[34,-4,85],[25,-4,87]],P.team,'cloth');
 }
 root.FractureDetailArt?.building(M,d,f);M.finish();return true;
}
root.FracturePrimateArt={render};
})(globalThis);

