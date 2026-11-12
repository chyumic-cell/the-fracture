'use strict';
(function(root){
const palettes={humans:['#6c8388','#b1b9ad'],reptilians:['#7f8b62','#d3b779'],machines:['#405963','#8cd3cb'],primates:['#8e6e4c','#c4ac72'],insects:['#8b834f','#cab781'],wizards:['#727e9e','#cfbd9d'],elders:['#648375','#b4b69a'],myth:['#b1a582','#cfbe88'],dragons:['#87674b','#c29c68'],night:['#525b6c','#a7a3ad'],infernal:['#694849','#c2845b'],symbiotes:['#586d63','#a7b591']};
function bomber(ctx,d,f,angle,action,frame){
 const M=new root.FractureSpriteMesh(ctx,Math.round(angle/(Math.PI/4))*Math.PI/4,action==='dead'),[base,trim]=palettes[f.id],dark='#29363e',beam=(a,b,c=trim,w=1)=>M.seg(a,b,c,w),flap=Math.sin(frame*Math.PI/3)*4,drop=action==='attack'&&frame%4===2;
 const bomb=(x,y,z,col=trim)=>{M.material('metal');M.orb(x,y,z,4,2.4,2.4,col);M.face([[x-4,y-3,z],[x-4,y+3,z],[x-8,y,z+2]],dark);};
 const bay=(x,y,z)=>{M.material('metal');M.box(x,y,z,8,4,1,dark);for(const xx of [x-5,x,x+5])bomb(xx,y,z-2-(drop&&xx===x?10:0));for(const side of [-1,1])beam([x-9,y+side*4,z],[x+9,y+side*4,z],trim,.8);};
 if(['humans','reptilians','machines'].includes(f.id)){
  M.material('metal');const machine=f.id==='machines',reptile=f.id==='reptilians',span=machine?44:reptile?34:42;
  M.orb(-2,0,24,29,reptile?7:5,6,base);M.orb(21,0,26,8,4,4,'#547d8a');
  for(const side of [-1,1]){M.face([[14,side*3,24],[machine?-12:-3,side*span,23],[machine?-27:-13,side*(span-2),22],[-19,side*4,23]],base);M.face([[7,side*5,25],[-8,side*(span-5),24],[-15,side*(span-6),24],[-15,side*5,25]],trim);beam([12,side*4,24],[-4,side*span,23],trim,1);for(let j=0;j<4;j++)beam([-8-j*3,side*8,24],[-10-j*3,side*(span-4),23],dark,.4);
   const engines=machine?[24]:reptile?[15]:[18,32];for(const y of engines){M.orb(1,side*y,22,11,3,3,base);M.cylinder(-9,side*y,21,2.5,2,dark,8);M.orb(-9,side*y,23,2,2,1,machine?'#8bcfd3':'#9fabb0');}
   bay(-4,side*10,18);
   if(!machine){M.face([[-22,side*2,25],[-31,side*16,26],[-35,side*15,25],[-31,side*2,24]],trim);M.face([[-26,side*3,24],[-31,side*3,36],[-36,side*3,36],[-34,side*3,24]],base);}
  }
  if(machine){for(const y of [-4,0,4])M.orb(26,y,27,1.5,1.3,1.3,'#dd7766');M.box(-15,0,28,9,7,3,dark);for(const y of [-5,0,5])beam([-20,y,32],[-7,y,32],trim,.7);}
  if(reptile){M.face([[18,-6,26],[32,0,24],[18,6,26],[8,0,32]],trim);for(const x of [-20,-11,-2])M.face([[x,-2,29],[x-4,0,37],[x+4,2,29]],base);}
 }else if(['wizards','elders','night'].includes(f.id)){
  const night=f.id==='night',elder=f.id==='elders';M.material(night?'metal':'wood');M.box(-2,0,16,25,7,5,base);for(let x=-24;x<23;x+=5)beam([x,-7,21],[x,7,21],trim,.6);bay(4,0,12);
  if(night){M.material('cloth');M.orb(-6,0,38,35,12,12,base);for(let x=-31;x<25;x+=7){beam([x,-10,36],[x,0,49],trim,.6);beam([x,0,49],[x,10,36],trim,.6);}for(const y of [-13,13]){M.material('metal');M.orb(-7,y,20,10,3,3,dark);beam([-5,y,24],[-7,y*.6,35],trim,1);}M.face([[-32,0,36],[-42,0,51],[-45,0,33]],trim);}
  else if(elder){for(const side of [-1,1]){M.material('cloth');M.face([[19,side*3,26],[-8,side*44,29],[-30,side*31,23],[-21,side*5,24]],f.color);for(let j=0;j<5;j++)beam([12-j*7,side*5,25],[-8-j*5,side*(42-j*2),28],trim,.7);M.orb(-8,side*18,24,7,4,3,trim);}}
  else{M.material('metal');for(const x of [-18,16])for(const y of [-19,19]){M.cylinder(x,y,19,8,2,trim,12);M.orb(x,y,23,4,4,7,'#aaa9d5');beam([x,y,20],[x*.6,0,20],trim,1.4);}M.face([[-26,-5,22],[-26,5,22],[-30,0,39]],f.color);M.orb(18,0,25,7,6,5,'#b8b2d7');}
 }else{
  const insect=f.id==='insects',sym=f.id==='symbiotes',primate=f.id==='primates',myth=f.id==='myth',dragon=f.id==='dragons',infernal=f.id==='infernal';
  M.material(insect?'chitin':sym||primate||myth?'fur':'bone');M.orb(-4,0,27,insect?22:18,sym?13:7,sym?10:7,base);if(!sym){M.orb(17,0,30,7,5,5,trim);M.orb(22,-3,32,1,1,1,'#e4bf71');M.orb(22,3,32,1,1,1,'#e4bf71');}else{for(const y of [-7,0,7]){M.orb(14,y,31,7,3,4,base);beam([14,y,33],[23,y*.6,30],'#baaccb',.7);}M.orb(19,0,33,2,2,2,'#c6b9e1');}
  if(primate||myth){M.material('bone');M.face([[22,-3,33],[31,0,31],[28,0,27],[22,3,33]],'#c7aa78');if(myth){for(const side of [-1,1]){beam([-8,side*5,26],[-13,side*7,17],base,2.4);beam([-13,side*7,17],[-9,side*7,15],trim,1.6);M.face([[12,side*4,34],[10,side*6,43],[17,side*4,35]],base);}beam([-20,0,27],[-31,0,23],base,2);}}

  if(sym){for(let j=0;j<16;j++){const a=j*Math.PI/8,y=Math.sin(a)*15,x=-4+Math.cos(a)*20;beam([x,y,29],[x-8,y*1.6,22],trim,1);beam([x-8,y*1.6,22],[x-18,y*2,16+flap],base,.8);}for(const x of [-15,0,13])M.orb(x,0,40,7,6,4,'#aaa5c3');}
  else for(const side of [-1,1]){const span=insect?38:primate?44:40;M.material(insect?'chitin':dragon||infernal?'cloth':'fur');M.face([[9,side*5,29],[-1,side*span,30+flap],[-24,side*(span-4),24+flap],[-17,side*5,25]],base);for(let j=0;j<7;j++){const y=side*(10+j*4);beam([8-j*3,side*5,30],[-13-j*2,y,27+flap],trim,insect?.6:1.2);if(primate||myth)M.face([[-7-j*2,y,28+flap],[-26-j,y+side*3,23+flap],[-20-j,y+side*5,25+flap]],j%2?base:trim);}if(insect){M.face([[-10,side*6,26],[-28,side*29,22-flap],[-35,side*19,21-flap]],trim);beam([20,side*3,33],[28,side*11,40],base,.8);}}
  if(dragon||infernal){beam([-20,0,27],[-38,0,20],base,5);beam([-38,0,20],[-44,5,24],trim,2);for(const x of [-15,-5,5])M.face([[x-4,0,33],[x,0,42],[x+4,0,33]],trim);M.face([[20,-4,32],[31,0,30],[20,4,32]],base);}
  if(primate||myth){M.material('wood');M.box(-2,0,15,18,10,2,trim);for(const x of [-17,13])for(const y of [-9,9])beam([x,y,15],[x*.6,y*.6,27],dark,1);if(primate){M.material('fur');M.orb(4,0,38,4,4,6,'#735c44');M.orb(6,0,45,3,3,3,'#bc9871');}}
  for(const x of [-12,0,12])for(const y of [-7,7]){const z=16-(drop&&x===0?10:0);M.material(insect?'chitin':sym?'fur':'stone');M.orb(x,y,z,5,4,6,infernal?'#d39754':sym?'#b9a5c8':trim);beam([x-4,y,22],[x+4,y,22],dark,.8);}
 }
 M.material('paint');M.face([[-10,-5,31],[2,-5,31],[2,5,31],[-10,5,31]],f.color);M.finish();return true;
}
function unit(ctx,d,f,angle,action,frame,occupancy=0){if(d.bomber)return bomber(ctx,d,f,angle,action,frame);if(root.FractureTradeArt?.unit(ctx,d,f,angle,action,frame))return true;if(!d.naval&&!d.transport&&d.role!=='merchant'&&d.id!=='primates_condor_rider')return false;
const M=new root.FractureSpriteMesh(ctx,Math.round(angle/(Math.PI/4))*Math.PI/4,action==='dead'),[base,trim]=palettes[f.id],organic=['insects','symbiotes'].includes(f.id),industrial=['humans','machines','reptilians','night'].includes(f.id),wing=Math.sin(frame*Math.PI/3)*8;
M.material(organic?'chitin':industrial?'metal':'wood');const beam=(a,b,c=trim,w=1.5)=>M.seg(a,b,c,w);
if(d.naval){
 const role=d.navalRole||'warship',siege=role==='siege',scout=role==='scout',escort=role==='escort',L=role==='merchant'&&f.id==='symbiotes'?29:siege?44:scout?29:36,W=siege?15:scout?8:12,z=8,dark='#263b40',edge=root.FractureArt.tint(trim,-18),hull=root.FractureArt.tint(base,-14),team=f.color;
 const top=[[-L,-W*.8,z],[L*.65,-W,z],[L+5,0,z],[L*.65,W,z],[-L,W*.8,z]],low=top.map(([x,y])=>[x*.9,y*.65,0]);
 for(let i=0;i<5;i++){M.face([low[i],low[(i+1)%5],top[(i+1)%5],top[i]],hull);beam(top[i],top[(i+1)%5],trim,1.2);}M.face(top,base);
 for(let x=-L+4;x<L*.7;x+=4){beam([x,-W*.8,8.3],[x,W*.8,8.3],edge,.5);for(const y of [-W*.95,W*.95]){M.orb(x,y,5,.6,.5,.6,trim);if(industrial)beam([x,y,2],[x,y,7],base,.6);}}
 if(organic){
  M.material(f.id==='symbiotes'?'fur':'chitin');
  if(f.id==='insects'){for(let j=0;j<7;j++){const x=-L+7+j*(L*1.4/7);M.orb(x,0,9,9,W,6+(j%2)*2,base);beam([x,-W,9],[x+5,0,15],trim,.7);beam([x+5,0,15],[x,W,9],trim,.7);}for(const y of [-W,W])M.orb(-17,y,11,12,4,5,edge);}
  else{M.orb(-9,0,10,L*.72,W*.8,8,base);for(let j=0;j<26;j++){const x=-L+j*(L*1.6/26),y=j%2?W:-W,h=13+Math.sin(j*2.1)*3;beam([x-5,0,h],[x,y*.65,9],'#8f819b',.8);beam([x,y*.65,9],[x-10,y*1.45,2],trim,.6);beam([x-10,y*1.45,2],[x-16,y*1.6,3],base,.55);}for(let j=0;j<3;j++){const x=-L+10+j*9;beam([x,0,12],[x-4,0,24+j*2],base,2);M.orb(x-4,0,25+j*2,7,5,2,trim);}}

 }else{
  for(const y of [-W*.87,W*.87]){for(let x=-L+4;x<L*.6;x+=9)beam([x,y,9],[x,y,14],trim,.7);beam([-L+4,y,14],[L*.6,y,14],trim,.65);}
  if(f.id==='machines'){
   M.orb(-L*.48,0,17,scout?8:14,W*.75,8,dark);M.orb(-L*.48+5,0,22,scout?6:10,W*.6,6,base);for(const y of [-W*.45,0,W*.45])M.orb(-L*.48+12,y,23,1.8,1.6,1.8,'#d26e5a');for(const y of [-W-3,W+3]){M.box(-9,y,2,L*.7,2.5,5,dark);beam([-18,y,7],[-8,0,18],trim,1.4);beam([8,y,6],[0,0,18],trim,1.4);}for(let j=0;j<5;j++)beam([-L+3+j*4,-W*.65,11],[-L+3+j*4,W*.65,11],trim,.7);
  }else if(f.id==='reptilians'){
   M.box(-L*.47,0,9,scout?7:12,W*.7,5,base);M.face([[-L*.75,-W*.8,14],[-L*.12,-W*.65,14],[-L*.24,-W*.35,27],[-L*.66,-W*.4,27]],trim);M.face([[-L*.75,W*.8,14],[-L*.66,W*.4,27],[-L*.24,W*.35,27],[-L*.12,W*.65,14]],base);M.face([[-L*.24,-W*.35,27],[-L*.12,-W*.65,14],[-L*.12,W*.65,14],[-L*.24,W*.35,27]],dark);M.face([[-L*.66,-W*.4,27],[-L*.24,-W*.35,27],[-L*.24,W*.35,27],[-L*.66,W*.4,27]],base);beam([-L*.65,0,26],[-L*.8,0,40],trim,2);
  }else{
   M.box(-L*.48,0,9,scout?5:10,W*.65,scout?7:12,base);M.box(-L*.48,0,scout?16:21,scout?6:11,W*.72,2,trim);
   for(let y=-W*.5;y<W*.55;y+=3)M.face([[-L*.48+(scout?5:10)+.2,y,12],[-L*.48+(scout?5:10)+.2,y+2.4,12],[-L*.48+(scout?5:10)+.2,y+2.4,18],[-L*.48+(scout?5:10)+.2,y,18]],'#345764');
   if(industrial){for(const x of [-L*.7,-L*.35]){M.cylinder(x,0,22,2.6,8,dark,8);M.cylinder(x,0,30,3,1,trim,8);}for(let x=-L*.7;x<-L*.3;x+=3)beam([x,-W*.6,23],[x,W*.6,23],edge,.6);beam([-L*.6,0,24],[-L*.6,0,37],trim,.7);beam([-L*.6,-6,34],[-L*.6,6,34],trim,.8);}
  }

 }
 if(role==='merchant'){
  // Open cargo deck, tied freight, and handling gear replace every weapon mount.
  const crate=(x,y,w=5,h=7)=>{M.material('wood');M.box(x,y,9,w,4,h,trim);for(const yy of [y-4,y+4]){beam([x-w,yy,10],[x+w,yy,9+h],edge,.8);beam([x-w,yy,9+h],[x+w,yy,10],edge,.8);}for(const xx of [x-w+1,x+w-1])beam([xx,y-4,9+h],[xx,y+4,9+h],edge,.8);};
  if(f.id==='insects'){for(const x of [1,13,24])for(const y of [-5,5]){M.orb(x,y,13,5,4,7,'#c6ae71');beam([x-4,y,16],[x+4,y,16],edge,.8);}}
  else if(f.id==='symbiotes'){for(const x of [0,12,24]){M.orb(x,0,13,7,7,9,'#858eab');for(const y of [-6,6])beam([x-6,y,10],[x+3,0,22],trim,.8);}}
  else if(f.id==='machines'){for(const x of [-1,13]){M.material('metal');M.box(x,0,10,6,8,10,base);for(let y=-7;y<=7;y+=3)beam([x-6,y,20],[x+6,y,20],trim,.7);M.orb(x+6,0,16,1,2,1,'#8bd3d0');}}
  else if(['myth','elders','dragons','infernal'].includes(f.id)){for(const x of [1,13,25])for(const y of [-5,5]){M.material('stone');M.orb(x,y,13,4,3.5,6,f.id==='infernal'?'#ad654c':trim);M.cylinder(x,y,18,2.2,3,edge,8);beam([x-3,y,14],[x+3,y,14],base,.6);}if(f.id==='dragons')crate(3,0,6,5);}
  else{crate(2,-5);crate(2,5);crate(16,-5,6,8);crate(16,5,6,f.id==='night'?10:6);if(f.id==='wizards'){M.material('crystal');for(const y of [-5,5])M.orb(27,y,15,3,3,5,'#c2b4db');}}
  if(['humans','reptilians','machines','night'].includes(f.id)){M.material('metal');beam([-4,-W+2,9],[-4,-W+2,34],trim,1.8);beam([-4,-W+2,34],[20,-W+2,29],base,2);beam([20,-W+2,29],[20,-W+2,17],trim,.5);beam([20,-W+2,17],[22,-W+2,15],edge,.7);beam([-4,-W+2,18],[17,-W+2,29],trim,.7);}
  else{M.material('cloth');M.face([[0,-W,15],[24,-W,15],[21,W,16],[0,W,16]],f.color);for(const x of [0,21])for(const y of [-W,W])beam([x,y,9],[x,y,16],trim,.7);}
 }
 else if(d.transport){M.box(10,0,9,14,W*.65,2,edge);for(const y of [-W*.7,W*.7])M.box(9,y,9,16,1.1,6,base);M.face([[22,-W*.65,10],[L+4,-W*.5,5],[L+4,W*.5,5],[22,W*.65,10]],trim);for(let x=24;x<L+2;x+=3)beam([x,-W*.5,9-(x-22)*.3],[x,W*.5,9-(x-22)*.3],base,.7);for(let k=0;k<Math.min(4,Math.ceil(occupancy/2.5));k++){M.orb(2+k*5,0,14,2,2,3,base);M.orb(2+k*5,0,19,2,2,2.2,trim);}}
 else if(organic){const h=escort?27:siege?25:19;M.orb(8,0,13,10,8,9,base);beam([8,0,19],[siege?43:32,0,h],base,siege?7:4);M.orb(siege?43:32,0,h,1,3,3,dark);for(let i=0;i<3;i++)beam([7+i*5,-5,17],[12+i*5,-5,22],trim,1);if(escort)for(const y of [-6,6])beam([8,y,17],[25,y,30],trim,2);}
 else if(['primates','myth','elders'].includes(f.id)&&!escort){M.material('wood');M.box(11,0,10,siege?13:8,siege?9:6,3,edge);for(const y of [-6,6]){beam([7,y,12],[13,y,24],base,3);beam([21,y,12],[13,y,24],trim,2);}beam([5,0,13],[siege?43:32,0,siege?25:19],trim,3);M.orb(siege?43:32,0,siege?25:19,3,3,3,'#8b8e7c');}
 else{M.cylinder(9,0,9,siege?10:6,4,edge,12);M.box(9,0,13,siege?10:6,siege?8:5,6,base);const h=escort?27:siege?25:19;beam([10,0,18],[siege?43:32,0,h],trim,siege?4:scout?1.8:2.8);M.orb(siege?43:32,0,h,.5,siege?2:1.3,siege?2:1.3,dark);if(escort)for(const y of [-4,4])beam([8,y,17],[27,y,27],trim,2);if(siege){for(const y of [-8,8])M.box(-2,y,10,6,2,7,edge);beam([1,-7,21],[1,7,21],trim,1);}}
 if(f.id==='primates'){for(const y of [-W-7,W+7]){M.orb(0,y,4,L*.8,2.4,2.5,base);for(const x of [-17,17])beam([x,y,5],[x,0,9],trim,1.5);}for(const y of [-W,W])for(let x=-20;x<15;x+=8)beam([x,y,10],[x-7,y*1.6,2],edge,1);}
 if(['wizards','elders','myth','dragons','infernal'].includes(f.id)&&!d.transport){
  M.material('cloth');const h=scout?42:siege?56:49;beam([-16,0,18],[-16,0,h],trim,1.3);beam([-16,-23,h-3],[-16,18,h-3],trim,1);M.face([[-16,-23,h-3],[-14,2,h-8],[-16,18,h-3],[-16,16,26],[-13,-2,23],[-16,-21,26]],f.id==='infernal'?'#6f3a3b':team);for(const y of [-16,-8,0,8,15])beam([-15.7,y,27],[-15.7,y,h-5],trim,.45);for(const y of [-W,W])beam([-16,0,h],[-L+4,y,10],edge,.45);
  if(f.id==='dragons')for(const y of [-W,W]){beam([L*.6,y,9],[L+5,y*.8,18],trim,2);M.face([[0,y,11],[8,y*1.5,28],[-19,y*1.35,17]],base);}
  if(f.id==='wizards'){M.orb(-16,0,h+3,3,3,5,'#b8afd5');for(const y of [-W,W]){M.orb(-12,y,11,3,3,5,'#9fa9d0');beam([-12,y,12],[15,y,11],trim,.8);}}
 }

 if(f.id==='reptilians')for(const y of [-W,W]){M.face([[3,y,9],[21,y,9],[15,y,17]],trim);beam([L*.5,y,10],[L+7,y*.6,17],trim,1.4);}
 if(f.id==='machines')for(const y of [-W,W]){M.box(-10,y,3,14,2,4,dark);for(const x of [-20,-8,4])M.orb(x,y,8,1.3,1.2,1.3,'#b5ded6');}
 if(f.id==='night'){for(const y of [-W*.6,W*.6])M.cylinder(-23,y,19,2,15,base,8);M.face([[-29,-W*.7,22],[-12,-W*.7,22],[-20,0,32]],trim);}
 if(f.id==='infernal')for(const y of [-W,W]){beam([-20,y,9],[-25,y,21],trim,2);M.orb(-25,y,23,2,2,3,'#d68e58');}
 M.material('paint');M.face([[-L+2,-W*.81,6],[-L+13,-W*.97,6],[-L+13,-W*.97,8],[-L+2,-W*.81,8]],team);
}
else if(f.id==='primates'){
 const carrier=!!d.transport,bird=carrier?'#353e3b':'#80613f',feather=carrier?'#777d70':'#c1a474',tips=carrier?'#252e2d':'#463b31',span=carrier?40:32,flap=Math.sin(frame*Math.PI/3)*(carrier?5:10),z=carrier?34:25;
 M.material('fur');M.orb(-3,0,z,carrier?16:12,carrier?7:5,carrier?7:5.5,bird);
 M.orb(10,0,z+2,5,5,4,carrier?'#d4ccb1':'#b79664');M.orb(16,0,z+6,carrier?4.3:4,3.4,4,carrier?'#a17b60':'#75573d');
 M.material('bone');M.face([[18,-2,z+7],[25,0,z+5],[22,0,z+2],[18,2,z+7]],'#d0b783');
 for(const side of [-1,1]){
  M.material('fur');M.orb(18,side*2.9,z+7,.7,.55,.8,'#e0c57b');M.orb(18.4,side*3.2,z+7,.3,.3,.5,'#202e2b');
  M.face([[-9,side*3,z+1],[4,side*15,z+4+flap*.3],[carrier?-1:-6,side*span,z+flap],[-17,side*(span-3),z-2+flap],[-18,side*8,z-2]],bird);
  M.face([[0,side*10,z+3],[-1,side*(span-6),z+1+flap],[-12,side*(span-7),z+flap],[-10,side*9,z+2]],feather);
  for(let j=0;j<8;j++){
   const y=side*(13+j*(span-13)/8),x=-7-j*.9;
   M.face([[x+6,y,z+flap*.6],[x-8,y+side*1.8,z-2+flap],[x-11-j*.35,y+side*4,z-3+flap],[x-2,y+side*4,z+flap*.6]],j%3===0?feather:tips);
   beam([x+3,y,z+1+flap*.6],[x-7,y+side*2,z-2+flap],feather,.55);
  }
  for(let j=0;j<5;j++)beam([-10+j*3,side*5,z+4],[-11+j*3,side*14,z+3+flap*.4],feather,.7);
  beam([-2,side*3,z-4],[2,side*3,z-10],trim,1.5);for(let j=-1;j<=1;j++)beam([2,side*3,z-10],[5,side*3+j,z-11],tips,.65);
 }
 for(let j=-3;j<=3;j++)M.face([[-12,j*.8,z],[-29-Math.abs(j)*.5,j*(carrier?1.7:3),z-5],[-27,(j+1)*(carrier?1.7:3),z-5],[-12,(j+1)*.8,z]],j%2?tips:feather);
 if(carrier){
  // Wide cargo gondola with woven panels, visible occupants and four suspension ropes.
  M.material('wood');M.box(-2,0,2,13,10,2,'#755637');
  for(const y of [-10,10]){M.box(-2,y,4,13,.8,8,'#997d54');for(let h=5;h<12;h+=2)beam([-15,y,h],[11,y,h],trim,.6);for(let x=-13;x<12;x+=3)beam([x,y,4],[x,y,12],'#6d573d',.55);beam([-15,y,12],[11,y,12],trim,1.5);}
  for(const x of [-15,11]){M.box(x,0,4,.8,10,8,'#997d54');for(let h=5;h<12;h+=2)beam([x,-10,h],[x,10,h],trim,.6);for(const side of [-1,1])beam([x,side*10,12],[x*.65,side*5,z-2],'#c6b58c',.9);}
  for(let i=0;i<Math.min(4,Math.ceil(occupancy/2.5));i++){const x=-10+i*6;M.material('fur');M.orb(x,0,12,2.4,2.3,3.3,'#685641');M.orb(x+1,0,17,2.5,2.3,2.7,'#ac8963');}
  M.material('cloth');M.face([[-8,-11,6],[5,-11,6],[5,-11,11],[-8,-11,11]],f.color);
 }else{
  // War condor: no cargo basket. A forward saddle and large, readable spear-bearing ape.
  M.material('cloth');M.box(-2,0,z+3,7,5,2,'#674e38');M.face([[-8,-6,z],[-8,6,z],[4,6,z],[4,-6,z]],f.color);
  M.material('fur');M.orb(-1,0,z+11,4,3.6,6,'#655340');M.orb(0,0,z+19,3.3,3.1,3.8,'#8f7250');M.orb(2.8,0,z+18,2,2.7,2,'#b59365');
  for(const side of [-1,1]){beam([-1,side*3,z+9],[3,side*6,z+3],'#655340',2.7);beam([3,side*6,z+3],[6,side*5,z+1],'#a18761',1.8);}
  const release=action==='attack'&&frame%4===2,windup=action==='attack'&&frame%4===1,hand=windup?[-8,5,z+23]:[release?20:8,5,release?z+18:z+15];
  beam([0,4,z+14],windup?[-6,6,z+18]:[5,7,z+12],'#655340',2.6);beam(windup?[-6,6,z+18]:[5,7,z+12],hand,'#a98a63',2);
  beam([0,-3,z+14],[10,-3,z+5],'#806342',2);beam([10,-3,z+5],[15,-2,z+6],'#d5c399',.5);
  if(!release){M.material('wood');beam([hand[0]-12,hand[1],hand[2]-3],[hand[0]+18,hand[1],hand[2]+4],'#c6ae79',1.1);M.material('stone');M.face([[hand[0]+17,hand[1]-1.5,hand[2]+3],[hand[0]+23,hand[1],hand[2]+5],[hand[0]+17,hand[1]+1.5,hand[2]+3]],'#c6c9b5');}
 }
}
else if(['myth','dragons','elders'].includes(f.id)){M.material('fur');M.orb(0,0,28,15,7,7,base);M.orb(17,0,33,5,4,5,trim);M.face([[21,-2,33],[29,0,31],[21,2,33]],'#d1b779');for(const side of [-1,1]){M.face([[-8,side*4,28],[3,side*36,29+wing],[-20,side*29,26+wing],[-17,side*6,27]],base);for(let j=0;j<6;j++)beam([-3-j*3,side*18,27+wing*.5],[-6-j*3,side*(35-j),24+wing],trim,1.3);beam([-8,side*5,24],[-9,side*8,9],trim,.8);beam([9,side*5,24],[9,side*8,9],trim,.8);}M.material('wood');M.box(0,0,2,12,9,7,'#987b50');for(let z=3;z<9;z+=2)for(const y of [-9.2,9.2])beam([-12,y,z],[12,y,z],trim,.6);
for(let i=0;i<Math.min(3,Math.ceil(occupancy/3.4));i++){const x=-7+i*7;M.material('fur');M.orb(x,0,10,2.5,2.3,3.5,'#74614d');M.orb(x+.5,0,15,2.5,2.3,2.8,'#a68a65');}
if(!d.transport){M.orb(1,0,36,3,3,5,'#847058');M.orb(1,0,43,3,3,3,'#b89b74');beam([4,4,38],[27,4,44],trim,1);}}
else if(industrial){M.box(0,0,12,16,9,11,base);M.orb(18,0,19,7,7,7,'#42666e');beam([-13,0,19],[-32,0,22],base,3);beam([0,0,22],[0,0,32],trim,2);const spin=frame*Math.PI/3;for(const sign of [-1,1])beam([0,0,32],[Math.cos(spin)*34*sign,Math.sin(spin)*34*sign,32],trim,1.4);for(const y of [-10,10])beam([-15,y,6],[18,y,6],trim,2);for(const y of [-8,8])beam([0,y,13],[0,y*1.3,6],base,2);}
else{M.orb(0,0,24,24,13,12,base);for(const x of [-12,12])for(const y of [-8,8])beam([x,y,18],[x,y,7],trim,1);M.box(0,0,2,16,10,6,trim);for(let i=0;i<5;i++)M.orb(-18+i*9,0,34,3,4,3,organic?'#b1b999':f.color);}
M.finish();return true;}
function building(ctx,d,f){if(root.FractureTradeArt?.building(ctx,d,f))return true;if(!['dock','market','deepMine','trap'].includes(d.kind))return false;const M=new root.FractureSpriteMesh(ctx,0,false,{originX:120,originY:181,logicalWidth:240}),[base,trim]=palettes[f.id],industrial=['humans','machines','reptilians','night'].includes(f.id),organic=['symbiotes','insects'].includes(f.id);M.material(organic?'chitin':industrial?'metal':'wood');const beam=(a,b,c=trim,w=2)=>M.seg(a,b,c,w);
if(d.kind==='trap'){
 const ring=(r,z,color,width=2)=>{for(let j=0;j<24;j++){const a=j*Math.PI/12,b=(j+1)*Math.PI/12;beam([Math.cos(a)*r,Math.sin(a)*r,z],[Math.cos(b)*r,Math.sin(b)*r,z],color,width);}};
 if(f.id==='humans'){M.cylinder(0,0,0,24,7,'#55665b',16);M.cylinder(0,0,7,12,3,trim,12);for(let j=0;j<6;j++){const a=j*Math.PI/3;M.orb(Math.cos(a)*19,Math.sin(a)*19,8,1.8,1.8,1.5,'#b8b79e');}}
 if(f.id==='reptilians'){M.box(0,0,0,24,18,6,base);for(const y of [-12,12])beam([-18,y,7],[18,y,7],trim,3);M.orb(0,0,9,7,5,3,'#b2d78e');}
 if(f.id==='machines'){M.cylinder(0,0,0,20,9,base,8);for(let j=0;j<4;j++){const a=j*Math.PI/2;beam([Math.cos(a)*12,Math.sin(a)*12,7],[Math.cos(a)*30,Math.sin(a)*30,1],trim,3);}M.orb(0,0,12,6,6,3,'#ca5650');}
 if(f.id==='primates'||f.id==='myth'){M.face([[-27,-23,0],[27,-23,0],[27,23,0],[-27,23,0]],'#26352b');for(let j=-22;j<24;j+=8)beam([j,-24,1],[j+5,24,2],f.id==='primates'?'#85704b':'#687448',3);for(let j=0;j<10;j++){const a=j*2.4;beam([Math.cos(a)*25,Math.sin(a)*22,1],[Math.cos(a+.2)*30,Math.sin(a+.2)*25,6],trim,1);}}
 if(f.id==='insects'){for(let j=0;j<8;j++){const a=j*Math.PI/4;beam([0,0,2],[Math.cos(a)*34,Math.sin(a)*34,1],'#cfcd94',1);}for(const r of [10,20,30])ring(r,2,'#c5ca95',1);M.orb(0,0,5,10,9,5,'#879b58');}
 if(f.id==='wizards'||f.id==='elders'){M.cylinder(0,0,0,29,3,base,16);ring(24,4,trim,2);ring(16,4,f.color,1.5);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;beam([Math.cos(a)*22,Math.sin(a)*22,5],[Math.cos(a+2.51)*22,Math.sin(a+2.51)*22,5],f.color,1.5);}if(f.id==='elders')for(const x of [-21,21])M.box(x,0,2,4,11,9,trim);}
 if(f.id==='dragons'||f.id==='infernal'){M.cylinder(0,0,0,27,5,'#45413d',7);for(let j=0;j<6;j++){const a=j*Math.PI/3;beam([Math.cos(a)*25,Math.sin(a)*25,5],[Math.cos(a+.4)*9,Math.sin(a+.4)*9,6],f.id==='dragons'?'#d2a25a':'#d8794a',2);}M.orb(0,0,8,8,8,f.id==='dragons'?7:3,'#dfad6c');}
 if(f.id==='night'){M.box(0,0,0,24,15,5,base);for(const x of [-13,0,13]){M.cylinder(x,0,5,4,10,'#bfc1bb',10);beam([x,-7,6],[x,7,6],'#c5b48b',2);}beam([-27,17,1],[28,17,1],'#bcbeb9',1);}
 if(f.id==='symbiotes'){for(let j=0;j<15;j++){const a=j*2.4;beam([0,0,3],[Math.cos(a)*24,Math.sin(a)*20,2],'#77767b',2);beam([Math.cos(a)*24,Math.sin(a)*20,2],[Math.cos(a+.2)*34,Math.sin(a+.2)*29,1],'#a891b6',1);}M.orb(0,0,5,13,11,6,'#6c626d');for(const x of [-6,6])M.orb(x,0,10,3,3,3,'#b69acc');}
}
if(d.kind==='dock'){
 const dark='#293b3c',roof=root.FractureArt.tint(base,-24),team=f.color;
 // Two working piers surround a real slip, with piles, deck seams and mooring gear.
 for(const x of [-35,35]){M.box(x,10,-1,10,40,5,base);for(let y=-26;y<50;y+=5)beam([x-9,y,4.2],[x+9,y,4.2],trim,.7);for(const y of [-24,10,43]){M.cylinder(x,y,-14,3,25,roof,10);M.cylinder(x,y,10,3.6,1.2,trim,10);beam([x-5,y,7],[x+5,y,7],trim,1.6);}}
 M.box(0,-24,0,44,16,5,base);for(let x=-40;x<44;x+=7)beam([x,-38,5],[x,-10,5],trim,.55);
 if(organic){M.material(f.id==='symbiotes'?'fur':'chitin');M.orb(0,-23,19,32,21,20,base);for(let j=0;j<9;j++){const a=j*Math.PI/4;beam([Math.cos(a)*17,-23+Math.sin(a)*12,20],[Math.cos(a)*44,-10+Math.sin(a)*28,2],trim,f.id==='symbiotes'?1:3);}
  if(f.id==='insects'){for(const x of [-23,0,23]){M.orb(x,-25,33,9,12,12,base);M.orb(x,-11,16,7,3,9,dark);for(let z=29;z<43;z+=4)beam([x-7,-27,z],[x+7,-27,z],trim,.6);}for(const x of [-30,30])M.orb(x,14,8,6,9,4,'#b3bb7d');}
  else{for(const x of [-25,0,25]){beam([x,-25,12],[x-5,-24,49],base,3);M.orb(x-5,-24,50,14,12,4,trim);for(let j=0;j<6;j++)beam([x-5,-24,49],[x-15+j*5,-18,31],'#9b88a5',.7);}for(let j=0;j<15;j++)beam([-30+j*4,-7,10],[-35+j*5,22,1],'#a89ab5',.6);}
 }else if(industrial){
  if(f.id==='machines'){M.box(-12,-25,5,25,17,9,roof);for(const x of [-29,7]){M.cylinder(x,-25,14,10,28,base,8);M.orb(x,-25,45,9,9,5,trim);for(const y of [-31,-20])M.orb(x,y,46,2,2,2,'#d96e5e');beam([x,-15,31],[x,11,16],trim,3);beam([x,11,16],[x,22,5],roof,3);}M.box(-11,-26,20,13,9,17,roof);for(let z=24;z<36;z+=3)beam([-24,-16,z],[2,-16,z],trim,.8);beam([-30,-7,17],[9,-7,17],'#92cccc',1.5);}
  else{M.box(-10,-24,5,24,15,27,base);M.box(-10,-24,32,26,17,3,trim);M.face([[-25,-8,7],[5,-8,7],[5,-8,28],[-25,-8,28]],dark);for(let z=10;z<28;z+=3)beam([-24,-7.7,z],[4,-7.7,z],roof,.8);for(const x of [-30,-19,-8,3]){M.box(x,-24,36,1,14,1.5,trim);for(let y=-34;y<-12;y+=4)beam([x+1,y,35.5],[x+7,y,35.5],roof,.6);}
  M.box(19,-25,6,7,13,35,roof);for(let y=-34;y<-14;y+=5)M.face([[26.1,y,29],[26.1,y+3,29],[26.1,y+3,38],[26.1,y,38]],'#6c969c');M.box(19,-25,41,8,14,2,trim);
  }
  beam([34,-23,6],[34,-23,68],trim,3);beam([34,-23,68],[34,27,68],base,4);beam([34,-23,48],[34,13,68],trim,1.2);beam([34,24,68],[34,24,19],dark,.8);M.box(34,24,17,3,3,3,trim);for(let z=13;z<62;z+=7)beam([31,-23,z],[37,-23,z],base,.7);
  if(f.id==='machines'){for(const x of [-27,-7,13]){M.cylinder(x,-25,37,4,7,base,8);M.orb(x,-25,46,2,2,2,'#a6d8cc');}beam([-27,-6,29],[5,-6,29],'#81bfc0',1.4);}
  if(f.id==='reptilians'){M.face([[-38,-43,36],[16,-43,36],[16,-25,57],[-38,-25,57]],roof);M.face([[-38,-25,57],[16,-25,57],[16,-7,36],[-38,-7,36]],base);for(let x=-34;x<16;x+=9)beam([x,-25,57],[x,-7,36],trim,1.4);}
  if(f.id==='reptilians')for(const x of [-35,15]){M.face([[x,-10,34],[x+10,-10,34],[x+5,-10,53]],trim);M.face([[x+2,-9,35],[x+8,-9,35],[x+5,-9,44]],team);}
  if(f.id==='night'){for(const x of [-29,9]){M.cylinder(x,-28,35,4,14,base,10);M.cylinder(x,-28,49,6,12,roof,10,0);}for(const y of [-32,-20])beam([19,y,6],[19,y,39],trim,1.2);}
 }else{
  const primitive=f.id==='primates',hot=['dragons','infernal'].includes(f.id);M.material(primitive?'wood':'stone');M.box(-8,-25,5,27,15,primitive?22:30,base);
  if(primitive){for(let x=-32;x<20;x+=4)beam([x,-9,6],[x,-9,27],trim,1);for(const x of [-32,16])beam([x,-8,5],[x,-8,36],base,3);M.face([[-39,-43,28],[23,-43,28],[23,-25,44],[-39,-25,44]],roof);M.face([[-39,-25,44],[23,-25,44],[23,-5,28],[-39,-5,28]],base);for(let x=-38;x<23;x+=3)beam([x,-25,44],[x,-5,28],trim,.6);beam([34,-25,7],[34,-25,57],base,4);beam([34,-25,57],[34,15,51],trim,3);beam([34,14,51],[34,14,11],trim,.7);}
  else{for(const x of [-31,-13,5,22]){M.cylinder(x,-8,5,2.8,31,trim,12);M.box(x,-8,35,4,4,3,trim);}M.box(-5,-24,36,31,18,4,trim);
   if(f.id==='wizards'){for(const x of [-29,20]){M.cylinder(x,-26,38,9,20,base,8);M.cylinder(x,-26,58,11,21,roof,8,0);M.orb(x,-26,81,2,2,3,'#bcabd9');}M.orb(-5,-23,42,13,11,4,trim);M.orb(-5,-23,49,8,7,10,'#b5a0d0');for(const x of [-29,20])beam([x,-26,63],[-5,-23,58],trim,1);}
   else if(hot){M.material('stone');for(const x of [-32,23]){M.orb(x,-26,29,12,20,28,base);beam([x,-10,32],[x*1.15,-12,63],trim,5);beam([x*1.15,-12,63],[x*.7,-13,74],trim,2);}M.face([[-30,-40,39],[22,-40,39],[22,-25,62],[-30,-25,62]],roof);M.face([[-30,-25,62],[22,-25,62],[22,-7,39],[-30,-7,39]],base);for(let j=0;j<6;j++)beam([-28+j*9,-24,61],[-24+j*9,-8,39],trim,1.3);for(const x of [-33,26]){M.cylinder(x,0,4,5,17,roof,8);M.orb(x,0,23,4,4,7,'#dc8c56');}if(f.id==='dragons')for(const x of [-35,25])M.face([[x,-10,37],[x+(x<0?-14:14),-16,60],[x,-25,51]],trim);}
   else{M.face([[-39,-44,40],[29,-44,40],[29,-24,58],[-39,-24,58]],roof);M.face([[-39,-24,58],[29,-24,58],[29,-4,40],[-39,-4,40]],base);for(let x=-36;x<29;x+=5)beam([x,-24,58],[x,-4,40],trim,.5);}
   if(!hot&&f.id!=='wizards'){M.cylinder(34,-26,5,7,47,base,12);for(const z of [12,28,45])M.cylinder(34,-26,z,8,2,trim,12);M.orb(34,-26,57,5,5,6,'#a7c9b7');}
   if(f.id==='elders')for(const x of [-28,-10,8])beam([x,-7,15],[x+4,-7,24],'#a7bd98',1.2);
  }
  M.face([[-24,-8,6],[0,-8,6],[0,-8,26],[-24,-8,26]],dark);beam([-25,-7,27],[1,-7,27],trim,2);
 }
 for(const x of [-31,31]){M.material(organic?'chitin':industrial?'metal':'wood');for(let j=0;j<3;j++){M.box(x,-6+j*7,5,4,3,5+(j%2)*3,base);beam([x-4,-6+j*7,11],[x+4,-6+j*7,11],trim,.6);}for(let j=0;j<12;j++){const a=j*Math.PI/6,b=(j+1)*Math.PI/6;beam([x+Math.cos(a)*5,35+Math.sin(a)*4,5.3],[x+Math.cos(b)*5,35+Math.sin(b)*4,5.3],trim,.8);}}
 M.material('paint');M.face([[-21,-7,27],[-8,-7,27],[-8,-7,31],[-21,-7,31]],team);
}
if(d.kind==='deepMine'){
 const color={ore:'#b6a585',oil:'#607d82',aether:'#87c9bd',rift:'#b7a1d0'}[d.resource],ring=(x,y,z,r,c=trim)=>{for(let j=0;j<16;j++){const a=j*Math.PI/8,b=(j+1)*Math.PI/8;beam([x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z],c,1.3);}};
 M.box(0,0,0,35,30,4,base);
 if(organic){
  M.material('chitin');M.orb(-9,-4,20,31,25,23,base);M.orb(12,16,12,18,5,13,trim);M.orb(13,19,11,14,2,10,'#1b2b2c');
  for(let j=0;j<12;j++){const a=j*Math.PI/6;beam([-8+Math.cos(a)*18,Math.sin(a)*16,18],[-8+Math.cos(a)*43,Math.sin(a)*37,1],trim,f.id==='symbiotes'?1.2:3);}
  if(f.id==='insects'){for(const x of [-25,-5,15]){M.orb(x,-15,34,8,10,17,base);M.orb(x,-15,49,4,5,5,color);}for(const x of [-25,-10,5])beam([x,8,33],[x+11,15,18],trim,2);}
  else{for(let j=0;j<9;j++){const a=j*2.4,x=-9+Math.cos(a)*20,y=-7+Math.sin(a)*15;beam([x,y,25],[x-5,y+3,52+j%3*6],'#8c7a9c',2);beam([x-5,y+3,52+j%3*6],[x+8,y+7,68-j%3*9],trim,.8);}M.orb(-7,-4,38,10,8,6,color);}
 }else if(f.id==='primates'){
  M.material('stone');M.orb(-8,-8,14,31,25,20,'#72715b');M.face([[7,-14,3],[7,15,3],[7,15,27],[7,-14,27]],'#25332a');M.material('wood');for(const y of [-19,19]){beam([10,y,4],[10,y,37],trim,5);beam([-28,y,3],[-28,y,54],base,4);}beam([-28,-19,54],[-28,19,54],trim,5);for(let x=-31;x<14;x+=6)beam([x,-24,30],[x,24,38],base,5);M.cylinder(-28,0,35,6,14,trim,10);beam([-28,0,54],[-28,0,16],'#d1b984',1);M.box(-28,0,5,6,6,11,base);
 }else if(['wizards','elders','myth'].includes(f.id)){
  M.material('stone');M.box(-12,-2,4,19,22,29,base);M.face([[7,-15,4],[7,15,4],[7,15,28],[7,-15,28]],'#263438');for(const y of [-20,20]){M.cylinder(10,y,4,4,37,trim,12);M.box(10,y,40,7,6,4,trim);}beam([10,-21,44],[10,21,44],trim,5);
  if(f.id==='wizards'){for(const z of [37,51,65])ring(-14,-6,z,16);M.orb(-14,-6,55,7,7,17,color);for(const y of [-21,21])M.orb(10,y,48,4,4,7,'#a79ac9');}
  if(f.id==='elders'){M.box(-12,-2,33,23,25,7,trim);for(let j=-2;j<=2;j++)beam([-14+j*6,-25,8],[-16+j*6,-25,37],base,2);for(const y of [-21,21]){beam([11,y,8],[12,y,26],'#8cba9a',1.5);beam([12,y-3,18],[12,y+3,23],'#8cba9a',1.5);}}
  if(f.id==='myth'){M.face([[-37,-29,36],[15,-29,36],[15,0,55],[-37,0,55]],trim);M.face([[-37,0,55],[15,0,55],[15,27,36],[-37,27,36]],base);M.material('wood');beam([29,-18,4],[29,-18,51],trim,4);beam([29,-18,51],[29,17,51],base,4);beam([29,14,51],[29,14,9],trim,.8);}
 }else if(['dragons','infernal'].includes(f.id)){
  M.material('stone');M.orb(-8,-4,22,33,27,28,base);M.face([[18,-14,4],[18,14,4],[18,14,29],[18,0,39],[18,-14,29]],'#25272b');for(const y of [-22,22]){beam([16,y,4],[11,y,39],trim,6);beam([11,y,39],[22,y*1.1,57],trim,3);}for(let j=0;j<6;j++){const x=-33+j*10;beam([x,-20,17],[x+3,-14,39],f.id==='infernal'?'#c57655':'#b39062',1.5);}M.orb(-10,5,47,9,8,6,color);
 }else{
  M.material(f.id==='night'?'stone':'metal');M.box(-12,0,4,20,23,27,base);M.face([[8,-16,4],[8,16,4],[8,16,28],[8,-16,28]],'#172a2c');for(const y of [-19,19])beam([8,y,4],[8,y,36],trim,4);beam([8,-19,36],[8,19,36],trim,4);
  for(const x of [-32,-8])beam([x,-20,31],[x,-20,77],trim,f.id==='machines'?4:2);beam([-32,-20,77],[-8,-20,77]);M.cylinder(-20,-20,54,6,12,trim,12);
  if(f.id==='humans'){for(let z=37;z<73;z+=8)beam([-32,-20,z],[-8,-20,z+8],trim,1);M.box(-10,18,24,9,4,10,'#485d65');for(let x=-17;x<-2;x+=5)beam([x,22,27],[x,22,33],trim,1);}
  if(f.id==='machines'){for(const x of [-27,-11,5]){M.cylinder(x,-12,30,5,22,base,8);M.orb(x,-12,54,3,3,3,'#94d9d3');}for(const y of [-22,22])beam([-31,y,10],[4,y,10],'#77b9b5',2);}
  if(f.id==='reptilians'){for(const y of [-22,22]){M.face([[5,y,31],[-11,y,31],[-4,y,55]],trim);for(let x=-26;x<5;x+=9)beam([x,y,9],[x+5,y,15],trim,2);}M.orb(-8,0,37,8,7,5,'#a7bd75');}
  if(f.id==='night'){M.box(-12,0,31,23,25,7,trim);for(const y of [-20,20])M.cylinder(-13,y,36,4,20,base,8,0);for(const x of [-24,-9])M.box(x,23,12,3,1,13,'#b4a26d');}
 }
 // Surface fittings and resource machinery share the main game's material detail.
 if(!organic){for(let j=0;j<6;j++){const x=-32+j*6;beam([x,-23.3,7],[x,-23.3,27],root.FractureArt.tint(base,-20),.55);M.orb(x,-23.6,8,.65,.65,.65,trim);M.orb(x,-23.6,26,.65,.65,.65,trim);}for(let z=8;z<30;z+=6)beam([-31,-23.5,z],[4,-23.5,z],root.FractureArt.tint(base,12),.45);
  M.box(-23,22,4,7,5,7,base);for(const y of [18,22,26])beam([-30,y,12],[-16,y,12],trim,.65);for(const x of [-30,-17])M.cylinder(x,26,3,2,9,trim,8);
  if(industrial){M.box(-16,1,32,13,14,2,trim);for(let y=-10;y<13;y+=3)beam([-27,y,35],[-5,y,35],root.FractureArt.tint(base,-30),.8);M.box(2,-20,4,4,3,11,base);M.face([[-1,-16.7,9],[5,-16.7,9],[5,-16.7,13],[-1,-16.7,13]],'#83b0a5');}}
 else{for(let j=0;j<18;j++){const a=j*2.4,x=-9+Math.cos(a)*25,y=-4+Math.sin(a)*20;beam([x*.7,y*.7,30],[x,y,12],root.FractureArt.tint(trim,-15),.65);M.orb(x*.7,y*.7,31,1.2,1.2,1.2,color);}}
 if(d.resource==='aether'||d.resource==='rift'){const h=d.resource==='rift'?26:17;for(let j=0;j<4;j++){const x=21+j%2*9,y=-17+Math.floor(j/2)*11;M.face([[x-3,y,5],[x,y-3,5],[x+3,y,5],[x,y,5+h]],color);beam([x,y,5+h],[x+3,y,5],trim,.7);}if(d.resource==='rift'){ring(27,-9,29,12,color);ring(27,-9,37,9,trim);}}
 if(d.resource==='oil'&&!organic){for(const y of [-17,17]){beam([19,y,5],[25,y,40],trim,2);beam([34,y,5],[25,y,40],trim,2);}beam([12,0,42],[40,0,36],base,4);beam([39,0,36],[39,0,6],trim,1.2);M.box(39,0,33,4,5,6,trim);}
 // A visible entrance and loading rails are shared conventions, while each
 // civilization reaches the underground through its own architecture.
 for(const y of [-8,8])beam([12,y,4],[44,y,2],trim,1.4);M.box(29,0,2,9,8,8,base);M.orb(29,0,11,7,5,3,color);
 if(d.resource==='oil'){for(const y of [-20,20]){M.material(organic?'chitin':industrial?'metal':'stone');if(organic)M.orb(27,y,15,8,8,13,color);else M.cylinder(27,y,4,8,23,color,12);beam([0,y,29],[27,y,27],trim,2.5);}}
}
M.finish();return true;}
root.FractureExpansionArt={unit,building};
})(globalThis);
