'use strict';
// Original trade architecture and traveling merchants. Geometry and materials only.
(function(root){
const palette={humans:['#7c8988','#334d58','#c2b79b'],reptilians:['#b2a17b','#4d6b4b','#d5bd78'],machines:['#3c5059','#202d35','#99b2b3'],insects:['#aa8045','#594731','#d2b77b'],primates:['#96704a','#544631','#c7ad76'],wizards:['#aaa5a1','#575a85','#ccb88b'],elders:['#a7a38b','#416452','#c8b58b'],myth:['#d0c3a1','#9d634d','#e4d5af'],dragons:['#6d655b','#3f403c','#ceaa62'],night:['#7e7e8d','#343b4d','#b6aa91'],infernal:['#665155','#2e2c32','#af8b61'],symbiotes:['#796d80','#3d4d48','#b8b7a0']};
const designs={humans:['Freight exchange','Six-wheel delivery truck'],reptilians:['Imperial counting court','Pack lizard and caravan keeper'],machines:['Automated sorting terminal','Hovering freight automaton'],insects:['Resin trading chambers','Broad-backed cargo beetle'],primates:['Open barter terraces','Gorilla basket porter'],wizards:['Arcane auction rotunda','Mage with levitating luggage'],elders:['Guild hall and woodland stalls','Dwarven barrel-cart trader'],myth:['Marble trade agora','Satyr amphora wagon'],dragons:['Basalt hoard vault','Kobold treasure-sled keeper'],night:['Gothic exchange house','Lantern-lit covered carriage'],infernal:['Chain-and-furnace exchange','Imp furnace-cart trader'],symbiotes:['Living nutrient exchange','Fibrous nutrient carrier']};
function kit(M,f){
 const [base,dark,trim]=palette[f.id],tint=root.FractureArt.tint;
 const box=(x,y,z,w,l,h,c=base,m='stone')=>{M.material(m);M.box(x,y,z,w,l,h,c);},orb=(x,y,z,rx,ry,rz,c=base,m='skin')=>{M.material(m);M.orb(x,y,z,rx,ry,rz,c);},seg=(a,b,c=trim,w=1,m='metal')=>{M.material(m);M.seg(a,b,c,w);},face=(v,c=base,m='stone')=>{M.material(m);M.face(v,c);},tube=(x,y,z,r,h,c=base,m='stone',top=r,n=12)=>{M.material(m);M.cylinder(x,y,z,r,h,c,n,top);};
 const curve=(pts,c=trim,w=1,m='metal')=>{for(let i=1;i<pts.length;i++)seg(pts[i-1],pts[i],c,w*(1-i/pts.length*.45),m);};
 const ring=(x,y,z,r,c=trim,w=1)=>{for(let j=0;j<20;j++){const a=j*Math.PI/10,b=(j+1)*Math.PI/10;seg([x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z],c,w);}};
 const crate=(x,y,z,r=5,c='#98764e')=>{box(x,y,z,r,r*.8,r*1.5,c,'wood');for(const yy of [-.82,.82]){for(const zz of [.2,1.3])seg([x-r,y+yy*r,z+zz*r],[x+r,y+yy*r,z+zz*r],trim,.65);seg([x-r,y+yy*r,z+.2*r],[x+r,y+yy*r,z+1.3*r],trim,.7);}for(const xx of [-.65,.65])seg([x+xx*r,y-r*.8,z+r*1.52],[x+xx*r,y+r*.8,z+r*1.52],dark,.6);};
 const barrel=(x,y,z,r=4,h=11,c='#97734c')=>{M.material('wood');M.loft([[x,y,z,r*.8,r*.8],[x,y,z+h*.3,r,r],[x,y,z+h*.7,r,r],[x,y,z+h,r*.8,r*.8]],c,12);for(const zz of [.12,.32,.77,.95])ring(x,y,z+h*zz,r*(zz<.2||zz>.9?.85:1.01),dark,.7);tube(x,y,z+h,r*.73,.5,trim,'wood');};
 const vase=(x,y,z,r=4,h=11,c='#b78959')=>{M.material('stone');M.loft([[x,y,z,r*.45,r*.45],[x,y,z+h*.25,r,r],[x,y,z+h*.6,r*.95,r*.95],[x,y,z+h*.8,r*.4,r*.4],[x,y,z+h,r*.48,r*.48]],c,12);tube(x,y,z+h,r*.52,.6,trim,'stone');for(const s of [-1,1])curve([[x+s*r*.35,y,z+h*.85],[x+s*r*1.25,y,z+h*.8],[x+s*r*1.2,y,z+h*.47],[x+s*r*.85,y,z+h*.44]],c,.9,'stone');};
 const crystal=(x,y,z,r=4,h=12,c='#9fbeb8')=>{const q=Array.from({length:6},(_,i)=>[x+Math.cos(i*Math.PI/3)*r,y+Math.sin(i*Math.PI/3)*r,z+h*.2]);for(let i=0;i<6;i++){face([q[i],q[(i+1)%6],[x,y,z+h]],tint(c,i%2?14:-12),'glass');face([q[i],[x,y,z-1],q[(i+1)%6]],tint(c,-26),'glass');}};
 const stairs=(x,y,z,w=12,n=4)=>{for(let j=0;j<n;j++)box(x,y+j*2.6,z,w,1.6,(n-j)*1.7,trim);};
 const column=(x,y,z,h=34,r=2.7)=>{box(x,y,z,r+1.5,r+1.5,3,trim);tube(x,y,z+3,r,h-5,base,'stone',r*.85);box(x,y,z+h-2,r+1.8,r+1.8,3,trim);for(let j=0;j<8;j++){const a=j*Math.PI/4;seg([x+Math.cos(a)*r,y+Math.sin(a)*r,z+4],[x+Math.cos(a)*r*.85,y+Math.sin(a)*r*.85,z+h-3],trim,.4,'stone');}};
 const roof=(x,y,z,w,l,h,c=dark,m='slate')=>{face([[x-w,y-l,z],[x+w,y-l,z],[x+w,y,z+h],[x-w,y,z+h]],c,m);face([[x-w,y,z+h],[x+w,y,z+h],[x+w,y+l,z],[x-w,y+l,z]],c,m);face([[x-w,y-l,z],[x-w,y,z+h],[x-w,y+l,z]],base);face([[x+w,y-l,z],[x+w,y+l,z],[x+w,y,z+h]],base);seg([x-w,y,z+h],[x+w,y,z+h],trim,1.4);for(const s of [-1,1]){seg([x-w,y+s*l,z],[x+w,y+s*l,z],trim,1);for(let v=4;v<l;v+=4)seg([x-w,y+s*v,z+h*(1-v/l)+.15],[x+w,y+s*v,z+h*(1-v/l)+.15],tint(c,13),.55,m);}};
 const arch=(x,y,z,w,h,c=trim)=>{face([[x-w,y,z],[x+w,y,z],[x+w,y,z+h-w],[x,y,z+h],[x-w,y,z+h-w]],'#202d30');for(const s of [-1,1])box(x+s*(w+1.4),y,z,1.5,2,h-w,c);curve([[x-w,y+2,z+h-w],[x-w*.7,y+2,z+h-w*.35],[x,y+2,z+h],[x+w*.7,y+2,z+h-w*.35],[x+w,y+2,z+h-w]],c,3,'stone');};
 const lamp=(x,y,z,c='#dbb36a')=>{seg([x,y,z],[x,y,z+11],dark,1.1);box(x,y,z+9,2.3,2.3,5,trim,'metal');box(x,y,z+10,1.7,1.7,3,c,'glow');tube(x,y,z+14,3,3,dark,'metal',0,8);};
 const scale=(x,y,z,s=1)=>{box(x,y,z,4*s,3*s,1.4*s,trim,'metal');seg([x,y,z],[x,y,z+15*s],trim,s*1.3);seg([x-9*s,y,z+14*s],[x+9*s,y,z+14*s],trim,s);for(const side of [-1,1]){const xx=x+side*8*s;for(const dy of [-3,3])seg([xx,y,z+14*s],[xx,y+dy*s,z+7*s],dark,s*.45);tube(xx,y,z+5.5*s,4*s,1.4*s,trim,'metal',5*s);}};
 const wheel=(x,y,z,r=5,phase=0,metal=false)=>{M.material(metal?'metal':'wood');const rings=[-.9,.9].map(o=>Array.from({length:16},(_,i)=>{const a=i*Math.PI/8;return[x+Math.cos(a)*r,y+o,z+Math.sin(a)*r];}));M.rings(rings,metal?'#343d40':'#594b3b');for(let j=0;j<8;j++){const a=j*Math.PI/4+phase;seg([x,y+1.05,z],[x+Math.cos(a)*r*.83,y+1.05,z+Math.sin(a)*r*.83],trim,.65);}orb(x,y+1.1,z,1.3,1,1.3,trim,'metal');};
 const paved=()=>{box(0,0,0,43,32,3,tint(base,-13));for(let x=-39;x<44;x+=10)seg([x,-31,3.1],[x,31,3.1],dark,.35,'stone');for(let y=-29;y<32;y+=9)seg([-42,y,3.1],[42,y,3.1],dark,.35,'stone');};
 return{M,base,dark,trim,tint,box,orb,seg,face,tube,curve,ring,crate,barrel,vase,crystal,stairs,column,roof,arch,lamp,scale,wheel,paved};
}
function building(ctx,d,f){
 if(d.kind!=='market')return false;
 const M=new root.FractureSpriteMesh(ctx,0,false,{originX:120,originY:181,logicalWidth:240}),k=kit(M,f),{base,dark,trim,tint,box,orb,seg,face,tube,curve,ring,crate,barrel,vase,crystal,stairs,column,roof,arch,lamp,scale,paved}=k;
 if(!['insects','primates','symbiotes'].includes(f.id))paved();
 switch(f.id){
 case 'humans':{
  box(-18,-7,3,23,23,35,base,'stone');box(-18,-7,38,25,25,3,dark,'metal');roof(-18,-7,41,25,25,8,'#667b80','metal');
  for(const x of [-29,-9]){box(x,17,4,8,1.5,23,trim,'metal');box(x,19,5,6.7,1,20,'#293a40','metal');for(let z=7;z<25;z+=3)seg([x-6,20.1,z],[x+6,20.1,z],'#84908b',.6);}
  for(const x of [-31,-20,-9]){box(x,-31,25,4,1,9,trim,'metal');box(x,-32.1,26,3,1,6,'#496a75','glass');}box(-31,-11,49,5,7,3,trim,'metal');for(let x=-34;x<-26;x+=2)seg([x,-17,52.2],[x,-5,52.2],dark,.8);
  for(const x of [11,37]){box(x,-21,3,2,2,48,dark,'metal');seg([x,-21,50],[x,20,50],trim,3);seg([x,-21,27],[x,0,50],base,2);}seg([11,7,50],[37,7,50],trim,4);seg([25,7,50],[25,7,27],dark,.65);curve([[25,7,27],[25,7,23],[29,7,22],[30,7,26]],trim,1.5);
  box(25,14,3,14,15,2,dark,'metal');for(let y=1;y<28;y+=3)seg([12,y,5.1],[38,y,5.1],trim,.7);crate(19,13,5,7);crate(32,18,5,4);barrel(31,-12,3,5,16,'#59747d');barrel(18,-13,3,4,13);scale(-8,29,3,.5);lamp(-40,27,3);break;
 }
 case 'reptilians':{
  for(let j=0;j<3;j++)box(0,-9,3+j*4,36-j*4,21-j*3,4,base);box(0,-10,15,26,14,28,base);box(0,-10,43,29,17,4,trim);arch(0,5,15,11,25);roof(0,-10,47,31,19,15,'#65754e','metal');
  for(const x of [-32,32]){box(x,9,3,5,17,7,trim);column(x,9,10,36,3);tube(x,9,47,6,9,dark,'metal',2);curve([[x,9,55],[x*1.08,9,66],[x*.85,9,70]],trim,2,'bone');}
  for(const x of [-17,17])for(let z=19;z<40;z+=6)face([[x-4,5.3,z],[x+4,5.3,z],[x+3,5.3,z+4],[x,5.3,z+6],[x-3,5.3,z+4]],'#8b915e','metal');
  box(0,21,3,21,5,9,dark,'stone');scale(0,21,12,1.1);for(const x of [-17,17])vase(x,20,12,4,9);stairs(0,28,0,15,4);crate(-31,-19,3,7);crystal(30,-23,7,6,17,'#88ae82');break;
 }
 case 'machines':{
  box(0,-5,3,18,21,7,dark,'metal');tube(0,-5,10,18,32,base,'metal',13,8);tube(0,-5,42,17,6,trim,'metal',19,8);box(0,-5,48,13,12,5,dark,'metal');
  for(const x of [-32,32]){box(x,-15,3,8,14,48,base,'metal');for(let z=10;z<46;z+=10){box(x,0, z,6,1.5,6,dark,'metal');for(const xx of [-3,0,3])orb(x+xx,2,z+3,.65,.5,.8,'#c46d54','glow');}box(x,-15,51,10,16,3,trim,'metal');}
  for(const y of [-17,4]){seg([-31,y,42],[-22,y,66],trim,3);seg([-22,y,66],[14,y,60],base,4);seg([14,y,60],[17,y,44],dark,2);for(const s of [-1,1])curve([[17,y,44],[17+s*4,y,41],[17+s*3,y,36]],trim,1.4);}
  box(2,22,3,27,9,5,dark,'metal');for(let x=-22;x<30;x+=4){seg([x,14,8.5],[x,30,8.5],trim,1.5);}for(const x of [-17,1,19])box(x,22,10,5,6,9,base,'metal');
  for(let j=0;j<7;j++){const a=j*Math.PI/3.5;curve([[Math.cos(a)*12,-5+Math.sin(a)*12,30],[Math.cos(a)*25,Math.sin(a)*20,12],[Math.cos(a)*39,Math.sin(a)*29,3]],'#899c9b',1.1);}
  box(0,17,28,8,1,8,dark,'metal');for(let x=-6;x<7;x+=3)seg([x,18.2,30],[x,18.2,34+(x%2)],'#9ac8bf',.8,'glow');break;
 }
 case 'insects':{
  orb(0,0,2,43,33,4,'#6d613d','chitin');
  for(const [x,y,r,h]of [[-24,-13,18,29],[2,-23,19,40],[27,-9,16,32]]){orb(x,y,18,r,17,h,base,'chitin');orb(x,y+14,22,r*.64,4,h*.57,trim,'chitin');orb(x,y+17,21,r*.49,2,h*.43,dark,'chitin');for(let j=0;j<4;j++){const z=10+j*9;curve([[x-r*.8,y,z],[x,y-15,z+8],[x+r*.8,y,z]],trim,1,'chitin');}tube(x,y,18+h-3,7,6,'#b19d5f','chitin',3,6);}
  for(const x of [-29,-10,10,29]){orb(x,18,8,9,11,7,trim,'chitin');orb(x,20,12,6,7,6,'#c49a4f','glass');for(const y of [11,23])curve([[x-9,y,4],[x-5,y,16],[x+5,y,16],[x+9,y,4]],dark,1.5,'chitin');}
  for(let j=0;j<12;j++){const a=j*Math.PI/6;curve([[Math.cos(a)*20,Math.sin(a)*18,8],[Math.cos(a)*36,Math.sin(a)*30,3],[Math.cos(a)*46,Math.sin(a)*34,1]],trim,1.5,'chitin');}break;
 }
 case 'primates':{
  box(0,0,0,40,30,4,'#655940','wood');for(let x=-37;x<=38;x+=5)seg([x,-29,4.4],[x,29,4.4],trim,1,'wood');
  for(const x of [-33,-11,11,33])for(const y of [-25,20]){seg([x,y,0],[x,y,14],dark,4,'wood');}box(0,-16,5,33,12,6,base,'wood');box(0,-23,11,31,5,7,base,'wood');
  for(const x of [-31,9]){seg([x,-23,5],[x,-23,56],trim,4,'wood');seg([x,7,5],[x,7,41],trim,3,'wood');for(const z of [16,29,40]){seg([x-3,-24,z],[x+3,-22,z+2],'#d0ba82',1);seg([x-3,-22,z+3],[x+3,-24,z],dark,.7);}}
  face([[-35,-27,55],[13,-27,55],[14,10,39],[-35,10,39]],'#a18b5b','cloth');for(let x=-33;x<14;x+=4)seg([x,-27,55],[x,10,39],trim,.55,'wood');
  seg([28,-22,8],[28,-22,49],dark,4,'wood');seg([16,-22,44],[39,-22,44],trim,3,'wood');for(const x of [18,37]){curve([[x,-22,44],[x,-22,31],[x,-22,26]],'#bdb08a',.7,'cloth');vase(x,-22,15,6,11,'#8d6d43');}
  for(const [x,y,r]of [[-24,18,7],[-8,16,5],[9,18,6],[29,12,9]]){barrel(x,y,5,r,10,'#9c8254');for(let z=7;z<16;z+=2)ring(x,y,z,r,trim,.45);}for(let j=0;j<9;j++)orb(-25+j%3*3,17+Math.floor(j/3)*3,16,1.5,2,1.5,j%2?'#c9ab55':'#839454','skin');stairs(3,29,0,15,3);scale(-12,-15,12,.65);break;
 }
 case 'wizards':{
  tube(-12,-9,3,24,7,trim,'stone',24,12);tube(-12,-9,10,20,29,base,'stone',18,12);for(const x of [-25,-12,1])arch(x,8,11,4,21);tube(-12,-9,39,23,4,trim,'stone');roof(-12,-9,43,24,22,23,'#68638a');
  tube(-29,-21,30,8,30,base,'stone',7);tube(-29,-21,60,11,24,dark,'slate',0);crystal(-29,-21,84,2,7,'#c1acd8');
  for(const z of [27,43,60])ring(22,-8,z,12,'#ae9c74',1.2);for(const y of [-18,2])column(22,y,3,29,2);orb(22,-8,47,7,7,9,'#ae9dc2','glass');curve([[10,-8,12],[11,-8,43],[22,-8,65],[33,-8,43],[34,-8,12]],trim,2);
  box(1,24,3,24,6,9,dark,'wood');for(let j=0;j<6;j++){const x=-17+j*7;box(x,24,13,2.5,4,1.5,j%2?'#d5c4a2':'#8d789a','cloth');vase(x,20,14,1.3,4,j%2?'#8aa8a7':'#a588ba');}scale(16,25,13,.6);lamp(-36,26,3,'#bcb0e1');break;
 }
 case 'elders':{
  box(-13,-7,3,27,23,24,base);arch(-13,17,3,11,23);roof(-13,-7,28,29,25,23,'#426555');box(-13,-7,49,15,10,4,trim);roof(-13,-7,53,17,12,11,'#557568');
  for(const x of [-34,8]){box(x,14,3,4,6,29,'#939782');seg([x,20,10],[x,20,27],trim,1.4);for(let z=13;z<27;z+=5)seg([x-2,20.3,z],[x+2,20.3,z+3],trim,.9);}
  for(const [x,y]of [[31,-22],[34,10]]){curve([[x,y,3],[x-4,y,29],[x,y,54],[x-12,y,65]],'#6a624a',5,'wood');for(let j=0;j<4;j++)orb(x-6+j%2*8,y-4+Math.floor(j/2)*7,55+j%2*5,10,8,6,'#5f7956','fur');}
  curve([[20,-22,45],[31,-5,52],[24,12,42]],trim,1,'wood');box(26,2,3,10,12,8,dark,'wood');for(const x of [21,29])barrel(x,2,11,3.5,12);crate(-31,27,3,6);crate(-18,28,3,5);scale(6,27,3,.8);stairs(-10,27,0,10,3);break;
 }
 case 'myth':{
  box(0,-13,3,36,16,23,base);for(const x of [-29,-15,0,15,29]){arch(x,3,4,4.7,19);column(x,14,3,31,2.5);}box(0,14,34,40,4,4,trim);roof(0,-2,38,40,23,15,'#a56c50');
  for(const x of [-37,37])column(x,-23,3,34,3);face([[-40,21,38],[40,21,38],[0,21,53]],trim);for(let j=0;j<7;j++)seg([-21+j*7,21.2,40],[-21+j*7,21.2,43],dark,.7);
  tube(-14,28,3,9,4,trim,'stone',11);tube(-14,28,7,9,1,'#6f9595','glass');tube(-14,28,8,2,7,trim);orb(-14,28,16,2.5,2.5,3,trim,'stone');for(const x of [10,20,31])vase(x,25,3,4.5,13,'#bd825e');scale(29,6,3,.7);stairs(2,32,0,11,3);break;
 }
 case 'dragons':{
  for(let j=0;j<3;j++)box(-4,-9,3+j*8,32-j*5,24-j*3,8,tint(base,j*5));box(-4,-9,27,21,17,19,base);roof(-4,-9,46,26,21,14,dark);arch(-4,9,15,13,28,trim);
  for(const x of [-34,29]){tube(x,-14,3,10,30,dark,'stone',7,7);curve([[x,-14,31],[x*1.1,-14,52],[x*.8,-13,70]],trim,5,'bone');for(let j=0;j<4;j++)seg([x-5,-8,14+j*6],[x+5,-8,14+j*6],trim,1.2);}
  face([[-22,10,41],[-4,13,53],[14,10,41],[7,19,35],[-15,19,35]],'#857158','stone');for(const x of [-16,8])crystal(x,16,41,2.3,5,'#d6b269');
  for(let j=0;j<24;j++){const x=-28+j%8*5,y=23+Math.floor(j/8)*3;orb(x,y,4+(j%3)*.4,2,1.8,.8,'#cbab62','metal');}for(const x of [-31,25,34]){crystal(x,23,4,3,9,x<0?'#bb9cc1':'#9dbbb3');}crate(28,4,3,7,'#75614b');scale(-6,25,5,1);break;
 }
 case 'night':{
  box(-18,-9,3,20,20,36,base);roof(-18,-9,39,23,23,29,dark);box(15,-13,3,13,16,29,'#686b78');roof(15,-13,32,16,19,23,'#495366');
  for(const x of [-28,-9]){arch(x,12,6,4.5,22);arch(x,12,31,3,10);}arch(14,5,3,7,25);box(-30,-16,59,3,4,18,base);box(-30,-16,77,4,5,2,trim);box(23,-20,46,3,3,20,base);
  for(const x of [-39,32]){seg([x,15,3],[x,15,34],dark,2.2);curve([[x,15,33],[x+7,15,35],[x+9,15,31]],trim,1.1);lamp(x+9,15,17,'#dbb16d');}
  box(-3,25,3,24,6,10,dark,'wood');roof(-3,25,28,26,9,4,'#69616c','cloth');for(const x of [-25,19])seg([x,31,3],[x,31,29],trim,1.2);for(const x of [-17,-3,11]){box(x,25,13,4,3,3,'#766459','wood');seg([x-3,28.2,15],[x+3,28.2,15],trim,.6);}scale(27,26,3,.7);break;
 }
 case 'infernal':{
  tube(0,-6,3,24,9,dark,'stone',25,8);tube(0,-6,12,19,5,base,'metal',23,8);for(let j=0;j<8;j++){const a=j*Math.PI/4;seg([Math.cos(a)*22,-6+Math.sin(a)*22,5],[Math.cos(a)*11,-6+Math.sin(a)*11,16],'#c07d48',1.1,'glow');}
  for(const x of [-32,32]){box(x,-12,3,7,10,46,base);box(x,-12,49,9,12,3,dark,'metal');curve([[x,-12,51],[x*1.1,-12,67],[x*.72,-12,79]],trim,4,'bone');arch(x,-1,7,4,17,dark);orb(x,1,15,2,1.5,5,'#d19557','glow');}
  seg([-32,-12,54],[32,-12,54],dark,5);for(const x of [-17,17]){for(let z=29;z<54;z+=3.5){ring(x,-12,z,1.5,trim,.65);}tube(x,-12,25,10,3,base,'metal',13,10);for(let j=0;j<6;j++)orb(x+(j%3-1)*4,-13+Math.floor(j/3)*4,29,2,2,1.5,'#a59a81','stone');}
  box(0,22,3,20,7,8,dark,'metal');for(let x=-16;x<18;x+=4)seg([x,16,11.2],[x,28,11.2],trim,.8);vase(-31,23,3,5,12,'#a66f4f');barrel(31,23,3,6,13,'#6a5150');scale(0,21,12,.65);break;
 }
 case 'symbiotes':{
  orb(0,0,2,42,31,4,'#485c4e','fur');
  for(const [x,y,h,r]of [[-24,-8,42,14],[1,-20,63,15],[26,-4,46,13]]){M.material('fur');M.loft([[x,y,3,r,r],[x-4,y-3,h*.45,r*.55,r*.65],[x+2,y-4,h*.8,r*.4,r*.5],[x+4,y-5,h,r*.7,r*.6]],base,14);orb(x+4,y-5,h,r*1.35,r*.9,5,trim,'skin');orb(x+4,y-5,h+2,r*.7,r*.55,3,'#93839e','skin');for(let j=0;j<10;j++){const a=j*Math.PI/5;curve([[x+Math.cos(a)*r,y+Math.sin(a)*r,3],[x-4+Math.cos(a)*r*.6,y-3+Math.sin(a)*r*.7,h*.42],[x+2+Math.cos(a)*r*.4,y-4+Math.sin(a)*r*.5,h*.8],[x+4+Math.cos(a)*r,y-5+Math.sin(a)*r*.7,h]],j%3?'#9c93a4':'#717d76',.7,'fur');}}
  for(let j=0;j<17;j++){const a=j*2.399,x=Math.cos(a)*37,y=Math.sin(a)*27;curve([[0,-9,20],[x*.55,y*.55,11],[x,y,3],[x*1.17,y*1.17,1]],j%3?'#aea5b4':'#84738e',.8,'fur');}
  for(const x of [-26,-8,11,29]){orb(x,19,10,8,8,10,'#8b8c7a','skin');orb(x,22,13,5,5,6,x%2?'#a2b29d':'#b19bbd','glass');for(const s of [-1,1])curve([[x+s*8,19,4],[x+s*6,23,15],[x,24,22]],trim,1,'fur');}curve([[-22,-5,39],[-11,4,48],[7,2,42],[24,-1,39]],'#a39aae',1.2,'fur');break;
 }
 }
 // Ownership is a small built-in sign, not a recoloring of faction materials.
 const organic=['insects','symbiotes'].includes(f.id);if(organic){orb(0,31,8,6,2,3,f.color,'skin');}else{box(-29,29,4,5,1,6,f.color,'paint');seg([-35,29,3],[-35,29,13],trim,1);}
 M.unit=d;M.ownership(organic?[{x:[-6,6],y:[29,34],z:[5,11]}]:[{x:[-34,-24],y:[27,31],z:[4,10]}]);M.finish();return true;
}
function unit(ctx,d,f,angle,action,frame){
 if(d.role!=='merchant')return false;
 const M=new root.FractureSpriteMesh(ctx,Math.round(angle/(Math.PI/4))*Math.PI/4,action==='dead');M.pose(d,action,frame);
 const k=kit(M,f),{base,dark,trim,tint,box,orb,seg,face,tube,curve,ring,crate,barrel,vase,crystal,wheel}=k,walk=action==='walk',phase=walk?frame*Math.PI/3:0;
 let zones=[{x:[-12,16],y:[-12,12],z:[20,24]}];
 function limb(a,b,c,w=3){M.material('skin');M.limb(a,b,c,w);}
 function traveler(type,x,y,z=0,s=1){
  const q=p=>[x+p[0]*s,y+p[1]*s,z+p[2]*s],skin=type==='reptile'?'#8e9868':type==='kobold'?'#a58b5c':type==='imp'?'#9e6553':type==='dwarf'?'#c19b78':type==='satyr'?'#ab9672':'#bba88e',cloth=type==='night'?'#4d4c61':type==='mage'?'#6c6493':type==='dwarf'?'#567366':type==='reptile'?'#7c6653':type==='imp'?'#524540':'#7d715b';
  for(const side of [-1,1]){const step=walk?root.FractureMotion.step(frame,side<0?.5:0,3):{x:0,lift:0},foot=[step.x,side*2.2,1+step.lift],knee=[step.x*.35-1,side*2.2,7+step.lift*.4];limb(q([0,side*2.2,14]),q(knee),type==='satyr'?'#60523e':cloth,3.4*s);limb(q(knee),q(foot),type==='satyr'?'#77664c':cloth,2.6*s);const a=q(foot);orb(a[0]+s,a[1],a[2],2*s,1.5*s,s,type==='satyr'?'#3b3830':'#45423a','skin');if(type==='satyr')seg([a[0]+2*s,a[1],a[2]],[a[0]+.3*s,a[1],a[2]+.8*s],'#b8a57c',.4);}
  const body=q([0,0,20]);M.material('cloth');M.loft([q([0,0,12]).concat([4.4*s,3.2*s]),q([0,0,21]).concat([4.6*s,3.5*s]),q([0,0,26]).concat([3.4*s,3*s])],cloth,12);
  for(const side of [-1,1]){limb(q([0,side*3.7,24]),q([3,side*5.5,18]),cloth,3*s);limb(q([3,side*5.5,18]),q([6,side*4.6,18]),skin,2.3*s);const hand=q([6,side*4.6,18]);orb(...hand,1.2*s,1.2*s,1.3*s,skin);}
  const head=q([1,0,30]);orb(...head,3.7*s,3.2*s,4.2*s,skin);const snout=type==='reptile'||type==='kobold'||type==='imp';if(snout){const a=q([4.2,0,29]);orb(...a,3*s,2.6*s,1.9*s,skin);for(const side of [-1,1]){face([q([0,side*2.7,31]),q([-3,side*6,35]),q([1,side*3.5,27])],trim,'skin');orb(...q([3,side*2.8,31]),.75*s,.5*s,.6*s,'#d9c78b','bone');orb(...q([3.4,side*3.1,31]),.3*s,.3*s,.4*s,'#25322b');}curve([q([-3,0,13]),q([-9,0,9]),q([-15,Math.sin(phase)*2,5]),q([-20,Math.sin(phase)*3,6])],skin,3*s,'skin');}
  else{orb(...q([4.2,0,29]),s,1.3*s,1.4*s,skin);for(const side of [-1,1])seg(q([3.5,side*2.7,31]),q([4.2,side*1.6,31]),'#343934',.6*s);}
  if(type==='dwarf'){orb(...q([2,0,25]),4*s,3.4*s,5.7*s,'#b39c7e','fur');for(const side of [-1,1]){seg(q([4,side*2,29]),q([4,side*2,21]),'#d2bb99',1.3*s,'fur');orb(...q([4,side*2,22]),s,s,.65*s,trim,'metal');}tube(head[0],head[1],head[2]+2*s,4.2*s,3.5*s,cloth,'cloth',2*s);}
  if(type==='mage'){tube(head[0],head[1],head[2]+3*s,6*s,1*s,cloth,'cloth');tube(head[0]-s,head[1],head[2]+4*s,4*s,11*s,cloth,'cloth',.3*s);seg(q([1,-6,1]),q([4,-6,40]),trim,1.1*s,'wood');crystal(...q([4,-6,40]),2.3*s,7*s,'#b9b3d4');}
  if(type==='night'){orb(head[0]-1*s,head[1],head[2]+1*s,4.2*s,3.5*s,4.6*s,cloth,'cloth');face([q([1,-4,26]),q([-5,-5,9]),q([-5,5,9]),q([1,4,26])],cloth,'cloth');}
  if(type==='satyr'||type==='imp')for(const side of [-1,1])curve([q([0,side*2.5,32]),q([-2,side*4,37]),q([-4,side*3,39]),q([-4,side*1.5,35])],type==='imp'?'#c7b599':'#6c5a43',1.5*s,'bone');
  if(type==='imp')for(const side of [-1,1]){face([q([-3,side*2,25]),q([-8,side*9,29]),q([-10,side*6,15]),q([-4,side*3,18])],'#795456','skin');seg(q([-3,side*2,25]),q([-8,side*9,29]),trim,.7);}
  seg(q([-2,-3.6,17]),q([3,3.6,24]),trim,1.1*s,'cloth');box(body[0]-3*s,body[1]+4*s,z+15*s,2*s,1.6*s,4*s,'#80623f','wood');
 }
 switch(f.id){
 case 'humans':{
  box(-5,0,6,19,8,3,'#3a4548','metal');for(const x of [-18,-6,15])for(const y of [-9,9]){wheel(x,y,5,4.7,phase,true);seg([x,-8,5],[x,8,5],dark,1.7);}
  box(15,0,9,8,8,9,'#6a8182','metal');box(14,0,18,7,7,8,base,'metal');box(14,0,26,8,8,1.2,trim,'metal');face([[21.1,-6,18],[21.1,6,18],[20,6,24],[20,-6,24]],'#3a5864','glass');seg([21,-5,24],[20,5,24],'#b1cdce',.6);for(const y of [-8.2,8.2]){face([[10,y,19],[18,y,19],[18,y,24],[10,y,24]],'#42636d','glass');seg([9,y,15],[13,y,15],trim,.6);}
  box(23,0,8,1.8,9,2,trim,'metal');box(23,0,11,1,4,4,dark,'metal');for(const y of [-6,6])orb(23.5,y,14,.7,1.5,1.1,'#ded0a2','glass');for(let z=11;z<16;z+=1.4)seg([24,-3,z],[24,3,z],trim,.45);
  box(-10,0,9,15,8,6,base,'metal');crate(-18,0,15,5);crate(-7,0,15,5);barrel(3,0,15,3.8,9,'#8f7754');for(const y of [-8,8]){seg([-25,y,15],[5,y,15],trim,1.2);for(const x of [-22,-13,-4,4])seg([x,y,9],[x,y,15],trim,.9);face([[-20,y,10],[-9,y,10],[-9,y,13],[-20,y,13]],f.color,'paint');}zones=[{x:[-21,-8],y:[-9,9],z:[10,13]},{x:[7,21],y:[-2.2,2.2],z:[25,29]}];break;
 }
 case 'reptilians':{
  traveler('reptile',22,-5,0,.72);orb(-7,0,13,14,7,7,'#7e885b','chitin');orb(6,0,18,5,4,5,'#8f986b','chitin');orb(12,0,18,6,3.5,2.7,'#a1a77a','chitin');
  for(const side of [-1,1])for(const x of [-14,1]){const st=walk?root.FractureMotion.step(frame,(side<0?.5:0)+(x>0?.5:0),3):{x:0,lift:0};limb([x,side*5,13],[x-3,side*9,7],'#748357',3);limb([x-3,side*9,7],[x+st.x,side*8,1+st.lift],'#9aa276',2.2);seg([x+st.x,side*8,1],[x+st.x+3,side*8,1],trim,1.7,'bone');}
  curve([[-18,0,13],[-25,0,8],[-32,Math.sin(phase)*2,6]],'#859062',4,'chitin');for(let x=-17;x<8;x+=5)face([[x,-1,18],[x+3,0,24],[x+5,1,18]],trim,'bone');
  for(const y of [-8,8]){box(-7,y,11,8,3.5,10,'#866849','wood');seg([-14,y,21],[-1,y,21],trim,.9);seg([-12,y-3,12],[-12,y+3,22],trim,.7);face([[-7,y-3.6,15],[-1,y-3.6,15],[-1,y-3.6,20],[-7,y-3.6,20]],f.color,'cloth');}curve([[15,-2,19],[20,-4,16],[26,-8,13]],'#b9ab7f',.55,'cloth');zones=[{x:[-8,0],y:[-13,13],z:[15,20]}];break;
 }
 case 'machines':{
  box(-3,0,12,15,9,7,base,'metal');box(-3,0,19,12,7,4,trim,'metal');for(const y of [-13,13]){orb(-8,y,12,10,4,4,dark,'metal');box(-8,y,12,8,2,4,base,'metal');for(const x of [-13,-4]){tube(x,y,7,3.2,1.5,'#9cc9bd','glow');seg([x,y,13],[x,0,20],trim,1.5);}}
  box(-6,0,23,9,6,8,dark,'metal');for(const y of [-5,0,5]){box(-6,y,25,7,1.5,6,base,'metal');seg([-12,y,32],[-1,y,32],trim,.7);}orb(12,0,22,6,7,5,'#283e49','metal');for(const y of [-4,0,4])orb(17,y,23,1.1,1,1.1,'#d16b50','glow');
  for(const side of [-1,1]){curve([[4,side*7,18],[15,side*11,16],[21,side*9,9],[25,side*7,10]],trim,2.1);for(const t of [-1,1])seg([25,side*7,10],[28,side*7+t*2,10],base,1.1);for(let j=0;j<4;j++)curve([[-15,side*(4+j),17],[-24,side*(7+j),10],[-29,side*(9+j)+Math.sin(phase+j)*1.5,6],[-31,side*(8+j),8]],'#768f91',.9);}
  face([[-13,-9.1,15],[1,-9.1,15],[1,-9.1,18],[-13,-9.1,18]],f.color,'paint');zones=[{x:[-14,2],y:[-10,10],z:[15,18]}];break;
 }
 case 'insects':{
  orb(-10,0,16,15,11,11,base,'chitin');orb(5,0,13,9,7,7,'#99844b','chitin');orb(14,0,15,6,6,5,'#8f814e','chitin');
  for(const side of [-1,1])for(let j=0;j<3;j++){const x=-12+j*10,step=walk?Math.sin(phase+(j%2)*Math.PI+side)*3:0;curve([[x,side*7,15],[x-4,side*15,10],[x+step+1,side*17,1],[x+step+4,side*17,1]],'#756c40',2,'chitin');orb(x-4,side*15,10,1.7,1.7,1.8,trim,'chitin');}
  for(const s of [-1,1]){orb(17,s*4.8,17,1.6,1,1.5,'#283f31','glass');curve([[17,s*4,19],[21,s*6,27],[27,s*9,30]],trim,1,'chitin');curve([[19,s*3,12],[25,s*5,12],[24,s*1.5,14]],dark,2,'bone');}
  for(let x=-21;x<-1;x+=4)curve([[x,-10,16],[x+2,0,26],[x,10,16]],trim,.8,'chitin');for(const y of [-8,8]){orb(-12,y,28,7,4.7,7,'#b8a56f','chitin');for(let x=-17;x<-5;x+=4)curve([[x,y-5,22],[x,y,36],[x,y+5,22]],'#7c6845',.75,'cloth');}face([[-2,-8,15],[-2,8,15],[1,7,22],[1,-7,22]],f.color,'chitin');zones=[{x:[-3,2],y:[-9,9],z:[15,22]},{x:[-15,-10],y:[-12,12],z:[28,40]}];break;
 }
 case 'primates':{
  orb(2,0,19,7.5,6,9,'#62513c','fur');orb(5,0,27,5,5,6,'#6f5a41','fur');orb(8,0,25,3.4,4,3,'#aa8b63','skin');orb(7,0,30,4,4,2.4,'#4f4939','fur');for(const side of [-1,1]){seg([9,side*3.1,29],[10,side*1.8,29],'#332f28',.8);const st=walk?root.FractureMotion.step(frame,side<0?.5:0,3):{x:0,lift:0};limb([2,side*5,24],[7,side*8,13],'#68543e',6);limb([7,side*8,13],[11+st.x,side*8,3+st.lift],'#63503b',4.2);orb(12+st.x,side*8,2+st.lift,3,2.5,2,'#9a7d58','skin');limb([-2,side*4,13],[-7-st.x*.5,side*4,6],'#66513d',5);orb(-6-st.x*.5,side*4,2,3,2,1.5,'#9a7d58','skin');}
  box(-8,0,13,6,8,18,'#9c7c50','wood');for(const y of [-8.1,8.1])for(let z=15;z<31;z+=2)seg([-14,y,z],[-2,y,z],trim,.7,'wood');for(const x of [-13,-9,-5])for(const y of [-8.3,8.3])seg([x,y,13],[x,y,32],dark,.6,'wood');for(const s of [-1,1])curve([[-10,s*7,32],[2,s*6,27],[1,s*5,18],[-10,s*7,14]],trim,1,'cloth');barrel(-9,-4,31,3.5,8);vase(-8,4,31,3,8);for(let j=0;j<5;j++)curve([[-13+j,1,34],[-15+j,2,38],[-14+j,4,40]],'#c9b359',1.7,'skin');face([[-14.3,-5,19],[-14.3,5,19],[-14.3,5,24],[-14.3,-5,24]],f.color,'cloth');zones=[{x:[-15,-1],y:[-9,9],z:[20,23]},{x:[4,10],y:[-6,6],z:[20,23]}];break;
 }
 case 'wizards':{
  traveler('mage',14,-4,0,.8);const bob=walk?Math.sin(phase)*1.2:0;box(-13,3,12+bob,11,7,8,'#705a4c','wood');box(-13,3,20+bob,11.5,7.5,2,'#9e875e','metal');for(const x of [-21,-5]){seg([x,-4,12+bob],[x,-4,22+bob],trim,1);seg([x,-4,22+bob],[x,10,22+bob],trim,1);seg([x,10,22+bob],[x,10,12+bob],trim,1);}crystal(-13,3,24+bob,4,10,'#a6b5c5');for(const x of [-21,-5])tube(x,3,23+bob,2,6,trim,'cloth');for(let j=0;j<5;j++){const a=j*Math.PI*2/5;orb(-13+Math.cos(a)*13,3+Math.sin(a)*9,8+bob,.65,.65,.9,'#b3b9d5','glow');}curve([[17,0,15],[4,1,19],[-1,2,20]],'#baadcf',.45,'glow');face([[-20,10.6,15],[-7,10.6,15],[-7,10.6,19],[-20,10.6,19]],f.color,'paint');zones=[{x:[-21,-6],y:[9.5,12],z:[14,20]},{x:[12,18],y:[-9,2],z:[17,20]}];break;
 }
 case 'elders':{
  traveler('dwarf',17,0,0,.74);box(-11,0,6,12,8,3,'#73583c','wood');for(const y of [-10,10])wheel(-11,y,6,6,phase);for(const y of [-6,6])seg([-14,y,8],[20,y,13],trim,1.5,'wood');barrel(-16,0,9,5,14);crate(-5,0,9,5,'#64715a');for(const y of [-8,8]){box(-11,y,9,12,1,3,base,'wood');face([[-9,y*1.1,9],[-1,y*1.1,9],[-1,y*1.1,14],[-9,y*1.1,14]],f.color,'cloth');}for(let j=0;j<3;j++)seg([-8,-8.9,16+j],[-3,-8.9,18+j],trim,.6);zones=[{x:[-10,0],y:[-10,10],z:[9,14]}];break;
 }
 case 'myth':{
  traveler('satyr',20,0,0,.8);box(-10,0,7,12,9,2,'#9b7850','wood');for(const y of [-11,11])wheel(-10,y,7,7,phase);for(const y of [-7,7]){seg([-9,y,9],[24,y,14],trim,1.5,'wood');for(const x of [-21,-12,-1])seg([x,y,9],[x,y,18],trim,1.1,'wood');seg([-22,y,18],[1,y,18],trim,1.5,'wood');}for(const [x,y,r]of [[-17,-4,3.8],[-17,4,3.3],[-6,0,4.7]])vase(x,y,9,r,12,'#bd885c');face([[-17,9,9],[-5,9,9],[-5,9,14],[-17,9,14]],f.color,'cloth');zones=[{x:[-18,-4],y:[-10,10],z:[9,14]}];break;
 }
 case 'dragons':{
  traveler('kobold',19,0,0,.73);for(const y of [-8,8])curve([[-27,y,2],[-6,y,2],[1,y,4],[4,y,8]],'#9c8457',2,'metal');box(-14,0,4,12,8,3,dark,'wood');crate(-17,0,7,7,'#7a6246');box(-17,0,17,7,6,2,'#ba9a56','metal');for(const y of [-5,5])seg([-24,y,17],[-10,y,17],trim,1);for(let j=0;j<10;j++)orb(-22+j%5*2.5,-3+Math.floor(j/5)*4,20,1.4,1.2,.65,'#d4b465','metal');crystal(-5,2,8,3,12,'#a19bc2');for(const y of [-6,6])curve([[-1,y,7],[9,y,7],[22,y*.7,13]],trim,.7,'cloth');face([[-24.2,-5,10],[-24.2,5,10],[-24.2,5,15],[-24.2,-5,15]],f.color,'paint');zones=[{x:[-24,-10],y:[-8,8],z:[10,12]}];break;
 }
 case 'night':{
  traveler('night',23,-3,0,.73);box(-9,0,6,15,8,3,'#443e43','wood');for(const y of [-10,10])wheel(-10,y,6,6,phase);for(const y of [-6,6])seg([-12,y,9],[27,y,13],trim,1.3,'wood');box(-9,0,9,13,7,16,'#5e5665','wood');
  face([[-24,-9,25],[6,-9,25],[6,0,34],[-24,0,34]],'#353f51','slate');face([[-24,0,34],[6,0,34],[6,9,25],[-24,9,25]],'#465166','slate');seg([-25,0,35],[7,0,35],trim,1);for(const y of [-7.2,7.2])for(const x of [-17,-1]){face([[x-3,y,14],[x+3,y,14],[x+3,y,22],[x,y,25],[x-3,y,22]],'#c2a570','glass');seg([x,y,14],[x,y,24],dark,.7);}for(const x of [-21,3])for(const y of [-7,7])seg([x,y,10],[x,y,25],trim,1.1);box(-10,8,12,5,1,4,f.color,'cloth');k.lamp(7,-9,10);zones=[{x:[-16,-4],y:[-10,10],z:[12,16]}];break;
 }
 case 'infernal':{
  traveler('imp',21,-1,0,.76);box(-10,0,6,13,8,3,dark,'metal');for(const y of [-10,10]){wheel(-11,y,6,6,phase,true);seg([-9,y,10],[25,y*.65,12],trim,1.7);}
  tube(-11,0,9,8,14,base,'metal',7,10);tube(-11,0,23,10,2,dark,'metal',10,10);tube(-11,0,25,7,9,base,'metal',3,10);tube(-11,0,34,4,3,trim,'metal');for(const y of [-7.5,7.5]){box(-11,y,12,4,1,7,'#b77c45','glow');for(const x of [-14,-11,-8])seg([x,y*1.04,11],[x,y*1.04,21],dark,1.2);}for(const x of [-23,1])curve([[x,0,9],[x,0,22],[x-3,0,29]],trim,2,'bone');for(const s of [-1,1])curve([[4,s*7,12],[11,s*5,10],[21,s*4,14]],'#b1a182',.7,'metal');face([[-19,-5,23],[-19,5,23],[-19,5,27],[-19,-5,27]],f.color,'paint');zones=[{x:[-20,-2],y:[-9,9],z:[22,25]}];break;
 }
 case 'symbiotes':{
  orb(-7,0,13,14,8,10,'#74727a','skin');M.material('fur');M.loft([[7,0,5,7,7],[8,0,17,5,5],[12,0,28,4,4],[17,0,31,6,4]],'#8d8492',14);orb(18,0,31,5,4,4,'#9c91a1','skin');for(const s of [-1,1]){orb(21,s*3,32,.9,.6,1,'#bbbed7','glow');curve([[11,s*4,23],[18,s*9,19],[24,s*9,21],[27,s*6,25]],trim,1.4,'fur');for(let j=0;j<4;j++)curve([[24,s*8,22],[27+j*.7,s*(7+j*.7),25],[29+j*.5,s*(5+j),24]],'#b9afb9',.5,'fur');}
  for(let j=0;j<14;j++){const a=j*Math.PI/7,x=-7+Math.cos(a)*12,y=Math.sin(a)*7,off=walk?Math.sin(phase+j)*2:0;curve([[x,y,16],[-12+Math.cos(a)*18,y*1.5,5],[-15+Math.cos(a)*17+off,y*2,1],[-20+Math.cos(a)*15+off,y*2.1,3]],j%3?'#b0a5b0':'#867c96',.85,'fur');}
  for(const [x,y,z,r]of [[-14,-5,23,5],[-10,4,26,5],[-1,0,26,4]]){orb(x,y,z,r,r*.8,r*1.25,'#a8ac91','skin');orb(x+1,y-1,z+2,r*.6,r*.5,r*.8,'#b5a0bd','glass');for(const s of [-1,1])curve([[x+s*r,y,z-4],[x+s*r,y,z+3],[x,y,z+r*1.3]],trim,.6,'fur');}for(let j=0;j<9;j++)curve([[-15+j*2,-6,13],[-13+j*2,-7,24],[1+j*1.4,-4,28],[14,-2,33]],'#9b8da7',.55,'fur');orb(1,-7,17,4,1.6,3,f.color,'skin');zones=[{x:[-3,5],y:[-9,9],z:[14,20]},{x:[5,11],y:[-6,6],z:[17,19]}];break;
 }
 }
 M.ownership(zones);M.finish();return true;
}
root.FractureTradeArt={building,unit,designs};
})(globalThis);
