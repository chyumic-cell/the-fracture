'use strict';
// Additional authored geometry, kept in the same coordinate system as the original meshes.
(function(root){
function kit(M){
 const tint=root.FractureArt.tint;
 const box=(x,y,z,w,l,h,c,m='metal')=>{M.material(m);M.box(x,y,z,w,l,h,c);};
 const line=(a,b,c,w=.8,m='metal')=>{M.material(m);M.seg(a,b,c,w);};
 const orb=(x,y,z,rx,ry,rz,c,m='metal')=>{M.material(m);M.orb(x,y,z,rx,ry,rz,c);};
 const face=(v,c,m='metal')=>{M.material(m);M.face(v,c);};
 const tube=(x,y,z,r,h,c,m='metal',top=r)=>{M.material(m);M.cylinder(x,y,z,r,h,c,12,top);};
 const ring=(x,y,z,r,c,w=.7)=>{for(let i=0;i<12;i++){const a=i*Math.PI/6,b=(i+1)*Math.PI/6;line([x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z],c,w);}};
 const chain=(a,b,c,n=7)=>{for(let j=0;j<n;j++){const t=j/(n-1),p=a.map((v,k)=>v+(b[k]-v)*t+(k===2?-Math.sin(t*Math.PI)*2:0));orb(...p,.6,.6,.9,c);}};
 const fan=(x,y,z,r,c)=>{tube(x,y,z,r,1.2,'#28383e');ring(x,y,z+1.3,r,c);for(let j=0;j<6;j++){const a=j*Math.PI/3;face([[x,y,z+1.5],[x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.8,z+1.5],[x+Math.cos(a+.5)*r*.7,y+Math.sin(a+.5)*r*.7,z+1.5]],c);}tube(x,y,z+1.5,1,1,c);};
 return{tint,box,line,orb,face,tube,ring,chain,fan};
}
function building(M,d,f){
 const {tint,box,line,orb,face,tube,ring,chain,fan}=kit(M),kind=d.kind,style=f.style;
 const siblings=f.buildings.filter(b=>b.kind===kind),variant=Math.max(0,siblings.findIndex(b=>b.id===d.id));
 // Distinct production architecture is authored in the civilization renderers.
 const small=kind==='defense'||kind==='extractor',w=small?19:39,l=small?19:29,team=f.color;
 const industry=['industrial','machine'].includes(style),bio=style==='insect'||style==='fungal';
 if(industry){
  const dark=style==='machine'?'#26343e':'#42545b',metal=style==='machine'?'#758995':'#a5b1ad',lamp=style==='machine'?'#ed7968':'#c1d7ca';
  // Service cabinets, insulated conduits and bolted radiator grilles.
  box(w-4,-l+6,3,7,7,12,dark);box(w-4,-l+6,15,7.4,7.4,1.5,metal);fan(w-4,-l+6,17,4.5,metal);
  for(let j=0;j<4;j++)line([w+3.1,-l+2,6+j*2],[w+3.1,-l+10,6+j*2],metal,.5);
  for(const y of [-l+2,-l+10]){line([w+3,y,5],[w+7,y,5],dark,1.5);line([w+7,y,5],[w+7,l-7,5],metal,1.2);}
  for(const x of [-w+5,w-5]){box(x,l,3,3,3,8,dark);orb(x,l,12,1.1,1.1,1,lamp,'glow');}
  if(!small){
   // A protected service gantry remains outside the doorway and inside the footprint.
   for(let j=0;j<5;j++){const y=-18+j*9;line([w+1,y,4],[w+1,y,15],metal,.7);}
   for(const z of [9,15])line([w+1,-18,z],[w+1,18,z],metal,.75);
   if(['armor','inf','air','depot'].includes(kind)){
    for(let j=0;j<3;j++){box(-w+4+j*7,l-1,3,2.7,3,5,dark);line([-w+2+j*7,l+2.1,4],[-w+6+j*7,l+2.1,7],'#cbb877',.8);}
    box(w-8,l-1,5,5,2,3,dark);face([[w-12,l+1.1,6],[w-4,l+1.1,6],[w-4,l+1.1,7.5],[w-12,l+1.1,7.5]],team,'paint');
   }
   if(style==='machine')for(let j=0;j<3;j++){const x=-w+8+j*7;box(x,l-2,4,2,4,11+j*2,dark);for(let z=7;z<14+j*2;z+=3)line([x-1.8,l+2.1,z],[x+1.8,l+2.1,z],metal,.5);orb(x,l+2.4,8,.6,.3,.6,lamp,'glow');}
  }
 }else if(bio){
  if(style==='insect'){
   // Layered wax comb and breathing slits, not another generic spherical pod.
   for(const side of [-1,1])for(let j=0;j<3;j++){const x=side*(w-6),y=-8+j*9,z=5+j%2*3;
    M.material('chitin');const verts=Array.from({length:6},(_,k)=>[x+Math.cos(k*Math.PI/3)*4,y+Math.sin(k*Math.PI/3)*4,z]);
    M.face(verts,'#493c29');for(let k=0;k<6;k++)line(verts[k],verts[(k+1)%6],'#c2a76c',1.4,'chitin');
    line([x-3,y+1,z+1],[x+3,y+1,z+1],'#8d7949',.7,'chitin');
   }
   for(const s of [-1,1]){orb(s*(w-7),l-4,9,6,4,7,'#8b723c','chitin');for(let j=0;j<3;j++)line([s*(w-7)-3,l-.1,6+j*2],[s*(w-7)+3,l-.1,6+j*2],'#392f29',.8,'chitin');}
  }else{
   for(const s of [-1,1])for(let j=0;j<3;j++){
    const x=s*(w-7),y=-4+j*10;orb(x,y,5,4.5,3,5,'#634d61','skin');
    line([x,y,8],[x-s*6,y+4,2],'#b394a6',.8,'skin');orb(x+1,y+2,7,1.1,.8,1.1,'#d0b4ed','glow');
   }
  }
 }else if(style==='ape'){
  for(const s of [-1,1]){const x=s*(w-4);box(x,l-5,2,5,4,7,'#775739','wood');for(const z of [4,7])line([x-5,l-.8,z],[x+5,l-.8,z],'#c1a279',.7,'cloth');for(let j=-1;j<=1;j++)line([x+j*2.8,l-.7,3],[x+j*2.8,l-.7,8],'#4c382a',.5,'wood');}
  if(!small)for(const side of [-1,1]){line([side*(w+1),-12,2],[side*(w+1),-12,25],'#7e5b3a',2,'wood');line([side*(w+1),-12,25],[side*(w-8),-7,18],'#b59d72',.9,'cloth');for(let j=0;j<4;j++)line([side*(w+1)-2,-12,7+j*1.2],[side*(w+1)+2,-12,7+j*1.2],'#c5aa7b',.55,'cloth');}
 }else{
  const palette={reptile:['#b9a67b','#756b45','#dec78b'],wizard:['#aaa6ad','#626184','#ddc792'],elder:['#9fada0','#496859','#d1cdb2'],myth:['#c9c3ac','#777e71','#e5d7ac'],dragon:['#9e8870','#544e44','#d2b882'],night:['#9796a4','#4b485e','#bbb8c5'],demon:['#796565','#493e42','#c4a278']},[stone,dark,edge]=palette[style]||palette.myth;
  for(const side of [-1,1]){
   const x=side*(w-4),y=l-2;
   // Layered plinths, inset reliefs and capitals make the entrance architecture readable.
   box(x,y,3,4.5,4,3,stone,'stone');tube(x,y,6,2.8,15,stone,'stone',2.3);box(x,y,20,3.4,3,2,edge,'stone');
   for(let k=0;k<4;k++){const a=k*Math.PI/2;line([x+Math.cos(a)*2.8,y+Math.sin(a)*2.8,7],[x+Math.cos(a)*2.3,y+Math.sin(a)*2.3,19],edge,.4,'stone');}
   if(style==='reptile'){
    // Carved, plated serpent heads on stepped gate piers.
    box(x,y,22,4,3.5,3,dark,'stone');orb(x+1,y,26,4,3,2.7,stone,'stone');box(x+3,y,23,3,2.6,2,edge,'stone');orb(x+3,y+2.5,26,.8,.4,.6,'#c5d088','glass');
   }else if(style==='wizard'){
    tube(x,y,22,4,2,dark);ring(x,y,26,5,edge);orb(x,y,27,2.5,2.5,4,'#a5acd7','glass');line([x,y,22],[x,y,31],edge,.7);
   }else if(style==='elder'){
    for(let j=0;j<4;j++){const z=8+j*4;line([x+2.7,y,7],[x+3,y+2,z],dark,.7,'wood');face([[x+3,y+2,z],[x+7,y+2,z+3],[x+5,y+5,z+2]],j%2?'#76916a':'#9da779','cloth');}
    orb(x,y,24,2.8,2.8,3.5,edge,'stone');
   }else if(style==='night'){
    tube(x,y,22,3.5,12,dark,'slate',.2);line([x,y,29],[x,y,38],edge,.7);line([x-2,y,34],[x+2,y,34],edge,.65);
   }else if(style==='demon'||style==='dragon'){
    tube(x,y,22,4,2,dark,'metal',5);orb(x,y,26,1.5,1.5,3,'#e2a36b','glow');for(let j=0;j<4;j++){const a=j*Math.PI/2;line([x+Math.cos(a)*3,y+Math.sin(a)*3,24],[x+Math.cos(a)*4,y+Math.sin(a)*4,29],edge,1);}
   }else{orb(x,y,24,3.5,3.5,3.5,edge,'stone');for(let j=-1;j<=1;j++)line([x-2+j*2,y+3,24],[x-2+j*2,y+3,27],stone,.6,'stone');}
  }
  if(!small){
   for(const side of [-1,1]){const x=side*(w-2);box(x,0,3,3,11,4,dark,'stone');box(x,0,7,3.5,11.5,1,edge,'stone');for(let j=-1;j<=1;j++){face([[x+3.6,j*6-2,4],[x+3.6,j*6+2,4],[x+3.6,j*6+2,6],[x+3.6,j*6-2,6]],stone,'stone');}}
   if(style==='demon')for(const s of [-1,1])chain([s*(w-4),l-2,20],[s*(w-12),l+1,4],edge,8);
  }
 }
}

function emblem(M,p,size,faction){
 const [x,y,z]=p,c='#e5c36d',dark='#98702b',q=(u,v)=>[x,y+u*size,z+v*size];
 M.material('metal');const stroke=(a,b,w=.36)=>M.seg(q(...a),q(...b),c,w),plate=vs=>M.face(vs.map(v=>q(...v)),c);
 if(faction==='wizards'||faction==='night'){
  const n=faction==='wizards'?6:4,vs=[];for(let i=0;i<n*2;i++){const a=i*Math.PI/n,r=i%2?.32:1;vs.push([Math.sin(a)*r,Math.cos(a)*r]);}plate(vs);
  M.orb(x+.2,y,z,.35,.65,.65,faction==='wizards'?'#e5ebef':'#ab3f52');
 }else if(faction==='elders'){
  stroke([0,-1],[0,1]);for(const side of [-1,1])for(let j=0;j<3;j++)plate([[0,-.5+j*.45],[side*.8,-.3+j*.45],[side*.4,.1+j*.45]]);
 }else if(faction==='reptilians'||faction==='dragons'){
  plate([[-.7,.7],[0,1.2],[.7,.7],[.25,.15],[.6,-.5],[0,-1.1],[-.5,-.5],[-.15,-.2],[.15,-.5],[.25,-.35],[-.15,.1]]);
 }else if(faction==='primates'){
  for(const a of [-.5,.5]){stroke([a-.4,-.7],[a,.8]);stroke([a,.8],[a+.4,-.7]);}stroke([-.8,-.8],[.8,-.8]);
 }else if(faction==='infernal'){
  plate([[-.7,.9],[-.3,.2],[0,.7],[.3,.2],[.7,.9],[.5,-.5],[0,-1],[-.5,-.5]]);
 }else{
  // Winged spear used by the mortal military traditions.
  stroke([0,-1],[0,.8],.5);plate([[-.25,.7],[0,1.25],[.25,.7]]);
  for(const side of [-1,1])for(let j=0;j<3;j++)plate([[side*.1,.4-j*.3],[side*(1-j*.15),.8-j*.3],[side*.7,.1-j*.3]]);
 }
}

// Mesh additions: real geometry, shaded and depth-tested before sprite baking.
function humanoid(M,d,s){
 const {kind,h,width:w,zz:z,armor,robe,skin,cloth,hands,head,headPart,action,frame}=s;
 const {tint,face,line,orb}=kit(M),metal=kind==='human'?'#687472':d.faction==='night'?'#84909f':kind==='reptilian'?'#a6a88c':kind==='skeleton'?'#a1a6b0':kind==='elf'?'#b5bdb1':'#b5bcc1',dark=tint(metal,-42),edge=tint(metal,26),trim='#c0a46e';
 const sculpt=(rings,c,material='metal',sides=12)=>{M.material(kind==='human'&&material==='metal'?'paint':material);M.loft(rings,c,sides);};
 const organic=['ape','wolf','minotaur','golem','horror','treant','husk','demon','imp','gargoyle','troll','cyclops'].includes(kind);
 if(armor&&!organic){
  // Curved cuirass: waist, flared ribs, narrowed neck and a pronounced central ridge.
  sculpt([[0,0,z+h*.54,w*.9,w*.98],[.1,0,z+h*.62,w*.94,w*1.04],[-.15,0,z+h*.76,w*.93,w*1.08],[-.2,0,z+h*.86,w*.65,w*.78]],metal);
  for(const side of [-1,1]){
   face([[w*.66,side*w*.67,z+h*.85],[w*1.15,side*w*.82,z+h*.68],[w*1.19,0,z+h*.59],[w*1.24,0,z+h*.77]],side>0?metal:tint(metal,-16));
   line([w*1.24,0,z+h*.77],[w*1.19,0,z+h*.59],edge,.45);
   // Three overlapping articulated shoulder lames, with rolled rims and hinge pins.
   for(let j=0;j<3;j++){
    const sy=side*(w+.3+j*.32),sz=z+h-4.8-j*1.55;
    sculpt([[-.7,sy,sz-1.5,2.45-j*.2,2.05],[-.7,sy,sz+.35,2.55-j*.2,2.15],[-1,sy,sz+1.5,1.9,1.55]],j%2?dark:metal);
    line([1.8,sy-side*1.5,sz-1.4],[1.8,sy+side*2.2,sz-1.4],edge,.45);
    orb(2,sy,sz,.35,.4,.4,trim);
   }
   // Split skirt: dark mail under overlapping steel tassets, never a rigid barrel.
   for(let j=0;j<3;j++){
    const top=z+h*(.56-j*.043),y=side*w*.52;
    face([[w*.99,y-side*w*.36,top],[w*.99,y+side*w*.4,top],[w*1.02,y+side*w*.48,top-2.2],[w*.97,y-side*w*.36,top-2.2]],j%2?tint(metal,-10):metal);
    line([w*1.03,y-side*w*.35,top-2.1],[w*1.03,y+side*w*.48,top-2.1],edge,.4);
   }
   const gait=(action==='walk'||action==='walkReady')?root.FractureMotion.step(frame,side<0?.5:0,['goblin','kobold','imp'].includes(kind)?5.5:7.5):{x:0,lift:0};
   const knee=[-gait.x*.5,side*4.3,z+9+gait.lift*.45],ankle=[gait.x,side*4.4,z+3+gait.lift];
   orb(knee[0]+1.1,knee[1],knee[2],1.8,2.05,2.4,metal);
   // The front ridge and side fins make greaves read as forged plates.
   face([[knee[0]+1.8,knee[1]-1.7,knee[2]-1],[knee[0]+2.6,knee[1],knee[2]-1],[ankle[0]+2,ankle[1],ankle[2]],[ankle[0]+1.2,ankle[1]-1.5,ankle[2]]],metal);
   face([[knee[0]+2.6,knee[1],knee[2]-1],[knee[0]+1.8,knee[1]+1.7,knee[2]-1],[ankle[0]+1.2,ankle[1]+1.5,ankle[2]],[ankle[0]+2,ankle[1],ankle[2]]],dark);
   line([knee[0]+2.65,knee[1],knee[2]-1],[ankle[0]+2.1,ankle[1],ankle[2]],edge,.4);
   const hand=hands[side<0?0:1];orb(...hand,1.35,1.4,1.6,dark);
  }
  sculpt([[0,0,z+h*.84,w*.65,w*.8],[0,0,z+h*.91,w*.55,w*.62]],dark);
  // Cloth tabard and stitched hem preserve a readable civilization/owner accent.
  face([[w*1.22,-w*.27,z+h*.73],[w*1.22,w*.27,z+h*.73],[w*1.02,w*.35,z+h*.35],[w*1.02,-w*.35,z+h*.35]],cloth,'cloth');
  line([w*1.03,-w*.35,z+h*.36],[w*1.03,w*.35,z+h*.36],trim,.45);
  emblem(M,[w*1.26,0,z+h*.66],1.4,d.faction);
 }
 if(robe&&!organic){
  for(const side of [-1,1]){
   const y=side*w*.64;
   line([w*.82,y,z+h*.78],[w*.8,y,z+5],'#dbc080',.8,'cloth');
   for(let j=0;j<5;j++){
    const zz=z+8+j*h*.105;
    face([[w*.85,y,zz+1.1],[w*.88,y+side*.7,zz],[w*.85,y,zz-1.1],[w*.88,y-side*.7,zz]],'#d9bd78');
   }
  }
  sculpt([[0,0,z+h*.76,w*.95,w*1.22],[0,0,z+h*.83,w*.85,w*1.08],[0,0,z+h*.88,w*.52,w*.65]],tint(cloth,8),'cloth');
  line([w*.91,-w*.65,z+h*.8],[w*.91,w*.65,z+h*.8],'#dbbe7f',.7);
 }
 if(!organic&&!robe&&!armor){
  // Sculpted collar, folded hem, seams and leather fastenings on workers and light troops.
  sculpt([[0,0,z+h*.81,w*.75,w*.9],[0,0,z+h*.89,w*.5,w*.6]],tint(cloth,-14),'cloth');
  for(const side of [-1,1]){
   face([[w*.85,side*w*.45,z+h*.7],[w*.99,side*w*.65,z+h*.53],[w*.8,side*w*.82,z+h*.4]],tint(cloth,17),'cloth');
   line([w*.95,side*w*.6,z+h*.68],[w*.93,side*w*.7,z+h*.48],tint(cloth,-20),.5,'cloth');
  }
 }
 // Carefully fitted helmets, rather than repainting the head sphere.
 if(armor&&!organic&&!robe&&kind!=='human'&&!['kobold','draconian'].includes(kind)){
  const [hx,hy,hz]=head;M.part=headPart;
  sculpt([[hx-.6,0,hz+.4,4.2,3.8],[hx-.6,0,hz+3,4.3,3.9],[hx-1,0,hz+5.5,3.2,3.3],[hx-1,0,hz+6.5,1.1,1.7]],metal);
  for(const side of [-1,1]){
   face([[hx+2,side*3.4,hz+2],[hx+4,side*2.6,hz+.6],[hx+3.6,side*2.8,hz-3.5],[hx+.4,side*3.6,hz-3]],metal);
   line([hx+2,side*3.5,hz+2],[hx+4.1,side*2.65,hz+.6],edge,.45);
  }
  if(/Knight|Shieldbearer|Imperial/.test(d.name)){
   face([[hx+4.1,-2.8,hz+1.1],[hx+5.4,0,hz+1.6],[hx+4.1,2.8,hz+1.1],[hx+4.5,2.6,hz-2.9],[hx+5.3,0,hz-3.7],[hx+4.5,-2.6,hz-2.9]],dark);
   for(const side of [-1,1])line([hx+5.5,0,hz+.5],[hx+4.5,side*2.6,hz+.25],'#263039',.7);
   for(let j=-1;j<=1;j++)line([hx+5.4,j*.85,hz-1],[hx+5.4,j*.85,hz-2.1],'#334047',.35);
   // Short fabric crest; silhouette differs from the caster's pointed hat.
   M.material('cloth');M.loft([[hx-1,0,hz+6,1.3,.8],[hx-2,0,hz+10,2.1,1.3],[hx-4,0,hz+12,1.1,.6]],cloth,8);
  }
  M.part=null;
 }
 if(kind==='vampire'){
  const elite=d.role==='elite',ranged=d.role==='rifle',scout=d.role==='scout';
  // High turned-back collar, fitted waistcoat and split coat tails.
  for(const side of [-1,1]){
   face([[1,side*w*.5,h-4],[-3,side*(w+2),h+5],[-6,side*(w+3),h-2],[-4,side*w,h-8]],scout?'#24323b':tint(cloth,-24),'cloth');
   face([[w*.8,side*.8,h*.82],[w*.85,side*(w-1),h*.72],[w*.92,side*1.7,h*.55]],'#c8bcb1','cloth');
   for(let j=0;j<5;j++)orb(w*.93,side*1.5,h*.5+j*1.8,.3,.35,.35,trim);
   line([w*.9,side*(w-.6),h*.48],[w*.85,side*(w+1),7],trim,.45,'cloth');
   if(elite){sculpt([[0,side*(w+1),h-6,3,3],[0,side*(w+1),h-2,3.5,3.5],[-1,side*(w+1),h+1,2.5,2.5]],dark);for(let j=0;j<3;j++)line([-1+j,side*(w+2),h-2],[-3+j,side*(w+4),h+5],trim,.7);}
  }
  if(ranged){line([-4,3,h*.65],[-7,3,h+5],'#624b38',1.5,'wood');for(let j=0;j<3;j++)line([-7+j,3,h+5],[-7+j,3,h+1],trim,.6);}
  if(scout)face([[-4,-5,h-5],[-4,5,h-5],[-10,7,12],[-9,-5,8]],'#28333e','cloth');
 }
 if(kind==='centaur'){
  // Fitted horse blanket, girth and breast collar follow the ribcage.
  M.material('cloth');M.loft([[-11,0,18,10,6.9],[-11,0,22,9.2,6.7],[-11,0,24,7.3,4.7]],tint(cloth,-9),12);
  for(const side of [-1,1]){
   face([[-20,side*6,22],[-3,side*6,22],[-5,side*7.1,12],[-18,side*7,12]],cloth,'cloth');
   line([-18,side*7.1,12.2],[-5,side*7.2,12.2],trim,.65);
   line([-5,side*6.8,21],[-4,side*7.1,13],'#69533c',1.1,'wood');
   for(let j=0;j<3;j++)face([[-17+j*4,side*7.1,18],[-15+j*4,side*7.2,17],[-16+j*4,side*7.2,14]],trim,'cloth');
  }
 }
 if(organic&&armor&&!['husk','golem','treant'].includes(kind)){
  for(const side of [-1,1]){
   sculpt([[-1,side*(w+.3),z+h-8,3.8,3],[-1,side*(w+.3),z+h-5,3.7,3],[-2,side*w,z+h-3.5,2.3,2]],dark);
   line([-1,side*(w+3),z+h-7],[1,side*(w+2),z+h-5],trim,.8);
  }
 }
}

function unit(M,d){
 const {line,orb,face,tint}=kit(M),n=d.name,role=d.role;
 // Accessories are attached in model space and share the mesh's pose and occlusion.
 if(/Tank|Fighting Vehicle|Self-Propelled/.test(n)){
  for(const side of [-1,1]){
   for(let j=0;j<4;j++){
    const x=-12+j*7;face([[x,side*15,9],[x+5.5,side*15,9],[x+5.5,side*15.5,5],[x,side*15.5,5]],'#80938d');
    orb(x+1,side*15.65,8,.3,.3,.3,'#c5c7af');
   }
   line([-15,side*7,15],[-15,side*7,21],'#344745',2.5);orb(-15,side*7,21,1.3,1.3,.45,'#202b2d');
   line([8,side*8.2,16],[14,side*8.2,16],'#bcc1ae',.8);
  }
 }
 if(d.faction==='insects'&&!d.air&&!d.naval){
  const mass=d.worker?.78:role==='siege'?1.35:role==='heavy'?1.3:role==='scout'?.64:1;
  for(const side of [-1,1])for(let j=0;j<4;j++){
   const x=-17*mass+j*3.5*mass,y=side*(4.8+Math.sin(j)*.8)*mass,z=17+mass*2;
   face([[x-2,y,z+2],[x+1,y+side*1.6,z],[x+2,y+side*.8,z-3],[x-1,y,z-2]],j%2?'#a18b58':'#7f6947','chitin');
   line([x-2,y,z+2],[x+1,y+side*1.6,z],'#bba778',.45,'chitin');
  }
 }
 if(/Dragon|Drake|Wyvern|War-Beast|Hellhound|Magical Beast/.test(n)&&!d.naval&&!d.bomber){
  const col=d.faction==='dragons'?'#bca175':d.faction==='reptilians'?'#b3b58c':'#9b9680';
  for(const side of [-1,1])for(let j=0;j<5;j++){
   const x=-12+j*4,z=22-Math.abs(j-2)*.8,y=side*(4.2+Math.sin(j*.6)*1.8);
   face([[x-2,y,z+2],[x+1,y+side*1.6,z+1],[x+2,y+side*.5,z-1],[x,y,z-2]],tint(col,j%2?-18:4),'chitin');
  }
 }
 if(d.faction==='symbiotes'&&!d.naval){
  // Membranous plates and anchor nodes, distinct from mechanical rivets.
  const giant=role==='giant',z=giant?29:19;
  for(const side of [-1,1])for(let j=0;j<3;j++){
   const x=-3+j*2;orb(x,side*(3+j*.4),z+j*2,1.3,1,1.8,j%2?'#9b8e9e':'#808e79','chitin');
   line([x,side*3,z],[x-2,side*4,z-4],'#b1a994',.55,'bone');
  }
 }
}


// Rebuilt humanoid rig. All surfaces below are 3D meshes; the runtime bakes
// them to the same eight-direction sprite/cache format as the rest of the game.
function figure(ctx,d,f,angle,action,frame){
 const kind=root.FractureIdentity?.identity(d,f);
 if(!['human','dwarf','elf','wizard','vampire','skeleton','reptilian','draconian','kobold','goblin','orc','ghoul','thrall'].includes(kind)||(d.faction==='night'&&kind!=='vampire')||d.campaignEmperor||d.air||d.naval||d.transport||d.role==='merchant')return false;
 const M=new root.FractureSpriteMesh(ctx,Math.round(angle/(Math.PI/4))*Math.PI/4,action==='dead').pose(d,action,frame);
 const {tint,orb,line,face,box}=kit(M),outfit=root.FractureIdentity.uniform(d,f),cloth=outfit[0],gold='#d6b568',steel='#b8c5d2',silver='#e2e7e9',iron='#505d70',leather='#674530',black='#202838';
 const shot=root.FractureProjectiles.profile(d,f).kind;
 const dwarf=kind==='dwarf',small=['kobold','goblin'].includes(kind),reptile=['reptilian','draconian','kobold'].includes(kind),modern=kind==='human',caster=!modern&&(d.heal||['spell','flame'].includes(shot)||/Mage|Healer|Sage|Seer|Spellweaver|Runesmith/.test(d.name)),armored=!d.worker&&!caster&&!d.heal&&(!(modern&&['scout','stealth'].includes(d.role)))&&(modern||d.role==='heavy'||d.role==='elite'||/Guard|Shield|Knight|Legionnaire|Spearman/.test(d.name)),shielded=/Shield|Guardian|Knight|Legionnaire|Flameguard/.test(d.name)||d.name==='Spellguard';
 const heavy=d.role==='heavy',elite=d.role==='elite',light=['scout','stealth'].includes(d.role),archer=shot==='arrow'||shot==='bolt',width=dwarf?1.13:heavy?1.16:elite?1.07:light?.88:1;
 const skin=reptile?'#859e50':['orc','goblin'].includes(kind)?'#8a9b62':kind==='skeleton'?'#dfd8bd':kind==='ghoul'?'#a9b38d':kind==='vampire'?'#dbd5d3':'#d2ac8a';
 const moving=action==='walk'||action==='walkReady',ready=action==='ready'||action==='walkReady',attack=action==='attack',work=['gather','gatherOil','build','heal'].includes(action),gesture=['scratch','yawn'].includes(action),phase=frame%4,melee=d.range<2,scale=small?.61:dwarf?.69:.83;
 M.part={origin:[0,0,0],scale};
 M.ownership([{x:[-10,13],y:[-13,13],z:[19*scale,22*scale]},{x:[-10,13],y:[-13,13],z:[38*scale,40*scale]}],['cloth','paint']);
 const loft=(r,c,mat='cloth',sides=16)=>{M.material(mat);M.loft(r,c,sides);};
 // Anatomical sections: full muscle bellies taper into wrist/ankle joints.
 const limb=(a,b,w,c,mat='cloth')=>{
  const delta=b.map((q,i)=>q-a[i]),length=Math.hypot(...delta)||1,axis=delta.map(q=>q/length),raw=Math.abs(axis[2])>.9?[1,0,0]:[-axis[1],axis[0],0],ul=Math.hypot(...raw)||1,u=raw.map(q=>q/ul),v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]];
  const sections=[[0,.8],[.2,1.12],[.46,1.04],[.75,.8],[1,.59]],radius=w*.55;
  const rings=sections.map(([t,r])=>Array.from({length:14},(_,j)=>{const an=j*Math.PI/7;return a.map((q,i)=>q+delta[i]*t+radius*r*(u[i]*Math.cos(an)+v[i]*Math.sin(an)));}));
  M.material(mat);M.rings(rings,c,true);
 };
 const tube=(a,b,w,c,mat='metal')=>line(a,b,c,w,mat);
 const shift=attack&&melee?[-1,-4,5,1.5][phase]:attack?[-.5,-1.5,1,.5][phase]:0;
 const shoulder=(side)=>[shift,side*(dwarf?7.8:7.1)*width,41.8+(side>0?.3:-.3)];
 // A fitted pelvis and abdomen are narrower than the ribcage. A shaped neck
 // and jaw replace the stack of round primitives used by the earlier figures.
 for(const side of [-1,1]){
  const gait=moving?root.FractureMotion.step(frame,side<0?.5:0,8.2):{x:attack&&melee?(side>0?3:-2):side>0?1.6:-1.6,lift:0};
  const hip=[-.7,side*3.4,26],knee=[1-gait.x*.32,side*3.8,14.2+gait.lift*.4],ankle=[gait.x,side*4.3,3+gait.lift];
  limb(hip,knee,dwarf?6.6:6.1,d.worker?leather:cloth);limb(knee,ankle,4.65,d.worker?leather:black,'leather');
  // Fitted boot has a sole, toe box, raised ankle and heel.
  loft([[ankle[0]+1.3,ankle[1],.7+gait.lift,3.4,2.3],[ankle[0]+1.5,ankle[1],2.3+gait.lift,3.6,2.3],[ankle[0]-.1,ankle[1],4+gait.lift,2,1.8]],black,'leather',12);
  tube([ankle[0]-1.2,ankle[1],3+gait.lift],[ankle[0]-1,ankle[1],9+gait.lift],2.6,tint(leather,-15),'leather');
  if(modern&&armored){loft([[knee[0]+1.4,knee[1],knee[2]-1.9,.8,1.7],[knee[0]+1.7,knee[1],knee[2],1,1.9],[knee[0]+1.4,knee[1],knee[2]+1.8,.8,1.6]],tint(cloth,-23),'leather',10);}
  if(armored&&!modern){
   orb(knee[0]+1.8,knee[1],knee[2],2.2,2.5,2.7,steel);
   const v=[[knee[0]+2,knee[1]-2,knee[2]-1],[knee[0]+3,knee[1],knee[2]],[knee[0]+2,knee[1]+2,knee[2]-1],[ankle[0]+2,ankle[1]+1.7,ankle[2]],[ankle[0]+2.8,ankle[1],ankle[2]-.3],[ankle[0]+2,ankle[1]-1.7,ankle[2]]];
   face([v[0],v[1],v[4],v[5]],steel);face([v[1],v[2],v[3],v[4]],iron);tube(v[1],v[4],.45,silver);
   for(let j=0;j<3;j++)face([[ankle[0]+j,ankle[1]-2,3.2+gait.lift],[ankle[0]+j+1.4,ankle[1]-2,2.7+gait.lift],[ankle[0]+j+1.4,ankle[1]+2,2.7+gait.lift],[ankle[0]+j,ankle[1]+2,3.2+gait.lift]],j%2?iron:steel);
  }
 }
 // Pelvis, tucked abdomen, oval ribcage, sloping clavicles and a visible neck.
 const torsoRings=[[-.8,0,24,3.5,4.7],[-.8,0,27.5,3.8,5],[-.3,0,31,2.8,3.8],[shift-.1,0,35,4.15*width,5.65*width],[shift-.2,0,38.5,4.9*width,6.45*width],[shift-.3,0,41.8,4.15*width,5.95*width],[shift-.2,0,44.4,2.3,3.1]];
 loft(torsoRings,caster?cloth:armored?'#485260':cloth,armored&&!modern?'mail':'cloth',20);
 // Reptile civilizations wear scale over the whole trunk: individual plates, not a scale-patterned cloth.
 if(reptile){M.material('scales');M.pelt(torsoRings,caster?cloth:armored?'#51606d':cloth,{axis:'z',rows:13,cols:15,flow:-1,lift:.36,grow:.05,shade:8,narrow:1.45,seed:17});}
 if(!armored&&!caster)for(const side of [-1,1]){
  orb(shift+2.4,side*2.5,38,1.9,2.8,3.1,tint(cloth,3),'cloth');
  tube([shift+.3,side*1.8,44],[shift+.5,side*6.1,41.4],.75,tint(cloth,14),'cloth');
 }

 loft([[shift,0,43,2.1,2.4],[shift,0,48,2,2.2]],skin,'skin');
 if(caster){
  // Closed skirt, asymmetric folds, hanging stole and a broad stitched mantle.
  loft([[-1,0,4,7.1,8.4],[0,0,17,6.3,7.4],[0,0,27,4.2,5.4]],cloth,'cloth');
  for(const side of [-1,1]){
   face([[4,side*2,40],[5,side*3,26],[6,side*4,5],[5.7,side*1.7,5],[4.7,side*.8,26],[3.7,side*.8,40]],tint(cloth,22),'cloth');
   tube([4.1,side*2.2,39],[6.1,side*4.1,5],.6,gold);
   for(let j=0;j<7;j++)orb(5.3,side*2.8,8+j*4,.25,.7,.5,gold);
  }
  loft([[shift-.4,0,39.5,4,6.3],[shift-.2,0,42,3.3,5.4],[shift,0,44.7,2.5,3.2]],tint(cloth,-12),'cloth');
  tube([shift+4,-5,41],[shift+4,5,41],.75,gold);
 }else if(armored){
  // Curved cuirass follows the ribs and narrows above the hips. No flat chest box.
  loft([[0,0,30,3.1,4.2],[shift-.1,0,33,4.3*width,5.05*width],[shift,0,37.5,5.35*width,6.7*width],[shift-.1,0,40.8,4.95*width,6.3*width],[shift-.2,0,43.5,2.65,3.5]],modern?cloth:steel,modern?'cloth':'metal',24);
  for(const side of [-1,1]){
   tube([shift+2.8,side*2.8,43],[shift+4.1,side*4.5,39],.5,silver);
   tube([shift+4.1,side*4.5,39],[shift+3.4,side*3.4,32],.45,modern?iron:gold);
   // Two independent hip lames leave the waist and leg articulation visible.
   for(let j=0;j<2;j++){
    const z=29-j*2.1;face([[3.6,side*.7,z],[3.3,side*4.5,z],[3.4,side*5.3,z-2.4],[3.7,side*.9,z-2.4]],j?iron:steel);
    tube([3.7,side*.9,z-2.4],[3.4,side*5.3,z-2.4],.35,silver);
   }
  }
  if(!modern){
   // Surcoat and a model-space device: dark field, bright embroidery, metal rim.
   face([[shift+4.5,-1.5,38],[shift+4.5,1.5,38],[3.9,2,21],[3.9,-2,21]],cloth,'cloth');
   emblem(M,[shift+4.45,0,36],1.45,f.id);
  }else for(const side of [-1,1]){
   box(3.6,side*2.9,30,.6,1.4,3.7,cloth,'cloth');tube([4.25,side*1.8,33.7],[4.25,side*4,33.7],.35,gold);
   box(-3.3,side*2.9,31,1,1.9,6,black,'leather');
  }
 }
 // Tailored vampire garments keep their identity on the fuller anatomical rig.
 if(kind==='vampire'){
  for(const side of [-1,1]){
   face([[shift-1,side*2.5,44],[shift-3,side*5,49],[shift-5,side*6.5,43],[shift-3,side*5,40]],tint(cloth,-22),'cloth');
   face([[shift+3,side*.5,43],[shift+5.2,side*3.5,38],[shift+4.6,side*.9,34]],tint(cloth,23),'cloth');
   face([[-3,side*1.5,29],[-3.7,side*5,29],[-6.5,side*7,12],[-5.5,side*2,14]],tint(cloth,-15),'cloth');
   for(let j=0;j<5;j++)orb(shift+5,side*1.2,32+j*1.5,.2,.25,.25,gold);
  }
 }
 // Role-specific kit is attached to the rig, and remains physical geometry at every facing.
 if(modern){
  if(d.worker){box(-5,0,27,3,5,12,'#94683d','leather');for(const y of [-4,4])tube([-8,y,30],[-8,y,43],1.2,steel);tube([5,0,32],[5,0,41],1.2,'#e4c077','cloth');}
  else if(d.heal){box(-5,0,27,3.3,5.3,14,'#d6d7c8','paint');box(-8.4,0,33,.2,3,3,'#2e7b83','paint');box(0,-7,27,3,1.8,7,'#dedcc8','cloth');for(const y of [-6,6])tube([-4,y,31],[-4,y,40],1.4,'#d1dddf');}
  else if(d.role==='aa'){for(const y of [-4,4]){tube([-7,y,24],[-7,y,44],3.8,iron);tube([-7,y,43],[-7,y,46],3.2,steel);}box(0,-7,29,3,2,9,leather,'leather');}
  else if(heavy){box(-4.7,0,28,2.5,4.5,12,iron);for(const side of [-1,1]){box(-7,side*7,25,3,2,12,steel);tube([shift-1,side*7.5,42],[shift-1,side*8.3,37],2.6,cloth,'cloth');}for(let j=0;j<10;j++)tube([-6+j*.6,7,30+j*.8],[-6+j*.6,9,30+j*.8],1,'#bfa56a');}
  else if(light){loft([[0,0,31,3.1,4],[shift,0,36,3.9,5.7],[shift,0,40,3.7,5.8],[shift,0,42,2.8,4.3]],'#344b43','cloth');for(const y of [-4,0,4])box(3.8,y*.78,31,.7,1.2,3.8,leather,'leather');box(-5,0,29,2,4,8,cloth,'cloth');if(d.role==='stealth')tube([-4,-6,28],[-4,-6,45],1.2,black);}
 }else{
  if(archer){box(-5,2,27,2.5,3,14,leather,'leather');for(let j=0;j<4;j++){tube([-6,j*.9,35],[-6,j*.9,49],.6,'#c8b284','wood');face([[-6,j*.9,48],[-8,j*.9,45],[-6,j*.9,43]],'#ddd7be','cloth');}}
  if(heavy&&!caster){for(const side of [-1,1])tube([shift+2.7,side*8.8,43],[shift+2.7,side*9.3,39],.6,gold);if(/Berserker/.test(d.name))for(const side of [-1,1])tube([-1,side*11,42],[-3,side*15,47],2,'#d2c3a4','bone');}
  if(elite){for(const side of [-1,1])face([[shift-1,side*7,42],[shift-3,side*12,49],[shift+3,side*9,44]],gold);for(let j=0;j<5;j++)orb(shift+5.7,-3+j*1.5,39,.35,.45,.45,gold);}
  if(shot==='potion'||shot==='firepot'){for(let j=0;j<4;j++){orb(3,-5+j*3,28,1.2,1.2,2,j%2?'#b6c38b':'#c79359','glass');tube([3,-5+j*3,29],[3,-5+j*3,31],.6,leather,'wood');}box(-5,0,28,2.5,5,10,leather,'leather');}
  if(light){face([[-5,-5,42],[-5,5,42],[-8,7,25],[-8,-6,22]],tint(cloth,-16),'cloth');tube([4,-5,33],[-3,5,24],1,leather,'leather');}
 }
 // Leather belt with separate buckle, loops and hanging utility pouch.
 loft([[-.5,0,28,3.7,4.8],[0,0,29.5,3.3,4.4]],leather,'leather');box(3.5,0,28,.4,1.1,1.5,gold);box(3.95,0,28.3,.1,.6,.9,black);
 for(const side of [-1,1]){box(-.5,side*4.8,25,1.7,1.1,3.5,leather,'leather');tube([1.25,side*4.8,28],[1.25,side*4.8,26],.55,gold);}
 const hands=[];
 for(const side of [-1,1]){
  const gun=!d.worker&&!caster&&['bullet','rocket','bolt','spine','pulse'].includes(shot),bow=shot==='arrow',alert=ready||attack;
  let hand=gun?[side>0?10:20,4,alert?37:30]:bow?[side>0?17:attack&&phase===1?3:12,side>0?4:-2,alert?37:28]:side>0&&alert?(melee?[[10,8,35],[-11,9,52],[26,4,24],[13,7,36]][ready?0:phase]:[10,7,38]):[3,side*10,28];
  if(side<0&&shielded)hand=[8,-11,32];
  if(work)hand=[8,side*8,[29,43,30,27][phase]];
  if(gesture&&side<0){const amount=[.35,1,1,.35][phase],target=[shift+4,-1,action==='yawn'?49:52];hand=hand.map((v,i)=>v+(target[i]-v)*amount);}
  const sh=shoulder(side),elbow=[(sh[0]+hand[0])*.45-2,side*(8.8*width+Math.abs(hand[1])*.12),(sh[2]+hand[2])*.5-3.8];
  limb(sh,elbow,heavy?6.1:5.5,armored?'#46505b':cloth,armored&&!modern?'mail':'cloth');limb(elbow,hand,4.3,modern?cloth:armored?iron:skin,modern?'cloth':armored?'metal':'skin');
  if(armored){
   // Open overlapping shoulder plates follow the upper arm instead of spherical caps.
   const axis=elbow.map((v,i)=>v-sh[i]),len=Math.hypot(...axis),v=axis.map(q=>q/len),u=[1,0,0],cross=[0,v[2],-v[1]];
   for(let j=0;j<(modern?2:3);j++){
    const center=sh.map((q,i)=>q+v[i]*(j*1.65-.1)),radius=(heavy?2.85:2.45)-j*.14;
    const points=Array.from({length:7},(_,k)=>{const t=-Math.PI*.12+k*Math.PI*1.24/6;return center.map((q,i)=>q+radius*(Math.cos(t)*u[i]+Math.sin(t)*cross[i]));});
    const lower=points.map(q=>q.map((n,i)=>n+v[i]*1.9));
    for(let k=0;k<6;k++){face([points[k],points[k+1],lower[k+1],lower[k]],modern?tint(cloth,j*5-8):j%2?iron:steel,modern?'cloth':'metal');tube(lower[k],lower[k+1],.3,modern?tint(cloth,18):silver,modern?'cloth':'metal');}
   }
   orb(...elbow,1.7,1.7,1.8,steel);const cuff=hand.map((v,i)=>v*.67+elbow[i]*.33);tube(cuff,hand,2.6,steel);
  }
  orb(...hand,1.55,1.4,1.8,armored?iron:skin,armored?'metal':'skin');
  for(let j=0;j<3;j++)tube([hand[0]+.8,hand[1]-1+j*.8,hand[2]+.2],[hand[0]+1.8,hand[1]-1+j*.8,hand[2]-1.2],.55,armored?silver:skin,armored?'metal':'skin');
  hands.push(hand);
 }
 // Head: a closed jaw/chin, cheeks, brow sockets and attached ears/snout.
 // Fitted chest equipment sits on the ribcage with straps wrapping onto the back.
 if(modern&&armored){
  loft([[shift+.1,0,32,4.4,5],[shift+.3,0,37,5.55*width,6.8*width],[shift,0,40.3,5.2*width,6.4*width]],tint(cloth,-18),'cloth',20);
  for(const side of [-1,1]){
   tube([shift+3.6,side*3.4,39.5],[shift,side*4.5,43],1.25,tint(cloth,-27),'cloth');tube([shift,side*4.5,43],[-3.5,side*3.5,34],1.25,tint(cloth,-27),'cloth');
   for(let j=0;j<2;j++){box(shift+5.3*width,side*(1.4+j*2.3),33,.75,.95,4.4,tint(cloth,8),'cloth');tube([shift+6.1*width,side*(.6+j*2.3),37.1],[shift+6.1*width,side*(2.2+j*2.3),37.1],.3,tint(cloth,30),'cloth');}
  }
 }
 const hx=shift+.8,hz=51;
 loft([[hx,0,46.5,1.8,2],[hx+1,0,48,2.6,2.7],[hx+.5,0,51.5,3,3.1],[hx-.3,0,54.5,2.8,2.7],[hx-.8,0,55.8,1.6,1.8]],skin,'skin',14);
 if(reptile){
  loft([[hx+2,0,49,3,2.2],[hx+3,0,51,3.8,2.4],[hx+1,0,53.5,2.4,2]],skin,'chitin');
  for(const side of [-1,1])face([[hx-1,side*2.7,53],[hx-4,side*6,56],[hx-2,side*5,48]],tint(skin,-16),'chitin');
  const tail=[[ -3,0,23],[-10,0,15],[-16,2,8],[-23,4,4]];for(let j=0;j<3;j++)limb(tail[j],tail[j+1],5-j*1.5,skin,'chitin');
  M.material('scales');M.pelt([[-3,0,23,2.8,2.8],[-10,0,15,2.2,2.2],[-16,2,8,1.5,1.5],[-23,4,4,.7,.7]],skin,{rows:12,cols:10,flow:1,lift:.26,grow:.06,shade:8,narrow:1.4,seed:13});
  M.pelt([[hx+1.6,0,48.6,3.1,2.4],[hx+3,0,51,3.9,2.6],[hx+1,0,53.6,2.5,2.1]],skin,{axis:'z',rows:6,cols:10,flow:-1,lift:.2,grow:.05,shade:7,narrow:1.4,seed:23});
 }else{
  orb(hx+3,0,50.8,.9,.8,1.3,skin,'skin');
  for(const side of [-1,1]){orb(hx-.5,side*3,50.5,.65,.7,1.2,skin,'skin');if(['elf','goblin','orc'].includes(kind))face([[hx-1,side*3,52],[hx-3,side*6,54],[hx-.5,side*3,49]],skin,'skin');}
 }
 for(const side of [-1,1]){tube([hx+2.4,side*1,52],[hx+2.4,side*2.6,52.1],.7,'#3c3330','skin');orb(hx+2.9,side*1.7,51.8,.4,.5,.32,'#282a27','skin');}
 if(gesture&&action==='yawn')orb(hx+3,0,49,.35,1.1,1.5,'#40312f','skin');else tube([hx+2.6,-.9,48.8],[hx+2.6,.9,48.8],.35,'#805f4b','skin');
 if(dwarf){loft([[hx+1,0,44,2.1,2],[hx+2,0,48,3.2,3.2]],'#a57c4f','fur');for(const side of [-1,1]){tube([hx+3,side*1.8,48],[hx+3,side*1.8,40],1.6,'#b88f61','fur');tube([hx+3,side*1.8,42],[hx+3,side*1.8,43],1.8,gold);}}
 if(modern&&(d.worker||d.heal||light)){
  if(d.worker){loft([[hx-.5,0,53,4.3,4],[hx-.5,0,54,4.3,4],[hx-1,0,57,3.2,3],[hx-1,0,58,1.6,1.6]],'#cfab51','paint');}
  else if(d.heal){loft([[hx-.5,0,52.8,3.4,3.3],[hx-.5,0,55.8,3.2,3.1],[hx-.8,0,57,2,2]],'#dadbce','paint');tube([hx+2,-1.5,55],[hx+2,1.5,55],.8,'#397e85','paint');}
  else if(d.role==='stealth'){loft([[hx-.5,0,48,3.3,3.4],[hx-.5,0,54,3.5,3.5],[hx-1,0,57,2.3,2.3]],cloth,'cloth');face([[hx+3.5,-2.5,50],[hx+3.5,2.5,50],[hx+3.5,2.5,53],[hx+3.5,-2.5,53]],black,'cloth');for(const y of [-1.4,1.4])orb(hx+3.7,y,52,.4,.8,.6,'#a2c7a9','glass');}
  else{loft([[hx-.5,0,54,4,4],[hx-2,0,56.4,3.3,3.3],[hx-3,0,57,1.4,2]],cloth,'cloth');box(hx-1,-3.6,49,.8,.8,3,black);tube([hx-1,-4,51],[hx+1,-4,57],.5,black);}
 }else if(modern&&armored){
  // Ballistic shell, open face, padded ear cups and chin strap; not a medieval visor.
  loft([[hx-.7,0,52.8,3.5,3.5],[hx-1,0,55.3,3.6,3.5],[hx-1.2,0,57.1,2.7,2.8],[hx-1.3,0,58,1.2,1.5]],tint(cloth,-12),'paint',20);
  for(const side of [-1,1]){tube([hx+1,side*3,53],[hx+1.7,side*2.3,47.8],.55,leather,'leather');tube([hx+1.7,side*2.3,47.8],[hx+2.3,0,47.3],.55,leather,'leather');orb(hx-.6,side*3.1,51.5,.8,.65,1.4,black,'leather');}
  tube([hx+2.7,-2.6,53.1],[hx+2.7,2.6,53.1],.65,tint(cloth,18),'paint');
 }else if(armored){
  loft([[hx-.5,0,52,3.5,3.4],[hx-.6,0,55,3.6,3.5],[hx-1,0,57,2.8,2.9],[hx-1,0,58,1.3,1.8]],modern?iron:steel,'metal');
  for(const side of [-1,1])face([[hx+1.5,side*3.1,53],[hx+3.3,side*2.5,51.5],[hx+2.7,side*2.7,48],[hx,side*3.3,48.5]],steel);
  if(!dwarf){
   face([[hx+3.2,-2.7,52.5],[hx+4.2,0,53],[hx+3.2,2.7,52.5],[hx+3.3,2.4,48.3],[hx+4,0,47.5],[hx+3.3,-2.4,48.3]],modern?black:iron);
   for(const side of [-1,1])tube([hx+4.25,0,51.9],[hx+3.55,side*2.5,51.6],.65,modern?'#82c5dc':'#101823',modern?'glass':'metal');
   for(let j=-1;j<=1;j++)tube([hx+4.1,j*.85,50.3],[hx+4.1,j*.85,49.1],.32,silver);
  }
  tube([hx-2.7,0,57.2],[hx+1.5,0,57.2],.7,silver);
  if(!modern&&(elite||/Knight|Legionnaire/.test(d.name)))loft([[hx-1,0,58,1.1,.6],[hx-3,0,62,2.3,1],[hx-6,0,63,1,.4]],cloth,'cloth',10);
 }else if(kind==='wizard'&&caster){
  loft([[hx-.8,0,54.8,6,5.2],[hx-.8,0,55.6,6,5.2]],tint(cloth,-15));loft([[hx-1,0,55.5,3.7,3.3],[hx-1.5,0,61,2.8,2.5],[hx-3,0,66,1.4,1.3],[hx-2,0,69,.15,.15]],cloth);
  tube([hx+2,-2,57],[hx+2,2,57],.7,gold);
 }else{
  loft([[hx-1,0,52,3,3],[hx-1,0,55,3,3],[hx-1.2,0,56.5,1.8,2]],d.worker?'#68513a':tint(cloth,-24),'fur');
  if(caster)for(const side of [-1,1])face([[hx-2,side*2.8,54],[hx-4,side*4,43],[hx,side*3.5,46]],'#a8926e','fur');
 }
 if(!modern&&!d.worker&&(elite||caster||/Knight|Vampire/.test(d.name))){
  // A folded cape has six panels and a shaped lower hem, with bright lining.
  const cape=kind==='skeleton'?'#d4d6de':tint(cloth,-10);
  for(let j=0;j<6;j++){
   const y0=-7+j*14/6,y1=-7+(j+1)*14/6,wave=Math.sin(j*1.7)*1.2;
   face([[-4.9,y0*.7,43],[-4.9,y1*.7,43],[-8.5-wave,y1,11+Math.cos(j)*1.2],[-8.5-wave,y0,11+Math.sin(j)*1.2]],tint(cape,j%2?15:-12),'cloth');
   tube([-8.6-wave,y0,12],[-8.6-wave,y1,12],.5,gold);
  }
 }
 if(light&&!d.worker){
  // Ranger kit: a slung satchel on the hip under a chest strap, and a rolled blanket lashed across the back.
  box(-4.4,5.4,22,2.2,3.1,5.4,tint(leather,8),'leather');
  box(-4.4,5.4,27.1,2.3,3.2,.9,tint(leather,-14),'leather');
  line([-3.2,5.6,27.6],[2.6,-4.2,40.5],tint(leather,-18),1.2,'leather');
  M.material('cloth');M.wedge([-5.9,-6.2,38.6],[-5.9,6.2,38.6],1.8,1.8,1.8,1.8,tint(cloth,-16));
  for(const y of [-3.4,3.4])line([-7.7,y,38.6],[-4.1,y,38.6],tint(leather,-10),.55,'leather');
 }
 const hand=hands[1],tip=(p)=>{if(attack&&phase===2){ctx.canvas.weaponMuzzle={x:p[0]*scale,y:p[1]*scale,z:p[2]*scale};M.material('paint');M.orb(p[0]+1.5,p[1],p[2],3.5,2.5,2.5,'#edca79');M.orb(p[0]+3,p[1],p[2],2,2,1.5,'#f5e8b0');}};
 if(d.worker){
  // A forged pick: swelled haft with a bound grip, a wedged eye, a swept point and a hammer poll.
  const hy=hand[1],headZ=hand[2]+14,hx=hand[0]+2;
  M.material('wood');M.loft([[hand[0]-.8,hy,hand[2]-5,1.4,1.4],[hand[0]-.2,hy,hand[2]-.5,1.75,1.75],[hx-.8,hy,headZ-6,1.25,1.25],[hx,hy,headZ+1.6,1.05,1.05]],leather,10);
  line([hand[0]-.6,hy,hand[2]-5.2],[hand[0]-.2,hy,hand[2]+2],'#3f2c1f',2.1,'leather');
  box(hx,hy,headZ-2,1.95,1.95,3.7,iron);
  line([hx-2.3,hy,headZ+1.5],[hx+2.3,hy,headZ+1.5],tint(steel,8),.45);
  M.material('metal');
  const forgedSteel=tint(steel,-34);
  M.wedge([hx-1,hy,headZ],[hx-9.6,hy,headZ+2.3],1.7,1.9,.3,.35,forgedSteel);
  M.wedge([hx+1,hy,headZ-.2],[hx+5.2,hy,headZ-.6],1.6,1.9,1.45,2.3,forgedSteel);
  M.wedge([hx+5.2,hy,headZ-.6],[hx+6,hy,headZ-.6],1.45,2.3,1.3,2.1,tint(steel,-6));
  // Frame pack: back board, shoulder straps over the chest and a visible load on top.
  box(-5,0,29,2,4.7,9,leather,'leather');
  box(-6.8,0,30,.9,4.4,7.4,'#4b3625','leather');
  for(const y of [-3.4,3.4])line([-4.2,y,37.4],[2.8,y*.7,30.5],'#55402c',1.35,'leather');
  for(let j=0;j<3;j++)orb(-5.5,-2.4+j*2.4,38.3+(j%2)*.7,1.5,1.4,1.25,j%2?'#8a7f66':'#6f6a58','rock');
 }
 else if(d.heal&&modern){box(hand[0]+2,hand[1],hand[2]-3,3,2,5,'#e0ddc9','paint');tube([hand[0]+5.1,hand[1]-1,hand[2]],[hand[0]+5.1,hand[1]+1,hand[2]],.6,'#a83e38','paint');tube([hand[0]+5.1,hand[1],hand[2]-1],[hand[0]+5.1,hand[1],hand[2]+1],.6,'#a83e38','paint');}
 else if(caster){
  const staffTop=elite?61:d.heal?52:56,gem=d.heal?'#a6d0bd':d.name==='Transfigurer'?'#80c7bc':'#a5ace8';
  tube([hand[0],hand[1],4],[hand[0],hand[1],staffTop-6],1.2,leather,'wood');
  if(d.heal){for(let j=0;j<12;j++){const a=j*Math.PI/6,b=(j+1)*Math.PI/6;tube([hand[0],hand[1]+Math.cos(a)*4,staffTop+Math.sin(a)*4],[hand[0],hand[1]+Math.cos(b)*4,staffTop+Math.sin(b)*4],.7,gold);}orb(hand[0],hand[1],staffTop,1.5,1.5,2,gem,'glass');}
  else{loft([[hand[0],hand[1],staffTop-8,1.5,1.5],[hand[0],hand[1],staffTop-3,elite?4:2.7,elite?4:2.7],[hand[0],hand[1],staffTop+3,.1,.1]],gem,'glass',6);for(const side of [-1,1])tube([hand[0],hand[1]+side,staffTop-9],[hand[0],hand[1]+side*(elite?5:3),staffTop],.7,gold);}
  tip([hand[0],hand[1],staffTop]);
 }
 else if(shot==='bolt'){
  const x=hand[0],y=hand[1],z=hand[2],pull=attack&&phase===1?x-2:x+6;
  box(x+4,y,z-1,9,1.2,2.1,leather,'wood');tube([x+9,y-9,z],[x+13,y,z],1.2,steel);tube([x+13,y,z],[x+9,y+9,z],1.2,steel);
  tube([x+9,y-9,z],[pull,y,z],.35,'#d5cbb5','cloth');tube([pull,y,z],[x+9,y+9,z],.35,'#d5cbb5','cloth');if(!attack||phase<2)tube([x,y,z+1.4],[x+17,y,z+1.4],.6,gold,'wood');tip([x+17,y,z+1.4]);
 }
 else if(/Archer/.test(d.name)){
  const x=hands[1][0],y=4,z=hands[1][2],pull=attack&&phase===1?x-11:x-2;
  tube([x,y,z-11],[x+4,y,z],1.4,'#b88e48','wood');tube([x+4,y,z],[x,y,z+11],1.4,'#b88e48','wood');tube([x,y,z-11],[pull,y,z],.3,'#eee2bc','cloth');tube([pull,y,z],[x,y,z+11],.3,'#eee2bc','cloth');if(!attack||phase<2)tube([pull,y,z],[x+12,y,z],.65,'#d6ba79','wood');tip([x+5,y,z]);
 }else if(['javelin','rock','potion','firepot'].includes(shot)||/Spearman|Slinger/.test(d.name)){
  if(shot==='javelin'||/Spearman/.test(d.name)){
   const end=attack?[hand[0]+28,hand[1],hand[2]+3]:[hand[0]+2,hand[1],hand[2]+25];tube([hand[0]-5,hand[1],hand[2]-4],end,1.1,leather,'wood');
   face([[end[0]-2,end[1],end[2]],[end[0]+4,end[1],end[2]+6],[end[0]+2,end[1],end[2]-1]],silver);tip(end);
  }else if(shot==='rock'&&!/Thrower|Stone|Cyclops|Troll/.test(d.name)){
   // A sling: paired cords from the fist down to a leather pouch, slack at rest and whirled through the throw.
   const arc=attack?[-.55,.7,2.15,1.35][phase]:-1.2,reach=attack?13:9;
   const px=hand[0]+Math.cos(arc)*reach,pz=hand[2]+Math.sin(arc)*reach,hy=hand[1];
   for(const dy of [-1.15,1.15])tube([hand[0]+1,hy+dy*.45,hand[2]+1],[px,hy+dy,pz],.32,'#cbb98e','cloth');
   face([[px-2,hy-1.6,pz+1.4],[px+2,hy-1.6,pz+1.1],[px+2,hy+1.6,pz+1.1],[px-2,hy+1.6,pz+1.4]],leather,'leather');
   face([[px-2,hy-1.6,pz+1.4],[px+2,hy-1.6,pz+1.1],[px+1.4,hy,pz-1.6],[px-1.6,hy,pz-1.5]],tint(leather,-16),'leather');
   face([[px-2,hy+1.6,pz+1.4],[px+1.4,hy,pz-1.6],[px+2,hy+1.6,pz+1.1]],tint(leather,12),'leather');
   if(!attack||phase<2)orb(px,hy,pz,1.5,1.5,1.4,'#96938a','rock');
   tip([px+2,hy,pz]);
  }else{if(!attack||phase<2)orb(hand[0]+1,hand[1],hand[2]+2,2.5,2.5,3,shot==='rock'?'#96938a':'#c49963','rock');tip([hand[0]+3,hand[1],hand[2]+3]);}
 }
 else if(!melee){
  const x=hand[0],y=hand[1],z=hand[2],recoil=attack&&phase===2?-3.5:attack&&phase===1?-1.5:0,rocket=/Rocket/.test(d.name),heavy=/Heavy|Powder/.test(d.name);
  box(x+2+recoil,y,z-1,5,1.4,3,iron);box(x-5+recoil,y,z-1,3,1.3,2.6,leather,'wood');tube([x+6+recoil,y,z],[x+22+recoil,y,z],rocket?4.6:heavy?2.2:1.3,black);tube([x+7+recoil,y,z],[x+15+recoil,y,z],rocket?5:heavy?3.2:2.3,steel);tube([x+4,y,z-1],[x+2,y,z-6],1.7,black);box(x+6,y,z-7,1.3,1,5,iron);tube([x-1,y,z+3],[x+6,y,z+3],1.2,black);orb(x+6,y,z+3,.3,.6,.6,'#96d1dd','glass');
  for(let j=0;j<4;j++)tube([x+8+j*1.3,y-1.3,z],[x+8+j*1.3,y+1.3,z],.35,silver);tip([x+22+recoil,y,z]);
 }else{
  const spear=/Spear|Legionnaire|Guard/.test(d.name)&&!shielded,axe=/Dwarf|Orc/.test(d.name),v=attack?[[6,0,22],[-16,0,28],[28,3,-9],[13,0,13]][phase]:ready?[7,0,21]:[4,0,-17],end=hand.map((x,i)=>x+v[i]*(spear?1.4:1));
  tube(hand,end,spear?1.1:axe?1.4:1,axe||spear?leather:iron,axe||spear?'wood':'metal');
  const len=Math.hypot(v[0],v[2]),nx=-v[2]/len,nz=v[0]/len,a=hand.map((x,i)=>x+v[i]*.2),b=end,wide=spear?1.5:2.1;
  if(axe){face([[b[0]-5,b[1],b[2]+6],[b[0]+6,b[1],b[2]+4],[b[0]+7,b[1],b[2]-4],[b[0]-3,b[1],b[2]-2]],steel);tube([b[0]+6,b[1],b[2]+4],[b[0]+7,b[1],b[2]-4],.7,silver);}
  else{for(const side of [-1,1])face([[a[0]+nx*wide,a[1],a[2]+nz*wide],[b[0],b[1],b[2]],[a[0]-nx*wide,a[1],a[2]-nz*wide],[a[0],a[1]+side*.7,a[2]]],side>0?silver:steel);}
  tube([hand[0]+nx*3,hand[1],hand[2]+nz*3],[hand[0]-nx*3,hand[1],hand[2]-nz*3],.9,gold);orb(hand[0]-v[0]*.12,hand[1],hand[2]-v[2]*.12,1,1,1,gold);
 }
 if(shielded){
  const x=gesture?7:10,y=-12,z=gesture?12:32,w=dwarf?8:7,h=11;
  const ring=[[x,y-w,z+h-2],[x,y-w,z-h+3],[x,y,z-h-3],[x,y+w,z-h+3],[x,y+w,z+h-2],[x,y,z+h]];
  for(let j=0;j<ring.length;j++){face([ring[j],ring[(j+1)%ring.length],[x+2.7,y,z]],j%2?cloth:tint(cloth,-12),'paint');tube(ring[j],ring[(j+1)%ring.length],1,silver);const a=ring[j],b=ring[(j+1)%ring.length];for(const t of [.25,.75])orb(a[0]+.3,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,.35,.4,.4,gold);}
  emblem(M,[x+3,y,z],4.4,f.id);
 }
 M.part=null;M.finish();return true;
}

