/* Original scenery meshes. They reuse the tree entity, placement and clearing rules. */
'use strict';
(function(root){
function tree(e,options,art){
 const E=root.FractureEnvironments,o=typeof options==='string'?{theme:options}:options||{},kind=E.scenery(o,e.x,e.y);if(kind==='temperate')return null;
 const variant=(e.variant||0)%4,key='environment-tree1_'+kind+'_'+variant;if(art.cache.has(key))return art.cache.get(key);
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
 }else if(kind==='arctic'){
  const height=64+variant*5;M.material('wood').loft([[0,0,0,4,4],[0,0,height*.7,2,2],[0,0,height,1,1]],'#72706a',7);
  for(let tier=0;tier<5;tier++){const z=14+tier*11,r=24-tier*4+(variant%2?2:0),top=z+24;
   const ring=(radius,zz,phase=0)=>Array.from({length:12},(_,i)=>{const a=i*Math.PI/6+tier*.13,rr=radius*(i%2?.74:1)*(.85+rand(i+tier*12,39)*.24);return[Math.cos(a)*rr,Math.sin(a)*rr*.8,zz+(i%2?2:0)+phase+rand(i+tier*12,54)*2];});
   M.material('fur').rings([ring(r,z),ring(r*.78,z+6),ring(.1,top)],'#4c6467');
   M.material('rock').rings([ring(r*.85,z+5),ring(r*.6,z+11),ring(.15,top+.8)],'#dce8eb');
   for(let j=0;j<6;j++){const a=j*Math.PI/3+tier*.13,dx=Math.cos(a),dy=Math.sin(a),tip=[dx*r,dy*r*.8,z+1];M.material('wood').seg([0,0,z+8],tip,'#5b6662',.7);for(const side of [-1,1]){const end=[tip[0]-dx*3-dy*side*3,tip[1]-dy*3+dx*side*3,tip[2]+3];M.material('fur').seg(tip,end,'#445d5f',1.3);M.material('rock').seg([tip[0],tip[1],tip[2]+1],[end[0],end[1],end[2]+.6],'#cedee0',.8);}}
  }
  for(let j=0;j<5;j++){const a=j*1.26;M.material('wood').seg([0,0,5],[Math.cos(a)*10,Math.sin(a)*10,1],'#77756f',2);}
 }else{
  const palm=variant%2===0,wood='#8b7455',height=palm?57+variant*3:42+variant*4;
  M.material('wood').loft([[0,0,0,4.3,4],[-2,0,height*.4,3,2.8],[2,0,height*.75,2.2,2],[6,0,height,1.8,1.8]],wood,8);
  for(let j=0;j<8;j++){const a=j*Math.PI/4+.3,dx=Math.cos(a),dy=Math.sin(a),z=height-(palm?0:j%2*2),mid=[6+dx*(palm?15:12),dy*12,z+(palm?8:5)],tip=[6+dx*(palm?27:22),dy*22,z-(palm?7:0)];
   M.material('wood').seg([3,0,palm?height:height*.55],mid,wood,palm?.9:2.2);M.seg(mid,tip,wood,.9);
   if(palm){for(let k=0;k<7;k++){const f=k/7,anchor=mid.map((v,i)=>v+(tip[i]-v)*f),w=(1-f)*5+2;for(const side of [-1,1])M.material('fur').face([anchor,[anchor[0]-dy*w*side-dx*3,anchor[1]+dx*w*side-dy*3,anchor[2]-3],[anchor[0]+dx*4,anchor[1]+dy*4,anchor[2]-2]],j%2?'#8d9160':'#686f4b');}}
   else{M.material('fur').loft([[tip[0],tip[1],z-3,9,7],[tip[0],tip[1],z+1,13,10],[tip[0]+1,tip[1],z+5,7,5]],j%2?'#85845c':'#72784e',9);for(let k=0;k<5;k++){const an=k*2.4+j,xx=tip[0]+Math.cos(an)*8,yy=tip[1]+Math.sin(an)*6;M.loft([[xx,yy,z+1,3,3],[xx,yy,z+4,5,4],[xx,yy,z+6,2,2]],k%2?'#858b58':'#72794e',7);}}
  }
  if(!palm)M.material('fur').loft([[5,0,height-3,9,8],[5,0,height+2,17,14],[5,0,height+6,11,9]],'#7d8155',11);
  if(palm)for(let j=0;j<12;j++)M.material('wood').cylinder(j>7?3:0,0,j*4,3-j*.12,.5,'#b09a71',8);
 }
 M.finish();
 // Moon light is achromatic, including shaded facets; other sprites retain their identity colors.
 if(kind==='moon'){const im=ctx.getImageData(0,0,96,112);for(let i=0;i<im.data.length;i+=4){const gray=Math.round(im.data[i]*.30+im.data[i+1]*.59+im.data[i+2]*.11);im.data[i]=im.data[i+1]=im.data[i+2]=gray;}ctx.putImageData(im,0,0);}
 ctx.save();ctx.globalCompositeOperation='destination-over';root.FractureArt.ellipse(ctx,48,96,22,6,kind==='hell'?'#19060a65':kind==='moon'?'#10101055':'#17242a45');ctx.restore();art.cache.set(key,c);return c;
}
root.FractureEnvironmentArt={tree};
})(globalThis);
