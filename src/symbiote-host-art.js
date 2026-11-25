'use strict';
// Converted hosts: a human soldier overgrown by an amber, porous symbiote lattice over dark reddish-brown flesh,
// with exposed ribs, olive spore sacs, barbed whip tendrils and hooked claws. Remnant tactical gear
// (belt, pouches, knee pads, boots) shows what the host used to be. Only 'paint' takes owner colour.
(function(root){
const C={flesh:'#3d1d17',fleshD:'#25110c',fleshL:'#552a20',muscle:'#8a4c3e',rib:'#a8705e',ribD:'#7a4c44',amber:'#c08a2e',amberL:'#dcae4c',amberD:'#8a5c1c',
 sac:'#8c8838',sacL:'#c2b95a',sacD:'#55521f',skin:'#b07c5c',skinD:'#86583f',hair:'#24180f',eye:'#ecdccb',infect:'#d0503c',whip:'#3a1d15',whipD:'#24120c',
 gear:'#38392a',gearL:'#4b4c37',gearD:'#24251a',boot:'#2b231c',bootL:'#3d3127',claw:'#2e1d1a',clawTip:'#a89474',spore:'#e2c45e',sporeL:'#f4e6a0',team:'#a8a8a8'};
// Builds per unit. kind: trooper (upright), spitter (spore sacs, spits), stalker (digitigrade crouch),
// crawler (all fours), brute (massive), binder (tendril crown), flyer (lattice wings).
const roster={
 Harvester:{kind:'trooper',bulk:.92,scale:.58,sacs:1,whips:3,claw:.7,gear:'worker',lattice:['#c9a860','#e2cc8e'],mark:'sack'},
 Talon:{kind:'trooper',bulk:1,scale:.61,sacs:2,whips:7,claw:1.35,gear:'full',lattice:['#b8622a','#d8863a'],mark:'scythes'},
 Husk:{kind:'trooper',bulk:1.12,scale:.61,sacs:2,whips:3,claw:1,gear:'full',hunch:.25,lattice:['#c4b48a','#e2d6b0'],mark:'plates'},
 'Spore Dart':{kind:'spitter',bulk:.98,scale:.61,sacs:3,whips:6,claw:.9,gear:'belt',lattice:['#a3a236','#c8c45a'],mark:'launcher'},
 Listener:{kind:'spitter',bulk:.95,scale:.61,sacs:2,whips:5,claw:.8,gear:'belt',crown:6,skyward:true,lattice:['#8a9e6a','#b4c48e'],mark:'ears'},
 Spitter:{kind:'spitter',bulk:1.15,scale:.64,sacs:8,whips:8,claw:1,gear:'full',vents:true,skyward:true,lattice:['#cfac2c','#ecd35a']},
 Stalker:{kind:'stalker',bulk:1.05,scale:.66,sacs:2,whips:9,claw:1.6,gear:'thigh',lattice:['#8a5824','#b07836'],mark:'spines'},
 Prowler:{kind:'crawler',bulk:.85,scale:.66,sacs:1,whips:6,claw:1.2,gear:'thigh',lattice:['#b06c36','#cc8a4a']},
 Brute:{kind:'brute',bulk:1.6,scale:.65,sacs:4,whips:9,claw:1.7,gear:'full'},
 'Root Colossus':{kind:'brute',bulk:1.75,scale:.8,sacs:7,whips:12,claw:2,gear:'full',roots:true},
 'Neural Binder':{kind:'binder',bulk:.95,scale:.63,sacs:0,whips:5,claw:1,gear:'belt',crown:9,lattice:['#dcbc5a','#f4dc88']},
 'Spore Flyer':{kind:'flyer',bulk:.9,scale:.7,sacs:3,whips:8,claw:1.2,gear:'belt'},
 'Buoyant Carrier':{kind:'bladder',scale:.9,whips:10},
 'Buoyant Carrier Bomber':{kind:'bladder',scale:.85,whips:8,bombs:true},
 // Grown, not built: living hulls, a converted war-beast and a pack-host. No metal anywhere.
 'Carapace Beast':{kind:'beast',scale:.98,sacs:4,whips:9,claw:1.4},
 'Trade Organism':{kind:'pack',scale:1,sacs:5,whips:5,claw:1},
 'Spine Skimmer':{kind:'hull',job:'warship',scale:1.55,L:30,W:9,whips:6},
 'Tendril Skimmer':{kind:'hull',job:'scout',scale:1.55,L:24,W:6.5,whips:4},
 'Spineward Colony':{kind:'hull',job:'aa',scale:1.55,L:30,W:9.5,whips:6},
 'Spore Mortar Vessel':{kind:'hull',job:'siege',scale:1.38,L:36,W:11,whips:8},
 'Living Ferry':{kind:'hull',job:'transport',scale:1.55,L:31,W:10.5,whips:8},
 'Tidal Colony Merchant Ship':{kind:'hull',job:'merchant',scale:1.55,L:27,W:9.5,whips:6}
};
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k),lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],nrm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);};
const hash=(a,b)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s);};
const frameOf=(a,b)=>{const axis=nrm(sub(b,a)),u=nrm(Math.abs(axis[2])>.9?[1,0,0]:[-axis[1],axis[0],0]);return{axis,u,v:cross(axis,u)};};