// Distinct vehicle chassis: troop carrier, low turreted armor, and artillery carriage.
function vehicle(ctx,d,f,angle,action,frame){
 if(d.air||d.naval||!['Infantry Fighting Vehicle','Main Battle Tank','Self-Propelled Artillery','Imperial Tank','Nightbreaker Combat Vehicle'].includes(d.name))return false;
 const M=new root.FractureSpriteMesh(ctx,Math.round(angle/(Math.PI/4))*Math.PI/4,action==='dead').pose(d,action,frame);
 const {box,line,orb,face,tube,ring,tint}=kit(M),ifv=/Fighting Vehicle/.test(d.name),siege=d.role==='siege',reptile=f.id==='reptilians',night=f.id==='night',col=night?'#535065':reptile?'#74794a':'#657b74',trim='#c0c4b4',dark='#283333',steel='#9eada8',phase=frame%4,recoil=action==='attack'&&phase===2?-1.8:0;
 const plate=(x,y,z,w,l,h,c)=>{const r=(ww,ll,zz)=>[[-ww,-ll],[ww,-ll],[ww,ll],[-ww,ll]].map(q=>[x+q[0],y+q[1],zz]);M.material('metal');M.rings([r(w,l,z),r(w*.8,l*.77,z+h)],c);};
 // Axial tire sections produce flat sidewalls and tread shoulders, not rubber spheres.
 const wheel=(x,y,z,r,half,side)=>{
  const rings=[[-half,.83],[-half*.78,.98],[half*.78,.98],[half,.83]].map(([yy,rr])=>Array.from({length:20},(_,i)=>{const a=i*Math.PI/10;return[x+Math.cos(a)*r*rr,y+yy,z+Math.sin(a)*r*rr];}));
  M.material('leather');M.rings(rings,dark,true);
  for(let j=0;j<20;j++){const a=j*Math.PI/10+(action==='walk'||action==='walkReady'?frame*.45:0);line([x+Math.cos(a)*r,y-half*.8,z+Math.sin(a)*r],[x+Math.cos(a+.06)*r,y+half*.8,z+Math.sin(a+.06)*r],tint(dark,15),.48,'leather');}
  const yy=y+side*(half+.08);M.material('metal');M.rings([.0,.22].map(dy=>Array.from({length:16},(_,j)=>{const a=j*Math.PI/8;return[x+Math.cos(a)*r*.55,yy+side*dy,z+Math.sin(a)*r*.55];})),steel,true);
  for(let j=0;j<6;j++){const a=j*Math.PI/3;orb(x+Math.cos(a)*r*.3,yy+side*.3,z+Math.sin(a)*r*.3,.23,.2,.23,trim);}
 };
 const tread=(side)=>{
  const yy=side*13.6,L=siege?22:20;
  box(0,yy,2,L,3.7,6,dark);for(let x=-L+4;x<L-2;x+=6){wheel(x,side*16.6,5,2.8,.55,side);orb(x,side*17.5,5,1,.3,1,dark);}
  const outline=[[-L,3],[-L+3,1],[L-3,1],[L,3],[L,7],[L-3,9],[-L+3,9],[-L,7]];
  for(let j=0;j<outline.length;j++){const a=outline[j],b=outline[(j+1)%outline.length],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2.4));for(let k=0;k<n;k++){const t=(k+.25+(action==='walk'?(frame%3)*.18:0))/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;line([x,side*10,z],[x,side*17.8,z],steel,.9);}}
  box(-1,side*13.7,9,L-1,4,1.6,col);for(let j=0;j<5;j++)plate(-L+5+j*7,side*17,5,3,.8,4.4,tint(col,j%2?-12:8));
 };
 if(ifv){
  // Eight road wheels and a tall passenger compartment; never a smaller tank turret.
  for(const side of [-1,1])for(const x of [-15,-5,5,15]){wheel(x,side*12.5,5,4.3,2.3,side);orb(x,side*14.7,5,2.5,.45,2.6,steel);orb(x,side*15.1,5,.9,.3,.9,dark);for(let j=0;j<6;j++){const a=j*Math.PI/3+(action==='walk'?frame*.45:0);line([x,side*15.2,5],[x+Math.cos(a)*2.1,side*15.2,5+Math.sin(a)*2.1],trim,.4);}}
  plate(-1,0,6,21,11,11,col);plate(-8,0,17,13,9,6,col);box(-21,0,8,1,7,12,dark);for(const y of [-5,5])line([-22.1,y,9],[-22.1,y,18],trim,.7);
  for(const side of [-1,1]){for(const x of [-14,-6,2]){face([[x,side*10,15],[x+4,side*10,15],[x+4,side*8.9,20],[x,side*8.9,20]],'#294551','glass');box(x+2,side*10.1,12,1,.5,1,dark);}line([-16,side*9,24],[-2,side*9,24],steel,.8);}
  tube(4,0,17,4,4,col);box(5,0,20,4,3,3,col);line([7+recoil,0,18],[26+recoil,0,18],steel,1.9);orb(26+recoil,0,18,.3,1.1,1.1,dark);
 }else{
  tread(-1);tread(1);plate(-1,0,7,siege?23:21,11,7,col);
  if(siege){
   plate(-12,0,14,11,9,12,col);box(-14,0,26,8,7,1.2,steel);for(const y of [-6,6])box(-12,y,18,3,1,3,dark);plate(3,0,14,9,7,6,col);
   for(const side of [-1,1]){line([-19,side*9,17],[-25,side*16,3],steel,2.5);plate(-24,side*16,1,4,3,2,dark);for(let j=0;j<4;j++)box(-15+j*4,side*10,17,1.3,1,4,tint(col,-16));}
   line([2+recoil,0,18],[34+recoil,0,18],steel,3.2);line([1+recoil,0,18],[14+recoil,0,18],col,5.3);box(32+recoil,0,16.5,2,2.2,3,dark);for(const y of [-2.3,2.3])face([[31+recoil,y,17],[33+recoil,y,17],[33+recoil,y,19],[31+recoil,y,19]],'#101d21');
  }else{
   tube(-2,0,14,8,2,dark);plate(-3,0,16,12,9,7,col);plate(7,-5,16,6,4,5,tint(col,12));plate(7,5,16,6,4,5,tint(col,5));box(-15,0,16,3,8,6,dark);for(const side of [-1,1]){line([-17,side*8,23],[-8,side*8,23],trim,.8);for(let j=0;j<3;j++)line([1-j*2,side*9,19],[-1-j*2,side*11,22],steel,1.6);}
   line([6+recoil,0,18],[28+recoil,0,18],steel,3.5);line([7+recoil,0,18],[14+recoil,0,18],col,4.8);orb(28+recoil,0,18,.35,1.8,1.8,dark);tube(-6,-4,23,3,1.1,steel);box(-4,4,23,2,2,2,dark);line([-4,4,26],[7,4,26],steel,.9);
   if(reptile){for(const side of [-1,1])face([[-10,side*6,24],[-7,side*6,31],[-3,side*6,24]],'#b8ad71');}
  }
 }
 // Cast towing loops, mesh grilles, separate optics and tied stowage survive downsampling.
 for(const side of [-1,1]){orb(17,side*8,13,1.5,1.1,1.2,'#d2c391','glass');line([20,side*7,7],[17,side*7,7],steel,1.3);box(-18,side*9,14,3,1.6,4,'#978a65','cloth');for(const x of [-20,-17])line([x,side*7.4,14],[x,side*10.6,18],dark,.65);}
 for(let x=-18;x<-9;x+=1.8)line([x,-5,15],[x,5,15],dark,.75);line([-16,-7,21],[-16,-7,32],steel,.5);
 M.ownership([{x:[-9,-4],y:[-20,20],z:[10,26]},{x:[8,12],y:[-20,20],z:[10,22]}]);
 M.finish();return true;
}

root.FractureDetailArt={kit,building,humanoid,unit,emblem,figure,vehicle};
})(globalThis);
