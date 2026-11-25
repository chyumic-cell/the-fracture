'use strict';
// Symbiotes are a distributed weave of vascular strands inhabiting fused bodies.
(function(root){
// Between plant and fungus: root-bark bodies, pale mycelial threads and dry mould blooms.
// Converted-host palette (November 2026): maroon flesh, amber porous lattice, olive spore sacs.
const BASE={body:'#4a2318',deep:'#2a120c',shadow:'#3a1a12',tissue:'#6b3428',strand:'#c99a3a',thread:'#9a6a24',violet:'#e2c45e',core:'#f0d27a',plate:'#5a3022',sac:'#8c8838',sacL:'#c2b95a'};
// Shared vascular anatomy, distinct host tissue and signaling colors by battlefield role.
const hostPalettes={
 Harvester:['#6e7156','#8a8c62','#d6cfae','#b6ad84'],Prowler:['#55665c','#6f8470','#c7d2b4','#9aad92'],
 Talon:['#6a5c46','#8e7a52','#dccfa8','#c08f52'],'Spore Dart':['#56684f','#728a5e','#cfd9ae','#9db289'],
 Listener:['#5d6456','#7b8468','#d2cfb0','#a8ab8a'],Husk:['#7a7a68','#97957c','#d9d1b4','#b0a98d'],
 Stalker:['#4e5750','#68736a','#bcc3ad','#8d9887'],Spitter:['#6f6244','#9a8550','#ded0a0','#c08f4a'],
 Brute:['#6b5f4b','#8d7a56','#d3c6a2','#b8803f'],'Carapace Beast':['#4f5c4e','#6d7c63','#c3cbaa','#8ea283'],
 'Spore Flyer':['#616b5f','#808d72','#cdd4b6','#a2ae92'],'Neural Binder':['#5f6260','#7d8178','#d0cfc2','#a9a2b0'],
 'Root Colossus':['#5d6648','#7d8a5a','#c9cfa4','#9aa578']
};
function unitPalette(d){return BASE;const p=hostPalettes[d.name];if(!p)return BASE;const tint=root.FractureArt.tint;return {...BASE,body:p[0],deep:tint(p[0],-22),shadow:tint(p[0],-10),tissue:p[1],strand:p[2],thread:p[3],plate:tint(p[0],10),violet:tint(p[3],35),core:tint(p[2],25)};}
const norm=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
function kit(M,time=0,C=BASE){
 const orb=(x,y,z,rx,ry,rz,c=C.body,m='skin')=>{M.material(m==='skin'?'mold':m);M.orb(x,y,z,rx,ry,rz,c);};
 const seg=(a,b,w=1,c=C.strand,m='skin')=>{M.material(m==='skin'?'mold':m);M.seg(a,b,c,w);};
 const line=(p,w=1,c=C.strand,m='skin')=>{for(let j=1;j<p.length;j++)seg(p[j-1],p[j],w*(1-j/p.length*.3),c,m);};
 const cord=(points,radii,c=C.tissue)=>{
  // Round the bends into growing roots rather than angular scaffold tubes.
  if(points.length>2){const smooth=[],widths=[];for(let j=0;j<points.length-1;j++)for(let step=0;step<2;step++){const t=step*.5,p0=points[Math.max(0,j-1)],p1=points[j],p2=points[j+1],p3=points[Math.min(points.length-1,j+2)];smooth.push(p1.map((v,k)=>.5*((2*v)+(-p0[k]+p2[k])*t+(2*p0[k]-5*v+4*p2[k]-p3[k])*t*t+(-p0[k]+3*v-3*p2[k]+p3[k])*t*t*t)));widths.push(radii[j]+(radii[j+1]-radii[j])*t);}smooth.push(points[points.length-1]);widths.push(radii[radii.length-1]);points=smooth;radii=widths;}
  const rings=points.map((p,j)=>{const a=points[Math.max(0,j-1)],b=points[Math.min(points.length-1,j+1)],axis=norm(b.map((q,k)=>q-a[k])),u=norm(Math.abs(axis[2])>.9?[1,0,-axis[0]/(axis[2]||1)]:[-axis[1],axis[0],0]),v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]];return Array.from({length:8},(_,k)=>p.map((q,i)=>q+radii[j]*(u[i]*Math.cos(k*Math.PI/4)+v[i]*Math.sin(k*Math.PI/4))));});M.material('mold');M.rings(rings,c,true);if(Math.max(...radii)>2.2){for(const side of [0,3,6])line(rings.map((r,j)=>r[(side+j*2)%8]),Math.min(1.2,.6+Math.max(...radii)*.06),side===3?C.thread:C.strand);}};
 // Pulses travel through small vascular knots; the supporting host never inflates.
 const node=(x,y,z,r=1.7)=>{const pulse=.5+.5*Math.sin(time*2+x*.31+y*.47+z*.19);r*=.57+pulse*.13;orb(x,y,z,r*1.25,r*.64,r*.75,C.thread,'mold');orb(x+r*.65,y+r*.32,z+r*.26,r*.55,r*.42,r*.4,root.FractureArt.mixColor(C.strand,C.violet,pulse*.35),'skin');};
 const weave=(x,y,z,rx,ry,rz,c=C.body,n=5)=>{
  // An asymmetric, fluted host with collapsed sides, never a sphere with a wire cage.
  const seed=x*.31+y*.27+z*.41,large=Math.max(rx,ry,rz)>7;
  const surface=(t,a,offset=0)=>{
   const bulge=Math.sqrt(Math.max(.006,1-t*t)),fold=.86+.085*Math.sin(a*3+t*4+seed)+.045*Math.sin(a*7-t*5+seed*.7),waist=1-.17*Math.exp(-(((t-.12)*4)**2));
   return [x+rx*.1*Math.sin(t*3+seed)+Math.cos(a)*(rx*bulge*fold*waist+offset),y+ry*.08*Math.sin(t*5-seed)+Math.sin(a)*(ry*bulge*fold*.85+offset),z+rz*t-.1*rz*Math.sin(a*2+seed)*bulge];
  };
  const rings=Array.from({length:11},(_,j)=>Array.from({length:16},(_,k)=>surface(-.98+j*.196,k*Math.PI/8)));
  M.material('mold');M.rings(rings,c,true);
  // A connected root network: irregular forks reconnect to neighboring trunks.
  // Embedded ends and lifted bends retain the net idea without a manufactured cage.
  const rootColor=root.FractureArt.mixColor(C.tissue,C.strand,.37),rootCount=large?Math.min(M.unit?3:6,n):M.unit?1:3,trunks=[];
  for(let j=0;j<rootCount;j++){
   const points=[],a=seed+j*2.399;
   for(let k=0;k<7;k++){const t=-.83+k*.265,angle=a+Math.sin(k*.87+j*1.23)*.61+Math.sin(k*1.83+j)*.16;points.push(surface(t,angle,k===0||k===6?-.25:large?.28:.12));}
   const strength=large?Math.min(2.05,.85+rx*.055):.6;
   const radii=[.33,.76,1,.78,.92,.56,.19].map((v,k)=>v*strength*(1+.065*Math.sin(time*2-k*.95+j)));
   cord(points,radii,j%3===0?C.thread:rootColor);trunks.push(points);
  }
  for(let j=0;j<rootCount;j++){
   const trunk=trunks[j],next=trunks[(j+1)%rootCount],a=trunk[2+j%2],b=next[4-j%2],bend=surface(-.05+(j%3)*.17,seed+j*2.399+.8,.6);
   cord([a,bend,b],[large?.74:.38,large?.54:.25,.15],j%2?C.strand:rootColor);
   const end=surface(-.68,seed+j*2.399+.55,-.1);cord([trunk[3],surface(-.34,seed+j*2.399+.73,.55),end],[large?.58:.3,.34,.08],rootColor);
   if(large&&j%2===0){const q=trunk[4],aa=seed+j*2.399;cord([q,[q[0]+Math.cos(aa)*2.1,q[1]+Math.sin(aa)*2.1,q[2]+1.1],[q[0]+Math.cos(aa+.55)*3.3,q[1]+Math.sin(aa+.55)*3.3,q[2]+2.9]],[.6,.34,.035],C.strand);}
  }
  // Uneven powdery colonies and torn films cling to folds, leaving dark exposed tissue.
  const pale=root.FractureArt.mixColor(C.tissue,'#d8a640',.55),count=large?n*(M.unit?1:3):M.unit?2:7;
  for(let j=0;j<count;j++){
   const a=j*2.399+seed,t=-.75+((j*.371+seed*.017)%1+1)%1*1.45;
   const path=[];for(let k=0;k<5;k++){const tt=Math.max(-.96,Math.min(.96,t+(k-2)*.105)),aa=a+Math.sin(k*1.7+j)*.13+k*.12;path.push(surface(tt,aa,.22));}
   line(path,large?.62:.38,j%4===0?C.thread:pale,'mold');
   // Forked, loose hyphae: no opposed spirals or repeated diamond netting.
   const base=path[2],tip=surface(Math.max(-.97,t-.31),a+.42,.7);
   tip[2]-=large?1.4:.5;line([base,[(base[0]+tip[0])*.5,(base[1]+tip[1])*.5,base[2]-.7],tip],.24,pale,'mold');
   if(large&&j%3===0){M.material('mold');M.face([surface(t,a,.14),surface(Math.min(.94,t+.21),a+.07,.16),surface(t+.04,a+.34,.16),surface(t-.09,a+.17,.2)],root.FractureArt.mixColor(c,pale,.38));}
   if(large&&j%4===1){const q=path[1],sway=Math.sin(time*2+j)*.55;line([q,[q[0]+Math.cos(a)*1.6,q[1]+Math.sin(a)*1.6,q[2]-1.5],[q[0]+Math.cos(a)*2.2+sway,q[1]+Math.sin(a)*2.2,q[2]-3.7]],.29,pale,'mold');}
  }
  if(large){
   // Loose mycelium spreads beyond the host silhouette in ragged, hanging bundles.
   for(let j=0;j<(M.unit?1:4);j++){
    const a=j*2.399+seed,t=.56-Math.abs(Math.sin(j*1.91))*.85,start=surface(t,a,.5),sway=Math.sin(time*2+j*.8)*.6;
    const mid=[start[0]+Math.cos(a)*2.1,start[1]+Math.sin(a)*2.1,start[2]-2.4],end=[start[0]+Math.cos(a)*3+sway,start[1]+Math.sin(a)*3,start[2]-Math.min(7,rz*.42)];
    line([start,mid,end],.58,pale,'mold');
    for(let k=0;k<3;k++){const tip=[end[0]+Math.cos(a+k)*2.1,end[1]+Math.sin(a-k)*1.9,end[2]-1-k*.6];line([mid,[end[0]+k*.5,end[1]-k*.4,end[2]+1],tip],.3,k%2?C.thread:pale,'mold');}
    const patch=surface(t,a+.16,.35);orb(...patch,.65,.5,1.5,pale,'mold');
   }
   const q=surface(.14,seed,.2);node(...q,Math.min(1.6,rx*.13));
   // Olive spore sacs in an amber net cluster on the upper flanks.
   for(let j=0;j<(M.unit?2:4);j++){const a=seed+j*1.9+.6,p=surface(.35+j*.12,a,.4),r=Math.min(4.5,Math.max(1.6,rx*.18));orb(p[0],p[1],p[2]+r*.3,r,r,r*.95,C.sac||'#8c8838','chitin');orb(p[0]+r*.3,p[1]-r*.25,p[2]+r*.8,r*.35,r*.3,r*.25,C.sacL||'#c2b95a','chitin');for(let k=0;k<4;k++){const b=k*Math.PI/2+a;seg([p[0]+Math.cos(b)*r,p[1]+Math.sin(b)*r,p[2]+r*.3],[p[0]+Math.cos(b+.9)*r*.6,p[1]+Math.sin(b+.9)*r*.6,p[2]+r*1.15],.35,C.thread,'mold');}}}
 };
 const limb=(a,b,w,c=C.tissue)=>{
  const delta=b.map((q,k)=>q-a[k]),axis=norm(delta),u=norm(Math.abs(axis[2])>.9?[1,0,0]:[-axis[1],axis[0],0]);
  const mid=a.map((q,k)=>q+delta[k]*.48+u[k]*w*.12);
  // A continuous flexor/extensor mass supports the host, with smaller superficial roots.
  const upper=a.map((q,k)=>q+delta[k]*.23+u[k]*w*.13),lower=a.map((q,k)=>q+delta[k]*.73-u[k]*w*.04);
  cord([a,upper,mid,lower,b],[w*.38,w*.46,w*.43,w*.3,w*.24],root.FractureArt.mixColor(c,C.deep,.17));
  for(const sign of [-1,1]){
   const off=u.map(q=>q*w*.28*sign),origin=a.map((q,k)=>q+off[k]*.55),belly=mid.map((q,k)=>q+off[k]),end=b.map((q,k)=>q+off[k]*.4);
   cord([origin,belly,end],[w*.18,w*.23,w*.1],root.FractureArt.mixColor(c,C.body,.35));
  }
  for(const side of [-1,1]){const off=u.map(v=>v*w*.19*side),pts=[a.map((q,k)=>q+off[k]),mid.map((q,k)=>q+off[k]*1.5),b];line(pts,Math.max(.32,w*.065),side<0?C.thread:C.strand,'mold');const q=pts[1];line([q,[q[0]+off[0]*1.5,q[1]+off[1]*1.5,q[2]-w*.5]],.25,C.strand,'mold');}
 };
 // Structural tissue joins are drawn into both host and appendage, not floating decoration.
 const graft=(a,b,w=3)=>{
  const mid=a.map((q,k)=>(q+b[k])*.5+(k===2?1:0));
  cord([a,mid,b],[w*.67,w*.56,w*.58],C.body);
  const axis=norm(b.map((q,k)=>q-a[k])),side=norm(Math.abs(axis[2])>.9?[1,0,0]:[-axis[1],axis[0],0]);
  for(const sign of [-1,1]){const offset=side.map(v=>v*w*.35*sign),aa=a.map((q,k)=>q+offset[k]),bb=b.map((q,k)=>q+offset[k]*.6);line([aa,mid.map((q,k)=>q+offset[k]),bb],.44,C.strand,'mold');}
 };
 const hand=(p,spread=3,reach=7,up=0)=>{
  // Flattened metacarpal pad and hooked digits share embedded knuckle roots.
  cord([[p[0]-2,p[1],p[2]+.4],p,[p[0]+2.4,p[1],p[2]-.3]],[1.7,2,1.3],C.body);
  for(let j=-1;j<=1;j++){
   const base=[p[0]+1,p[1]+j*1.35,p[2]],knuckle=[p[0]+reach*.45,p[1]+j*spread*.7,p[2]+up+1.1],hook=[p[0]+reach*.83,p[1]+j*spread,p[2]+up+.25],tip=[p[0]+reach,p[1]+j*spread,p[2]+up-1.25];
   cord([base,knuckle,hook,tip],[1.1,.85,.48,.06],root.FractureArt.mixColor(C.tissue,C.strand,.25));
   line([base,knuckle,hook],.24,C.thread,'mold');
  }
 };
 const head=(x,y,z,s=1)=>{
  const mix=root.FractureArt.mixColor,skin=mix(C.tissue,C.strand,.34),jaw=mix(C.body,C.tissue,.55);
  // A single recognizable cranium, face and lower jaw, supported by a short neck.
  graft([x-3*s,y,z-8*s],[x-.5*s,y,z-3.6*s],3.4*s);
  M.material('mold');M.loft([[x+.3*s,y,z-3.2*s,2.2*s,2.4*s],[x+.2*s,y,z-.5*s,3.5*s,3.4*s],[x-.6*s,y,z+3*s,3.8*s,3.3*s],[x-1.2*s,y,z+5*s,2.9*s,2.7*s],[x-1.4*s,y,z+5.6*s,1.3*s,1.6*s]],skin,18);
  M.loft([[x+2.7*s,y,z-4*s,1.5*s,2*s],[x+3*s,y,z-2.8*s,2.5*s,2.8*s],[x+2.7*s,y,z-1.8*s,2.3*s,2.6*s]],jaw,14);
  // Recessed sockets and brow ridges point in the same direction as the mouth.
  for(const side of [-1,1]){
   orb(x+2.8*s,y+side*2.2*s,z+.9*s,1.1*s,.9*s,.85*s,C.deep,'mold');
   orb(x+3.5*s,y+side*2.35*s,z+.95*s,.35*s,.5*s,.38*s,mix(C.strand,'#d8d3a8',.55),'skin');
   cord([[x+.3*s,y+side*3*s,z+2*s],[x+2.7*s,y+side*2.5*s,z+2.15*s],[x+3.4*s,y+side*1.5*s,z+1.75*s]],[.65*s,.75*s,.3*s],jaw);
   cord([[x-2.6*s,y+side*2.1*s,z+3.6*s],[x-3.4*s,y+side*3.1*s,z],[x-2*s,y+side*2.3*s,z-4.8*s]],[.55*s,.45*s,.18*s],C.thread);
  }
  M.face([[x+4.8*s,y-1.9*s,z-1.8*s],[x+5.2*s,y,z-1.5*s],[x+4.8*s,y+1.9*s,z-1.8*s],[x+4.6*s,y+1.7*s,z-2.6*s],[x+4.9*s,y,z-2.9*s],[x+4.6*s,y-1.7*s,z-2.6*s]],C.deep);
  for(const side of [-1,1])cord([[x+4.85*s,y+side*1.3*s,z-1.85*s],[x+4.8*s,y+side*1.2*s,z-2.55*s]],[.22*s,.03*s],C.strand);
 };
 const ribs=(x,y,z,w,h,count=6)=>{for(let j=0;j<count;j++){const zz=z+j*h/count;for(const side of [-1,1]){const a=[x-2, y+side*w*(.50+Math.sin(j*2.9)*.07),zz+2],b=[x+w*.30,y+side*w*(.62+Math.cos(j*1.8)*.07),zz+Math.sin(j)*1.7],c=[x+w*.53,y+side*w*.23,zz-2.3];line([a,b,c],.68,j%3?C.strand:C.thread,'mold');line([b,[b[0]+1,b[1]+side*1.1,b[2]-2.2],[c[0]-1,c[1]+side*2,c[2]-3.5]],.35,C.thread,'mold');}}};
 const port=(from,width=4,p=[19,0,20])=>{width*=1+.025*Math.sin(time*2+from[2]*.3);graft([from[0]-5,from[1]*.65,from[2]-2],from,width);cord([from,[(from[0]+p[0])*.5,(from[1]+p[1])*.5,Math.max(from[2],p[2])+3],p],[width,width*.78,width*.45],C.tissue);orb(p[0]+.2,p[1],p[2],.7,width*.55,width*.55,C.deep);node(p[0]+.65,p[1],p[2],width*.23);for(const s of [-1,1])line([from,[p[0]-5,p[1]+s*width*.65,p[2]+width*.4],[p[0],p[1]+s*width*.4,p[2]]],.8,C.thread);};
 const roots=(x,y,z,r=20,count=6)=>{for(let j=0;j<count;j++){const a=j*Math.PI*2/count+.25,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r*.75;cord([[x+Math.cos(a)*3,y+Math.sin(a)*3,z],[x+(xx-x)*.5,y+(yy-y)*.5,3],[xx,yy,.5]],[2.8,1.8,.2],j%2?C.tissue:C.thread);line([[x,y,z],[xx*.8+x*.2,yy*.8+y*.2,3],[xx+Math.cos(a+.7)*5,yy+Math.sin(a+.7)*4,.5]],.65,C.strand);}};
 const halo=(x,y,z,r=12,plane='yz',c=C.thread,w=1)=>{const pts=[];for(let j=0;j<=20;j++){const a=j*Math.PI/10,rr=r*(.88+Math.sin(j*1.7)*.08);pts.push(plane==='yz'?[x+Math.sin(j*2.3)*1.4,y+Math.cos(a)*rr,z+Math.sin(a)*rr]:[x+Math.cos(a)*rr,y+Math.sin(a)*rr,z+Math.sin(j*1.7)*1.6]);}for(let j=1;j<pts.length;j++){if(j%7!==0)line([pts[j-1],pts[j]],w*.6,c,'mold');if(j%3===0){const p=pts[j];line([p,[p[0]+1.2,p[1]-.6,p[2]-2],[p[0]+2+Math.sin(time+j)*.5,p[1]-1.1,p[2]-5]],.32,C.strand,'mold');}}};
 return {M,orb,seg,line,cord,node,weave,limb,hand,head,ribs,port,roots,halo,graft};
}
function renderUnit(ctx,d,f,angle,action,frame){if(action==='walkReady')action='walk';if(action==='ready'){action='attack';frame=0;}
 if(f.id!=='symbiotes')return false;
 // Converted-host bodies (concept sheets of November 2026) replace the older root-and-mould forms.
 if(root.FractureSymbioteHostArt?.render(ctx,d,f,angle,action,frame))return true;
 const C=unitPalette(d);
 const M=new root.FractureSpriteMesh(ctx,angle,action==='dead').pose(d,action,frame),K=kit(M,action==='dead'?0:frame*Math.PI/3,C),{orb,line,cord,node,weave,limb,hand,head,ribs,port,roots,halo,graft}=K;
 // Narrow ownership markings on host tissue preserve readable player color without neon body bands.
 M.ownership([{x:[-3,4],y:[-10,10],z:[18,20]},{x:[-6,-3],y:[-7,7],z:[26,30]}],['mold']);
 const moving=action==='walk',attack=action==='attack',work=action==='gather'||action==='build',phase=frame%4,walk=moving?Math.sin(frame*Math.PI/3):0,pulse=Math.sin(frame*Math.PI/3),reach=attack?[0,5,11,3][phase]:work?[0,5,-3,2][phase]:0,n=d.name;
 const arm=(side,shoulder,elbow,palm,w=4)=>{graft([shoulder[0]-1,0,shoulder[2]-3],shoulder,w);limb(shoulder,elbow,w);limb(elbow,palm,w*.82);hand(palm,w*.5,5,attack?1:-2);};
 const feet=(height,width=4,bulk=4)=>{for(const s of [-1,1]){const stride=walk*s*4,hip=[-1,s*width,height],knee=[-3-stride*.5,s*(width+.5),height*.52],foot=[stride+1,s*(width+1.3),2];graft([0,0,height+3],hip,bulk*.85);limb(hip,knee,bulk);limb(knee,foot,bulk*.76);cord([foot,[foot[0]+4,s*(width+1.6),1],[foot[0]+7,s*(width+2),.7]],[2.1,1.4,.14],C.tissue);}};
 const quad=(length,z,w=7,bulk=5)=>{for(const front of [-1,1])for(const s of [-1,1]){const x=front*length,stride=walk*s*front*3.5,hip=[x,s*w,z],elbow=[x+(front>0?-2:3)+stride*.4,s*(w+2),z*.55],foot=[x+2+stride,s*(w+3),2];graft([x*.65,0,z+4],hip,bulk*.9);limb(hip,elbow,bulk);limb(elbow,foot,bulk*.72);hand(foot,1.5,4,0);}};
 if(n==='Prowler'){
 quad(10,14,5,4.5);weave(-2,0,17,15,7,7,C.shadow,6);weave(8,0,18,7,8,8,C.body,5);head(15,0,21,.95);
 cord([[-14,0,17],[-24,2,13],[-29,6+walk*2,8],[-32,10,9]],[3,2,.9,.08],C.thread);for(const s of [-1,1])line([[-12,s*4,22],[-19,s*7,25],[-26,s*8,22]],.9,C.strand);port([10,0,20],2.6);
 }else if(n==='Spitter'){
 quad(8,12,7,5.6);weave(-3,0,17,13,10,11,C.tissue,6);weave(10,0,18,8,7,8,C.body,5);port([9,0,20],6);node(7,-5,20,2.2);
 for(const s of [-1,1]){cord([[-12,s*6,18],[-18,s*8,29],[-10,s*6,37],[0,s*4,28]],[1.8,1.4,.7,.1],C.thread);for(let j=0;j<5;j++)line([[-16+j*3,s*7,27+j*.8],[-8+j*2,s*8,18]],.7,C.strand);}
 }else if(n==='Carapace Beast'){
 quad(12,15,9,7);weave(-3,0,22,21,13,13,C.deep,7);head(17,0,21,1.2);port([11,0,21],4.2);
 // Broad fused plates sit inside the vascular net, never as insect body segments.
 for(const s of [-1,1]){M.material('slate');M.face([[-19,s*3,30],[-13,s*12,25],[4,s*13,25],[12,s*5,32],[0,s*2,37]],C.plate);for(let j=0;j<6;j++)cord([[-17+j*5,s*1.5,34+Math.sin(j)*2],[-14+j*4,s*5,34+Math.sin(j*2)*1.4],[-11+j*4,s*8,31],[-16+j*5,s*12,25]],[.45,1.2,.85,.25],j%2?C.thread:C.strand);node(-4,s*9,32,2.1);}
 cord([[-20,0,21],[-29,0,12],[-32,4,6]],[4,2,.15],C.thread);node(-2,0,36,2.7);
 }else if(n==='Spore Flyer'){
 const flap=pulse*(moving?5:2);weave(0,0,23,15,5,6,C.shadow,6);head(13,0,23,.9);port([11,0,23],3);
 for(const s of [-1,1]){const elbow=[-1,s*16,29+flap],tip=[-10,s*31,20+flap],edge=[[-22,s*23,13+flap*.6],[-24,s*13,12],[-17,s*5,15]];cord([[5,s*3,25],elbow,tip],[3.5,2,.12],C.tissue);M.material('cloth');M.face([[4,s*3,22],elbow,tip,...edge],C.shadow);for(let j=0;j<edge.length;j++){line([elbow,[-10,s*(11+j*5),19+flap*.4],edge[j]],1.1,j%2?C.thread:C.strand);node(edge[j][0],edge[j][1],edge[j][2],.8);}for(let j=0;j<4;j++)line([[2,s*(6+j*4),23+flap*.5],[-7,s*(9+j*4),19+flap*.5],[-17,s*(8+j*4),15]],.65,C.thread);}
 for(let j=-1;j<=1;j++)cord([[-12,j*3,20],[-24,j*5,10],[-30,j*7+walk*2,7],[-34,j*8,11]],[1.5,1,.5,.06],C.strand);node(0,0,28,2);
 }else if(n==='Neural Binder'){
 graft([-2,0,22],[-1,0,40],4);weave(-2,0,24,6,6,10,C.shadow,5);weave(-1,0,38,7,6,7,C.body,4);head(4,0,46,.92);node(3,-3,38,1.8);
 for(const s of [-1,1]){graft([-2,0,25],[0,s*5,29],2.8);cord([[-2,s*3,18],[-7,s*7,10],[-11,s*10,4],[-18,s*14,7+pulse]],[2.1,1.4,.7,.08],C.thread);cord([[0,s*5,29],[6,s*13,33+reach*.3],[17,s*11,23]],[2,1.3,.5],C.tissue);hand([17,s*11,23],2,6,2);line([[-2,s*4,43],[-8,s*14,50],[-13,s*18,41],[-9,s*16,27]],1.1,C.strand);node(-11,s*16,42,1.5);}
 halo(-3,0,39,15,'yz',C.thread,1.15);for(let j=0;j<6;j++){const a=j*Math.PI/3;line([[-3,Math.cos(a)*15,39+Math.sin(a)*15],[-1,Math.cos(a+.4)*3.5,40+Math.sin(a+.4)*4.5]],.6,C.strand);}port([2,0,28],2.8);node(5,0,27,1.5);
 }else if(n==='Root Colossus'){
 feet(28,10,10);weave(-3,0,39,13,14,19,C.deep,8);ribs(1,0,31,13,22,7);weave(-4,0,59,11,10,11,C.body,6);head(4,0,64,1.15);node(8,-2,42,3.5);
 for(const s of [-1,1]){graft([-3,0,43],[-1,s*14,48],6.5);weave(-1,s*14,48,8,7,9,C.plate,5);limb([-1,s*14,47],[5,s*19,31],9);limb([5,s*19,31],[14+reach*.25,s*17,18],8);hand([14+reach*.25,s*17,18],3,7,1);cord([[-9,s*8,50],[-16,s*12,68],[-9,s*9,74]],[3,1.8,.1],C.thread);node(-13,s*11,65,1.7);}
 roots(-4,0,18,25,5);port([9,0,34],4.5);for(let j=0;j<4;j++)line([[-9+j*4,-8,64],[-12+j*4,-12,70],[-8+j*4,-13,76]],.8,C.strand);
 }else if(n==='Brute'){
 feet(16,8,8);weave(-4,0,28,12,12,14,C.shadow,7);ribs(0,0,20,11,16,6);head(7,0,35,1.25);node(7,-2,25,2.4);
 for(const s of [-1,1]){graft([-4,0,29],[-1,s*11,34],5.8);weave(-1,s*11,34,7,6,8,C.body,5);limb([-1,s*11,33],[8,s*15,18],8);limb([8,s*15,18],[15+walk*s*2,s*14,5],7);hand([15+walk*s*2,s*14,5],2.8,6,1);cord([[-10,s*7,34],[-15,s*8,43],[-18,s*4,44]],[2.6,1.4,.08],C.thread);}port([7,0,28],4.5);
 }else{
 const harvester=n==='Harvester',husk=n==='Husk',stalker=n==='Stalker',talon=n==='Talon',listener=n==='Listener',dart=n==='Spore Dart',h=harvester?26:husk?29:stalker?36:listener?40:34,w=stalker?8:harvester?5:husk?4.5:5.7;
 feet(h*.43,harvester?4:stalker?6:4.4,stalker?6:harvester?4.3:3.8);
 weave(-1,0,h*.68,w,w*.9,h*.28,C.body,5);ribs(w*.1,0,h*.52,w,h*.3,5);head(3,0,h+2,stalker?1.15:harvester?1:1.08);node(w*.63,-w*.35,h*.73,harvester?1.3:1.65);
 for(const s of [-1,1]){const shoulder=[0,s*w,h*.85],elbow=[3+reach*.35,s*(w+5),h*.59],palm=[8+reach*.6,s*(w+4),harvester?9:husk?8:h*.43];arm(s,shoulder,elbow,palm,stalker?6.4:4.6);}
 if(harvester){weave(-6,0,22,5,7,8,C.shadow,4);for(const s of [-1,1])cord([[-5,s*4,25],[-4,s*5,21],[-2,s*4,17]],[.65,.5,.12],C.tissue);node(-8,-5,24,1.4);}
 if(talon){for(const s of [-1,1]){const x=10+reach*.6;cord([[x,s*8,17],[x+4,s*11,28],[x+7+reach*.2,s*10,39],[x+10,s*7,43]],[2.8,2,1.1,.08],C.strand);line([[x-1,s*8,18],[x+1,s*9,30],[x+7,s*9,39]],.9,C.thread);}}
 if(dart){weave(-6,-3,25,6,6,11,C.tissue,4);for(let j=0;j<3;j++)node(-9,-4+j*3,28+j,1.4);port([3,5,24],3.4);for(const s of [-1,1])cord([[-5,s*4,29],[-10,s*5,37],[-13,s*6,38]],[1.3,.8,.06],C.thread);}
 if(listener){for(const s of [-1,1]){cord([[-2,s*4,35],[-7,s*13,46],[-9,s*17,47],[-10,s*20,39]],[1.7,1.1,.7,.1],C.thread);for(let j=0;j<5;j++){const yy=s*(7+j*2.7),zz=43+Math.sin(j*.65)*5;line([[-2,s*3,33],[-7,yy,zz],[-9,s*(10+j*2),37]],.7,C.strand);if(j%2===0)node(-7,yy,zz,.9);}}port([2,4,28],2.6);}
 if(husk){for(const s of [-1,1]){cord([[-3,s*4,23],[-7,s*7,13],[-5,s*10,5]],[1.6,1,.08],C.thread);line([[-2,s*4,30],[-6,s*7,35],[-10,s*6,32]],.8,C.strand);}orb(5,0,30,1.6,2.3,1.1,C.deep);}
 if(stalker){for(const s of [-1,1]){M.material('slate');M.face([[-4,s*4,36],[-5,s*12,34],[1,s*15,24],[4,s*10,25],[2,s*5,32]],C.plate);weave(1,s*8,30,4.5,5,9,C.plate,4);cord([[6,s*10,18],[12+reach,s*12,22],[18+reach*.3,s*11,27]],[2.1,1.2,.08],C.strand);}node(6,-7,27,1.6);}
 }
 M.finish();return true;
}
function renderBuilding(ctx,d,f){
 if(f.id!=='symbiotes')return false;
 const livery=root.FractureArt.buildingLivery(d,f),mix=root.FractureArt.mixColor,C={...BASE,body:mix(BASE.body,livery.primary,.45),tissue:mix(BASE.tissue,livery.primary,.5),thread:mix(BASE.thread,livery.primary,.6)};
 const M=new root.FractureSpriteMesh(ctx,0,false,{originX:120,originY:181,logicalWidth:240}),{orb,line,cord,node,weave,limb,hand,head,ribs,port,roots,halo}=kit(M,0,C),kind=d.kind;
 const r=kind==='defense'?19:kind==='extractor'?27:40;
 // Root bundles reach the ground; free-standing lattice arches leave meaningful negative space.
 M.buildingFaction='symbiotes';
 roots(0,0,8,r,8);orb(0,0,1,r*.85,r*.62,2,C.deep,'skin');
 const arch=(x,y,w,h,z=3)=>{const a=[[x-w,y,z],[x-w*.93,y-1,z+h*.45],[x-w*.5,y-2,z+h*.86],[x,y,z+h],[x+w*.5,y+2,z+h*.86],[x+w*.93,y+1,z+h*.45],[x+w,y,z]];cord(a,[3.5,3,2.8,2.5,2.8,3,3.5],C.tissue);for(const s of [-1,1])line(a.map((p,j)=>[p[0]+s*1.4,p[1]+s*1.7,p[2]+Math.sin(j)*1.5]),1.1,s<0?C.thread:C.strand);};
 const bridge=(a,b,width=5)=>{cord([a,[(a[0]+b[0])*.5,(a[1]+b[1])*.5,Math.max(a[2],b[2])+8],b],[width,width*.8,width],C.body);line([a,[(a[0]+b[0])*.5,(a[1]+b[1])*.5,Math.max(a[2],b[2])+9],b],1.2,C.strand);};
 const vat=(x,y,rx,ry,h)=>{orb(x,y,3,rx,ry,3,C.shadow);(M.buildingFaction='symbiotes',M).material('skin');for(let j=0;j<20;j++){const a=j*Math.PI/10,b=(j+1)*Math.PI/10,A=[x+Math.cos(a)*rx*.86,y+Math.sin(a)*ry*.86,2],B=[x+Math.cos(b)*rx*.86,y+Math.sin(b)*ry*.86,2],U=[x+Math.cos(a)*rx,y+Math.sin(a)*ry,h],V=[x+Math.cos(b)*rx,y+Math.sin(b)*ry,h],I=[x+Math.cos(a)*rx*.78,y+Math.sin(a)*ry*.78,h-1],J=[x+Math.cos(b)*rx*.78,y+Math.sin(b)*ry*.78,h-1];M.face([A,B,V,U],C.body);M.face([U,V,J,I],C.tissue);M.face([I,J,[J[0],J[1],3],[I[0],I[1],3]],C.shadow);}for(let j=0;j<14;j++){const a=j*Math.PI/7,b=(j+1)*Math.PI/7;cord([[x+Math.cos(a)*rx,y+Math.sin(a)*ry,3],[x+Math.cos(a)*rx*1.02,y+Math.sin(a)*ry*1.02,h],[x+Math.cos(b)*rx,y+Math.sin(b)*ry,h]],[2,2.7,2.7],j%2?C.thread:C.tissue);}orb(x,y,h-3,rx*.83,ry*.83,1.4,C.deep);for(let j=0;j<5;j++)node(x+(j-2)*rx*.29,y+(j%2-.5)*ry*.6,h-1,j%2?1.5:2);};
 const pod=(x,y,z,rx,h)=>{weave(x,y,z+h*.5,rx,rx*.8,h*.5,C.body,6);for(const s of [-1,1])cord([[x+s*rx*.7,y,z],[x+s*rx*1.15,y-1,z+h*.55],[x+s*rx*.4,y,z+h+7]],[2.2,1.5,.08],C.thread);node(x+rx*.7,y-1,z+h*.6,2);};
 if(kind==='extractor'){
 if(d.resource==='oil'){vat(-8,0,20,17,11);pod(15,-8,4,9,34);for(let j=-1;j<=1;j++)bridge([-13,j*6,8],[13,-7+j*3,23],2.6);orb(-8,0,7,14,11,.8,'#252b32');}
 else if(d.resource==='ore'){vat(0,0,23,18,10);for(let j=0;j<5;j++){(M.buildingFaction='symbiotes',M).material('slate');M.box(-15+j*7,j%2*5-3,5,4,5,8+j%3*4,'#8b7c85');}for(const s of [-1,1]){arch(s*12,0,10,35);hand([s*16,9,20],3,8,-5);}}
 else{for(const s of [-1,1]){cord([[s*20,0,3],[s*18,-4,35],[s*8,0,58]],[5,3.5,.6],C.tissue);line([[s*20,0,3],[s*24,3,25],[s*12,5,51]],1.3,C.thread);}weave(0,0,29,9,9,d.resource==='rift'?21:15,C.shadow,6);node(0,-5,34,5);for(const z of [18,38,53])halo(0,0,z,z===53?8:14,'xy',C.strand,1.4);if(d.resource==='rift')node(0,0,55,2.4);}
 }else if(kind==='hq'){
 for(const y of [-17,13])arch(0,y,28,66);for(const s of [-1,1])bridge([s*28,-17,4],[s*28,13,4],6);weave(0,-2,40,18,14,26,C.body,9);ribs(6,-2,24,15,29,8);node(13,0,44,5);node(0,10,26,2.3);
 for(const s of [-1,1]){cord([[s*29,13,3],[s*38,10,35],[s*24,-3,76],[s*8,-5,82]],[6,4,2,.2],C.thread);bridge([s*27,8,22],[s*13,1,46],3.5);}vat(0,23,16,9,9);
 }else if(kind==='house'){
 for(let j=-1;j<=1;j++)pod(j*23,j===0?-5:5,3,j===0?11:9,j===0?43:31);for(const s of [-1,1])bridge([s*24,4,18],[0,-5,26],3);vat(0,22,17,10,7);
 }else if(kind==='depot'){
 vat(0,0,34,26,12);for(const s of [-1,1]){cord([[s*29,-12,3],[s*31,-17,28],[s*15,-10,39],[s*6,0,18]],[4,3,2,.8],C.tissue);node(s*25,-15,27,2.5);}for(let j=-1;j<=1;j++)bridge([j*15,24,8],[j*8,4,13],2.5);
 }else if(kind==='inf'){
 vat(0,0,34,24,10);for(const x of [-17,17]){arch(x,-4,12,36);weave(x,-4,23,6,5,12,C.shadow,4);head(x+2,-4,36,.7);node(x+5,-4,26,1.6);}for(const s of [-1,1])bridge([s*32,-12,10],[s*32,19,10],2.8);
 }else if(kind==='lab'){
 for(const s of [-1,1]){cord([[s*25,0,3],[s*30,-3,30],[s*19,-4,59],[s*7,0,65]],[5,4,2.5,.5],C.thread);bridge([s*22,7,20],[s*7,0,42],2.6);}weave(0,0,44,14,12,14,C.body,8);node(10,0,47,4);halo(0,0,45,21,'yz',C.strand,1.3);for(let j=-1;j<=1;j++)pod(j*16,21,3,4,15);
 }else if(kind==='counter'){
 vat(0,0,28,22,15);for(const y of [-14,9])arch(0,y,22,47);weave(0,1,28,10,9,17,C.shadow,7);head(4,3,45,1.3);for(const s of [-1,1]){limb([0,s*9,34],[s*9,s*16,19],5);bridge([s*24,11,14],[s*11,5,34],3);pod(s*32,-4,3,5,24);}node(7,8,31,3);
 }else if(kind==='armor'){
 for(const y of [-19,-4,12])arch(0,y,32,43);for(const s of [-1,1]){weave(s*29,-5,17,7,23,15,C.deep,7);for(let j=-1;j<=1;j++)bridge([s*31,j*14,5],[s*20,j*14,37],2.5);}weave(0,-6,23,14,11,10,C.plate,7);node(7,6,28,3.2);vat(0,25,20,10,7);
 }else if(kind==='air'){
 for(const x of [-26,0,26])cord([[x,0,3],[x*.6,-5,33],[x,-5,52]],[5,4,2],C.tissue);
 const corners=[[-41,-6,71],[-21,-17,59],[0,-10,74],[22,-17,60],[41,-4,72],[29,21,47],[0,24,54],[-29,20,47]];
 (M.buildingFaction='symbiotes',M).material('cloth');for(let j=0;j<corners.length;j++)M.face([[0,2,56],corners[j],corners[(j+1)%corners.length]],j%2?C.shadow:C.body);
 for(let j=0;j<corners.length;j++){line([[0,2,56],corners[j]],2,j%2?C.thread:C.strand);node(...corners[j],1.5);line([corners[j],corners[(j+1)%corners.length]],1.3,C.thread);}weave(0,-2,48,13,10,8,C.body,5);node(0,5,53,4);
 }else if(kind==='elite'){
 for(let j=0;j<4;j++){const a=j*Math.PI/2;cord([[Math.cos(a)*24,Math.sin(a)*20,3],[Math.cos(a+.5)*17,Math.sin(a+.5)*15,39],[Math.cos(a+1)*13,Math.sin(a+1)*12,76],[Math.cos(a+1.2)*6,Math.sin(a+1.2)*6,94]],[6,5,2.8,.12],j%2?C.thread:C.tissue);}
 weave(0,0,66,14,12,18,C.shadow,8);node(9,1,69,5);for(const z of [22,43,65,82])halo(0,0,z,z<50?17:13,'xy',C.strand,1.3);vat(0,22,16,11,10);
 }else if(kind==='defense'){
 weave(0,0,26,11,11,25,C.body,6);roots(0,0,18,22,5);cord([[0,0,34],[10,0,49],[30,0,50]],[7,5,2.6],C.tissue);orb(31,0,50,1,3.3,3.3,C.deep);node(31.4,0,50,1.3);for(const s of [-1,1])line([[-5,s*8,13],[0,s*12,32],[15,s*7,47],[30,s*2,50]],1.4,C.strand);node(5,-6,29,2.8);
 }else{vat(0,0,30,23,12);pod(0,-6,3,13,46);for(const s of [-1,1])arch(s*20,9,9,28);}
 root.FractureDetailArt?.building(M,d,f);M.finish();return true;
}
root.FractureSymbioteArt={renderUnit,renderBuilding,colonyKit:kit};
})(globalThis);