'use strict';
// Imperial reptilian infantry: black riot armour over grey-green fatigues, built on the shared mesh rig.
// Only 'paint' surfaces take the owner's colour, so the tactical palette survives every player colour.
(function(root){
const roster={'Skink Scout':'scout',Legionnaire:'blade','Venom Rifleman':'rifle','Shock Guard':'gunner',Subjugator:'binder','Imperial Guard':'guard'};
const C={fat:'#5d6754',fatD:'#4d5646',cape:'#414b3c',capeD:'#323a2f',plate:'#1d2123',plateL:'#343a3f',plateD:'#121416',edge:'#59636a',strap:'#2a2f32',glove:'#1d2022',boot:'#16181a',visor:'#3f6568',visorL:'#b4d6d7',skin:'#86a352',skinD:'#66803c',mouth:'#28301f',tooth:'#ddd6bb',eye:'#c49a3a',team:'#a8a8a8',steel:'#9aa4a8',glass:'#a4c6c9',venom:'#8cb446',psi:'#86d3c8'};
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);},lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function render(ctx,d,f,angle,action,frame){
 const type=roster[d.name];
 if(!type||d.faction!=='reptilians'||d.campaignEmperor||d.air||d.naval)return false;
 const M=new root.FractureSpriteMesh(ctx,Math.round(angle/(Math.PI/4))*Math.PI/4,action==='dead').pose(d,action,frame);
 const tint=root.FractureArt.tint,use=m=>M.material(m);
 const box=(x,y,z,w,l,h,c,m='metal')=>{use(m);M.box(x,y,z,w,l,h,c);};
 const tube=(a,b,w,c,m='metal')=>{use(m);M.seg(a,b,c,w);};
 const orb=(p,rx,ry,rz,c,m='metal')=>{use(m);M.orb(p[0],p[1],p[2],rx,ry,rz,c);};
 const face=(v,c,m='metal')=>{use(m);M.face(v,c);};
 const loft=(r,c,m='cloth',sides=16)=>{use(m);M.loft(r,c,sides);};
 const wedge=(a,b,wa,ha,wb,hb,c,m='metal')=>{use(m);M.wedge(a,b,wa,ha,wb,hb,c);};
 const limb=(a,b,w,c,m='cloth')=>{
  const delta=sub(b,a),axis=nrm(delta),raw=Math.abs(axis[2])>.9?[1,0,0]:[-axis[1],axis[0],0],u=nrm(raw),v=cross(axis,u),radius=w*.55;
  const rings=[[0,.8],[.2,1.12],[.46,1.04],[.75,.8],[1,.59]].map(([t,r])=>Array.from({length:14},(_,j)=>{const an=j*Math.PI/7;return a.map((q,i)=>q+delta[i]*t+radius*r*(u[i]*Math.cos(an)+v[i]*Math.sin(an)));}));
  use(m);M.rings(rings,c,true);
 };
 // A curved armour plate wrapped around part of a limb, facing a chosen direction.
 const shell=(a,b,r0,r1,facing,arc,c,depth=.74)=>{
  const ax=nrm(sub(b,a));let u=sub(facing,mul(ax,dot(facing,ax)));if(Math.hypot(...u)<.05)u=Math.abs(ax[2])>.9?[1,0,0]:[-ax[1],ax[0],0];u=nrm(u);const v=cross(ax,u),n=6;
  const ring=(p,r)=>{const out=[],inn=[];for(let i=0;i<=n;i++){const t=-arc/2+arc*i/n,dir=add(mul(u,Math.cos(t)),mul(v,Math.sin(t)));out.push(add(p,mul(dir,r)));inn.unshift(add(p,mul(dir,r*depth)));}return out.concat(inn);};
  use('metal');M.rings([ring(a,r0),ring(lerp(a,b,.5),(r0+r1)*.52),ring(b,r1)],c);
 };
 const band=(cx,z,rx,ry,t0,t1,c,wd=.42,m='cloth',n=7)=>{for(let i=0;i<n;i++){const a=t0+(t1-t0)*i/n,b=t0+(t1-t0)*(i+1)/n;tube([cx+Math.cos(a)*rx,Math.sin(a)*ry,z],[cx+Math.cos(b)*rx,Math.sin(b)*ry,z],wd,c,m);}};

 const moving=action==='walk'||action==='walkReady',ready=action==='ready'||action==='walkReady',attack=action==='attack',alert=ready||attack,gesture=['scratch','yawn'].includes(action),phase=frame%4,melee=d.range<2;
 const heavy=type==='gunner',elite=type==='guard'||type==='binder',light=type==='scout',shielded=type==='blade'||type==='guard',gun=['rifle','gunner','guard'].includes(type);
 const w=heavy?1.14:elite?1.07:light?.9:1,scale=.83;
 M.part={origin:[0,0,0],scale};
 M.ownership([{x:[-40,40],y:[-40,40],z:[-5,90]}],['paint']);
 const shift=attack&&melee?[-1,-4,5,1.5][phase]:attack?[-.5,-1.5,1,.5][phase]:0;

 // Legs: fatigues under thigh plates, articulated knee cups, shin guards and laced boots.
 for(const side of [-1,1]){
  const gait=moving?root.FractureMotion.step(frame,side<0?.5:0,8.2):{x:attack&&melee?(side>0?3:-2):side>0?1.6:-1.6,lift:0},g=gait.lift;
  const hip=[-.7,side*3.5,26],knee=[1-gait.x*.32,side*3.9,14.2+g*.4],ankle=[gait.x,side*4.3,3+g];
  limb(hip,knee,6.4*w,C.fat);limb(knee,ankle,4.9,C.fatD);
  if(!light){shell(lerp(hip,knee,.16),lerp(hip,knee,.8),4.3*w,3.55,[1,side*.35,0],2.5,C.plate);tube(lerp(hip,knee,.25).map((q,i)=>q+[-1,side*3.4,0][i]),lerp(hip,knee,.25).map((q,i)=>q+[3,side*2.6,0][i]),.6,C.strap,'cloth');}
  else box(hip[0]-.2,side*5.4,18.5,1.3,1,3.2,C.plateD);
  orb(add(knee,[1.9,0,.2]),2.25,2.45,2.55,C.plateL);tube(add(knee,[1.2,-2.4,0]),add(knee,[1.2,2.4,0]),.55,C.strap,'cloth');
  shell(lerp(knee,ankle,.14),lerp(knee,ankle,.86),3.35,2.65,[1,side*.2,0],2.6,C.plate);
  tube(add(lerp(knee,ankle,.18),[3.2,0,0]),add(lerp(knee,ankle,.8),[2.5,0,0]),.5,C.edge);
  loft([[ankle[0]+1.4,ankle[1],g,3.8,2.6],[ankle[0]+1.4,ankle[1],.8+g,3.8,2.6]],C.plateD,'cloth',12);
  loft([[ankle[0]+1.4,ankle[1],.8+g,3.6,2.4],[ankle[0]+1.6,ankle[1],2.4+g,3.7,2.4],[ankle[0]-.1,ankle[1],4.3+g,2.3,2.1]],C.boot,'chitin',12);
  tube([ankle[0]-.6,ankle[1],3+g],[ankle[0]-.3,ankle[1],8.2+g],2.8,C.boot,'chitin');
 }
 // The tail is the one part left bare, scaled plate by plate.
 const sway=moving?Math.sin(frame*Math.PI/3)*1.6:0,tail=[[-3,0,22.5],[-9,sway*.4,13],[-16,1.5+sway,6.5],[-24,3+sway*1.4,3]],tr=[2.9,2.3,1.5,.7];
 for(let j=0;j<3;j++)limb(tail[j],tail[j+1],5.2-j*1.55,C.skin,'chitin');
 use('chitin');M.pelt(tail.map((p,i)=>[...p,tr[i],tr[i]]),C.skin,{rows:12,cols:10,flow:1,lift:.26,grow:.06,shade:8,narrow:1.4,seed:13});

 // Trunk: fatigues, then a hard plate carrier with MOLLE rows, magazine pouches and a gorget.
 loft([[-.8,0,23.5,3.7,4.9],[-.8,0,27.5,3.9,5.1],[-.3,0,31,3.2,4.2],[shift-.1,0,35,4.3*w,5.8*w],[shift-.2,0,38.5,5*w,6.6*w],[shift-.3,0,41.8,4.3*w,6.1*w],[shift-.2,0,44.4,2.4,3.2]],C.fat,'cloth',20);
 const pc=light?.93:1,cs=[[30.2,4.3*pc,5.3*pc],[33,5*w*pc,6*w*pc],[37.5,5.9*w*pc,7.1*w*pc],[41,5.5*w*pc,6.8*w*pc],[43.3,3.5,4.7]];
 const at=z=>{for(let i=0;i<cs.length-1;i++)if(z<=cs[i+1][0]){const t=Math.max(0,(z-cs[i][0])/(cs[i+1][0]-cs[i][0]));return[cs[i][1]+(cs[i+1][1]-cs[i][1])*t,cs[i][2]+(cs[i+1][2]-cs[i][2])*t];}return cs.at(-1).slice(1);};
 const front=(z,y)=>{const [rx,ry]=at(z),s=Math.max(-.95,Math.min(.95,y/ry));return shift+rx*Math.sqrt(1-s*s);};
 loft(cs.map(([z,rx,ry],i)=>[shift-(i===4?.2:0),0,z,rx,ry]),C.plate,'metal',light?10:8);
 for(const z of [32.6,34.4,36.2]){const [rx,ry]=at(z);band(shift,z,rx+.12,ry+.12,-.85,.85,C.plateL,.42,'cloth',6);}
 for(const side of [-1,1])tube([front(31,side*3.2)+.15,side*3.2,31],[front(40.5,side*4)+.15,side*4,40.5],.4,C.plateD);
 for(const y of [-2.7,0,2.7].map(q=>q*w*pc)){const x=front(32.5,y)+.55;box(x,y,30.7,.95,1.15,3.9,C.plateD);box(x+.1,y,34.3,1.1,1.3,.65,C.plateL);}
 box(front(39,0)+.15,0,37.9,.5,2.4,2.6,C.plateL);
 for(const side of [-1,1]){tube([shift+3.8,side*3.9,42.9],[shift,side*4.9,44.6],1.4,C.plate);tube([shift,side*4.9,44.6],[shift-3.8,side*3.9,42.9],1.4,C.plate);}
 loft([[shift-.4,0,43.4,3.6,4.5],[shift-.6,0,45.4,3.2,3.8],[shift-.8,0,47,2.6,3]],C.plateL,'metal',10);
 // War belt with buckle, hip pouches and a hanging groin guard.
 loft([[-.5,0,26.6,4.35,5.6],[-.3,0,28.6,4.1,5.3]],C.plate,'metal',14);box(3.95,0,27,.35,1.2,1.5,C.steel);
 for(const side of [-1,1]){box(-.4,side*5.7,23.6,1.7,1,3.6,C.plateD);box(-.4,side*5.75,27,1.8,1.1,.6,C.plateL);box(-4.2,side*3.3,24.2,1,1.4,3.4,C.plateD);}
 if(!light)wedge([3.9,0,26.6],[4.5,0,20.4],2.7,.45,2,.4,C.plate);

 // Arms: fatigue sleeves under segmented pauldrons, elbow pads, forearm guards and gloves.
 const hands=[];
 for(const side of [-1,1]){
  let hand;
  if(type==='guard')hand=side>0?(alert?[11,4,38]:[8,5,31]):[8,-11,32];
  else if(gun)hand=[side>0?10:20,4,alert?(heavy?35:37):(heavy?29:30)];
  else if(type==='blade')hand=side>0&&alert?[[10,8,35],[-11,9,52],[26,4,24],[13,7,36]][ready?0:phase]:side>0?[3,10,28]:[8,-11,32];
  else hand=side>0&&alert?[10,7,38]:[3,side*10,28];
  if(side<0&&shielded)hand=[8,-11,32];
  if(gesture&&side<0&&!shielded){const amount=[.35,1,1,.35][phase],target=[shift+7,-1.5,action==='yawn'?48:50];hand=hand.map((v,i)=>v+(target[i]-v)*amount);}
  const sh=[shift,side*7.3*w,41.8],elbow=[(sh[0]+hand[0])*.45-2,side*(8.9*w+Math.abs(hand[1])*.12),(sh[2]+hand[2])*.5-3.8];
  limb(sh,elbow,5.8*w,C.fat);limb(elbow,hand,4.5,C.fatD);
  const v=nrm(sub(elbow,sh)),out=[0,side,0];
  if(!light){
   const u=[1,0,0];let cr=cross(v,u);if(dot(cr,out)<0)cr=mul(cr,-1);cr=nrm(cr);
   orb(add(sh,[0,side*.9,1.3]),3.2*w,2.9*w,2.3,C.plate);
   for(let j=0;j<(heavy||elite?3:2);j++){
    const center=add(sh,mul(v,j*1.65+.4)),radius=(heavy?3.5:elite?3.25:3)-j*.15;
    const pts=Array.from({length:7},(_,k)=>{const t=-Math.PI*.12+k*Math.PI*1.24/6;return add(center,add(mul(u,radius*Math.cos(t)),mul(cr,radius*Math.sin(t))));}),low=pts.map(q=>add(q,mul(v,1.9)));
    for(let k=0;k<6;k++){face([pts[k],pts[k+1],low[k+1],low[k]],j%2?C.plateL:C.plate);tube(low[k],low[k+1],.32,C.edge);}
   }
  }else orb(add(sh,[0,side*.6,.8]),2.4,2.2,1.6,C.plate);
  // Owner flash on the outside of the sleeve.
  const mid=lerp(sh,elbow,light?.42:.62);let o=sub(out,mul(v,dot(out,v)));o=nrm(o);const t2=nrm(cross(v,o)),r=5.8*w*.55*1.06+.1;
  const pc0=add(mid,mul(o,r));face([add(pc0,add(mul(v,-1.3),mul(t2,-1.2))),add(pc0,add(mul(v,-1.3),mul(t2,1.2))),add(pc0,add(mul(v,1.3),mul(t2,1.2))),add(pc0,add(mul(v,1.3),mul(t2,-1.2)))],C.team,'paint');
  orb(add(elbow,[-.3,side*.5,0]),2.1,2.1,2.2,C.plateL);
  shell(lerp(elbow,hand,.12),lerp(elbow,hand,.78),3,2.55,[0,side,.7],2.7,C.plate);
  orb(hand,1.6,1.45,1.85,C.glove,'chitin');orb(add(hand,[.6,0,.9]),.9,1.1,.6,C.plateL);
  for(let j=0;j<3;j++)tube([hand[0]+.8,hand[1]-1+j*.8,hand[2]+.2],[hand[0]+1.8,hand[1]-1+j*.8,hand[2]-1.2],.55,C.glove,'chitin');
  hands.push(hand);
 }

 // Head: snout and jaw emerge beneath a full ballistic helmet and visor.
 const hx=shift+.8;
 loft([[hx,0,44,2.3,2.5],[hx+.6,0,48.5,2.6,2.7]],C.skin,'skin',12);
 orb([hx,0,52.2],3.3,3.2,3.4,C.skin,'skin');
 wedge([hx+1.4,0,50.3],[hx+10.2,0,49.3],2.6,1.8,1.3,1,C.skin,'skin');
 wedge([hx+1.4,0,48.4],[hx+9.2,0,48],2.3,.85,1.05,.5,C.skinD,'skin');
 for(const side of [-1,1]){
  tube([hx+2.2,side*2.2,48.9],[hx+9.6,side*1.15,48.6],.34,C.mouth,'skin');
  for(let k=0;k<4;k++)tube([hx+3.6+k*1.5,side*(2-k*.22),48.8],[hx+3.7+k*1.5,side*(1.95-k*.22),48.1],.3,C.tooth,'bone');
  orb([hx+10,side*.7,50.2],.32,.38,.32,C.mouth,'skin');
 }
 use('skin');M.pelt([[hx+1.8,0,50.3,2.2,1.6],[hx+6,0,49.9,1.8,1.3],[hx+10,0,49.4,1.2,.9]],C.skin,{rows:6,cols:8,flow:1,lift:.16,grow:.04,shade:7,narrow:1.3,seed:29,arc:Math.PI,start:0});
 loft([[hx-.9,0,50.2,4.5,4.6],[hx-.7,0,52.6,5.1,5.05],[hx-.9,0,55.4,4.95,4.85],[hx-1.3,0,57.6,3.95,3.9],[hx-1.9,0,59,2.1,2.2]],C.plate,'metal',16);
 const riotVisor=type==='blade',vTop=55.6,vBot=riotVisor?50.3:51.3,rTop=5.25,rBot=riotVisor?6.5:5.65,cx=hx-.8;
 const vp=(t,z,r)=>[cx+Math.cos(t)*r,Math.sin(t)*r,z];
 for(let k=0;k<6;k++){const t0=-1.15+k*2.3/6,t1=t0+2.3/6;face([vp(t0,vTop,rTop),vp(t1,vTop,rTop),vp(t1,vBot,rBot),vp(t0,vBot,rBot)],k%2?C.visor:tint(C.visor,-8),'glass');tube(vp(t0,vTop,rTop+.1),vp(t1,vTop,rTop+.1),.55,C.plateD);tube(vp(t0,vBot,rBot+.05),vp(t1,vBot,rBot+.05),.45,C.plateD);}
 tube(vp(-.55,vTop-.6,rTop+.25),vp(-.1,vBot+.8,rBot+.15),.35,C.visorL,'glass');
 for(const side of [-1,1]){
  orb(vp(side*1.25,53.4,rTop+.2),.7,.7,.7,C.plateL);
  orb([cx+Math.cos(side*.3)*(rTop+.35),side*1.55,53.4],.32,.55,.28,C.eye,'glow');
  orb([hx-1,side*5,52.3],1.7,.95,2.1,C.plateL);
  tube([hx+2,side*4.75,54.6],[hx-4,side*4.65,54.4],.5,C.edge);
  if(heavy)face([[hx+3,side*4.3,51],[hx+5.4,side*3,49.4],[hx+4.6,side*3.4,47.8],[hx+2,side*4.4,49]],C.plate);
 }
 box(hx+3.9,0,55.3,.55,.9,1.3,C.plateL);
 if(!light)wedge([hx-4.6,0,52],[hx-6.3,0,47.2],3.9,.45,3.6,.45,C.plateD);
 tube([hx+3.2,0,57],[hx-1.3,0,59.2],.95,C.team,'paint');tube([hx-1.3,0,59.2],[hx-5.4,0,57.1],.95,C.team,'paint');

 // Cape: darker grey-green panels hung from the shoulders, slit for the tail.
 {
  const fly=moving?1.3+Math.sin(frame*Math.PI/3)*.8:attack?[.4,1.8,.6,.2][phase]:0,N=6,half=6.6*w,low=light?24:9.5;
  const drape=(y,k)=>Math.sin(y*.9+k)*.6;
  for(let j=0;j<N;j++){
   const y0=-half+j*2*half/N,y1=y0+2*half/N,c=j%2?C.cape:tint(C.cape,-5),slit=!light&&(j===2||j===3);
   const top=y=>[shift-5.5,y*.82,43.6],mid=y=>[-8.4-fly*.5-drape(y,1),y*1.05,light?33:27.5],bot=y=>[-9.6-fly-drape(y,2),y*1.12,slit?18:low];
   face([top(y0),top(y1),mid(y1),mid(y0)],c,'cloth');face([mid(y0),mid(y1),bot(y1),bot(y0)],tint(c,-7),'cloth');
   tube(bot(y0),bot(y1),.55,C.capeD,'cloth');
  }
  for(const side of [-1,1]){face([[shift-1.2,side*6.2*w,44.6],[shift-5.5,side*half*.82,43.6],[shift-5.5,side*3.2*w,43.6],[shift-1.4,side*3*w,45]],C.cape,'cloth');orb([shift+.6,side*5.3*w,43.8],.8,.8,.8,C.plateL);}
 }

 const muzzleTip=p=>{if(attack&&phase===2){ctx.canvas.weaponMuzzle={x:p[0]*scale,y:p[1]*scale,z:p[2]*scale};orb([p[0]+1.5,p[1],p[2]],3.5,2.5,2.5,'#edca79','glow');orb([p[0]+3,p[1],p[2]],2,2,1.5,'#f5e8b0','glow');}};
 const recoil=attack&&phase===2?-3:attack&&phase===1?-1.2:0;
 const longGun=(h,len,big)=>{
  const [x,y,z]=h,r=recoil*(big?1.2:1),bw=big?1.9:1.45;
  box(x-5+r,y,z-1.3,3.2,bw*.85,2.8,C.plateD);
  box(x+1.5+r,y,z-1.4,big?7:5.5,bw,big?4.2:3.2,C.plate);
  tube([x-.5+r,y,z+(big?3.9:3.1)],[x+5+r,y,z+(big?3.9:3.1)],1.5,C.plateD);orb([x+5.3+r,y,z+(big?3.9:3.1)],.3,.7,.7,C.visor,'glass');
  tube([x+5+r,y,z-.2],[x+(big?15:12)+r,y,z-.2],big?3.4:2.3,C.plate);
  for(let k=0;k<(big?6:4);k++)tube([x+6+k*1.4+r,y-bw*.9,z+.3],[x+6+k*1.4+r,y+bw*.9,z+.3],.32,C.edge);
  tube([x+(big?15:12)+r,y,z-.1],[x+len+r,y,z-.1],big?1.3:.9,C.plateD);box(x+len+r-.4,y,z-.9,big?1.3:.9,big?1:.7,big?1.6:1.4,C.plateL);
  box(x+3.3+r,y,z-(big?7:6.2),1,.85,big?5.4:4.8,C.plateD);
  tube([x+.4+r,y,z-1],[x-.4+r,y,z-4.6],1.3,C.plateD);
  muzzleTip([x+len+1+r,y,z-.1]);
 };

 // Role kit and weapons, each type with its own tactical fit-out.
 const hand=hands[1];
 if(type==='rifle'){
  longGun(hand,22,false);tube([hand[0]+6+recoil,hand[1]+1.5,hand[2]+1],[hand[0]+10+recoil,hand[1]+1.5,hand[2]+1],1.4,C.venom,'glass');
  for(const y of [-3.4,3.4])tube([front(37,y)+.4,y,35.6],[front(37,y)+.4,y,39],1.2,C.venom,'glass');
 }else if(type==='gunner'){
  longGun(hand,27,true);box(hand[0]+3.5+recoil,hand[1]+2.4,hand[2]-3.6,2.2,1.3,3.2,C.plateL);
  const can=[-1.5,-6.4,22.5];box(can[0],can[1],can[2],2.2,1.4,4.2,C.plateD);
  for(let j=0;j<8;j++){const t=j/7,p=lerp([can[0]+1,can[1]+.6,can[2]+4.4],[hand[0]+4+recoil,hand[1]+1.8,hand[2]-1.2],t);p[2]-=Math.sin(t*Math.PI)*3.5;orb(p,.55,.55,.75,'#a48b4f');}
  for(let j=0;j<4;j++)box(-.4,-3+j*2,31.5,.45,.45,4.2,C.plateD);
 }else if(type==='guard'){
  longGun(hand,16,false);
  box(-6.6,3,33,1.2,1.8,5.5,C.plateD);tube([-6.8,3.8,38.4],[-8.2,4.8,57],.3,C.plateD);orb([-8.2,4.8,57.3],.4,.4,.4,C.plateL);
  for(let j=0;j<2;j++){const z=37.6+j*1.1;tube([front(z,-1.2)+.6,-1.2,z],[front(z+.7,0)+.6,0,z+.7],.35,C.steel);tube([front(z+.7,0)+.6,0,z+.7],[front(z,1.2)+.6,1.2,z],.35,C.steel);}
 }else if(type==='binder'){
  const top=60;tube([hand[0],hand[1],4],[hand[0],hand[1],top-5],1.1,C.plateD);
  for(const z of [20,34,48])tube([hand[0],hand[1],z],[hand[0],hand[1],z+1],1.7,C.plateL);
  for(let k=0;k<3;k++){const a=k*Math.PI*2/3;tube([hand[0],hand[1],top-5],[hand[0]+Math.cos(a)*1.9,hand[1]+Math.sin(a)*1.9,top+1],.45,C.plate);}
  orb([hand[0],hand[1],top-.5],1.4,1.4,2,C.psi,'glow');muzzleTip([hand[0],hand[1],top]);
  const fx=front(38,0);box(fx+.3,0,36.3,.7,2.1,3.2,C.plateL);orb([fx+1.1,0,37.9],.5,.95,.95,C.psi,'glow');
  for(const side of [-1,1]){tube([fx+.4,side*1.8,39.2],[shift+1,side*3.5,46.5],.45,C.strap,'cloth');tube([hx-3,side*3.6,57],[hx-5.6,side*4.6,63.5],.35,C.plateD);orb([hx-5.6,side*4.6,63.8],.45,.45,.45,C.psi,'glow');}
 }else if(type==='scout'){
  const end=attack?[hand[0]+28,hand[1],hand[2]+3]:[hand[0]+2,hand[1],hand[2]+25];
  tube([hand[0]-5,hand[1],hand[2]-4],end,1.05,C.plateD);face([[end[0]-2,end[1],end[2]],[end[0]+4,end[1],end[2]+6],[end[0]+2,end[1],end[2]-1]],C.steel);muzzleTip(end);
  box(-9,2.4,28,1.3,1.3,9,C.plateD);for(let j=0;j<3;j++){const y=1.6+j*.8;tube([-9,y,37],[-9.6,y,47],.6,C.plateD);face([[-9.6,y,47],[-9.3,y-.6,49.5],[-9.9,y+.6,49.5]],C.steel);}
 }else if(type==='blade'){
  const v=attack?[[6,0,22],[-16,0,28],[28,3,-9],[13,0,13]][phase]:ready?[7,0,21]:[4,0,-17],end=add(hand,mul(v,1.05)),dir=nrm(v);
  tube(sub(hand,mul(dir,3)),add(hand,mul(dir,.6)),1.2,C.plateD);orb(sub(hand,mul(dir,3.4)),.8,.8,.8,C.plateL);
  const len=Math.hypot(v[0],v[2]),nx=-v[2]/len,nz=v[0]/len;tube([hand[0]+nx*2.4,hand[1],hand[2]+nz*2.4],[hand[0]-nx*2.4,hand[1],hand[2]-nz*2.4],.8,C.plateL);
  const a=add(hand,mul(v,.12)),b=end,wide=1.9;
  for(const side of [-1,1])face([[a[0]+nx*wide,a[1],a[2]+nz*wide],[b[0],b[1],b[2]],[a[0]-nx*wide,a[1],a[2]-nz*wide],[a[0],a[1]+side*.6,a[2]]],side>0?'#3a4245':'#2a3033');
  tube([a[0]+nx*wide,a[1],a[2]+nz*wide],b,.35,'#cdd6d8');
 }
 // Transparent polycarbonate riot shield: curved panels, rubber rim, owner band and a light streak.
 if(shielded){
  const x=10.5,y=-12.2,z=31,hw=7.2,hh=16.5,cols=[-1,-.33,.33,1].map(t=>[x+(1-t*t)*1.1,y+t*hw]);
  for(let k=0;k<3;k++){const a=cols[k],b=cols[k+1];
   face([[a[0],a[1],z+hh],[b[0],b[1],z+hh],[b[0],b[1],z-hh],[a[0],a[1],z-hh]],k===1?C.glass:tint(C.glass,-14),'glass');
   face([[a[0]+.15,a[1],z+hh*.62],[b[0]+.15,b[1],z+hh*.62],[b[0]+.15,b[1],z+hh*.44],[a[0]+.15,a[1],z+hh*.44]],C.team,'paint');
   for(const zz of [z+hh,z-hh])tube([a[0],a[1],zz],[b[0],b[1],zz],.95,C.plateD);
  }
  for(const c of [cols[0],cols[3]])tube([c[0],c[1],z+hh],[c[0],c[1],z-hh],.95,C.plateD);
  tube([x+1.35,y-4.5,z+12],[x+1.35,y+1.5,z-7],.4,C.visorL,'glass');tube([x+1.3,y-1.5,z+13],[x+1.3,y+3.5,z-3],.28,C.visorL,'glass');
 }
 M.part=null;M.finish();return true;
}
root.FractureReptilianArt={render,roster};
})(globalThis);