function render(ctx,d,f,angle,action,frame){
 const spec=roster[d.name];
 if(!spec||f.id!=='symbiotes')return false;
 if(action==='walkReady')action='walk';if(action==='ready'){action='attack';frame=0;}
 const M=new root.FractureSpriteMesh(ctx,angle,action==='dead').pose(d,action,frame),use=m=>M.material(m);
 const tube=(a,b,w,c,m='skin')=>{use(m);M.seg(a,b,c,w);};
 const orb=(p,rx,ry,rz,c,m='skin')=>{use(m);M.orb(p[0],p[1],p[2],rx,ry,rz,c);};
 const face=(v,c,m='skin')=>{use(m);M.face(v,c);};
 const loft=(r,c,m='skin',sides=14)=>{use(m);M.loft(r,c,sides);};
 const box=(x,y,z,w,l,h,c,m='cloth')=>{use(m);M.box(x,y,z,w,l,h,c);};
 const moving=action==='walk',attack=action==='attack',work=action==='gather'||action==='build',phase=frame%4,t=frame*Math.PI/3,sway=Math.sin(t);
 const {kind,bulk:B}=spec,seed=d.name.length*7.3,LA=spec.lattice?.[0]||C.amber,LB=spec.lattice?.[1]||C.amberL;
 M.part={origin:[0,0,0],scale:spec.scale};
 M.ownership([{x:[-60,60],y:[-60,60],z:[-10,120]}],['paint']);

 // A limb of maroon flesh with a porous amber lattice wrapped over it.
 const limb=(a,b,r0,r1,dense=1,k=0)=>{
  const {axis,u,v}=frameOf(a,b),len=Math.hypot(...sub(b,a));
  const rings=[0,.25,.5,.75,1].map(q=>{const r=r0+(r1-r0)*q;return Array.from({length:12},(_,j)=>{const an=j*Math.PI/6;return add(lerp(a,b,q),add(mul(u,Math.cos(an)*r),mul(v,Math.sin(an)*r)));});});
  use('skin');M.rings(rings,C.flesh,true);
  lattice(a,b,r0,r1,axis,u,v,len,dense,k);
 };
 const lattice=(a,b,r0,r1,axis,u,v,len,dense,k)=>{
  const n=Math.max(2,Math.round(len/(2.7/dense))),around=7,pts=[];
  for(let i=0;i<=n;i++){const q=i/n,r=(r0+(r1-r0)*q)*1.07+.12,row=[];for(let j=0;j<around;j++){const an=(j+(i%2)*.5)*Math.PI*2/around+(hash(i+k,j+seed)-.5)*.5;row.push(add(lerp(a,b,q),add(mul(u,Math.cos(an)*r),mul(v,Math.sin(an)*r))));}pts.push(row);}
  for(let i=0;i<=n;i++)for(let j=0;j<around;j++){const p=pts[i][j],c=(i+j)%3?LA:LB;
   if(hash(i*3+k,j)>.3)tube(p,pts[i][(j+1)%around],.85,c,'chitin');
   if(i<n){tube(p,pts[i+1][(j+(i%2))%around],.78,c,'chitin');if(hash(j+k,i*5)>.7)orb(lerp(p,pts[i+1][j],.5),.55,.55,.55,C.muscle);}
  }
 };
 // Barbed whip tendril: tapering, curling, with small amber barbs.
 const whip=(base,dir,len,curl,w=1,k=0)=>{
  let p=base,d0=nrm(dir);const segs=7;
  for(let i=0;i<segs;i++){const q=i/segs,wob=Math.sin(t+k*1.7+i*.9)*.45*q,turn=curl*(.15+q*q*1.9);
   d0=nrm([d0[0]*Math.cos(turn)-d0[2]*Math.sin(turn)+wob*.2,d0[1]+wob,d0[0]*Math.sin(turn)+d0[2]*Math.cos(turn)]);
   const next=add(p,mul(d0,len/segs));tube(p,next,w*(1.25-q*1.05),i%2?C.whip:C.whipD,'chitin');
   if(i>0&&i<segs-1){const side=nrm(cross(d0,[0,0,1]));tube(next,add(next,add(mul(side,(i%2?1:-1)*.9),mul(d0,-.6))),.28,C.amberD,'chitin');}
   p=next;}
 };
 const sac=(p,r)=>{orb(p,r,r,r,C.sac,'chitin');orb(add(p,[r*.35,-r*.25,r*.45]),r*.38,r*.32,r*.26,C.sacL,'chitin');
  for(let j=0;j<4;j++){const a0=j*Math.PI/2+seed,q=[p[0]+Math.cos(a0)*r*1.02,p[1]+Math.sin(a0)*r*1.02,p[2]],q2=[p[0]+Math.cos(a0+.9)*r*.7,p[1]+Math.sin(a0+.9)*r*.7,p[2]+r*.72];tube(q,q2,.32,C.amberD,'chitin');}};
 const clawHand=(p,dir,s,open=0)=>{
  const {u,v}=frameOf(p,add(p,dir)),dn=nrm(dir);orb(p,1.7*s,1.5*s,1.6*s,C.flesh);
  for(let j=-1.5;j<=1.5;j++){const spread=mul(v,j*1.1*s*(1+open*.4)),knuckle=add(p,add(mul(dn,2*s),spread)),mid=add(knuckle,add(mul(dn,2.6*s*spec.claw),mul(u,-.6*s))),tip=add(mid,add(mul(dn,1.8*s*spec.claw),mul(u,-2*s*spec.claw)));
   tube(add(p,spread),knuckle,1*s,C.flesh);tube(knuckle,mid,.8*s,C.claw,'bone');tube(mid,tip,.45*s,C.clawTip,'bone');}
 };
 const ribs=(c,w,h,count=5)=>{for(let j=0;j<count;j++){const z=c[2]-h/2+j*h/(count-1);for(const s of [-1,1]){const a=[c[0]-1,c[1]+s*.5,z+.4],m=[c[0]+.9,c[1]+s*w*.55,z-.4],e=[c[0]-.6,c[1]+s*w*.95,z-1.6];tube(a,m,.75,j%2?C.rib:C.ribD,'bone');tube(m,e,.6,C.rib,'bone');}}};
 const kneePad=(p,s)=>{orb(add(p,[1.6*s,0,.3]),2.2*s,2.3*s,2.4*s,C.gear,'leather');tube(add(p,[.6,-2.3*s,0]),add(p,[.6,2.3*s,0]),.5*s,C.gearD,'leather');};
 const boot=(ankle,s,lift=0)=>{loft([[ankle[0]+1.3*s,ankle[1],lift,3.8*s,2.4*s],[ankle[0]+1.3*s,ankle[1],lift+.9*s,3.8*s,2.4*s]],C.gearD,'leather',12);
  loft([[ankle[0]+1.3*s,ankle[1],lift+.9*s,3.6*s,2.3*s],[ankle[0]+1.5*s,ankle[1],lift+2.4*s,3.6*s,2.3*s],[ankle[0]-.1,ankle[1],lift+4.6*s,2.4*s,2.1*s]],C.boot,'leather',12);
  tube([ankle[0]-.4,ankle[1],lift+4.2*s],[ankle[0]-.2,ankle[1],lift+8*s],2.7*s,C.bootL,'leather');for(let j=0;j<3;j++)tube([ankle[0]+.8,ankle[1]-1.4*s,lift+4.5*s+j*1.2],[ankle[0]+.8,ankle[1]+1.4*s,lift+4.5*s+j*1.2],.25,C.gearL,'cloth');};
 const footClaw=(ankle,s)=>{orb(ankle,1.8*s,1.6*s,1.4*s,C.flesh);for(let j=-1;j<=1;j++){const toe=add(ankle,[3.2*s,j*1.6*s,-1]),tip=add(toe,[2.4*s,j*.5*s,-1.6]);tube(ankle,toe,.9*s,C.flesh);tube(toe,tip,.55*s,C.claw,'bone');}tube(ankle,add(ankle,[-2.6*s,0,-1.2]),.6*s,C.claw,'bone');};
 const pouches=(cx,z,rx,ry,n)=>{loft([[cx,0,z-1,rx,ry],[cx,0,z+1,rx,ry]],C.gear,'cloth',16);box(cx+rx-.1,0,z-.8,.4,1.4,1.6,C.team,'paint');
  for(let j=0;j<n;j++){const a=-1.1+j*2.2/(n-1||1),y=Math.sin(a)*ry*1.02,x=cx+Math.cos(a)*rx*1.02;if(Math.abs(y)<1.3)continue;box(x,y,z-2.6,1.5,2,3.4,j%2?C.gear:C.gearL);box(x+.1,y,z+.6,1.6,2.1,.5,C.gearD);}};
 // Host head: human face under a lattice hood, one eye milky and red-rimmed, hair hanging out.
 const head=(p,s,tilt=0)=>{
  const [x,y,z]=p;tube([x-.9*s,y,z-4.2*s],[x-.3*s,y,z-1.8*s],1.9*s,C.flesh);
  orb([x+.4*s,y,z+.4*s],3.1*s,2.8*s,3.4*s,C.skin);
  const fx=x+2.6*s+tilt*.6,fz=z+tilt*.4;
  orb([fx-.2*s,y,fz-2.2*s],1.6*s,2*s,1.1*s,C.skinD);
  tube([fx+.5*s,y-1.9*s,fz+.95*s],[fx+.5*s,y+1.9*s,fz+.95*s],.5*s,C.skinD);
  orb([fx+.55*s,y-1.1*s,fz+.25*s],.48*s,.55*s,.42*s,C.eye,'glass');orb([fx+.62*s,y-1.1*s,fz+.25*s],.36*s,.4*s,.32*s,C.infect,'glow');
  orb([fx+.5*s,y+1.1*s,fz+.25*s],.35*s,.45*s,.32*s,'#2a1c16');
  orb([fx+1.2*s,y,fz-.6*s],.55*s,.45*s,.9*s,C.skin);tube([fx+.75*s,y-.8*s,fz-1.9*s],[fx+.75*s,y+.8*s,fz-1.9*s],.35*s,'#5a3226');
  // Hood: maroon cowl from crown to nape, wrapped in lattice, framing the face.
  loft([[x-1.1*s,y,z-2.2*s,2.4*s,2.9*s],[x-.5*s,y,z+.5*s,3.2*s,3.3*s],[x+.1*s,y,z+2.6*s,2.8*s,2.9*s],[x+.2*s,y,z+3.5*s,1.6*s,1.7*s]],C.flesh,'skin',14);
  for(let j=0;j<8;j++){const a=-Math.PI*.55+j*Math.PI*1.1/7,r=3.6*s,q=[x-.5*s+Math.cos(a+Math.PI)*r*.55,y+Math.sin(a)*r,z+3.4*s-Math.abs(Math.cos(a))*2*s],q2=[x+1.6*s+Math.cos(a)*1.2*s,y+Math.sin(a)*3.3*s,z-1.5*s+j%2];tube(q,q2,.42*s,j%2?LA:LB,'chitin');tube([x+.2*s,y,z+3.9*s],q,.4*s,C.amberD,'chitin');}
  for(const sd of [-1,1])for(let j=0;j<2;j++)tube([fx-.8*s,y+sd*(2.3+j*.5)*s,fz+1.6*s],[fx-1.6*s,y+sd*(2.6+j*.6)*s,fz-3.6*s],.4*s,C.hair,'fur');
 };
 // Spore-bladder carrier: a netted olive gas sac over a ribbed flesh gondola, trailing whip tendrils.
 function bladder(){
  const bob=Math.sin(t)*1.2,z0=40+bob,rx=24,ry=15,rz=13;
  orb([0,0,z0],rx,ry,rz,C.sac,'chitin');orb([6,-5,z0+7],rx*.35,ry*.3,rz*.25,C.sacL,'chitin');
  // Amber net: meridians and parallels with knots, leaving the sac bulging between them.
  const P=(a,b)=>[Math.cos(a)*Math.cos(b)*rx*1.02,Math.sin(a)*Math.cos(b)*ry*1.02,z0+Math.sin(b)*rz*1.02];
  for(let j=0;j<10;j++){const a=j*Math.PI/5;for(let k=0;k<6;k++){const b0=-1+k*.38,b1=b0+.38;tube(P(a,b0),P(a+.12*(k%2?1:-1),b1),.8,j%2?LA:LB,'chitin');}}
  for(const b of [-.55,-.1,.35,.75])for(let j=0;j<20;j++){const a=j*Math.PI/10;if(hash(j,b*10)>.25)tube(P(a,b),P(a+Math.PI/10,b),.7,LA,'chitin');}
  // Gondola: maroon ribbed hull hung on lattice cords.
  const gz=z0-rz-9;loft([[-15,0,gz,3,4],[-8,0,gz-1.5,5.5,6],[4,0,gz-1.8,6,6.5],[13,0,gz-.5,4,4.5],[18,0,gz+1,1.5,2]].map(([x,y,z,a,b])=>[x,y,z,b,a]),C.flesh,'skin',14);
  for(let j=0;j<6;j++){const x=-11+j*5;for(const sd of [-1,1]){tube([x,sd*5.8,gz-.5],[x+1,sd*4,gz-5.5],.7,C.rib,'bone');tube([x,0,gz+4.5],[x,sd*5.5,gz+.5],.6,LA,'chitin');}}
  for(const x of [-12,0,12])for(const sd of [-1,1])tube([x,sd*4.5,gz+2],[x*1.1,sd*ry*.8,z0-rz*.6],.6,C.amberD,'chitin');
  tube([-14,-4.5,gz+.5],[16,-4.5,gz+.8],.5,C.team,'paint');tube([-14,4.5,gz+.5],[16,4.5,gz+.8],.5,C.team,'paint');
  // Small converted host riding at the bow.
  head([17,0,gz+4],.8);
  for(let j=0;j<spec.whips;j++){const a=j*Math.PI*2/spec.whips,base=[Math.cos(a)*rx*.6,Math.sin(a)*ry*.6,z0-rz*.75];whip(base,[Math.cos(a)*.3,Math.sin(a)*.3,-1],16+(j%3)*3,(j%2?.25:-.25),.9,j);}
  for(let j=0;j<4;j++){const a=j*1.6+.4;sac([Math.cos(a)*rx*.75,Math.sin(a)*ry*.75,z0+rz*.55],2.4);}
  if(spec.bombs){const drop=attack?[0,2,5,1][phase]:0;for(let j=0;j<4;j++){const x=-9+j*6;tube([x,0,gz-2],[x,0,gz-4-drop*(j===1?1:0)],.5,C.amberD,'chitin');sac([x,0,gz-6-(j===1?drop*2:0)],2.1);}
   if(attack&&phase===2)ctx.canvas.weaponMuzzle={x:-3*spec.scale,y:0,z:(gz-10)*spec.scale};}
 }
 // ---------- Living hull ----------
 // Cross-sections run bow (+x) to stern (-x): a flesh hull sitting in the water, ribs exposed along the
 // sides, an amber lattice gunwale, spore-sac floats on struts, and tendrils sweeping the water as oars.
 function hull(){
  const L=spec.L,W=spec.W,job=spec.job,bob=Math.sin(t)*.5,deck=5.4+bob,keel=-2.5+bob,stations=13;
  const width=q=>W*Math.pow(Math.max(.02,1-Math.pow(Math.max(0,q),2.2)),.55)*(q<0?.82+.18*(1+q):1),depth=q=>(deck-keel)*(q>0?1-.35*q*q:.85+.15*(1+q));
  const rings=[];for(let i=0;i<=stations;i++){const q=-1+2*i/stations,x=q*L,w=width(q),d=depth(q);rings.push(Array.from({length:14},(_,j)=>{const a=j*Math.PI*2/14,bulge=1+.12*Math.sin(a*2+x*.4),y=Math.cos(a)*w*bulge,z=Math.min(deck+.6*Math.abs(Math.cos(a))*0,deck-d+d*(1+Math.sin(a))*.55);return[x,y,z];}));}
  use('skin');M.rings(rings,C.flesh,true);
  const rim=rings.map((r,i)=>[(-1+2*i/stations)*L,width(-1+2*i/stations)]);
  for(let i=0;i<stations;i++){const [x0,w0]=rim[i],[x1,w1]=rim[i+1];face([[x0,-w0*.92,deck+.05],[x1,-w1*.92,deck+.05],[x1,w1*.92,deck+.05],[x0,w0*.92,deck+.05]],C.fleshD);
   for(const sd of [-1,1]){tube([x0,sd*w0,deck+.4],[x1,sd*w1,deck+.4],1.1,LA,'chitin');tube([x0,sd*w0*.98,deck-.2],[(x0+x1)/2,sd*Math.max(w0,w1)*1.01,deck-3.2],.75,LB,'chitin');tube([(x0+x1)/2,sd*Math.max(w0,w1)*1.01,deck-3.2],[x1,sd*w1*.98,deck-.2],.75,LA,'chitin');tube([x0,sd*w0*1.02,deck-3.2],[(x0+x1)/2,sd*Math.max(w0,w1)*1.03,deck-5.6],.65,LB,'chitin');tube([(x0+x1)/2,sd*Math.max(w0,w1)*1.03,deck-5.6],[x1,sd*w1*1.02,deck-3.2],.65,LA,'chitin');}
   tube([x0,-w0*.85,deck+.3],[x1,w1*.85,deck+.3],.55,i%2?LA:C.amberD,'chitin');tube([x0,w0*.85,deck+.3],[x1,-w1*.85,deck+.3],.55,i%2?C.amberD:LB,'chitin');}
  for(let i=1;i<stations;i++){const q=-1+2*i/stations,x=q*L,w=width(q),d=depth(q);for(const sd of [-1,1]){const p0=[x,sd*w*1.03,deck-.4],p1=[x+1,sd*w*1.06,deck-d*.45],p2=[x+1.5,sd*w*.7,deck-d*.85];tube(p0,p1,1.3,C.rib,'bone');tube(p1,p2,1,C.ribD,'bone');}}
  for(const sd of [-1,1])for(let i=1;i<stations-1;i++){const [x0,w0]=rim[i],[x1,w1]=rim[i+1];tube([x0,sd*w0*1.04,deck-1.5],[x1,sd*w1*1.04,deck-1.5],1,C.team,'paint');}
  const floats=job==='scout'?2:3;for(let k=0;k<floats;k++){const q=.45-k*.55,x=q*L,w=width(q);for(const sd of [-1,1]){const pod=[x,sd*(w+4.2),deck-2.2];tube([x,sd*w,deck-.2],pod,.7,C.amberD,'chitin');sac(pod,2.1);}}
  for(let k=0;k<spec.whips;k++){const sd=k%2?1:-1,q=.35-Math.floor(k/2)*(.9/Math.max(1,spec.whips/2)),x=q*L,w=width(q),sweep=Math.sin(t+k)*.35;whip([x,sd*w,deck-1],[-.6+sweep,sd*1,-.55],8+W*.6,sd*.08,.8,k);}
  head([L*.98,0,deck+2.2],.85);tube([L*.8,0,deck],[L*.98,0,deck+.5],2.2,C.flesh);
  const muzzle=p=>{if(attack&&phase===2){ctx.canvas.weaponMuzzle={x:p[0],y:p[1],z:p[2]};for(let j=0;j<3;j++)orb(add(p,[j*1.4,0,j*.3]),1.4-j*.25,1.3-j*.25,1.2-j*.25,j%2?C.spore:C.sporeL,'glow');}};
  if(job==='warship'){
   const base=[2,0,deck+1];orb(base,5,4.5,3.5,C.fleshL);for(let j=0;j<6;j++){const a=j*Math.PI/3;tube([base[0]+Math.cos(a)*5,Math.sin(a)*4.5,deck+.5],[base[0],0,deck+4.2],.8,LA,'chitin');}
   const recoil=attack&&phase===2?-1.5:0;tube([base[0]+recoil,0,deck+3.5],[base[0]+19+recoil,0,deck+5.5],3.2,C.rib,'bone');tube([base[0]+19+recoil,0,deck+5.5],[base[0]+21+recoil,0,deck+5.7],2.2,C.ribD,'bone');for(let j=0;j<4;j++)tube([base[0]+4+j*3+recoil,-2.3,deck+4],[base[0]+4+j*3+recoil,2.3,deck+4.4],.6,C.amberD,'chitin');
   for(let j=0;j<5;j++)tube([-L*.2-j*3,0,deck+1],[-L*.2-j*3-2,0,deck+6-j*.5],1,C.clawTip,'bone');
   muzzle([base[0]+22+recoil,0,deck+5.8]);sac([-L*.6,-3,deck+2.2],2.4);sac([-L*.6,3,deck+2.2],2.4);
  }else if(job==='scout'){
   const mast=[[-2,0,deck],[-4,0,deck+16],[-12,0,deck+13],[-10,0,deck]];tube(mast[0],mast[1],1,C.whip,'chitin');tube(mast[3],mast[2],.9,C.whip,'chitin');face(mast,C.fleshD);tube(mast[1],mast[2],.6,LA,'chitin');for(let j=1;j<3;j++)tube(lerp(mast[0],mast[1],j/3),lerp(mast[3],mast[2],j/3),.5,LB,'chitin');
   const g=[6,0,deck+1.5];orb(g,2.5,2.2,2,C.fleshL);tube(g,[g[0]+7,0,g[2]+1],1,C.rib,'bone');muzzle([g[0]+7.5,0,g[2]+1]);
  }else if(job==='aa'){
   for(let k=0;k<3;k++){const p=[6-k*8,(k-1)*2.5,deck];tube(p,add(p,[0,0,5]),1.6,C.flesh);sac(add(p,[0,0,7]),2.6);for(let j=0;j<3;j++)orb(add(p,[.6,(j-1)*.9,9.4]),.5,.5,.5,C.spore,'glow');}
   if(attack&&phase===2){const p=[6,-2.5,deck+11];ctx.canvas.weaponMuzzle={x:p[0],y:p[1],z:p[2]};for(let j=0;j<4;j++)orb(add(p,[j*.6,0,j*1.6]),1.2+j*.3,1.2+j*.3,1.1,j%2?C.spore:C.sporeL,'glow');}
  }else if(job==='siege'){
   const m=[-L*.35,0,deck+6];orb(m,8,7,7,C.sac,'chitin');for(let j=0;j<8;j++){const a=j*Math.PI/4;tube(add(m,[Math.cos(a)*8,Math.sin(a)*7,-2]),add(m,[Math.cos(a+.5)*4.5,Math.sin(a+.5)*4,6]),.8,LA,'chitin');}
   orb(add(m,[2.5,0,6.5]),2.6,2.4,1,C.fleshD);orb(add(m,[2.8,0,7]),1.7,1.6,.6,C.spore,'glow');
   if(attack&&phase===2){const p=add(m,[3,0,9]);ctx.canvas.weaponMuzzle={x:p[0],y:p[1],z:p[2]};for(let j=0;j<4;j++)orb(add(p,[j*1.2,0,j*1.8]),1.5+j*.4,1.4+j*.4,1.3,j%2?C.spore:C.sporeL,'glow');}
   for(let k=0;k<2;k++)sac([L*.3-k*7,(k?3:-3),deck+2],2.4);
  }else if(job==='transport'){
   for(let k=0;k<5;k++){const x=L*.45-k*L*.2,w=width(x/L)*.85;const arc=Array.from({length:7},(_,j)=>{const a=j*Math.PI/6;return[x,Math.cos(a)*w,deck+Math.sin(a)*7];});for(let j=0;j<6;j++)tube(arc[j],arc[j+1],.9,k%2?LA:LB,'chitin');}
   for(const z of [deck+6.9,deck+4.8])tube([L*.45,0,z],[-L*.35,0,z],.7,C.amberD,'chitin');
   face([[L*.45,-width(.45)*.8,deck+.1],[-L*.35,-width(-.35)*.8,deck+.1],[-L*.35,width(-.35)*.8,deck+.1],[L*.45,width(.45)*.8,deck+.1]],C.muscle);
  }else{
   for(let k=0;k<5;k++)sac([L*.35-k*L*.2,(k%2?2.5:-2.5),deck+2.6],2.6);
   for(let k=0;k<3;k++){box(-L*.45+k*5,-1,deck,3.6,4.4,3.2,C.gear);tube([-L*.45+k*5,-3.4,deck+3.3],[-L*.45+k*5,1.4,deck+3.3],.6,C.team,'paint');}
   for(let k=0;k<6;k++)tube([L*.45-k*L*.16,-W*.7,deck+.5],[L*.35-k*L*.16,W*.7,deck+5.4],.55,C.amberD,'chitin');
  }
  if(moving)for(const sd of [-1,1])for(let j=0;j<3;j++)orb([L*.6-j*L*.5,sd*(width(.6-j*.5)+.8),-.2],2.4-j*.4,.9,.25,'#d8d4c0','cloth');
 }
 // ---------- Quadruped hosts ----------
 // Carapace Beast: a converted war-beast under an armoured lattice ridge. Trade Organism: a pack-host
 // carrying cargo sacs and lashed bundles.
 function quadruped(){
  const beast=kind==='beast',len=beast?15:12,h=beast?19:15,w=beast?7.5:6;
  const back=[-len,0,h+2],front=[len,0,h+3];
  for(const [fx,side] of [[1,-1],[1,1],[-1,-1],[-1,1]]){const g=moving?root.FractureMotion.step(frame,(fx>0?0:.5)+(side>0?.25:0),6):{x:0,lift:0};
   const hip=[fx*len*.78,side*w*.8,h],knee=[fx*len*.78+(fx>0?-2:3),side*(w+1.2),h*.55+g.lift*.3],foot=[fx*len*.78+g.x+(fx>0?2:0),side*(w+1.6),1.2+g.lift];
   limb(hip,knee,4.2*(beast?1.15:1),3.4,1,fx*3+side);
   // Owner colour: cloth bands bound round each leg.
   {const {u,v}=frameOf(hip,knee),c=lerp(hip,knee,.45),r=4.2*(beast?1.15:1)*.95+.4;for(let j=0;j<10;j++){const a0=j*Math.PI/5,a1=a0+Math.PI/5;tube(add(c,add(mul(u,Math.cos(a0)*r),mul(v,Math.sin(a0)*r))),add(c,add(mul(u,Math.cos(a1)*r),mul(v,Math.sin(a1)*r))),1.2,C.team,'paint');}}limb(knee,foot,3.2,2.2,1,fx*5+side);footClaw(foot,beast?1.35:1.1);}
  limb(back,front,w*1.05,w*1.15,1.1,21);
  for(let j=0;j<6;j++){const x=-len*.6+j*len*.24;for(const sd of [-1,1]){tube([x,sd*w*.9,h+2],[x+1,sd*w*1.1,h-3],.8,C.rib,'bone');tube([x+1,sd*w*1.1,h-3],[x+1.5,sd*w*.5,h-5.5],.65,C.ribD,'bone');}}
  const hp=[len+5,0,h+5+(attack?[0,1,-1.5,0][phase]:0)];tube(front,hp,4.5,C.flesh);head(hp,beast?1.35:1.1);
  if(beast){for(const sd of [-1,1])tube([hp[0]+2,sd*2.6,hp[2]-3.5],[hp[0]+6,sd*2.4,hp[2]-6],.9,C.clawTip,'bone');
   for(let j=0;j<7;j++){const x=-len*.85+j*len*.28,r=w*1.25+(j===3?1:0);const arc=Array.from({length:7},(_,k)=>{const a=k*Math.PI/6;return[x,Math.cos(a)*r,h+2+Math.sin(a)*(r*.9)];});for(let k=0;k<6;k++){tube(arc[k],arc[k+1],1.3,j%2?LA:LB,'chitin');if(j<6&&k%2===0){const nx=x+len*.28;face([arc[k],arc[k+1],[nx,arc[k+1][1]*.97,arc[k+1][2]],[nx,arc[k][1]*.97,arc[k][2]]],k===2?C.fleshL:C.flesh);}}}
   for(let j=0;j<spec.sacs;j++)sac([-len*.55+j*len*.36,(j%2?1:-1)*w*.7,h+w*1.15+2],2.7);
   for(let k=0;k<spec.whips;k++){const a=(k/(spec.whips-1)-.5)*2.4;whip([-len*.9,Math.sin(a)*3,h+5],[-1,Math.sin(a)*1.4,.5],18,-.35,1,k);}
   for(const sd of [-1,1])tube([hp[0]-1,sd*3,hp[2]+2],[hp[0]-7,sd*7,hp[2]+8],1.2,C.claw,'bone');
   if(attack&&phase===2)ctx.canvas.weaponMuzzle={x:hp[0]+6,y:0,z:hp[2]-4};
   for(const sd of [-1,1])tube([len*.6,sd*w*1.2,h+2],[len*.35,sd*w*.5,h+w*1.1+1.5],1.1,C.team,'paint');tube([len*.35,-w*.5,h+w*1.1+1.5],[len*.35,w*.5,h+w*1.1+1.5],1.1,C.team,'paint');
  }else{
   for(const x of [-len*.4,len*.3])for(let j=0;j<8;j++){const a0=j*Math.PI/7,a1=(j+1)*Math.PI/7,r=w*1.12;tube([x,Math.cos(a0)*r,h+2+Math.sin(a0)*r],[x,Math.cos(a1)*r,h+2+Math.sin(a1)*r],.7,C.gear,'cloth');}
   for(let j=0;j<3;j++){const x=-len*.55+j*len*.42;box(x,-1.8,h+w*.9,4.2,3.6,3.4,j%2?C.gear:C.gearL);tube([x,-4,h+w*.9+3.5],[x,.4,h+w*.9+3.5],.6,C.team,'paint');}
   for(let j=0;j<spec.sacs;j++)sac([-len*.7+j*len*.36,(j%2?1:-1)*(w*.9+1.8),h+3+(j%2)*1.5],2.2);
   for(let k=0;k<spec.whips;k++){const a=(k/(spec.whips-1)-.5)*2;whip([-len*.95,Math.sin(a)*2,h+3],[-1,Math.sin(a),.2],12,-.3,.8,k);}
   for(const sd of [-1,1])tube([len*.8,sd*w*.9,h+1],[len*.4,sd*w*.4,h+w*1.05+1],1,C.team,'paint');
  }
 }
 if(kind==='bladder'){bladder();M.part=null;M.finish();return true;}
 if(kind==='hull'){hull();M.part=null;M.finish();return true;}
 if(kind==='beast'||kind==='pack'){quadruped();M.part=null;M.finish();return true;}
 const upright=['trooper','spitter','binder','stalker','brute'].includes(kind);
 const hands=[],posture={trooper:{hip:28,chest:40,neck:46.5,crouch:0},spitter:{hip:28,chest:40,neck:46.5,crouch:0},binder:{hip:28,chest:40.5,neck:47,crouch:0},
  stalker:{hip:22,chest:33,neck:38.5,crouch:.5},crawler:{hip:15,chest:16,neck:18,crouch:1},brute:{hip:28,chest:42,neck:48.5,crouch:.1},flyer:{hip:30,chest:31,neck:31,crouch:1}}[kind];
 const s=kind==='brute'?1.25:1,w=B,lean=(spec.hunch||0)+posture.crouch*(kind==='crawler'?0:.5),shift=attack&&spec.claw>1.1&&kind!=='spitter'?[-1,-3,5,1.5][phase]:0;

 // ---------- Legs ----------
 if(kind==='flyer'){
  for(const side of [-1,1]){const hip=[-6,side*3.2,30],knee=[-12,side*4.5,24+sway*.6],ank=[-17,side*4,22];limb(hip,knee,3.2,2.5,1,side);limb(knee,ank,2.4,1.8,1,side+4);footClaw(ank,.9);}
 }else for(const side of [-1,1]){
  const g=moving?root.FractureMotion.step(frame,side<0?.5:0,kind==='crawler'?6:8):{x:side>0?1.4:-1.4,lift:0},lift=g.lift;
  if(kind==='stalker'||kind==='crawler'){
   // Digitigrade: thigh forward, shin back, long metatarsal down to a clawed foot.
   const hip=[-1,side*3*w,posture.hip],knee=[5+g.x*.35,side*3.6*w,posture.hip*.62+lift*.3],hock=[-2+g.x*.6,side*3.8*w,5+lift*.6],foot=[1.5+g.x,side*4*w,1.2+lift];
   limb(hip,knee,2.8*w,2.2*w,1,side);limb(knee,hock,2.2*w,1.7,1,side+2);limb(hock,foot,1.7,1.3,1,side+5);footClaw(foot,1);
   if(spec.gear==='thigh'){kneePad(knee,1);if(side>0){box(lerp(hip,knee,.4)[0],side*6.4*w,lerp(hip,knee,.4)[2]-1.5,2.6,1.3,3.6,C.gear);box(lerp(hip,knee,.4)[0]+.2,side*6.5*w,lerp(hip,knee,.4)[2]+2.2,2.7,1.4,.6,C.gearD);}}
  }else{
   const hip=[-.6,side*3.1*w*s,posture.hip*s],knee=[1.2-g.x*.3,side*3.3*w*s,posture.hip*s*.52+lift*.4],ank=[g.x,side*3.5*w*s,3.2*s+lift];
   limb(hip,knee,2.9*Math.sqrt(w)*s,2.3*Math.sqrt(w)*s,1,side);limb(knee,ank,2.3*Math.sqrt(w)*s,1.7*s,1,side+3);
   if(spec.gear!=='belt'&&spec.gear!=='worker')kneePad(knee,s);
   if(spec.roots)for(let j=0;j<3;j++){const a=side*.9+j*1.1;tube([ank[0],ank[1],2],[ank[0]+Math.cos(a)*9,ank[1]+Math.sin(a)*8,.3],1.4,C.whipD,'chitin');}
   boot(ank,s,lift);
  }
 }

 // ---------- Torso ----------
 const chestZ=posture.chest*s,hipZ=posture.hip*s,forward=lean*9;
 const pelvis=[-.5,0,hipZ+1],sternum=[shift+forward*.8,0,chestZ],neck=[shift+forward,0,posture.neck*s];
 if(kind==='crawler'||kind==='flyer'){
  const back=kind==='flyer'?[-8,0,30]:[-5,0,15.5],front=kind==='flyer'?[6,0,31]:[8,0,17.5];
  limb(back,front,5.4*w,6.2*w,1.15,9);ribs([front[0]-2,0,front[2]-3],6.4*w,4,4);
  if(spec.gear!=='none'){loft([[back[0]+3,0,back[2]-1.2,4.8*w,5.7*w],[back[0]+4,0,back[2]+1.2,4.8*w,5.7*w]],C.gear,'cloth',14);box(back[0]+3.5,5.9*w,back[2]-1.5,2.4,1.2,3,C.gearL);box(back[0]+3.5,-5.9*w,back[2]-1.5,2.4,1.2,3,C.team,'paint');}
 }else{
  const rx=3.5*w*s,ry=5*w*s;
  loft([[pelvis[0],0,hipZ-1,rx*.95,ry*.8],[pelvis[0]+forward*.2,0,hipZ+3.5,rx*.72,ry*.64],[sternum[0]-.4,0,(hipZ+chestZ)/2,rx*.86,ry*.8],[sternum[0],0,chestZ,rx*1.06,ry*1.06],[neck[0]-.4,0,chestZ+3.6*s,rx*.95,ry*1.18],[neck[0]-.6,0,chestZ+6*s,rx*.45,ry*.42]],C.flesh,'skin',16);
  // Torso lattice: diagonal amber ridges over the flesh, leaving open cells.
  for(let i=0;i<7;i++){const z0=hipZ+i*(chestZ+5*s-hipZ)/7,z1=z0+(chestZ+5*s-hipZ)/7;for(let j=0;j<12;j++){const a0=j*Math.PI*2/12+(i%2)*.26,a1=a0+.6+(hash(i,j)-.5)*.4,rr=(z)=>{const k=(z-hipZ)/(chestZ+5*s-hipZ);return[rx*(.9+.25*k)+.25,ry*(.85+.3*k)+.25];},[ax,ay]=rr(z0),[bx,by]=rr(z1),cx=sternum[0]*(i/7);
   const p=[cx+Math.cos(a0)*ax,Math.sin(a0)*ay,z0],q=[cx+Math.cos(a1)*bx,Math.sin(a1)*by,z1];if(Math.cos(a0)>.6&&Math.abs(Math.sin(a0))<.5&&i>=2&&i<=4)continue;tube(p,q,.95,(i+j)%3?LA:LB,'chitin');if(hash(j,i)>.4)tube(p,[cx+Math.cos(a0+.7)*ax,Math.sin(a0+.7)*ay,z0],.85,LA,'chitin');}}
  // Exposed ribs in an opened chest cavity.
  face([[sternum[0]+rx*.86,-ry*.5,chestZ+2],[sternum[0]+rx*.86,ry*.5,chestZ+2],[sternum[0]+rx*.8,ry*.55,chestZ-6*s],[sternum[0]+rx*.8,-ry*.55,chestZ-6*s]],C.fleshD);
  ribs([sternum[0]+rx*.9,0,chestZ-2*s],ry*.95,7*s,kind==='brute'?6:5);
  if(spec.vents)for(let j=0;j<3;j++)orb([sternum[0]+rx*.95,0,chestZ+2.5-j*2.2],.5,1.4-j*.25,.7,C.spore,'glow');
  // Remnant gear: war belt with pouches; owner colour on the buckle tab.
  if(spec.gear!=='none')pouches(pelvis[0]+.2,hipZ+1.8*s,rx*.95,ry*.9,spec.gear==='worker'?3:6);
  if(spec.gear==='worker'){box(-5.5,3,hipZ+2,3,3.2,4.6,C.gearL);box(-5.4,3,hipZ+6.8,3.2,3.3,.7,C.gearD);}
  if(spec.gear==='full'&&kind!=='brute')for(const sd of [-1,1])box(pelvis[0]+1.6,sd*ry*.8,hipZ-3.2,1.6,1.4,3.2,C.gear);
 }

 // ---------- Arms ----------
 const shoulderZ=kind==='crawler'?17:kind==='flyer'?31:chestZ+3.2*s,shoulderY=kind==='crawler'?5*w:kind==='flyer'?4.5:6.2*w*s;
 for(const side of [-1,1]){
  const sh=kind==='crawler'?[6,side*shoulderY,shoulderZ]:kind==='flyer'?[3,side*shoulderY,shoulderZ]:[neck[0]-1,side*shoulderY,shoulderZ];
  let hand;
  if(kind==='crawler'){const g=moving?root.FractureMotion.step(frame,side<0?0:.5,6):{x:0,lift:0};hand=attack&&side>0?[[14,4,9],[17,5,14],[22,4,6],[16,5,8]][phase]:[11+g.x,side*6.5*w,1+g.lift];}
  else if(kind==='flyer')hand=attack?[13+[0,3,6,2][phase],side*6,24]:[10,side*5,25+sway];
  else if(kind==='binder'&&side>0)hand=[6,9,shoulderZ+10+(attack?[0,3,5,2][phase]:sway)];
  else if(kind==='spitter'&&!work)hand=attack?[6,side*12,shoulderZ-3+[0,2,4,1][phase]]:[4,side*10.5*s,shoulderZ-12];
  else if(attack){const reach=[[5,10,shoulderZ+2],[-3,9,shoulderZ+(kind==='brute'?5:10)],[16,4,shoulderZ-8],[9,7,shoulderZ-4]][phase];hand=side>0?reach.map((q,i)=>i===1?q*s:q*(i===0?1+.1*(s-1):1)):[7,side*9*s,shoulderZ-12];}
  else if(work){const dig=[[9,4,10],[11,3,5],[13,2,2],[10,4,7]][phase];hand=[dig[0]*s,side*dig[1]*s,dig[2]];}
  else{const swing=moving?side*sway*3:0;hand=[3+swing,side*(7.6*w+.8)*s,posture.hip*s-3-(kind==='stalker'?7:kind==='brute'?2:0)];}
  const elbow=kind==='crawler'?[(sh[0]+hand[0])/2+1,side*(shoulderY+2.5),(sh[2]+hand[2])/2+4]:[(sh[0]+hand[0])*.45-2,side*(Math.abs(sh[1])+2.4*s),(sh[2]+hand[2])*.5-2*s];
  const thick=(kind==='brute'?3*Math.sqrt(w):kind==='stalker'?2.5*w:2.4*w)*s;
  orb(sh,thick*.95,thick*.9,thick*.85,C.fleshL);for(let j=0;j<6;j++){const a0=j*Math.PI/3+side,b0=a0+1.1,r=thick*1.02,P=q=>[sh[0]+Math.cos(q)*r*.9,sh[1]+side*Math.abs(Math.sin(q))*r*.55,sh[2]+Math.sin(q)*r*.85];tube(P(a0),P(b0),.8,j%2?LA:LB,'chitin');tube(P(a0),[sh[0],sh[1]+side*r*.95,sh[2]+r*.2],.7,C.amberD,'chitin');}limb(sh,elbow,thick,thick*.8,1,side+10);
  // Owner colour: a cloth band tied round each upper arm, the one surviving piece of the host's uniform.
  {const {u,v}=frameOf(sh,elbow),c=lerp(sh,elbow,spec.mark==='plates'?.72:.42),r=thick*.95+.35;for(let j=0;j<10;j++){const a0=j*Math.PI/5,a1=a0+Math.PI/5;for(const dz of [-.7,.7]){const off=mul(nrm(sub(elbow,sh)),dz);tube(add(add(c,off),add(mul(u,Math.cos(a0)*r),mul(v,Math.sin(a0)*r))),add(add(c,off),add(mul(u,Math.cos(a1)*r),mul(v,Math.sin(a1)*r))),.9,C.team,'paint');}}}limb(elbow,hand,thick*.8,thick*.55,1.1,side+14);
  clawHand(hand,kind==='crawler'?[1,0,-.6]:attack||work?sub(hand,elbow):[1,0,-1.2],kind==='brute'?1.25*s:1,attack?1:0);hands.push(hand);
 }

 // ---------- Head ----------
 const spit=kind==='spitter'&&attack,tilt=spit?[0,-3,-5,-1][phase]:0;
 const headP=kind==='crawler'?[13.5,0,19]:kind==='flyer'?[11,0,32.5]:[neck[0]+.6,0,neck[2]+4.8*s+(spec.skyward&&spit?1:0)];
 head(headP,(kind==='brute'?1.2:kind==='crawler'||kind==='flyer'?.95:1.12),spec.skyward?tilt*-.6+(spit?2:0):tilt);

 // ---------- Spore sacs ----------
 const backX=kind==='crawler'?-2:kind==='flyer'?-3:neck[0]-4.5*s,backZ=kind==='crawler'?21:kind==='flyer'?35:chestZ+2*s;
 for(let j=0;j<spec.sacs;j++){const ring=j<3?j:j-3,row=j<3?0:1,y=[-3.4,3.4,0][ring%3]*s*(row?1.25:1),z=backZ+(ring===2?3*s:0)-row*5.5*s,r=(j<3?2.6:2.1)*s*(kind==='spitter'?1.05:1)*(upright?.8:1);sac([backX-r*.6-row*1.5,y+(ring===2?0:Math.sign(y)*.8),z],r);}

 // ---------- Whip tendrils ----------
 const whipBase=kind==='crawler'?[-1,0,19]:kind==='flyer'?[-2,0,34]:[neck[0]-3*s,0,chestZ+5*s];
 const whips=upright?Math.max(2,Math.ceil(spec.whips*.42)):spec.whips;for(let j=0;j<whips;j++){const a=(j/(whips-1||1)-.5)*2.8,dir=upright?[-1,Math.sin(a)*1.1,.05+(j%2)*.1]:[-1,Math.sin(a)*1.5,.35+(j%3)*.12];whip(add(whipBase,[0,Math.sin(a)*4*s,(j%2)*1.5-1-(upright?2:0)]),dir,(kind==='brute'?22:17)*s*(1+(j%3)*.15)*(spec.roots?.78:1)*(upright?.62:1),-.32-(j%2)*.12+(moving?-.08:0),kind==='brute'?1.15:.9,j);}

 // ---------- Signature features ----------
 const mark=spec.mark;
 if(mark==='scythes')for(const [i,h] of hands.entries()){const side=i?1:-1,dir=nrm(add(sub(h,[neck[0],side*shoulderY,shoulderZ]),[0,0,0])),base=lerp([neck[0],side*shoulderY,shoulderZ],h,.55),tip=add(h,add(mul(dir,10),[0,side*2,attack?5:1])),hook=add(tip,[-3.5,side*1.2,-4.5]);
  tube(base,tip,2.1,'#d6c49c','bone');tube(tip,hook,1.2,C.clawTip,'bone');tube(lerp(base,tip,.5),lerp(base,tip,.5).map((q,k)=>k===2?q-2.5:q),.9,'#d6c49c','bone');tube(lerp(base,tip,.3),lerp(base,tip,.3).map((q,k)=>k===2?q+2.2:q),.6,C.ribD,'bone');}
 if(mark==='plates'){const plate=(a,b,c,dd)=>face([a,b,c,dd],C.rib,'bone');for(const sd of [-1,1]){const sh=[neck[0]-1,sd*shoulderY,shoulderZ];plate(add(sh,[3,sd*1,4]),add(sh,[3,sd*6,1]),add(sh,[-4,sd*6,0]),add(sh,[-4,sd*1,4.5]));plate(add(sh,[3.5,sd*5,-1]),add(sh,[3,sd*7,-5]),add(sh,[-3,sd*7,-5]),add(sh,[-3.5,sd*5.5,-1]));}
  const fx=sternum[0]+4.6*w;for(let j=0;j<3;j++){const z=chestZ+2-j*3.6;plate([fx,-4.5,z],[fx,4.5,z],[fx-.4,4,z-3],[fx-.4,-4,z-3]);tube([fx+.2,-4.5,z],[fx+.2,4.5,z],j===1?.9:.45,j===1?C.team:C.ribD,j===1?'paint':'bone');}}
 if(mark==='launcher'){const a=[neck[0]-3,4.5,shoulderZ+1],b=[neck[0]+9,6,shoulderZ+5];tube(a,b,2.1,C.rib,'bone');for(let j=0;j<4;j++)tube(lerp(a,b,.15+j*.22).map((q,k)=>k===1?q-2:q),lerp(a,b,.15+j*.22).map((q,k)=>k===1?q+2:q),.6,LA,'chitin');orb(b,1.6,1.6,1.6,C.fleshD);if(attack&&phase===2){ctx.canvas.weaponMuzzle={x:(b[0]+1)*spec.scale,y:b[1]*spec.scale,z:b[2]*spec.scale};orb(add(b,[1.8,0,.4]),1.8,1.6,1.5,C.sporeL,'glow');}}
 if(mark==='ears')for(const sd of [-1,1]){const c=[headP[0]-1,sd*3,headP[2]+.5],fan=[c,add(c,[-1,sd*8,7]),add(c,[-3,sd*11,1]),add(c,[-2,sd*7,-5])];face(fan,C.fleshL);for(let j=1;j<4;j++)tube(c,fan[j],.55,LB,'chitin');tube(fan[1],fan[2],.45,LA,'chitin');tube(fan[2],fan[3],.45,LA,'chitin');}
 if(mark==='spines')for(let j=0;j<6;j++){const z=chestZ+3-j*3.2,x=neck[0]-5.5-j*.3;tube([x,0,z],[x-5+j*.3,0,z+3.5-j*.2],1.1-j*.08,C.rib,'bone');tube([x-5+j*.3,0,z+3.5-j*.2],[x-6.4+j*.3,0,z+3.2-j*.2],.55,C.clawTip,'bone');}
 if(mark==='sack'){const c=[neck[0]-7,0,chestZ-2];orb(c,4.5,4,5.5,C.gearL,'cloth');for(let j=0;j<5;j++)tube(add(c,[-4.4,-3.8+j*1.9,-4]),add(c,[-4.4,-3.8+j*1.9,4]),.45,C.gearD,'cloth');for(const sd of [-1,1])tube([neck[0]-2,sd*4,shoulderZ+1],add(c,[2,sd*3.5,3]),.7,C.gear,'cloth');orb(add(c,[0,0,6]),3.2,2.8,1.4,C.sac,'chitin');}

 // ---------- Unit specifics ----------
 if(spec.crown){for(let j=0;j<spec.crown;j++){const a=(j/(spec.crown-1)-.5)*2.4,base=[headP[0]-1.2,headP[1]+Math.sin(a)*2.2,headP[2]+3.6],tip=[base[0]-4+Math.cos(a)*2,base[1]+Math.sin(a)*6,base[2]+8+Math.cos(a)*4];tube(base,lerp(base,tip,.5).map((q,i)=>i===0?q+1:q),.7,C.whip,'chitin');tube(lerp(base,tip,.5).map((q,i)=>i===0?q+1:q),tip,.45,C.whipD,'chitin');orb(tip,.7,.7,.7,kind==='binder'?C.spore:LB,kind==='binder'?'glow':'chitin');}
  if(kind==='binder'){const h=hands[1];orb([h[0]+1,h[1],h[2]+3],1.2+(attack?[0,.6,1,.4][phase]:0),1.2,1.2,C.spore,'glow');if(attack&&phase===2)ctx.canvas.weaponMuzzle={x:(h[0]+1)*spec.scale,y:h[1]*spec.scale,z:(h[2]+3)*spec.scale};}}
 if(kind==='spitter'||kind==='flyer'){
  const mouth=kind==='flyer'?[headP[0]+3.6,0,headP[2]-1.5]:[headP[0]+3.6+(spec.skyward?-.4:.5),0,headP[2]-1.5+(spec.skyward&&spit?2.4:0)];
  if(attack&&phase===2){ctx.canvas.weaponMuzzle={x:mouth[0]*spec.scale,y:mouth[1]*spec.scale,z:mouth[2]*spec.scale};const up=spec.skyward?[2.2,0,2.6]:[3,0,.2];for(let j=0;j<5;j++){const p=add(mouth,mul(up,j*1.1)),r=1+j*.45;orb(p,r,r*.9,r*.8,j%2?C.spore:C.sporeL,'glow');}}
  else if(attack&&phase===1)orb(add(mouth,[1,0,0]),.9,.9,.8,C.spore,'glow');
  for(const h of hands)if(kind==='spitter'&&attack)orb(add(h,[.5,0,1]),.8,.8,.8,C.spore,'glow');
 }
 if(kind==='flyer'){
  // Lattice wings: maroon membrane faces with amber struts and open holes, sacs on the leading edge.
  const flap=Math.sin(t)*(moving?6:2.5);
  for(const side of [-1,1]){const root0=[-1,side*4.5,34],elbow=[-3,side*15,40+flap],wrist=[-8,side*25,36+flap*1.2],tip=[-16,side*33,30+flap*1.4],trail=[[-20,side*24,24+flap*.6],[-17,side*14,25+flap*.3],[-11,side*6,28]];
   const arm=[root0,elbow,wrist,tip];for(let j=0;j<3;j++)tube(arm[j],arm[j+1],2.2-j*.5,C.whip,'chitin');tube(lerp(root0,elbow,.35),lerp(elbow,wrist,.45),2.5,C.team,'paint');tube(tip,add(tip,[-3,side*2,-4]),.6,C.claw,'bone');
   const ring=[root0,elbow,wrist,tip,...trail];for(let j=1;j<ring.length-1;j++)face([root0,ring[j],ring[j+1]],j%2?C.flesh:C.fleshD);
   for(let j=0;j<trail.length;j++){tube(wrist,trail[j],.8,LA,'chitin');tube(elbow,trail[j],.55,LB,'chitin');}
   for(let j=0;j<4;j++){const c=lerp(lerp(elbow,trail[1],.5),lerp(wrist,trail[0],.5),j/3);orb(add(c,[0,0,.4]),1.4,1.6,.3,C.fleshD);}
   sac(lerp(elbow,wrist,.5).map((q,i)=>i===2?q+1.2:q),2.1);}
 }
 if(spec.roots)for(let j=0;j<5;j++){const a=j*1.26;tube([-2,Math.sin(a)*3,4],[Math.cos(a)*14,Math.sin(a)*12,.4],1.3,C.whipD,'chitin');}
 if(kind!=='spitter'&&kind!=='binder'&&kind!=='flyer'&&attack&&phase===2){const h=hands[1];ctx.canvas.weaponMuzzle={x:h[0]*spec.scale,y:h[1]*spec.scale,z:h[2]*spec.scale};}
 M.part=null;M.finish();return true;
}
root.FractureSymbioteHostArt={render,roster,palette:C};
})(globalThis);
