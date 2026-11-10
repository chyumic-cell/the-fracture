'use strict';
// Purpose-built aircraft, reptilian armor and specialist insect silhouettes.
(function(root){
const names=new Set(['Broom Rider','Gunship','Siege Walker','Winged Hunter','Winged Scout','Flying Stinger','Siege Termite','Bombardier Caste']);
function render(ctx,d,f,angle,action,frame){if(!names.has(d.name))return false;
 const a=Math.round(angle/(Math.PI/4))*Math.PI/4,M=new root.FractureSpriteMesh(ctx,a,action==='dead').pose(d,action,frame),tint=root.FractureArt.tint,attack=action==='attack',phase=frame%4,t=frame*Math.PI/3,walk=action==='walk'?Math.sin(t):0,recoil=attack&&phase===2?1.5:0;
 const mat=s=>M.material(s),box=(x,y,z,w,l,h,c,m='metal')=>{mat(m);M.box(x,y,z,w,l,h,c);},orb=(x,y,z,rx,ry,rz,c,m='metal')=>{mat(m);M.orb(x,y,z,rx,ry,rz,c);},seg=(p,q,c,w=1,m='metal')=>{mat(m);M.seg(p,q,c,w);},face=(v,c,m='metal')=>{mat(m);M.face(v,c);};
 const spine=(rings,c,m='metal',n=12)=>{mat(m);M.rings(rings.map(([x,y,z,ry,rz])=>Array.from({length:n},(_,i)=>[x,y+Math.cos(i*2*Math.PI/n)*ry,z+Math.sin(i*2*Math.PI/n)*rz])),c,true);};
 const tube=(points,radii,c,m='metal',n=8)=>{mat(m);const rings=points.map((p,k)=>{const prev=points[Math.max(0,k-1)],next=points[Math.min(points.length-1,k+1)],dir=next.map((q,i)=>q-prev[i]),len=Math.hypot(...dir)||1;dir.forEach((v,i)=>dir[i]=v/len);let u=Math.abs(dir[2])>.9?[1,0,0]:[-dir[1],dir[0],0],ul=Math.hypot(...u)||1;u=u.map(v=>v/ul);const v=[dir[1]*u[2]-dir[2]*u[1],dir[2]*u[0]-dir[0]*u[2],dir[0]*u[1]-dir[1]*u[0]];return Array.from({length:n},(_,j)=>p.map((q,i)=>q+(u[i]*Math.cos(j*2*Math.PI/n)+v[i]*Math.sin(j*2*Math.PI/n))*radii[k]));});M.rings(rings,c,true);};
 const lens=(x,y,z,r,c)=>{orb(x,y,z,r,.7,r,'#182b30');orb(x,y+.45,z,r*.65,.45,r*.65,c,'glass');};
 const port=(p,axis,r)=>{orb(...p,axis==='x'?.3:r,axis==='y'?.3:r,axis==='z'?.3:r,'#142629','paint');};
 const armor=(x,y,z,w,l,h,c)=>{const v=[[-w,-l,0],[w,-l,0],[w,l,0],[-w,l,0],[-w*.8,-l*.7,h],[w*.72,-l*.7,h],[w*.72,l*.7,h],[-w*.8,l*.7,h]].map(q=>[x+q[0],y+q[1],z+q[2]]);for(const faceIds of [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])face(faceIds.map(i=>v[i]),c);};
 if(d.name==='Broom Rider'){
  // A seated airborne rider: knees bend around the broom, never a walking skeleton.
  const cloth='#514c72',trim='#a19573',skin='#be9877',lean=action==='walk'?2:0,flutter=Math.sin(t)*1.3;
  M.motion={bob:action==='dead'?0:Math.sin(t)*.55,shift:0,lean:0,sway:0};
  tube([[-28,0,12],[-9,0,14],[13,0,14.5],[25,0,16]],[1.1,1.2,1,.65],'#8a7050','wood');
  spine([[-30,0,10,4.7,3.2],[-26,0,11,4.3,3],[-18,0,13,2.2,1.9],[-15,0,14,1,1]],'#a38d5a','wood');
  for(let j=-4;j<=4;j++)seg([-17,j*.3,13],[-31-(j%2),j*1.1,9.5+(j%3)*.6],j%2?'#bdab70':'#7e6d49',.6,'wood');
  for(const x of [-18,-17,-16]){mat('cloth');M.loft([[x,0,12,1.1,2.4],[x,0,14.6,1.1,2.4]],'#625b46',8);}
  for(const side of [-1,1]){
   tube([[-3,side*3,17],[8,side*6,12],[3,side*6.8,5]],[2.8,2.3,1.5],tint(cloth,-13),'cloth');
   spine([[1,side*6.8,4.5,1.6,1.9],[5,side*6.8,3.5,1.8,1.4],[9,side*6.8,3.3,.8,.7]],'#3e403e','cloth');
   mat('cloth');M.loft([[-5,side*2.2,15,4,2.8],[0,side*3.5,18,4.1,3]],cloth,10);
  }
  mat('cloth');M.loft([[-3,0,16,4,4],[-2+lean,0,23,3.4,4],[lean,0,31,4,5],[1+lean,0,34,2.2,2.4]],cloth,12);
  // A folded cape follows flight, with an open underside exposing the bent legs.
  for(const side of [-1,1]){face([[-3+lean,0,32],[-3+lean,side*5,31],[-19,side*(6+flutter*.2),13+flutter],[-23,0,14]],tint(cloth,side<0?-12:7),'cloth');seg([-3+lean,side*4,31],[-19,side*5,14+flutter],trim,.6,'cloth');}
  const head=[3+lean,0,38];orb(...head,2.8,2.6,3.6,skin,'skin');orb(head[0]+2.8,0,37.3,1.05,.9,1.15,skin,'skin');
  for(const side of [-1,1]){orb(head[0]+2,side*1.8,38.2,.35,.4,.3,'#30322d','skin');tube([[head[0]-1,side*2,39],[head[0]-3,side*2.7,35],[head[0]-4,side*3,32]],[1.3,1.2,.5],'#807565','cloth');}
  mat('cloth');M.loft([[head[0]-.5,0,39.7,5.6,4.8],[head[0]-.5,0,40.4,5.6,4.8]],tint(cloth,-8),16);
  M.loft([[head[0]-.6,0,40.3,3.3,3],[head[0]-1,0,45,2.5,2.3],[head[0]-2,0,49,1.2,1.1],[head[0]-4,0,51,.2,.2]],cloth,12);
  M.loft([[head[0]-.6,0,40.5,3.35,3.05],[head[0]-.7,0,41.6,3.15,2.85]],trim,12);
  for(const side of [-1,1]){
   const casting=attack&&side===1,hand=casting?[[10,6,26],[7,6,32],[20,5,29],[15,6,26]][phase]:[14,side*1.4,15.7],elbow=casting?[5+lean,7,29]:[9+lean,side*5,23];
   tube([[lean,side*4.5,30],elbow,hand],[2.2,1.8,1.1],cloth,'cloth');orb(...hand,1.2,1.1,1.35,skin,'skin');
   if(casting){orb(hand[0]+2,hand[1],hand[2]+1,phase===2?2:1.2,1.3,1.7,'#b0a5d6','glow');if(phase===2)ctx.canvas.weaponMuzzle={x:hand[0]+2,y:hand[1],z:hand[2]+1};}
  }
 }else if(d.name==='Gunship'){
  // A narrow tandem-cockpit fuselage, long tail boom, rotor mast and skids: no aeroplane wing planform.
  const hull='#657d79',edge='#9ba99b',dark='#293d44';
  spine([[-14,0,13,3,4],[-9,0,13,6.2,6],[0,0,12.5,6.5,6.6],[10,0,12,4.9,5.5],[19,0,9.5,1.5,2.4]],hull);
  spine([[4,0,17,4.5,3.5],[10,0,16,4.1,4],[16,0,12.5,2.9,3],[18,0,10.5,1.1,1.3]],dark,'glass');
  for(const side of [-1,1]){seg([4,side*4.5,17],[10,side*4.2,19],edge,.7);seg([10,side*4.2,19],[16,side*2.9,14],edge,.65);seg([10,side*4.2,19],[10,side*4.8,13],edge,.7);seg([2,side*5.8,12],[2,side*5.5,18],hull,.8);}
  spine([[-11,0,15,3,3],[-24,0,17,1.7,2],[-35,0,18.5,.85,1.1]],hull);
  face([[-35,-.7,17],[-37,-.7,27],[-31,-.7,24],[-30,-.7,17]],hull);face([[-35,.7,17],[-30,.7,17],[-31,.7,24],[-37,.7,27]],edge);
  for(const side of [-1,1])face([[-27,side,17],[-32,side*9,16],[-28,side*9,16],[-24,side,17]],hull);
  // Tail rotor turns in a vertical plane, separate from the main rotor.
  seg([-34,-2,21],[-34,3,21],edge,1.4);for(let j=0;j<4;j++){const r=t*2.2+j*Math.PI*.5,p=[-34+Math.cos(r)*5,3,21+Math.sin(r)*5];seg([-34,3,21],p,dark,1.15);}orb(-34,3.3,21,1.1,.5,1.1,edge);
  box(-5,0,18,7,4.5,4,hull);for(const side of [-1,1]){spine([[-12,side*3,20,1.8,1.8],[-3,side*3,20,1.8,1.8]],dark);port([-12.3,side*3,20],'x',1.5);for(let j=0;j<4;j++)seg([-8+j*1.8,side*4.8,19],[-8+j*1.8,side*4.8,22],edge,.5);}
  seg([-3,0,20],[-3,0,29],edge,1.7);orb(-3,0,28.5,3,3,1.3,dark);
  for(let j=0;j<4;j++){const r=t*2.5+j*Math.PI*.5,co=Math.cos(r),si=Math.sin(r),v=[-si,co];face([[-3+co*3+v[0],si*3+v[1],29],[-3+co*32+v[0]*1.6,si*32+v[1]*1.6,28.2],[-3+co*32-v[0]*.5,si*32-v[1]*.5,28.2],[-3+co*3-v[0]*.5,si*3-v[1]*.5,29]],j%2?dark:'#576b69');}
  for(const side of [-1,1]){seg([-8,side*4,8],[-9,side*7,3],edge,1.2);seg([8,side*4,7],[8,side*7,3],edge,1.2);tube([[-14,side*7,3],[10,side*7,3],[15,side*7,5]],[1,1,.65],dark);face([[-5,side*5,12],[4,side*5,11],[5,side*15,10],[-1,side*15,10]],hull);spine([[0,side*15,9,2.8,2.8],[18,side*15,9,2.8,2.8]],dark);port([18.2,side*15,9],'x',2.2);for(let j=-1;j<=1;j++)orb(18.4,side*15+j*1.1,9,.2,.4,.45,'#9fa988');}
  orb(13,0,7,2.6,2.6,2,dark);seg([13,0,7],[24-recoil,0,6],dark,1.3);lens(14,3,8,1,'#79b9c0');
 }else if(d.name==='Siege Walker'){
  const base='#6c7c5d',edge='#b1ac83',dark='#344442',scale='#83915d';
  // Two massive reverse-jointed legs carry a low armored casemate. No insect stance.
  for(const side of [-1,1]){const gait=action==='walk'?root.FractureMotion.step(frame,side<0?.5:0,5):{x:0,lift:0},stride=gait.x,hip=[-3,side*8,20],knee=[3+stride,side*10,12+gait.lift*.5],ankle=[-4+stride*.5,side*10,5+gait.lift];orb(...hip,3,2.4,3,edge);seg(hip,knee,dark,5.5);armor(1+stride*.5,side*10,12,5,3.2,7,base);seg(knee,ankle,edge,3.2);seg([-6,side*9,19],[-5+stride*.5,side*10,7],dark,1.8);armor(ankle[0]+2,side*10,1+gait.lift,8,4.2,4,base);for(let j=-1;j<=1;j++)box(ankle[0]+7,side*10+j*2,1+gait.lift,3,1,2,edge);}
  armor(-5,0,19,15,11,9,base);armor(-8,0,28,11,8,7,scale);for(const side of [-1,1]){armor(-1,side*11,21,12,3,6,dark);for(let j=0;j<4;j++){const x=-14+j*6;face([[x,side*11,26],[x+5,side*11,26],[x+3,side*13,21],[x-2,side*13,21]],j%2?base:edge);}}box(-9,0,35,7,5,2,dark);for(let j=-2;j<=2;j++)seg([-14,j*1.8,37],[-5,j*1.8,37],edge,.65);
  seg([1,0,30],[24-recoil,0,30],base,5);seg([22-recoil,0,30],[35,0,30],edge,3.2);box(31,0,28.3,4,2.7,3.4,dark);port([35.2,0,30],'x',1.5);seg([0,4,29],[23,4,29],dark,1.7);seg([0,-4,29],[23,-4,29],dark,1.7);
  // Reptilian crest plates and bronze scale trims establish its builder, without making it an animal.
  for(let j=0;j<4;j++)face([[-15+j*4,-1,35],[-17+j*4,0,41-j*.5],[-12+j*4,1,35]],edge);lens(-1,7,33,2,'#d6cb73');seg([-15,-7,29],[-15,-7,43],dark,.6);
 }else if(d.name==='Winged Hunter'){
  const hull='#697c57',trim='#b3ad78',dark='#283c3b';
  // Reptilian single-pilot pursuit skiff, twin ducted lift engines, armored bio-weapon prow.
  spine([[-19,0,12,2,2],[-13,0,11,6,4],[2,0,10,6,4.5],[15,0,11,4.5,3],[24,0,12,1.8,1.5]],hull);
  for(const side of [-1,1]){seg([-10,side*4,11],[-6,side*15,11],trim,2);seg([7,side*4,11],[4,side*15,11],trim,2);mat('metal');M.cylinder(-3,side*16,9,8,4,hull,18);M.cylinder(-3,side*16,13,6,1,dark,18);for(let j=0;j<5;j++){const r=t*2.7+j*Math.PI*2/5;seg([-3,side*16,14],[-3+Math.cos(r)*5.6,side*16+Math.sin(r)*5.6,14],trim,.8);}orb(-3,side*16,14,1.5,1.5,.7,trim);face([[-15,side*3,13],[-23,side*9,20],[-24,side*6,13],[-18,side*3,11]],hull);}
  // Open cockpit: actual scaled pilot with muzzle, eyes and head crest.
  box(-5,0,14,4,4,2,dark);orb(-6,0,20,3.6,3.2,5,'#55634f','cloth');orb(-4,0,25,3,2.8,3.2,'#94a66f','skin');spine([[-3,0,24.5,2,1.5],[2,0,24,1.3,1]],'#a9b47b','skin');for(const side of [-1,1]){orb(-2,side*2.6,25,1,.55,.6,'#283d2f','skin');orb(-1.7,side*2.8,25,.35,.3,.35,'#dbd18b','glow');seg([-5,side*3,20],[1,side*4,18],'#839364',2,'skin');seg([1,side*4,18],[5,side*3,19],'#a7ad79',1.5,'skin');}for(let j=0;j<3;j++)face([[-6+j,0,27],[-8+j,0,31-j*.5],[-4+j,0,27]],trim,'bone');face([[3,-5,16],[7,-4,23],[7,4,23],[3,5,16]],'#538478','glass');seg([7,-4,23],[7,4,23],trim,.6);
  // Twin upward-reaching venom conduits lead to the existing acid muzzle.
  for(const side of [-1,1]){tube([[8,side*3,12],[15,side*3,19],[22,side*2,30],[26,side*.8,32]],[2.4,2,1.6,1.1],hull);orb(13,side*4,15,3,2.5,4,'#8aa763','chitin');}port([26.2,0,32],'x',1.4);for(let j=0;j<4;j++)armor(-15+j*5,0,13,3,6,2,hull);lens(18,3,13,1,'#d5c879');
 }else{
  const scout=d.name==='Winged Scout',stinger=d.name==='Flying Stinger',siege=d.name==='Siege Termite',bomber=d.name==='Bombardier Caste',air=scout||stinger,col=scout?'#9f955c':stinger?'#9e6b38':siege?'#9f8655':'#66583f',edge=scout?'#c7c793':stinger?'#d2a362':'#c0ad7a',dark='#3a382a';
  const shell=(x,y,z,rx,ry,rz,c)=>{orb(x,y,z,rx,ry,rz,c,'chitin');for(let j=-1;j<=1;j++){const yy=y+j*ry*.48,zz=z+rz*Math.sqrt(1-j*j*.23);seg([x-rx*.6,yy,zz*.98],[x+rx*.6,yy,zz],tint(c,17),.45,'chitin');}};
  const leg=(x,y,z,side,j)=>{const gait=action==='walk'?root.FractureMotion.step(frame,(side<0?.5:0)+(j%2?.5:0),4):{x:0,lift:0},stride=gait.x,p=[x,side*y,z],q=[x-3+stride,side*(y+5),z*.5],r=[x+2+stride,side*(y+9),air?4:1+gait.lift];tube([p,q,r],[air?1.2:2,air?.8:1.3,.3],col,'chitin');};
  if(scout){
   spine([[-25,0,13,1,.8],[-18,0,15,1.7,1.6],[-8,0,18,2.6,2.1],[0,0,20,3.4,3]],col,'chitin');for(let j=0;j<6;j++)orb(-24+j*4,0,14+j*.9,1,1.8,1.6,j%2?col:dark,'chitin');shell(4,0,20,5,4,4,col);shell(12,0,21,4,5.5,3,edge);for(const side of [-1,1]){orb(13,side*4.2,22,2.2,2,2,'#65897c','glass');tube([[12,side*3,23],[17,side*5,29],[23,side*8,31]],[.5,.3,.1],edge,'chitin');for(let j=0;j<3;j++)leg(1+j*4,2.5,18,side,j);}
   for(const side of [-1,1])for(let row=0;row<2;row++){const x=row?1:7,flap=Math.sin(t+row*.7)*5,tip=[x-5,side*(row?26:31),24+flap];face([[x,side*3,21],[x+6,side*15,25+flap],tip,[x-12,side*18,20+flap*.4]],row?'#aab99e':'#b8c7b1','glass');seg([x,side*3,21],tip,'#c2c8a2',.65,'chitin');for(let j=1;j<4;j++)seg([x,side*3,21],[x-8+j*2,side*(12+j*4),23+flap*.6],edge,.3,'chitin');}tube([[14,0,20],[19,0,20]],[1.2,.4],col,'chitin');
  }else if(stinger){
   spine([[-21,0,10,1,1],[-17,0,14,4,5],[-10,0,18,7,7],[-4,0,20,6,5]],col,'chitin');for(let j=0;j<4;j++){const x=-18+j*4;orb(x,0,14+j*1.4,2,4.5+j*.6,4.4+j*.4,j%2?dark:col,'chitin');}shell(3,0,22,6.5,5.5,5,dark);shell(12,0,21,5,3.6,4,col);for(const side of [-1,1]){orb(14,side*3,22,1.3,.8,1.2,'#d6c277','glass');tube([[14,side*2,25],[16,side*4,29],[13,side*7,30]],[.7,.5,.15],dark,'chitin');for(let j=0;j<3;j++)leg(-5+j*6,4,17,side,j);const flap=Math.sin(t)*7;face([[3,side*4,25],[3,side*15,32+flap],[-13,side*26,30+flap],[-22,side*18,22],[-7,side*5,21]],'#bcaa80','glass');seg([3,side*4,25],[-13,side*26,30+flap],edge,1.2,'chitin');for(let j=0;j<3;j++)seg([3,side*4,25],[-21+j*5,side*(18+j*2),23+j*3+flap*.6],edge,.5,'chitin');}
   // The hooked abdominal stinger curls underneath and points forward when firing.
   tube([[-19,0,13],[-24,0,7],[-13,0,4],[2,0,7],[12,0,15],[19,0,20]],[2.2,1.8,1.2,1.1,.8,.1],edge,'bone');
  }else if(siege){
   for(const side of [-1,1])for(let j=0;j<3;j++)leg(-14+j*12,7,13,side,j);spine([[-24,0,12,3,3],[-16,0,14,11,9],[0,0,15,12,10],[12,0,14,9,7],[20,0,11,5,3]],col,'chitin');for(let j=0;j<4;j++){const x=-17+j*8;shell(x,0,20,6,11-j*.8,5,tint(col,j%2?12:-8));}for(const side of [-1,1])tube([[14,side*5,12],[24,side*10,8],[29,side*5,5]],[2.5,2,.3],edge,'bone');
   tube([[-13,0,21],[-4,0,27],[9,0,27],[18,0,26]],[5.2,4.3,3.3,2.4],tint(col,-15),'chitin');port([18.3,0,26],'x',1.9);for(const side of [-1,1])orb(10,side*8,16,1.5,.8,1,'#c6c78a','glass');
  }else if(bomber){
   for(const side of [-1,1])for(let j=0;j<3;j++)leg(-12+j*9,6,11,side,j);shell(-5,0,12,20,10,9,col);shell(14,0,12,6,7,5,col);for(const side of [-1,1]){shell(-11,side*7,23,10,7,13,side<0?'#96805b':'#9d9160');for(let j=0;j<4;j++)seg([-17+j*4,side*8,29],[-16+j*4,side*11,25],edge,.65,'chitin');tube([[-10,side*7,23],[-6,side*7,31],[0,side*5,37],[4,side*4,38]],[3.5,3,2.4,2.1],tint(col,13),'chitin');port([4.2,side*4,38],'x',1.65);orb(16,side*5,14,1.5,.7,1.5,'#cebc6c','glass');tube([[18,side*4,12],[24,side*6,10],[25,side*2,9]],[1.2,.7,.1],edge,'bone');}
  }
 }
 M.finish();return true;
}
root.FractureSpecialistArt={render};
})(globalThis);
