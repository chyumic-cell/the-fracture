/* Original scenery meshes. They reuse the tree entity, placement and clearing rules. */
'use strict';
(function(root){
function tree(e,options,art){
 const E=root.FractureEnvironments,o=typeof options==='string'?{theme:options}:options||{},kind=E.scenery(o,e.x,e.y);if(kind==='temperate')return null;
 const variant=(e.variant||0)%4,key='environment-tree3_'+kind+'_'+variant;if(art.cache.has(key))return art.cache.get(key);
 const c=document.createElement('canvas');c.width=96;c.height=112;const ctx=c.getContext('2d'),M=new root.FractureSpriteMesh(ctx,0,false,{originX:48,originY:95,logicalWidth:96}),{hash}=root.FractureSim,rand=(a,b)=>hash(a,variant+19,b),tint=root.FractureArt.tint;
 if(kind==='hell'||kind==='moon'){
  const hell=kind==='hell',base=hell?'#813c36':'#929292';M.material('rock');
  const pillar=(x,y,r,h,id)=>{
   const count=hell?7:6,angle=id*.71,levels=hell?[0,.12,.36,.61,.81,1]:[0,.08,.33,.61,.88,1],radii=hell?[1,.86,.62,.36,.14,.015]:[1.14,1,.85,.94,.72,.65],lean=(rand(id,31)-.5)*(hell?7:11);
   const rings=levels.map((v,j)=>Array.from({length:count},(_,k)=>{const a=k*Math.PI*2/count+angle,rr=r*radii[j]*(.88+rand(k+id*7,j+29)*.24);return[x+Math.cos(a)*rr+lean*v,y+Math.sin(a)*rr*.8,h*v+(j===levels.length-1&&!hell?(rand(k+id,73)-.5)*7:0)];}));
   for(let j=0;j<rings.length-1;j++)for(let k=0;k<count;k++){const next=(k+1)%count;M.face([rings[j][k],rings[j][next],rings[j+1][next],rings[j+1][k]],tint(base,(j%3-1)*6+(k%2?4:-4)));if(j>0&&j<4)M.seg(rings[j][k],rings[j][next],tint(base,j%2?-23:15),.45);}
   M.face(rings.at(-1),tint(base,25));
   if(hell)for(let j=0;j<3;j++){const a=rings[1][j],b=rings[3][j];M.seg(a,b,'#471e26',.7);M.material('glow').seg([a[0]+.2,a[1]+.2,a[2]+1],[b[0]+.2,b[1]+.2,b[2]],'#b14c31',.3);M.material('rock');}
  };
  pillar(-4,-1,hell?12:10,61+variant*5,1);
  pillar(15,6,7,hell?31+variant*3:39-variant*3,2);
  pillar(-16,8,6,hell?23:22+variant*2,3);
  if(variant%2)pillar(5,-15,5,hell?40:28,4);
  for(let i=0;i<7;i++){const a=i*2.4,r=17+rand(i,99)*5;pillar(Math.cos(a)*r,Math.sin(a)*r*.72,2.2+rand(i,50)*2.5,2+rand(i,51)*5,i+8);}
 }else if(kind==='arctic'||kind==='aetherland'){
  const snowy=kind==='arctic',bark=snowy?'#72706a':'#60432d',needles=snowy?'#4c6467':'#294c38';
  const height=64+variant*5;M.material('wood').loft([[0,0,0,4,4],[0,0,height*.7,2,2],[0,0,height,1,1]],bark,7);
  for(let tier=0;tier<6;tier++){const z=14+tier*11,r=Math.max(4,24-tier*4)+(variant%2?2:0),top=z+24;
   const ring=(radius,zz,phase=0)=>Array.from({length:12},(_,i)=>{const a=i*Math.PI/6+tier*.13,rr=radius*(i%2?.74:1)*(.85+rand(i+tier*12,39)*.24);return[Math.cos(a)*rr,Math.sin(a)*rr*.8,zz+(i%2?2:0)+phase+rand(i+tier*12,54)*2];});
   M.material('leaf');for(let branch=0;branch<11;branch++){const a=branch*2.399+tier*.3,rr=r*(.68+rand(branch+tier*11,92)*.32),tip=[Math.cos(a)*rr,Math.sin(a)*rr*.8,z+rand(branch,97)*3];M.material('wood').seg([0,0,z+9],tip,bark,.65);for(let twig=0;twig<5;twig++){const t=.25+twig*.15,cx=tip[0]*t,cy=tip[1]*t,cz=z+9*(1-t),w=(1-t)*r*.27;M.material('leaf');for(const side of [-1,1])M.face([[cx,cy,cz],[cx-Math.sin(a)*w*side,cy+Math.cos(a)*w*side,cz-2],[tip[0],tip[1],tip[2]]],tint(needles,branch%3*6));}}
   if(snowy){M.material('rock');
    for(let j=0;j<9;j++){const a=j*2.399+tier*.41,rr=r*(.34+rand(j+tier*9,61)*.56),cx=Math.cos(a)*rr,cy=Math.sin(a)*rr*.8,cz=z+7+rand(j+tier*9,83)*4;
     M.orb(cx,cy,cz,2.6+rand(j,17)*2.2,2.2+rand(j,23)*1.9,1.1+rand(j,29)*.9,j%2?'#dce8eb':'#c7d8dd');}
    M.orb(0,0,z+10.5,r*.3,r*.26,1.9,'#d6e4e8');
    if(tier===5)M.orb(0,0,height-1,2.6,2.3,2.6,'#e4eef0');}
   for(let j=0;j<6;j++){const a=j*Math.PI/3+tier*.13,dx=Math.cos(a),dy=Math.sin(a),tip=[dx*r,dy*r*.8,z+1];M.material('wood').seg([0,0,z+8],tip,bark,.7);for(const side of [-1,1]){const end=[tip[0]-dx*3-dy*side*3,tip[1]-dy*3+dx*side*3,tip[2]+3];M.material('fur').seg(tip,end,snowy?'#445d5f':'#3d6948',1.3);if(snowy)M.material('rock').seg([tip[0],tip[1],tip[2]+1],[end[0],end[1],end[2]+.6],'#cedee0',.8);}}
   // Unsnowed pines carry a second set of boughs with hanging fronds; snow already closes the gaps on the arctic tree.
   if(!snowy)for(let j=0;j<6;j++){const a=j*Math.PI/3+tier*.13+.52,dx=Math.cos(a),dy=Math.sin(a),tip=[dx*r*.93,dy*r*.75,z+2.5],shoulder=[0,0,z+8.5];
    M.material('wood').seg(shoulder,tip,bark,.6);
    for(let k=1;k<=6;k++){const t=k/7,cx=tip[0]*t,cy=tip[1]*t,cz=shoulder[2]+(tip[2]-shoulder[2])*t,w=(1-t*.7)*r*.21;
     M.material('leaf');
     for(const side of [-1,1])M.face([[cx,cy,cz],[cx-Math.sin(a)*w*side+dx*1.5,cy+Math.cos(a)*w*side+dy*1.5,cz-2.5],[cx+dx*4.8,cy+dy*4.8,cz-1.2]],tint(needles,(k+j)%3*7-5));}}
  }
  for(let j=0;j<5;j++){const a=j*1.26;M.material('wood').seg([0,0,5],[Math.cos(a)*10,Math.sin(a)*10,1],bark,2);}
 }else if(kind==='dreadhollow'){
  const bark='#373c40',wood='#6a706e',height=59+variant*4,lean=(variant%2?1:-1)*5;
  M.material('wood').loft([[0,0,0,6,5],[2,-1,10,4.8,4.2],[-2,1,27,3.3,3],[lean,0,43,2.8,2.5],[lean+3,-2,height,1.2,1]],bark,9);
  for(let j=0;j<6;j++){
   const a=j*2.399+variant*.4,dx=Math.cos(a),dy=Math.sin(a),z=25+(j%3)*9,r=14+(j%2)*4;
   const shoulder=[lean*.5,0,z],elbow=[dx*r*.7,dy*r*.65,z+9],wrist=[dx*r,dy*r*.8,z+17],tip=[dx*(r-5)-dy*3,dy*(r-5)*.8+dx*3,z+26];
   M.material('wood').limb(shoulder,elbow,bark,3.4);M.limb(elbow,wrist,bark,2.5);M.seg(wrist,tip,wood,1);
   for(const side of [-1,1]){const fork=[wrist[0]-dy*side*5+dx*2,wrist[1]+dx*side*5+dy*2,wrist[2]+6],end=[fork[0]-dx*3,fork[1]-dy*3,fork[2]+5];M.seg(wrist,fork,bark,1.2);M.seg(fork,end,wood,.55);}
   if(j%2===0){M.material('cloth').face([elbow,[elbow[0]+1.5,elbow[1]+1,z+5],[elbow[0]-1,elbow[1]+.5,z-3]],'#626b68');}
  }
  for(let j=0;j<7;j++){const a=j*.898,mid=[Math.cos(a)*7,Math.sin(a)*6,2],end=[Math.cos(a+.22)*15,Math.sin(a+.22)*12,.6];M.material('wood').limb([0,0,6],mid,bark,3.4);M.seg(mid,end,wood,1.3);}
  // Recessed fissures and sparse spectral light are attached to the bark.
  for(const side of [-1,1]){M.material('wood').orb(2,side*2.5,28,1.6,1.3,5,'#101b22');M.material('glow').seg([2.4,side*3,25],[2.1,side*3.1,29],'#6a9baf',.5);M.material('wood').seg([1,side*3,14],[0,side*2.8,23],wood,.6);}
 }else if(kind==='jungle'){
  // Jungle tree: buttress roots, a tall smooth trunk, layered broad-leaf canopy and hanging vines.
  const bark='#6b5a42',pale='#8a7a5c',leaf='#2f6a2c',dark='#21501f',vine='#3f7a2e',height=58+variant*3,lean=(variant%2?1:-1)*3;
  M.material('wood').loft([[0,0,0,6.5,6],[0,0,9,4.4,4],[lean*.4,0,30,3.7,3.4],[lean,0,height,2.8,2.5]],bark,9);
  for(let j=0;j<5;j++){const a=j*1.257+variant*.4,dx=Math.cos(a),dy=Math.sin(a);M.material('wood').face([[0,0,14],[dx*3,dy*2.4,14],[dx*11,dy*8.5,0],[dx*4,dy*3,0]],pale);M.seg([dx*3,dy*2.4,13],[dx*11,dy*8.5,.4],bark,.9);}
  for(let j=0;j<6;j++){const a=j*2.399+variant*.3,r=11+(j%3)*4,x=Math.cos(a)*r+lean,y=Math.sin(a)*r*.75,z=height-6+(j%2)*5;M.material('wood').seg([lean,0,height-12+j],[x*.8,y*.8,z-2],bark,1.6);M.foliage(x,y,z,15,11.5,7,j%2?leaf:dark,j+variant*13);}
  M.foliage(lean,0,height+4,19,15,8,'#357530',91+variant*7);M.foliage(lean+2,-1,height+10,12,10,5.5,'#3f8236',97+variant*7);
  // Broad single leaves at the canopy rim.
  for(let j=0;j<10;j++){const a=j*.628+variant*.2,dx=Math.cos(a),dy=Math.sin(a),base=[lean+dx*14,dy*11,height-2],tip=[lean+dx*22,dy*17,height-7];M.material('leaf');for(const side of [-1,1])M.face([base,[base[0]-dy*4*side+dx*3,base[1]+dx*3*side+dy*2,base[2]-1],tip],j%2?'#3c7d33':'#2c6328');}
  // Vines hang from the canopy, some to the ground.
  for(let j=0;j<7;j++){const a=j*.9+variant*.5,x=Math.cos(a)*(8+j%3*3)+lean,y=Math.sin(a)*7,top=height-3,bottom=j%3===0?2:top-14-rand(j,41)*10;M.material('fur').seg([x,y,top],[x+1,y,(top+bottom)/2],vine,.55);M.seg([x+1,y,(top+bottom)/2],[x,y+.5,bottom],vine,.45);M.material('leaf').orb(x,y,(top+bottom)/2,.9,.7,1.2,'#4b8a35');}
  for(let j=0;j<4;j++){const a=j*1.6+.4;M.material('leaf').foliage(Math.cos(a)*12,Math.sin(a)*9,2.5,4.5,3.5,2.5,'#2d6a2a',j+60+variant);}
 }else if(kind==='duskbloom'){
  // Duskcap: a giant mushroom of pale violet stalk and indigo-magenta cap, freckled with teal light.
  const stalk='#c6a9ea',ring='#9a7fc4',cap=variant%2?'#6a3d8f':'#4d3a8f',gill='#d4c4ec',glowA='#7ff0dc',glowB='#9fd8ff',height=40+variant*4,lean=(variant%2?1:-1)*3;
  M.material('skin').loft([[0,0,0,7,6.2],[0,0,5,4.6,4.1],[lean*.5,0,height*.55,4,3.6],[lean,0,height,4.4,3.9]],stalk,10);
  M.orb(lean*.45,0,height*.5,4.4,3.8,1.2,ring);
  const rx=20+variant*1.5,ry=16+variant;M.material('skin').orb(lean,0,height+4,rx,ry,4.5,gill);M.orb(lean,0,height+8,rx-1,ry-1,8,cap);M.orb(lean,0,height+12,rx*.55,ry*.55,4,variant%2?'#7a4a9e':'#5c47a0');
  for(let j=0;j<12;j++){const a=j*2.399,d=Math.sqrt((j+.5)/12)*(rx-4),x=lean+Math.cos(a)*d,y=Math.sin(a)*d*ry/rx,z=height+8+8*Math.sqrt(Math.max(0,1-(d/(rx-1))**2))+.6;M.material('glow').orb(x,y,z,1.9+rand(j,51)*.9,1.6,1,j%3?glowA:glowB);}
  // Gill rim and drifting spores.
  for(let j=0;j<16;j++){const a=j*Math.PI/8,x=lean+Math.cos(a)*(rx-.5),y=Math.sin(a)*(ry-.5);M.material('skin').seg([lean+Math.cos(a)*rx*.4,Math.sin(a)*ry*.4,height+2],[x,y,height+3.5],ring,.4);}
  for(let j=0;j<5;j++){const a=j*1.3+variant,r=8+rand(j,61)*10;M.material('glow').orb(Math.cos(a)*r,Math.sin(a)*r*.7,height-6-j*5,.55,.55,.55,glowA);}
  // A cluster of smaller caps at the foot.
  for(let j=0;j<3;j++){const a=j*2.1+variant*.7,x=Math.cos(a)*11,y=Math.sin(a)*8,h=7+j*3;M.material('skin').loft([[x,y,0,1.6,1.4],[x,y,h,1,.9]],stalk,6);M.orb(x,y,h+1,4.2,3.5,1.8,cap);M.material('glow').orb(x,y,h+2.6,.8,.7,.5,glowA);}
 }else if(kind==='rotmire'){
  // Gallows tree: a swollen, tumoured trunk of bruise-violet bark streaked with rot-moss, drooping
  // limbs hung with silk-wrapped cocoons, and sickly green pustules. No reds or greys.
  const bark='#644a70',moss='#8d9e34',pale='#a294a8',silk='#e6dcaa',strand='#b3aa80',height=50+variant*4,lean=(variant%2?-1:1)*4;
  M.material('wood').loft([[0,0,0,7,6],[1,-1,8,6.2,5.6],[-1,1,20,6.8,6],[lean*.5,0,32,4.4,4],[lean,0,height-8,2.6,2.3],[lean+2,-1,height,1.3,1.1]],bark,10);
  // Tumours bulge from the trunk; moss streaks run down from them.
  for(let j=0;j<5;j++){const a=j*2.2+variant,z=10+j*7+rand(j,7)*4,r=4.5+rand(j,8)*1.5;const x=Math.cos(a)*r*.9+lean*z/height,y=Math.sin(a)*r*.7;M.material('skin').orb(x,y,z,2.4+rand(j,9)*1.6,2.1+rand(j,10)*1.4,2.6+rand(j,11)*1.5,j%2?'#7e5f8a':'#73567e');M.material('fur').seg([x,y,z-1],[x*1.05,y*1.05,z-8],moss,.9);}
  for(let j=0;j<6;j++){
   const a=j*2.399+variant*.5,dx=Math.cos(a),dy=Math.sin(a),z=height-14+(j%3)*5,r=15+(j%2)*5;
   const shoulder=[lean*.8,0,z],elbow=[dx*r*.6,dy*r*.5,z+6],hand=[dx*r,dy*r*.8,z+1],droop=[dx*(r+3),dy*(r+3)*.8,z-7];
   M.material('wood').limb(shoulder,elbow,bark,3);M.limb(elbow,hand,bark,2.1);M.seg(hand,droop,pale,.8);
   M.material('fur').seg(elbow,[elbow[0],elbow[1],elbow[2]-6],moss,1.1);
   // Cocoons hang on silk strands from alternate limbs; each holds the hunched outline of its victim.
   if((j+variant)%2===0){const top=[hand[0]*.92,hand[1]*.92,hand[2]-.5],len=9+rand(j,21)*5,c=[top[0],top[1],top[2]-len];M.material('cloth').seg(top,[c[0],c[1],c[2]+6],strand,.35);
    M.material('cloth').orb(c[0],c[1],c[2]+3,3.1,2.7,5.4,silk);M.orb(c[0],c[1],c[2]+8.6,2,1.8,2,silk);
    for(let k=0;k<4;k++)M.seg([c[0]-3,c[1],c[2]+k*2.4-.5],[c[0]+3,c[1],c[2]+k*2.4+.8],'#a39870',.3);}
   else{const tip=[droop[0],droop[1],droop[2]-4];M.material('wood').seg(droop,tip,pale,.45);}
  }
  // Pustules glow on the trunk and among the roots.
  for(let j=0;j<7;j++){const a=j*1.7+variant*.3,z=4+j*6.5,r=j<5?5.6:3.2;M.material('glow').orb(Math.cos(a)*r+lean*z/height,Math.sin(a)*r*.7,z,1.4+rand(j,31)*.7,1.25,1.4,j%3?'#a8d448':'#c9e86a');}
  // Rib-like roots arch out of the mire.
  for(let j=0;j<7;j++){const a=j*.898+variant*.2,mid=[Math.cos(a)*9,Math.sin(a)*7,4.5],end=[Math.cos(a+.25)*16,Math.sin(a+.25)*12.5,.4];M.material('wood').limb([0,0,5],mid,bark,3);M.seg(mid,end,pale,1.3);}
  M.material('glow').orb(3,8,1,1.1,.9,.6,'#b6dc52');M.orb(-9,-3,1,.9,.8,.5,'#a8d448');
 }else if(kind==='osland'||kind==='starfall'){
  const star=kind==='starfall',height=48+variant*4,bark=star?'#8d97a6':'#555d3a',leaf=star?'#88b7bd':'#315e37';
  M.material('wood').loft([[0,0,0,4.8,4],[1,-1,20,3.4,3],[-2,1,38,2,1.7],[0,0,height+6,.8,.8]],bark,9);
  for(let j=0;j<7;j++){
   const a=j*2.399+variant*.3,reach=13+(j%3)*3,x=Math.cos(a)*reach,y=Math.sin(a)*reach*.75,z=height-8+(j%3)*7;
   M.material('wood').seg([0,0,19+j*3],[x*.6,y*.6,z-5],bark,2.6);M.seg([x*.6,y*.6,z-5],[x,y,z],bark,1.4);
   M.foliage(x,y,z+2,11,8,8,tint(leaf,j%3*7),j+variant*17);
   for(let k=0;k<4;k++){const aa=a+k*1.8,xx=x+Math.cos(aa)*6,yy=y+Math.sin(aa)*5;M.material('wood').seg([x,y,z],[xx,yy,z+4],bark,.45);}
   if(star){const bud=[x+2,y,z+7];M.material('wood').seg([x,y,z+4],bud,bark,.65);M.material('glow').orb(...bud,1.3,1.1,1.8,'#b2dedb');M.material('cloth').face([[x,y,z+8],[x+5,y+1,z+12],[x+2,y+3,z+5]],'#b8cfda');}
  }
  for(let j=0;j<5;j++){const a=j*1.256;M.material('wood').seg([0,0,4],[Math.cos(a)*10,Math.sin(a)*8,1],bark,2.1);}
 }else{
  const palm=variant%2===0,wood='#8b7455',height=palm?57+variant*3:42+variant*4;
  M.material('wood').loft([[0,0,0,4.3,4],[-2,0,height*.4,3,2.8],[2,0,height*.75,2.2,2],[6,0,height,1.8,1.8]],wood,8);
  for(let j=0;j<8;j++){const a=j*Math.PI/4+.3,dx=Math.cos(a),dy=Math.sin(a),z=height-(palm?0:j%2*2),mid=[6+dx*(palm?15:12),dy*12,z+(palm?8:5)],tip=[6+dx*(palm?27:22),dy*22,z-(palm?7:0)];
   M.material('wood').seg([3,0,palm?height:height*.55],mid,wood,palm?.9:2.2);M.seg(mid,tip,wood,.9);
   if(palm){for(let k=0;k<7;k++){const f=k/7,anchor=mid.map((v,i)=>v+(tip[i]-v)*f),w=(1-f)*5+2;for(const side of [-1,1])M.material('fur').face([anchor,[anchor[0]-dy*w*side-dx*3,anchor[1]+dx*w*side-dy*3,anchor[2]-3],[anchor[0]+dx*4,anchor[1]+dy*4,anchor[2]-2]],j%2?'#8d9160':'#686f4b');}}
   else{M.foliage(tip[0],tip[1],z+1,11.5,9,4.4,j%2?'#85845c':'#72784e',j+variant*13);
    M.foliage(tip[0]*.72,tip[1]*.72,z+4.5,8,6.5,3.6,j%2?'#8e8d63':'#6b7248',j+41+variant*7);}
  }
  if(!palm){M.foliage(5,0,height+1,16,13,5.2,'#7d8155',77+variant*11);M.foliage(5,0,height+5,11,9,3.8,'#8b8a5f',91+variant*11);}
  if(palm)for(let j=0;j<12;j++)M.material('wood').cylinder(j>7?3:0,0,j*4,3-j*.12,.5,'#b09a71',8);
 }
 M.finish();
 // Moon light is achromatic, including shaded facets; other sprites retain their identity colors.
 if(kind==='moon'){const im=ctx.getImageData(0,0,96,112);for(let i=0;i<im.data.length;i+=4){const gray=Math.round(im.data[i]*.30+im.data[i+1]*.59+im.data[i+2]*.11);im.data[i]=im.data[i+1]=im.data[i+2]=gray;}ctx.putImageData(im,0,0);}
 ctx.save();ctx.globalCompositeOperation='destination-over';root.FractureArt.ellipse(ctx,48,96,22,6,kind==='hell'?'#19060a65':kind==='moon'?'#10101055':kind==='rotmire'?'#0f170a60':'#17242a45');ctx.restore();art.cache.set(key,c);return c;
}
root.FractureEnvironmentArt={tree};
})(globalThis);
