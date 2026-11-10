'use strict';
// Original industrial machine silhouettes; geometry and poses do not alter unit behavior.
(function(root){
function render(ctx,d,f,angle,action,frame){
 if(f.id!=='machines')return false;
 const dir=Math.round(angle/(Math.PI/4))*Math.PI/4,m=new root.FractureSpriteMesh(ctx,dir,action==='dead').pose(d,action,frame),pi=Math.PI,phase=frame%4,walk=action==='walk'?Math.sin(frame*pi/3):0,attack=action==='attack',work=action==='gather'||action==='build',stroke=attack?[0,.65,1,.25][phase]:work?[0,.6,1,.3][phase]:0,breathe=Math.sin(frame*pi/3)*.35;
 const c={dark:'#252e34',black:'#151d22',shell:'#47545b',plate:'#65767c',edge:'#99aaa9',steel:'#b5c0b8',joint:'#3c474c',wire:'#66757a',red:'#dd4e43',redDark:'#782b2b',team:'#716c65'};
 const livery=root.FractureArt.unitLivery(d,f);c.shell=root.FractureArt.mixColor(c.shell,livery.primary,.55);c.plate=livery.primary;c.team=livery.trim;
 const mat=(name='metal')=>m.material(name),box=(x,y,z,w,l,h,col=c.shell)=>{mat();m.box(x,y,z,w,l,h,col);},seg=(a,b,col=c.edge,width=1.6)=>{mat();m.seg(a,b,col,width);},orb=(x,y,z,rx,ry,rz,col=c.joint)=>{mat();m.orb(x,y,z,rx,ry,rz,col);},face=(v,col=c.shell)=>{mat();m.face(v,col);};
 const tube=(a,b,r1,r2,col=c.edge,sides=8)=>{const v=b.map((q,j)=>q-a[j]),vl=Math.hypot(...v)||1;for(let j=0;j<3;j++)v[j]/=vl;const u=Math.abs(v[2])>.92?[1,0,0]:[-v[1],v[0],0],ul=Math.hypot(...u)||1;for(let j=0;j<3;j++)u[j]/=ul;const w=[v[1]*u[2]-v[2]*u[1],v[2]*u[0]-v[0]*u[2],v[0]*u[1]-v[1]*u[0]];mat();m.rings([a,b].map((p,k)=>Array.from({length:sides},(_,i)=>p.map((q,j)=>q+(u[j]*Math.cos(i*pi*2/sides)+w[j]*Math.sin(i*pi*2/sides))*(k?r2:r1)))),col);};
 const hull=(x,y,z,len,w,h,col=c.shell)=>{const ring=(xx,ww,hh,zz)=>[[-ww*.62,-hh],[-ww,-hh*.45],[-ww,hh*.45],[-ww*.58,hh],[ww*.58,hh],[ww,hh*.45],[ww,-hh*.45],[ww*.62,-hh]].map(([yy,vz])=>[xx,y+yy,zz+vz]);mat();m.rings([ring(x-len,w*.63,h*.76,z),ring(x-len*.55,w,h,z),ring(x+len*.5,w*.91,h*.87,z),ring(x+len,w*.43,h*.48,z-.3)],col);for(const side of [-1,1]){seg([x-len*.5,y+side*w*.64,z+h],[x+len*.45,y+side*w*.58,z+h*.87],c.edge,.65);face([[x-len*.45,y+side*w*1.01,z-.7],[x+len*.3,y+side*w*.95,z-.7],[x+len*.3,y+side*w*.95,z+1],[x-len*.45,y+side*w*1.01,z+1]],c.dark);}};
 const lens=(x,y,z,r=1.2,col=c.red)=>{tube([x-.8,y,z],[x+.6,y,z],r*1.55,r*1.4,c.black,10);tube([x+.65,y,z],[x+.95,y,z],r*1.04,r,col,10);m.material('glow');m.orb(x+1,y-.16,z+.16,.25,r*.48,r*.48,col);};
 const eyes=(x,y,z,scale=1)=>{lens(x,y,z,1.5*scale);lens(x-.5,y-2.7*scale,z+1.5*scale,.9*scale);lens(x-.5,y+2.7*scale,z+1.5*scale,.9*scale);lens(x-.2,y,z-2.6*scale,.7*scale);};
 const spine=(x,z,count=5,step=3.4,w=4)=>{seg([x,0,z],[x-(count-1)*step,0,z-1],c.dark,3);for(let j=0;j<count;j++){box(x-j*step,0,z-.6,j===0?1.5:1.2,w*(1-j*.045),2.4,j%2?c.plate:c.shell);seg([x-j*step,-w*.78,z+1.8],[x-j*step,w*.78,z+1.8],c.edge,.7);}};
 const cable=(pts,r=1.2,clamp=true)=>{for(let j=0;j<pts.length-1;j++){const a=pts[j],b=pts[j+1];tube(a,b,r*(1-j*.045),r*(.96-j*.045),j%2?c.joint:c.wire,8);if(clamp){const q=a.map((v,k)=>v+(b[k]-v)*.1),e=a.map((v,k)=>v+(b[k]-v)*.3);tube(q,e,r*1.22,r*1.16,c.edge,8);}}};
 const tendril=(a,b,end,bend,r=1.5,tool=false)=>{const pts=[];for(let j=0;j<=9;j++){const t=j/9,q=1-t;pts.push(a.map((v,k)=>v*q*q*q+3*b[k]*q*q*t+3*bend[k]*q*t*t+end[k]*t*t*t));}cable(pts,r);if(tool)claw(end,attack?stroke*.8:work?stroke*.5:0,r*1.1);return end;};
 const claw=(p,open=0,s=1.6)=>{const [x,y,z]=p;box(x,y,z-1,s*.7,s,2,c.dark);for(const side of [-1,1]){const a=[x,y+side*s,z],b=[x+3,y+side*(s+open*2),z-1.7],e=[x+5,y+side*(.35+open*2),z-3];tube(a,b,.7,.65,c.plate);tube(b,e,.65,.15,c.steel);}};
 const piston=(a,b,r=1.1)=>{const q=a.map((v,j)=>v+(b[j]-v)*.6);tube(a,q,r*1.45,r*1.4,c.dark);tube(q,b,r,r,c.steel);};
 const gun=(x,y,z,r=2.1,heavy=false)=>{const end=[26,y,z];hull(x+3,y,z,5,r*1.5,r*1.3,c.dark);tube([x+4,y,z],end,r,r*.84,c.plate);for(let j=0;j<3;j++){const xx=18+j*2.6;tube([xx,y,z],[xx+.7,y,z],r*1.16,r*1.16,j%2?c.dark:c.edge);}tube([25.8,y,z],[26,y,z],r*.69,r*.69,c.black);lens(25,y,z,r*.4,attack&&phase===2?'#e99273':'#9b3936');if(heavy)for(const side of [-1,1])seg([x+2,y+side*(r+1),z],[24,y+side*(r+1),z],c.edge,.8);};
 const emitter=(z=22,r=2)=>{gun(9,0,z,r);if(attack&&phase===2){m.material('glow');m.orb(26,0,z,r*.95,r*.7,r*.7,'#f3ac86');}};
 const thruster=(x,y,z,r=2.5,flying=false)=>{tube([x,y,z+4],[x,y,z],r*.85,r,c.dark,10);tube([x,y,z+.6],[x,y,z],r*1.12,r*1.12,c.plate,10);m.material('glow');m.orb(x,y,z-.4,r*.62,r*.62,.6,'#bd6556');if(flying){tube([x,y,z-.5],[x-walk*.7,y,z-(action==='walk'?5.5:3)],r*.55,.1,'#b6c5c1',8);}};
 const tread=(x,y,len=15,width=3.5,z=5)=>{const out=[[-len,-2.2],[-len+3,-4],[len-3,-4],[len,-2],[len,2],[len-3,4],[-len+3,4],[-len,2]],inn=[[-len+2,-1.3],[-len+4,-2.6],[len-4,-2.6],[len-2,-1.3],[len-2,1.3],[len-4,2.5],[-len+4,2.5],[-len+2,1.3]],side=y<0?-1:1,yy=y+side*width;box(x,y,z-3,len-1,width*.8,6,c.dark);for(let j=-len+4;j<len-3;j+=5){orb(x+j,yy,z,2.2,.5,2.2,c.plate);orb(x+j,yy+side*.5,z,.7,.2,.7,c.edge);}for(let j=0;j<out.length;j++){const a=out[j],b=out[(j+1)%8],q=inn[j],e=inn[(j+1)%8];face([[x+a[0],yy,z+a[1]],[x+b[0],yy,z+b[1]],[x+e[0],yy,z+e[1]],[x+q[0],yy,z+q[1]]],c.shell);face([[x+a[0],y-width,z+a[1]],[x+b[0],y-width,z+b[1]],[x+b[0],y+width,z+b[1]],[x+a[0],y+width,z+a[1]]],c.dark);const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3));for(let k=0;k<n;k++){const t=(k+.3+(action==='walk'?(frame%3)*.18:0))/n,xx=x+a[0]+(b[0]-a[0])*t,zz=z+a[1]+(b[1]-a[1])*t;seg([xx,y-width-.1,zz],[xx,y+width+.1,zz],c.plate,.8);}}};
 const leg=(side,heavy=false)=>{const sy=side*(heavy?10:7),stride=walk*side*(heavy?3.8:4.5),hip=[-2,sy,heavy?28:23],knee=[4-stride*.4,sy,heavy?17:13],ankle=[-1+stride,sy,5];tube(hip,knee,heavy?3.1:2.4,heavy?2.7:1.8,c.dark);hull(0,sy,heavy?22:18,5,heavy?3.6:2.8,heavy?4.2:3.4,c.plate);orb(...knee,heavy?2.7:2.1,heavy?3.1:2.4,heavy?2.7:2.1,c.shell);tube(knee,ankle,heavy?2.1:1.5,heavy?1.7:1.2,c.joint);piston([knee[0]-2,sy-side*2,knee[2]],[ankle[0]-1,sy-side*2,ankle[2]+1],heavy?1.1:.8);box(ankle[0]+2,sy,1,heavy?6.1:4.4,heavy?3.7:2.8,4,c.plate);for(let j=-1;j<=1;j++)seg([ankle[0]+7,sy+j*2,1.5],[ankle[0]+7,sy+j*2,4],c.edge,.65);};
 const radiator=(x,y,z,count=5,h=7)=>{box(x,y,z,3.5,count*1.1,h,c.dark);for(let j=0;j<count;j++)box(x,y+(j-(count-1)/2)*2.1,z+.8,4,.38,h-.8,c.plate);};
 switch(d.name){
 case 'Construction Drone':{
  hull(-2,0,15,10,7,5);spine(-1,20,4,3.1,3.8);eyes(8,0,17,.75);box(-7,0,8,4.5,5,4,c.dark);
  for(const side of [-1,1]){thruster(-3,side*5,7,2.3);const end=[19+stroke*3,side*(8-stroke*2),8+stroke*5];tendril([2,side*6,16],[8,side*12,23],[end[0],end[1],end[2]],[13,side*14,10],1.65,true);piston([0,side*7,15],[9,side*11,16],1);tendril([-9,side*3,15],[-17,side*8,14],[-20,side*(7+walk),4],[-25,side*11,4],.95);}
  if(work){m.material('glow');m.orb(23+stroke*3,6-stroke*2,8+stroke*5,.7,.7,1.3,'#f6be78');}break;}
 case 'Recon Spider':{
  hull(-2,0,11,15,4.3,3.6,c.dark);spine(-3,15,6,3.4,2.3);tube([1,0,11],[3,0,23],1.4,1.3,c.edge);hull(4,0,23,5,3.5,2.8,c.shell);eyes(9,0,23,.7);emitter(22,1.05);
  for(const side of [-1,1]){thruster(-5,side*3,5,1.6);tendril([-12,side*2,12],[-24,side*8,17],[-25+walk*2,side*14,3],[-25,side*17,6],.8);seg([-2,side*3,22],[-7,side*8,31],c.edge,.7);lens(-6,side*8,31,.6);}break;}
 case 'Blade Drone':{
  hull(0,0,20,7,6,5.5,c.dark);spine(-1,25,3,3,3);eyes(7,0,22,.85);for(const side of [-1,1]){thruster(-1,side*4,10,2.4);const elbow=[3,side*(13+stroke*2),24+stroke*6],hand=[14+stroke*5,side*(16-stroke*5),18+stroke*8];tube([0,side*5,22],elbow,2.6,2.1,c.plate);orb(...elbow,2.4,2.4,2.4,c.dark);tube(elbow,hand,1.7,1.3,c.edge);piston([1,side*7,20],[hand[0]-2,hand[1],hand[2]-1],.8);face([[hand[0]-2,hand[1],hand[2]+3],[hand[0]+4,hand[1]+side*2,hand[2]+1],[hand[0]+10,hand[1]+side*1,hand[2]-10],[hand[0]+4,hand[1],hand[2]-5]],c.steel);face([[hand[0]-2,hand[1]-.7,hand[2]+3],[hand[0]+4,hand[1]+side*2,hand[2]+1],[hand[0]+4,hand[1],hand[2]-5]],c.plate);tendril([-5,side*3,18],[-14,side*6,15],[-18+walk*2,side*8,4],[-19,side*11,8],1);}
  break;}
 case 'Pulse Sentry':{
  for(const side of [-1,1])tread(-2,side*8,11,2.5,5);hull(-2,0,14,10,7,5,c.shell);hull(2,0,21,9,5.5,4.5,c.plate);eyes(10,0,26,.7);emitter(22,2.4);radiator(-10,0,16,5,8);for(const side of [-1,1]){box(-1,side*6,17,3,1.5,6,c.dark);lens(3,side*7,20,.7);}break;}
 case 'Repair Drone':{
  hull(-1,0,15,8,8,4,c.plate);box(-5,0,8,5,5,5,c.dark);for(const side of [-1,1]){thruster(-3,side*6,6,2);for(let j=0;j<2;j++)tendril([j*4-3,side*6,17],[4+j*3,side*(11+j*2),26],[17+stroke*2,side*(7+j*6),14+j*7],[14,side*(16+j*3),18+stroke*4],j?1:1.4,true);}
  tube([-4,0,17],[-4,0,33],1.8,1.4,c.edge);for(let j=0;j<3;j++){box(-4,-5+j*5,29,1.1,1.5,7,c.plate);lens(-2.8,-5+j*5,33,.8,j===1?'#cfae69':c.red);}emitter(22,1.25);break;}
 case 'Interceptor Drone':{
  hull(1,0,24,18,5,4.2,c.dark);face([[18,0,25],[2,-7,28],[-12,-9,23],[-4,0,20]],c.plate);face([[18,0,25],[2,7,28],[-12,9,23],[-4,0,20]],c.shell);spine(-1,28,6,3,2.8);eyes(14,0,25,.68);emitter(22,1.7);
  for(const side of [-1,1]){hull(-9,side*10,23,7,3,3,c.plate);thruster(-12,side*10,18,2.6,true);thruster(-3,side*7,19,1.7,true);piston([-3,side*5,24],[-7,side*10,24],1);tendril([-15,side*3,24],[-21,side*4,25],[-28,side*(5+walk),20],[-24,side*6,19],.8);}break;}
 case 'Heavy Walker':{
  for(const side of [-1,1])leg(side,true);hull(-2,0,32,11,10,7,c.dark);hull(1,0,39,8,7,4,c.plate);eyes(9,0,40,1.05);spine(-3,40,4,3.3,5);emitter(30,2.7);
  for(const side of [-1,1]){hull(-3,side*12,32,5,3.7,5,c.shell);const e=[5,side*15,25],hand=[15+stroke*2,side*13,27+stroke*2];tube([-1,side*12,32],e,2.5,2.2,c.plate);tube(e,hand,2,1.7,c.dark);piston([0,side*14,31],[12,side*14,27],1);claw(hand,stroke,2);radiator(-10,side*5,30,3,11);}
  break;}
 case 'Siege Crawler':{
  for(const side of [-1,1])tread(-3,side*11,19,3.4,5);hull(-3,0,13,18,9,5,c.dark);box(-6,0,17,9,7,4,c.plate);hull(3,0,22,10,5.8,5.2,c.shell);emitter(22,3.4);radiator(-14,0,18,6,13);spine(-4,30,4,3.4,6);
  for(const side of [-1,1]){piston([-9,side*6,17],[15,side*6,22],1.4);tendril([-12,side*6,25],[-20,side*9,20],[-7,side*9,12],[-21,side*11,12],1.5);lens(-4,side*8,25,.8);}break;}
 case 'Sentinel':{
  hull(-3,0,32,10,8,7,c.dark);spine(-1,39,5,3.1,4.5);eyes(7,0,34,1.2);hull(10,0,24,7,4,3,c.plate);emitter(22,1.9);
  for(const side of [-1,1]){tendril([1,side*6,29],[8,side*22,32],[21+stroke*2,side*(19-stroke*3),13+stroke*6],[8,side*29,10+walk*2],1.7,true);tendril([-4,side*7,30],[-12,side*27,30],[-23,side*(20+walk),12],[-27,side*29,12],1.5,true);tendril([-10,side*3,31],[-19,side*10,31],[-29,side*9,19+breathe],[-31,side*17,17],1.2,true);thruster(-6,side*4,24,2,true);}break;}
 case 'Hunter-Killer':{
  hull(-2,0,16,17,6,5,c.dark);for(const side of [-1,1]){face([[-13,side*6,18],[-6,side*13,22],[16,side*11,19],[21,side*5,14],[4,side*7,12]],c.plate);face([[-6,side*13,22],[16,side*11,19],[14,side*12,13],[-7,side*13,14]],c.shell);seg([-6,side*13,22],[15,side*11,19],c.edge,.8);thruster(-5,side*9,6,2.6);tendril([-13,side*4,17],[-24,side*11,16],[-28,side*(12+walk*2),4],[-31,side*16,6],1.25);lens(15,side*8,19,.9);}
  hull(7,0,23,6,4,3,c.shell);eyes(13,0,25,.8);emitter(22,2.2);spine(-3,22,7,3.3,3);break;}
 case 'Command Relay':{
  for(const side of [-1,1])tread(-2,side*7,9,2.6,4.8);hull(-2,0,12,9,7,4.2,c.dark);tube([-3,0,13],[-3,0,48],2.6,1.4,c.edge,10);box(-3,0,20,3,3,18,c.shell);for(let j=0;j<3;j++){const z=30+j*7,w=13-j*2;box(-3,0,z,1.4,w,3.3,c.plate);for(const side of [-1,1]){box(-3,side*(w-1),z-2,2,2,7,c.dark);lens(-.7,side*(w-1),z+2,.9);}seg([-3,-w,z+3.6],[-3,w,z+3.6],c.steel,.6);}lens(-.5,0,49,1.3);seg([-3,0,48],[-3,0,56],c.edge,.65);emitter(22,1.15);for(const side of [-1,1])tendril([-7,side*3,21],[-22,side*9,23],[-16,side*11,4],[-26,side*15,9],1.15);break;}
 case 'Juggernaut':{
  for(const side of [-1,1]){tread(-10,side*14,11,3.7,5);tread(12,side*14,10,3.7,5);}hull(-1,0,17,20,11,7,c.dark);hull(-5,0,29,13,10,8,c.shell);hull(-3,0,37,9,7.5,4.2,c.plate);eyes(6,0,39,1.25);emitter(30,3.8);spine(-4,42,4,3.3,6);
  for(const side of [-1,1]){hull(3,side*11,27,10,3.5,5,c.plate);piston([-7,side*11,21],[17,side*10,28],1.6);radiator(-15,side*7,24,4,13);gun(10,side*9,27,1.6);tendril([-12,side*8,31],[-26,side*15,29],[-16,side*16,12],[-28,side*22,15],1.65);lens(11,side*10,32,.8);}break;}
 default:return false;
 }
 m.finish();return true;
}
root.FractureMachineArt={render};
})(globalThis);