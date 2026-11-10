'use strict';
// Original orthographic sprite renderer: authored geometry, surface materials and baked self-shadow.
(function(root){
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const mod=(a,b)=>(a%b+b)%b;
const mats={rock:[.04,9,3.1],slate:[.06,11,2.3],paint:[.2,26,1.6],metal:[.85,55,2.5],cloth:[.02,7,2],skin:[.12,16,1],fur:[.03,7,3.2],stone:[.03,8,4.1],chitin:[.55,37,2],wood:[.06,13,3],bone:[.12,22,1.3],glow:[0,1,0],glass:[1,76,.5]};
class SpriteMesh{
 constructor(ctx,angle=0,dead=false,options={}){this.ctx=ctx;this.w=ctx.canvas.width;this.h=ctx.canvas.height;this.scale=this.w/(options.logicalWidth||112);this.ox=options.originX??56;this.oy=options.originY??87;this.ca=Math.cos(angle);this.sa=Math.sin(angle);this.dead=dead;this.image=ctx.createImageData(this.w,this.h);const count=this.w*this.h;this.depth=new Float32Array(count).fill(-Infinity);this.xyz=new Float32Array(count*3);this.lit=new Uint8Array(count);this.normalZ=new Float32Array(count);this.colors=new Map();this.light=norm([-.9,.65,1.55]);this.eye=norm([1,1,.8]);this.half=norm(this.light.map((x,i)=>x+this.eye[i]));this.su=norm([this.light[1],-this.light[0],0]);this.sv=cross(this.light,this.su);this.sw=options.logicalWidth?384:256;this.ss=options.logicalWidth?1.65:2;this.shadow=new Float32Array(this.sw*this.sw).fill(-Infinity);this.mat='paint';this.detail=options.detail!==false;}
 pose(d,action,frame){
  this.unit=d;
  const moving=action==='walk',air=!!d.air,heavy=['tank','siege','giant'].includes(d.role),phase=frame%4,t=frame*Math.PI/3;
  this.motion={bob:moving?(air?Math.sin(t)*.7:-Math.cos(t*2)*(heavy?.35:.65)):air&&action==='idle'?Math.sin(t)*.6:0,
   shift:action==='attack'?[-.35,-1.2,0,.4][phase]:['gather','build'].includes(action)?[.3,-.8,1.5,.5][phase]:moving&&!air?.5:0,
   lean:moving&&!air?.018:action==='attack'?[0,-.025,0,.012][phase]:['gather','build'].includes(action)?[.01,-.025,.05,.02][phase]:0,
   sway:moving&&!air&&!heavy?Math.sin(t)*.45:0};return this;
 }
 ownership(zones){this.ownerZones=zones;return this;}
 posed(v){if(this.part){const {origin,scale}=this.part;v=v.map((x,i)=>origin[i]+(x-origin[i])*scale);}if(!this.motion)return v;const m=this.motion,w=Math.max(0,Math.min(1,v[2]/16));return[v[0]+(m.shift+v[2]*m.lean)*w,v[1]+m.sway*w,v[2]+m.bob*w];}
 material(kind){this.mat=mats[kind]?kind:'paint';return this;}
 project(v){v=this.posed(v);const x=v[0]*this.ca-v[1]*this.sa,y=v[0]*this.sa+v[1]*this.ca,z=this.dead?v[2]*.16:v[2];return[(this.ox+(x-y)*.8)*this.scale,(this.oy+(x+y)*.4-z)*this.scale,x+y+z*.8];}
 rotate(n){return[n[0]*this.ca-n[1]*this.sa,n[0]*this.sa+n[1]*this.ca,n[2]];}
 world(v){const q=this.rotate(this.posed(v));if(this.dead)q[2]*=.16;return q;}
 shadowPoint(v){return[this.sw*.5+dot(v,this.su)*this.ss,this.sw*.65-dot(v,this.sv)*this.ss,dot(v,this.light)];}
 color(hex){if(!this.colors.has(hex))this.colors.set(hex,hex.slice(1,7).match(/../g).map(x=>parseInt(x,16)));return this.colors.get(hex);}
 triangle(a,b,c,color,normals){if(!color)return;const pa=this.project(a),pb=this.project(b),pc=this.project(c),det=(pb[1]-pc[1])*(pa[0]-pc[0])+(pc[0]-pb[0])*(pa[1]-pc[1]);const wa=this.world(a),wb=this.world(b),wc=this.world(c);this.shadowTriangle(this.shadowPoint(wa),this.shadowPoint(wb),this.shadowPoint(wc));if(Math.abs(det)<.015)return;
 const lowX=Math.max(0,Math.floor(Math.min(pa[0],pb[0],pc[0]))),highX=Math.min(this.w-1,Math.ceil(Math.max(pa[0],pb[0],pc[0]))),lowY=Math.max(0,Math.floor(Math.min(pa[1],pb[1],pc[1]))),highY=Math.min(this.h-1,Math.ceil(Math.max(pa[1],pb[1],pc[1]))),col=this.color(color),normal=norm(this.rotate(cross(sub(b,a),sub(c,a))));
 const ns=normals?normals.map(n=>this.rotate(n)):null;if(!ns&&dot(normal,this.eye)<0)for(let j=0;j<3;j++)normal[j]*=-1;const material=mats[this.mat],glow=this.mat==='glow',mat=this.mat,light=this.light,half=this.half,data=this.image.data;
 for(let y=lowY;y<=highY;y++)for(let x=lowX;x<=highX;x++){const u=((pb[1]-pc[1])*(x+.5-pc[0])+(pc[0]-pb[0])*(y+.5-pc[1]))/det,v=((pc[1]-pa[1])*(x+.5-pc[0])+(pa[0]-pc[0])*(y+.5-pc[1]))/det,w=1-u-v;if(u<-.0001||v<-.0001||w<-.0001)continue;const z=pa[2]*u+pb[2]*v+pc[2]*w,i=y*this.w+x;if(z<this.depth[i]-.008)continue;this.depth[i]=z;
 let nx=normal[0],ny=normal[1],nz=normal[2];if(ns){nx=ns[0][0]*u+ns[1][0]*v+ns[2][0]*w;ny=ns[0][1]*u+ns[1][1]*v+ns[2][1]*w;nz=ns[0][2]*u+ns[1][2]*v+ns[2][2]*w;const nl=Math.hypot(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl;}
 const diff=Math.max(0,nx*light[0]+ny*light[1]+nz*light[2]),spec=material[0]*Math.pow(Math.max(0,nx*half[0]+ny*half[1]+nz*half[2]),material[1])*105;
 const mx=a[0]*u+b[0]*v+c[0]*w,my=a[1]*u+b[1]*v+c[1]*w,mz=a[2]*u+b[2]*v+c[2]*w,seed=(Math.imul(Math.floor(mx*3+113),73856093)^Math.imul(Math.floor(my*3+117),19349663)^Math.imul(Math.floor(mz*3+109),83492791))>>>0;
 // Material patterns live in object coordinates, so they rotate with the model.
 // Broad variation supplies form; fine detail is deliberately lower contrast.
 let grain=(seed%13-6)*material[2]*.28,pattern=0;
 const along=Math.abs(normal[0])>.55?my:mx;
 if(mat==='metal'||mat==='paint'){
  const u=mod(along,12),v=mod(mz,9),seam=Math.abs(nz)<.7&&(u<.18||v<.18);
  pattern=seam?-15:(u<.42||v<.42?5:0)+(Math.floor(mx*2+my*.3)%7===0?1.5:0);
  // Sparse chips and streaks, not uniform television noise.
  if(seed%149===0)pattern+=16;if(seed%211===0)pattern-=12;
 }
 if(mat==='cloth'){const fold=Math.sin(along*1.5+mz*.14);pattern=fold*2.4+((Math.floor(along*6)+Math.floor(mz*6))%2?.65:-.65);}
 if(mat==='wood'){const knot=Math.sin(mz*.16+Math.sin(along*.21)*2);pattern=Math.sin(along*3+knot*1.4)*3.5+Math.sin(along*.7+knot)*2.5;if(mod(along,5.8)<.15)pattern-=12;}
 if(mat==='stone'){
  const row=Math.floor(mz/6.5),u=mod(along+(row%2)*7,14),v=mod(mz,6.5),wall=Math.abs(nz)<.6;
  const mortar=wall&&(v<.42||u<.4),block=(Math.imul(Math.floor((along+(row%2)*7)/14),37)+row*13)%7;
  pattern=mortar?-23:block*1.2+(wall&&(v<.78||u<.75)?6:0)+Math.sin(mx*.22+my*.31+mz*.47)*2;
 }
 if(mat==='rock'){const strata=mz*.19+Math.sin(mx*.21+my*.13)*1.4,seam=mod(strata,4);pattern=Math.sin(mx*.33+my*.41+mz*.27)*4+(seam<.13?-14:seam<.32?7:0);if(seed%163===0)pattern-=15;}
 if(mat==='slate'){const u=mod(along+Math.floor(mz/3)*2.5,5),v=mod(my+mx*.12,4);pattern=v<.3?-14:v<.65?9:u<.18?-6:Math.sin(along*.4+mz)*2;}
 if(mat==='fur'){const strand=mod(along*3+Math.sin(mz*.8)+my*.4,2.8);pattern=strand<.42?-7:strand<.8?5:Math.sin(mz*2+along*.4)*2;}
 if(mat==='chitin'){const row=Math.floor(mz/2.2),u=mod(along+(row%2)*1.8,3.6),v=mod(mz,2.2),rim=v<.2||Math.abs(u-1.8)>1.65;pattern=rim?-8:(v<.5?5:0)+Math.sin(mx*.24+my*.31)*2;}
 if(mat==='skin')pattern=Math.sin(mx*.27+my*.33+mz*.18)*2.5;
 if(mat==='bone')pattern=Math.sin(along*4+mz*.15)*1.2;
 if(mat==='glass'){pattern=Math.max(0,Math.sin(along*.15+mz*.19))**14*24;grain=0;}
 const k=i*4,amb=.4+Math.max(0,nz)*.08;
 for(let j=0;j<3;j++){const warm=j===0?1.06:j===1?1.015:.91,ambient=j===2?1.18:j===0?.93:1.02;data[k+j]=Math.max(0,Math.min(255,Math.round(glow?col[j]*1.12:(col[j]*(amb*ambient+diff*.85*warm)+spec+grain+pattern))));}data[k+3]=255;this.lit[i]=glow?0:Math.round(diff*255);this.normalZ[i]=nz;this.xyz[i*3]=wa[0]*u+wb[0]*v+wc[0]*w;this.xyz[i*3+1]=wa[1]*u+wb[1]*v+wc[1]*w;this.xyz[i*3+2]=wa[2]*u+wb[2]*v+wc[2]*w;
 }
 }
 shadowTriangle(a,b,c){const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<.02)return;const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(this.sw-1,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(this.sw-1,Math.ceil(Math.max(a[1],b[1],c[1])));for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/det,v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/det,w=1-u-v;if(u<0||v<0||w<0)continue;const z=a[2]*u+b[2]*v+c[2]*w,i=y*this.sw+x;if(z>this.shadow[i])this.shadow[i]=z;}}
 face(v,color){for(let j=1;j<v.length-1;j++)this.triangle(v[0],v[j],v[j+1],color);}
 orb(x,y,z,rx,ry,rz,color){const lat=Math.max(5,Math.min(10,Math.ceil(Math.max(rx,ry,rz)))),lon=lat*2;for(let j=0;j<lat;j++){const row=[];for(let i=0;i<=lon;i++){const a=i*Math.PI*2/lon;for(const k of [j,j+1]){const b=-Math.PI/2+k*Math.PI/lat,n=[Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b)];row.push({v:[x+rx*n[0],y+ry*n[1],z+rz*n[2]],n:norm([n[0]/rx,n[1]/ry,n[2]/rz])});}}for(let i=0;i<lon;i++){const a=row[i*2],b=row[i*2+1],c=row[i*2+2],d=row[i*2+3];this.triangle(a.v,b.v,c.v,color,[a.n,b.n,c.n]);this.triangle(c.v,b.v,d.v,color,[c.n,b.n,d.n]);}}}
 // Tapered limbs have a proper muscle belly and narrower joints.
 limb(a,b,color,width=3){const axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[2])<.9?[0,0,1]:[0,1,0])),v=cross(axis,u),r=width*.55;const rings=[0,.24,.62,1].map((t,k)=>Array.from({length:10},(_,i)=>{const an=i*Math.PI/5;return a.map((q,j)=>q+(b[j]-q)*t+(u[j]*Math.cos(an)+v[j]*Math.sin(an))*r*[.7,1.12,.95,.6][k]);}));this.rings(rings,color,true);}
 seg(a,b,color,width=2){const axis=norm(sub(b,a)),u=norm(cross(axis,Math.abs(axis[2])<.9?[0,0,1]:[0,1,0])),v=cross(axis,u),r=width*.58,sides=8;const rings=[a,b].map((p,k)=>Array.from({length:sides},(_,i)=>{const an=i*Math.PI*2/sides;return p.map((q,j)=>q+(u[j]*Math.cos(an)+v[j]*Math.sin(an))*r*(k?.83:1));}));this.rings(rings,color,true);}
 rings(rings,color,smooth=false){const count=rings[0].length;let normals;if(smooth){normals=rings.map((ring,k)=>{const center=ring.reduce((c,v)=>c.map((x,j)=>x+v[j]/count),[0,0,0]);return ring.map((p,i)=>{const tangent=sub(ring[(i+1)%count],ring[(i+count-1)%count]),vertical=sub(rings[Math.min(k+1,rings.length-1)][i],rings[Math.max(k-1,0)][i]);let n=norm(cross(tangent,vertical));if(dot(n,sub(p,center))<0)n=n.map(x=>-x);return n;});});}for(let k=0;k<rings.length-1;k++){const a=rings[k],b=rings[k+1];for(let i=0;i<count;i++){const n=(i+1)%count;if(smooth){this.triangle(a[i],b[i],a[n],color,[normals[k][i],normals[k+1][i],normals[k][n]]);this.triangle(a[n],b[i],b[n],color,[normals[k][n],normals[k+1][i],normals[k+1][n]]);}else this.face([a[i],a[n],b[n],b[i]],color);}}this.face([...rings[0]].reverse(),color);this.face(rings[rings.length-1],color);}
 loft(rings,color,sides=12){this.rings(rings.map(([x,y,z,rx,ry])=>Array.from({length:sides},(_,i)=>[x+Math.cos(i*Math.PI*2/sides)*rx,y+Math.sin(i*Math.PI*2/sides)*ry,z])),color,true);}
 box(x,y,z,w,l,h,color){const b=Math.min(w*.24,l*.24,h*.18,1.6),ring=(ww,ll,zz)=>[[-ww+b,-ll], [ww-b,-ll],[ww,-ll+b],[ww,ll-b],[ww-b,ll],[-ww+b,ll],[-ww,ll-b],[-ww,-ll+b]].map(q=>[q[0]+x,q[1]+y,zz]);this.rings([ring(w,l,z),ring(w,l,z+h-b),ring(w-b*.65,l-b*.65,z+h)],color);
 if(this.detail&&this.mat==='metal'&&w>=6&&l>=4&&h>=4){
  const rgb=this.color(color),shade=n=>'#'+rgb.map(v=>Math.max(0,Math.min(255,v+n)).toString(16).padStart(2,'0')).join(''),edge=shade(21),dark=shade(-25),top=z+h+.04;
  const ww=w*.56,ll=l*.56;
  this.face([[x-ww,y-ll,top],[x+ww,y-ll,top],[x+ww,y+ll,top],[x-ww,y+ll,top]],shade(-6));
  for(const side of [-1,1]){this.seg([x-ww,y+side*ll,top+.1],[x+ww,y+side*ll,top+.1],side<0?dark:edge,.28);}
  if(w>10)for(let j=-2;j<=2;j++)this.face([[x-ww*.65,y+j*ll*.28,top+.12],[x+ww*.65,y+j*ll*.28,top+.12],[x+ww*.65,y+j*ll*.28+.35,top+.12],[x-ww*.65,y+j*ll*.28+.35,top+.12]],dark);
 }
 }
 cylinder(x,y,z,r,h,color,sides=16,topR=r){this.loft([[x,y,z,r,r],[x,y,z+h,topR,topR]],color,sides);}
 finish(){const data=this.image.data,depth=this.depth,s=this.scale,sw=this.sw;for(let y=1;y<this.h-1;y++)for(let x=1;x<this.w-1;x++){const i=y*this.w+x;if(!data[i*4+3])continue;let shade=1;const px=this.xyz[i*3],py=this.xyz[i*3+1],pz=this.xyz[i*3+2],sx=Math.round(sw*.5+(px*this.su[0]+py*this.su[1]+pz*this.su[2])*this.ss),sy=Math.round(sw*.65-(px*this.sv[0]+py*this.sv[1]+pz*this.sv[2])*this.ss),sd=px*this.light[0]+py*this.light[1]+pz*this.light[2];if(sx>0&&sy>0&&sx<sw-1&&sy<sw-1&&this.lit[i]>0){let occluded=0;for(const [dx,dy]of [[0,0],[1,0],[0,1],[-1,0],[0,-1]])if(this.shadow[(sy+dy)*sw+sx+dx]>sd+1.25)occluded++;shade-=occluded*.065*(.4+this.lit[i]/425);}
 let cavity=0;for(const [dx,dy]of [[-2,0],[2,0],[0,-2],[0,2],[-3,-3],[3,-3]]){const xx=x+Math.round(dx*s*.6),yy=y+Math.round(dy*s*.6);if(xx<0||yy<0||xx>=this.w||yy>=this.h)continue;const dz=depth[yy*this.w+xx]-depth[i];if(dz>1.3&&dz<10)cavity+=.017;}shade-=Math.min(.1,cavity);if(!data[(i-1)*4+3]||!data[(i+1)*4+3]||!data[(i-this.w)*4+3]||!data[(i+this.w)*4+3])shade*=.86;for(let k=0;k<3;k++)data[i*4+k]=Math.round(data[i*4+k]*shade);}
 this.ctx.putImageData(this.image,0,0);
 if(this.unit){
  const d=this.unit,n=d.name,animal=/Dragon|Drake|Wyvern|Beast|Prowler|Spitter|Chimera|Hydra|Hellhound|Familiar/.test(n),machine=d.faction==='machines'||/Tank|Vehicle|Artillery|Gunship|Aircraft|Walker|Crawler|Ram|Catapult/.test(n),bug=d.faction==='insects';
  const zones=this.ownerZones||(n==='Broom Rider'?[{x:[-6,7],y:[-7,7],z:[21,24]}]:bug?[{x:[-11,-6],y:[-14,14],z:[15,42]}]:machine?[{x:[-9,-4],y:[-20,20],z:[11,50]},{x:[4,8],y:[-20,20],z:[11,50]}]:animal?[{x:[-8,-3],y:[-13,13],z:[20,55]}]:[{x:[-12,12],y:[-12,12],z:[20,24]}]);
  const marks=[];let x0=this.w,y0=this.h,x1=0,y1=0;
  for(let i=0;i<this.w*this.h;i++){if(!data[i*4+3])continue;const wx=this.xyz[i*3],wy=this.xyz[i*3+1],z=this.xyz[i*3+2]/(this.dead?.16:1),x=wx*this.ca+wy*this.sa,y=-wx*this.sa+wy*this.ca;if(!zones.some(q=>x>=q.x[0]&&x<=q.x[1]&&y>=q.y[0]&&y<=q.y[1]&&z>=q.z[0]&&z<=q.z[1]))continue;const px=i%this.w,py=Math.floor(i/this.w);x0=Math.min(x0,px);y0=Math.min(y0,py);x1=Math.max(x1,px);y1=Math.max(y1,py);marks.push([px,py,.48+this.lit[i]/255*.62]);}
  if(marks.length){const w=x1-x0+1,h=y1-y0+1,region=this.ctx.getImageData(x0,y0,w,h);this.ctx.canvas.ownerPaint={x:x0,y:y0,data:region,indices:marks.map(p=>((p[1]-y0)*w+p[0]-x0)*4),light:marks.map(p=>p[2])};root.FractureArt?.paintOwner(this.ctx.canvas,'#6eb8c6');}
 }
 }
}
root.FractureMotion={step(frame,offset=0,reach=7.5){const t=((frame/6+offset)%1+1)%1,stance=.58;if(t<stance)return{x:reach*(1-2*t/stance),lift:0,planted:true};const q=(t-stance)/(1-stance),ease=q*q*(3-2*q);return{x:reach*(-1+2*ease),lift:Math.sin(q*Math.PI)*3.3,planted:false};}};
root.FractureSpriteMesh=SpriteMesh;
})(globalThis);
