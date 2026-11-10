'use strict';
// Code-authored terrain: continuous material fields, crisp detail and bounded screen-space caches.
(function(root){
const {noise,hash}=root.FractureSim;
const environments=root.FractureEnvironments,styles=environments.styles;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function cellRange(game,r){return{lo:Math.max(0,Math.floor((r.y-30)/12)),hi:Math.min(game.n*2-2,Math.ceil((r.y+r.h+64)/12))};}
function cells(game,r,fn){const n=game.n,{lo,hi}=cellRange(game,r);for(let s=lo;s<=hi;s++){const left=Math.max(0,s-n+1,Math.floor((r.x+s*24-26)/48)),right=Math.min(n-1,s,Math.ceil((r.x+r.w+s*24+26)/48));for(let x=left;x<=right;x++)fn(x,s-x);}}
// All sampling weights are shared by every tile; the hot pixel loop allocates nothing.
const pixels=[];for(let py=0;py<26;py+=2)for(let px=0;px<50;px+=2){const targets=[];for(let oy=0;oy<2;oy++)for(let ox=0;ox<2;ox++){const xx=px+ox,yy=py+oy,u=((xx-25)/24+(yy-1)/12)/2,v=((yy-1)/12-(xx-25)/24)/2;if(u>=-.035&&v>=-.035&&u<=1.035&&v<=1.035)targets.push({at:(yy*50+xx)*4,gx:Math.floor(u*25),gy:Math.floor(v*25)});}if(!targets.length)continue;const u=clamp(((px+.5-25)/24+(py+.5-1)/12)/2),v=clamp(((py+.5-1)/12-(px+.5-25)/24)/2),fu=u*3,fv=v*3,ix=Math.min(2,Math.floor(fu)),iy=Math.min(2,Math.floor(fv)),fx=fu-ix,fy=fv-iy;pixels.push({u,v,a:(1-u)*(1-v),b:u*(1-v),c:(1-u)*v,d:u*v,targets,gx:Math.floor(u*25),gy:Math.floor(v*25),fi:iy*4+ix,fa:(1-fx)*(1-fy),fb:fx*(1-fy),fc:(1-fx)*fy,fd:fx*fy});}
const groundCaches=new WeakMap();
function surface(art,game,x,y){
 let cache=groundCaches.get(game);if(!cache){cache=new Map();groundCaches.set(game,cache);}const key=y*game.n+x;if(cache.has(key))return cache.get(key);
 const c={width:50,height:26,data:new Uint8ClampedArray(50*26*4)},im=c,t=game.tile(x,y),p=environments.palette(game.options,x+.5,y+.5),s=game.options.seed;
 const mixed=environments.resolve(game.options)==='varied',materialFields=['grass','dry','soil','stone','sand','shallow','deep'],materialCorners=mixed?Array.from({length:4},(_,i)=>{const p=environments.palette(game.options,x+(i&1),y+(i>>1));return materialFields.flatMap(f=>p[f]);}):null,materialValues=new Float64Array(21);
 const samples=Array.from({length:4},(_,i)=>{const wx=x+(i&1),wy=y+(i>>1);return[noise(wx/8,wy/8,s+301),noise(wx/19,wy/19,s+807),noise(wx/3,wy/3,s+511)];});
 const lerp=(u,v,k)=>samples[0][k]*(1-u)*(1-v)+samples[1][k]*u*(1-v)+samples[2][k]*(1-u)*v+samples[3][k]*u*v;
 const fineGrid=new Float32Array(16);for(let j=0;j<4;j++)for(let i=0;i<4;i++)fineGrid[j*4+i]=noise((x+i/3)*2.2,(y+j/3)*2.2,s+773);
 const edges=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const q=game.tile(x+dx,y+dy);if(q&&q.water!==t.water)edges.push([dx,dy]);}
 const bytes=im.data,[grass,dry,soil,stone,sand,shallow,deep]=materialFields.map((f,i)=>mixed?materialValues.subarray(i*3,i*3+3):p[f]);
 for(const q of pixels){
  if(mixed)for(let k=0;k<21;k++)materialValues[k]=materialCorners[0][k]*q.a+materialCorners[1][k]*q.b+materialCorners[2][k]*q.c+materialCorners[3][k]*q.d;
  const u=q.u,v=q.v,gx=x*25+q.gx,gy=y*25+q.gy,grain=hash(gx,gy,s+71),fi=q.fi,fine=fineGrid[fi]*q.fa+fineGrid[fi+1]*q.fb+fineGrid[fi+4]*q.fc+fineGrid[fi+5]*q.fd;
  const patch=samples[0][0]*q.a+samples[1][0]*q.b+samples[2][0]*q.c+samples[3][0]*q.d+(fine-.5)*.22,region=samples[0][1]*q.a+samples[1][1]*q.b+samples[2][1]*q.c+samples[3][1]*q.d,detail=samples[0][2]*q.a+samples[1][2]*q.b+samples[2][2]*q.c+samples[3][2]*q.d;
  let shore2=16;for(let j=0;j<edges.length;j++){const dx=edges[j][0],dy=edges[j][1],sx=Math.max(dx-u,0,u-dx-1),sy=Math.max(dy-v,0,v-dy-1),d=sx*sx+sy*sy;if(d<shore2)shore2=d;}const shore=Math.sqrt(shore2);
  let red,green,blue;
  if(t.water){const f=clamp(shore*.68),wave=Math.sin((gx+gy*.27)*.31+Math.sin(gy*.09)*2),ripple=wave>.87?(wave-.87)*34:wave*.8,light=(grain-.5)*5+ripple;red=shallow[0]+(deep[0]-shallow[0])*f+light;green=shallow[1]+(deep[1]-shallow[1])*f+light;blue=shallow[2]+(deep[2]-shallow[2])*f+light;if(shore<.09+(fine-.5)*.06){red+=(sand[0]-red)*.48;green+=(sand[1]-green)*.48;blue+=(sand[2]-blue)*.48;}const foam=Math.abs(shore-(.13+Math.sin((gx+gy)*.23)*.035));if(foam<.025&&fine>.37){red+=p.foam[0];green+=p.foam[1];blue+=p.foam[2];}if(shore<.65){const caustic=Math.abs(Math.sin(gx*.22+Math.sin(gy*.17))+Math.sin(gy*.24+gx*.05));if(caustic<.10){red+=p.foam[0]*.4;green+=p.foam[1]*.4;blue+=p.foam[2]*.4;}}}
  else{const a=clamp((region-.36)*2.1),b=clamp((patch-.47)*5.6),c=clamp((detail-.69)*5)*(t.height>0?.85:.5),d=clamp((.65-shore+(fine-.5)*.18)/.65)*.9;
   red=grass[0]+(dry[0]-grass[0])*a;green=grass[1]+(dry[1]-grass[1])*a;blue=grass[2]+(dry[2]-grass[2])*a;
   red+=(soil[0]-red)*b;green+=(soil[1]-green)*b;blue+=(soil[2]-blue)*b;red+=(stone[0]-red)*c;green+=(stone[1]-green)*c;blue+=(stone[2]-blue)*c;red+=(sand[0]-red)*d;green+=(sand[1]-green)*d;blue+=(sand[2]-blue)*d;
   const moss=Math.sin(gx*.31+Math.sin(gy*.27))*Math.sin(gy*.34+gx*.09),grit=(grain-.5)*(patch>.56?15:11)+(fine-.5)*11+(patch>.59&&grain>.982?14:0)+moss*(patch<.5?3:1);red+=grit;green+=grit;blue+=grit;
  }
  for(const pixel of q.targets){const grit=(hash(x*25+pixel.gx,y*25+pixel.gy,s+119)-.5)*8;bytes[pixel.at]=red+grit;bytes[pixel.at+1]=green+grit;bytes[pixel.at+2]=blue+grit;bytes[pixel.at+3]=255;}
 }
 if(!t.water&&['moon','hell','desert','arctic'].includes(p.scenery)){
  // World-aligned surface relief: craters, ember fissures, dunes or wind-packed snow.
  for(const q of pixels){const wx=x+q.u,wy=y+q.v;let tone=0;if(p.scenery==='moon'){const cx=Math.floor(wx/3),cy=Math.floor(wy/3),rx=(cx+.25+hash(cx,cy,s+21)*.5)*3,ry=(cy+.25+hash(cx,cy,s+22)*.5)*3,dist=Math.hypot(wx-rx,wy-ry),radius=.35+hash(cx,cy,s+23)*.5;if(dist<radius)tone=-7*(1-dist/radius);if(Math.abs(dist-radius)<.055)tone=10;}else if(p.scenery==='hell'){const crack=Math.abs(Math.sin(wx*2.7+Math.sin(wy*2.1)*.9));if(crack<.055&&noise(wx/3,wy/3,s+3)>.5)tone=-15;}else{const wave=Math.sin(wx*(p.scenery==='desert'?4:6)+wy*1.1+Math.sin(wy*1.7)*1.2);tone=wave>0?wave*(p.scenery==='desert'?5:3):wave*2;}if(tone)for(const pixel of q.targets)for(let k=0;k<3;k++)bytes[pixel.at+k]+=tone;}
 }
 if(!t.water){
  // Grouped blades, gravel and leaf litter replace evenly scattered bright pixels.
  // All details are tiny, traversable surface dressing; no decorative boulders imply blockers.
  const dab=(xx,yy,col,alpha=1)=>{xx=Math.round(xx);yy=Math.round(yy);if(xx<0||yy<0||xx>=50||yy>=26)return;const i=(yy*50+xx)*4;if(!bytes[i+3])return;for(let k=0;k<3;k++)bytes[i+k]=bytes[i+k]*(1-alpha)+col[k]*alpha;};
  const blade=(xx,yy,dx,h,col)=>{for(let j=0;j<=h;j++)dab(xx+dx*j/h,yy-j,col,.65+j/h*.15);};
  for(let j=0;j<13;j++){
   const u=.09+hash(x*17+j,y,s+3)*.82,v=.09+hash(x,y*19+j,s+7)*.82,px=25+(u-v)*24,py=1+(u+v)*12,patch=lerp(u,v,0),variant=hash(x*37+j,y*43,s+41);
   if(p.vegetation&&patch<.54&&variant>.2+(1-Number(p.vegetation))*.8){
    const col=p.grass.map((v,k)=>v+[37,42,23][k]),shadow=p.grass.map(v=>v*.68),h=1+(variant>.65?2:1);
    dab(px,py+1,shadow,.65);dab(px+1,py+1,shadow,.45);
    blade(px,py,-1,h,col);blade(px+1,py,1,h+1,col.map(v=>v-8));
    if(variant>.83){blade(px-1,py,-2,h+1,col.map(v=>v-12));dab(px-2,py-2,p.dry,.6);}
   }else if(variant>.64){
    const col=p.stone.map(v=>v-14);dab(px+1,py+1,p.shadow,.55);dab(px,py,col,.8);dab(px,py-1,p.stone,.65);if(variant>.88)dab(px+1,py,col,.7);
   }else if(patch>.6&&j<5){
    // Small ground fissures and wind-aligned litter, not a tile border.
    const col=p.soil.map(v=>v*.72);dab(px,py,col,.4);dab(px+1,py,col,.4);dab(px+2,py+1,col,.35);dab(px+2,py-1,p.dry,.35);
   }
  }
 }

 cache.set(key,c);if(cache.size>2048)cache.delete(cache.keys().next().value);return c;
}
// Rasterize the bounded terrain region directly into one pixel buffer. No per-tile
// canvases or repeated texture uploads: the completed region is uploaded exactly once.
function renderRegion(art,game,r){
 const c=canvas(r.w,r.h),ctx=c.getContext('2d'),im=ctx.createImageData(r.w,r.h),out=im.data,W=r.w,H=r.h;let environmentPalette=environments.palette(game.options);
 const triangle=(a,b,d,sa,sb,sd,texture,shade=0,wall=null)=>{const ax=a.x-r.x,ay=a.y-r.y,bx=b.x-r.x,by=b.y-r.y,cx=d.x-r.x,cy=d.y-r.y,den=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(den)<.001)return;
  const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(W-1,Math.ceil(Math.max(ax,bx,cx))),y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(H-1,Math.ceil(Math.max(ay,by,cy))),da=(by-cy)/den,db=(cy-ay)/den;
  for(let py=y0;py<=y1;py++){let wa=((by-cy)*(x0+.5-cx)+(cx-bx)*(py+.5-cy))/den,wb=((cy-ay)*(x0+.5-cx)+(ax-cx)*(py+.5-cy))/den;
   for(let px=x0;px<=x1;px++,wa+=da,wb+=db){const wc=1-wa-wb;if(wa<-.025||wb<-.025||wc<-.025)continue;const u=sa[0]*wa+sb[0]*wb+sd[0]*wc,v=sa[1]*wa+sb[1]*wb+sd[1]*wc,at=(py*W+px)*4;let red,green,blue;
    if(texture){const sx=Math.max(0,Math.min(49,Math.round(u))),sy=Math.max(0,Math.min(25,Math.round(v))),i=(sy*50+sx)*4;if(!texture.data[i+3])continue;red=texture.data[i];green=texture.data[i+1];blue=texture.data[i+2];}
    else{const wx=px+r.x,wy=py+r.y,stratum=wy*.16+Math.sin(wx*.15)*.4+Math.sin(wx*.047),band=Math.floor(stratum),block=Math.floor(wx/11+Math.sin(wy*.07)*1.3),grain=(hash(wx,wy,37)-.5)*8,fracture=((wx/11+Math.sin(wy*.07)*1.3)%1+1)%1,edge=fracture<.055||stratum-band<.10,tone=(hash(block,band,71)-.5)*23+grain-(edge?21:0)+(stratum-band>.88?8:0);red=wall[0]+tone;green=wall[1]+tone;blue=wall[2]+tone;}
    if(shade>0){const rgb=environmentPalette.shadow;red+=(rgb[0]-red)*shade;green+=(rgb[1]-green)*shade;blue+=(rgb[2]-blue)*shade;}else if(shade<0){const rgb=environmentPalette.light;red+=(rgb[0]-red)*-shade;green+=(rgb[1]-green)*-shade;blue+=(rgb[2]-blue)*-shade;}
    out[at]=red;out[at+1]=green;out[at+2]=blue;out[at+3]=255;
   }
  }
 };
 const line=(a,b,col)=>{const steps=Math.ceil(Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y)));for(let i=0;i<=steps;i++){const f=steps?i/steps:0,x=Math.round(a.x+(b.x-a.x)*f-r.x),y=Math.round(a.y+(b.y-a.y)*f-r.y);if(x<0||y<0||x>=W||y>=H)continue;const at=(y*W+x)*4;out[at]=col[0];out[at+1]=col[1];out[at+2]=col[2];out[at+3]=255;}};
 const source=[[25,1],[49,13],[25,25],[1,13]],n=game.n;
 for(let sum=Math.max(0,Math.floor((r.y-30)/12));sum<=Math.min(n*2-2,Math.ceil((r.y+r.h+64)/12));sum++)for(let x=Math.max(0,sum-n+1,Math.floor((r.x+sum*24-26)/48));x<=Math.min(n-1,sum,Math.ceil((r.x+r.w+sum*24+26)/48));x++){
  const y=sum-x,t=game.tile(x,y),h=t.height,corners=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]],heights=corners.map(([xx,yy])=>game.cornerHeight(xx,yy,h)),v=corners.map(([xx,yy],i)=>art.project(xx,yy,heights[i])),center=art.project(x+.5,y+.5,game.surfaceHeight(x+.5,y+.5)),texture=surface(art,game,x,y),dx=(heights[1]+heights[2]-heights[0]-heights[3])*.5,dy=(heights[2]+heights[3]-heights[0]-heights[1])*.5,shade=t.water?0:clamp(dx*.075+dy*.035,-.16,.24);
  environmentPalette=environments.palette(game.options,x+.5,y+.5);
  for(let j=0;j<4;j++)triangle(v[j],v[(j+1)%4],center,source[j],source[(j+1)%4],[25,13],texture,shade);
  for(const [dx,dy,i,j]of [[1,0,1,2],[0,1,2,3]]){const other=game.tile(x+dx,y+dy);if(!other||h-other.height<2)continue;const a=v[i],b=v[j],lowA=art.project(...corners[i],game.cornerHeight(...corners[i],other.height)),lowB=art.project(...corners[j],game.cornerHeight(...corners[j],other.height)),color=environmentPalette.stone.map(v=>v*(dx?.90:.68));triangle(a,b,lowB,[0,0],[1,0],[1,1],null,0,color);triangle(a,lowB,lowA,[0,0],[1,1],[0,1],null,0,color);line(a,b,environmentPalette.stone.map(v=>v+22));
   // Faceted rock ribs, offset strata and chipped ledges follow the actual impassable edge.
   for(let k=0;k<4;k++){const f0=k/4,f1=(k+1)/4,seed=hash(x*17+k,y*19,game.options.seed),mix=(v,w,f)=>({x:v.x+(w.x-v.x)*f,y:v.y+(w.y-v.y)*f}),ta=mix(a,b,f0),tb=mix(a,b,f1),ba=mix(lowA,lowB,f0),bb=mix(lowA,lowB,f1),ma=mix(ta,ba,.35+seed*.25),mb=mix(tb,bb,.4+seed*.18);ma.x+=(seed-.5)*5;mb.x+=(seed-.5)*5;const lit=color.map(v=>v+9+seed*14),dark=color.map(v=>v-10-seed*8);triangle(ta,tb,mb,[0,0],[1,0],[1,1],null,0,lit);triangle(ta,mb,ma,[0,0],[1,1],[0,1],null,0,lit);triangle(ma,mb,bb,[0,0],[1,0],[1,1],null,0,dark);line(ma,mb,environmentPalette.stone.map(v=>v+10));if(seed>.45){const ledge={x:ma.x+(mb.x-ma.x)*.5,y:ma.y+(mb.y-ma.y)*.5-2};triangle(ma,mb,ledge,[0,0],[1,0],[.5,1],null,0,environmentPalette.stone.map(v=>v+26));}}
}
 }
 ctx.putImageData(im,0,0);return c;
}

function backgroundSource(){
 const G=root.FractureSim.Game.prototype,A=root.FractureArt.Art.prototype;
 return environments.workerSource+'const root=self;const canvas=(w,h)=>new OffscreenCanvas(w,h);const hash='+hash.toString()+';const noise='+noise.toString()+';const clamp='+clamp.toString()+';const styles='+JSON.stringify(styles)+';const pixels='+JSON.stringify(pixels)+';const groundCaches=new WeakMap();const poly='+root.FractureArt.poly.toString()+';const surface='+surface.toString()+';const renderRegion='+renderRegion.toString()+';root.FractureTerrain={surface,renderRegion};const art={'+A.project.toString()+','+A.terrain.toString()+'};let game;onmessage=e=>{if(e.data.init){game=Object.assign({'+[G.tile,G.height,G.cornerHeight,G.surfaceHeight].map(f=>f.toString()).join(',')+'},e.data.init);if(game.tiles){game.map=Array.from(game.tiles,v=>({water:!!(v&128),height:v&127,road:!!(v&256)}));delete game.tiles;}return;}try{const began=performance.now(),c=art.terrain(game,e.data.region),bitmap=c.transferToImageBitmap();postMessage({key:e.data.key,bitmap,ms:performance.now()-began},[bitmap]);}catch(error){postMessage({key:e.data.key,error:String(error)});}}';
}
class Layer{
 constructor(art,game){this.art=art;this.game=game;this.size=512;this.maxChunks=48;this.maxFogChunks=48;this.chunks=new Map();this.fogChunks=new Map();this.width=game.n*48+96;this.height=game.n*24+80;this.queue=new Map();this.worker=null;this.inFlight=null;this.workerFailed=false;this.disposed=false;this.readyChunks=0;this.jobStats=[];}
 region(cx,cy,pad){return{x:cx*this.size-pad,y:cy*this.size-pad,w:this.size+pad*2,h:this.size+pad*2};}
 entries(cam,zoom,v,fn){const s=this.size,x0=Math.floor((cam.x-v.w/(2*zoom))/s),x1=Math.floor((cam.x+v.w/(2*zoom))/s),y0=Math.floor((cam.y-v.h/(2*zoom))/s),y1=Math.floor((cam.y+v.h/(2*zoom))/s);for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)fn(x,y);}
 touch(map,key,value,limit){map.delete(key);map.set(key,value);while(map.size>limit)map.delete(map.keys().next().value);return value;}
 paint(ctx,e,cam,zoom,v,pad){const x=Math.round((e.x-cam.x)*zoom+v.w/2),y=Math.round((e.y-cam.y)*zoom+v.h/2+v.top),right=Math.round((e.x+this.size-cam.x)*zoom+v.w/2),bottom=Math.round((e.y+this.size-cam.y)*zoom+v.h/2+v.top);ctx.drawImage(e.canvas,pad,pad,this.size,this.size,x,y,right-x,bottom-y);}
 startWorker(){if(this.worker||this.workerFailed||this.disposed)return;if(!root.Worker||!root.OffscreenCanvas){this.workerFailed=true;return;}try{const url=URL.createObjectURL(new Blob([backgroundSource()],{type:'application/javascript'}));this.worker=new Worker(url);URL.revokeObjectURL(url);const tiles=Uint16Array.from(this.game.map,t=>(t.water?128:0)|(t.road?256:0)|t.height);this.worker.postMessage({init:{n:this.game.n,tiles,options:this.game.options}},[tiles.buffer]);this.worker.onmessage=({data})=>{const e=this.chunks.get(data.key);this.jobStats.push({key:data.key,ms:data.ms,retained:!!e});if(this.jobStats.length>100)this.jobStats.shift();if(e&&data.bitmap){const ctx=e.canvas.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,e.canvas.width,e.canvas.height);ctx.drawImage(data.bitmap,0,0);e.ready=true;this.readyChunks++;}data.bitmap?.close();this.inFlight=null;if(data.error)this.failWorker();else this.pump();};this.worker.onerror=e=>{e.preventDefault();this.failWorker();};}catch{this.failWorker();}}
 failWorker(){this.worker?.terminate();this.worker=null;this.inFlight=null;this.workerFailed=true;this.queue.clear();}
 dispose(){this.disposed=true;this.worker?.terminate();this.worker=null;this.queue.clear();this.chunks.clear();this.fogChunks.clear();}
 pump(){if(!this.worker||this.inFlight)return;for(const [key,r]of this.queue){this.queue.delete(key);if(!this.chunks.has(key))continue;this.inFlight=key;this.worker.postMessage({key,region:r});break;}}

 async prepare(cam,zoom,v,onProgress=()=>{}){this.startWorker();const wanted=[];this.entries(cam,zoom,v,(x,y)=>{const key=x+','+y,r=this.region(x,y,2);wanted.push(key);if(!this.chunks.has(key))this.touch(this.chunks,key,{x:x*this.size,y:y*this.size,canvas:canvas(r.w,r.h),ready:false},this.maxChunks);this.queue.set(key,r);});this.visibleKeys=new Set(wanted);this.pump();
  while(!this.disposed){let ready=0;for(const key of wanted){const e=this.chunks.get(key);if(!e)throw Error('Starting terrain cache was evicted');if(e.ready)ready++;else if(this.workerFailed){const [x,y]=key.split(',').map(Number);e.canvas=this.art.terrain(this.game,this.region(x,y,2));e.ready=true;ready++;await new Promise(r=>setTimeout(r,0));}}onProgress(ready/wanted.length);if(ready===wanted.length)return;await new Promise(r=>setTimeout(r,16));}throw Error('Terrain loading canceled');}
 ensure(cam,zoom,v,priority=true){this.startWorker();const required=[],requests=[];this.entries(cam,zoom,v,(x,y)=>{const key=x+','+y,r=this.region(x,y,2);required.push(key);let e=this.chunks.get(key);if(!e)e={x:x*this.size,y:y*this.size,canvas:canvas(r.w,r.h),ready:false};this.touch(this.chunks,key,e,this.maxChunks);if(!e.ready){if(this.workerFailed){e.canvas=this.art.terrain(this.game,r);e.ready=true;}else if(key!==this.inFlight)requests.push([key,r]);}});if(priority)this.queue=new Map([...requests,...this.queue]);else for(const [key,r]of requests)if(!this.queue.has(key))this.queue.set(key,r);for(const key of this.queue.keys())if(!this.chunks.has(key))this.queue.delete(key);this.pump();return required.every(key=>this.chunks.get(key)?.ready);}
 draw(ctx,cam,zoom,v){this.ensure(cam,zoom,v,!this.suspendPrefetch);const wanted=new Set();this.entries(cam,zoom,v,(x,y)=>{const key=x+','+y;wanted.add(key);const e=this.chunks.get(key);if(e?.ready){this.touch(this.chunks,key,e,this.maxChunks);this.paint(ctx,e,cam,zoom,v,2);}});this.visibleKeys=wanted;
  // Draw ahead by one whole chunk on all sides. This is textured off-thread before ordinary panning reaches it.
  if(!this.suspendPrefetch)this.ensure(cam,zoom,{...v,w:v.w+this.size*zoom*2,h:v.h+this.size*zoom*2},false);}

 drawFog(ctx,cam,zoom,v){const g=this.game,p=g.players[0];this.entries(cam,zoom,v,(x,y)=>{const key=x+','+y,r=this.region(x,y,8);let e=this.fogChunks.get(key);if(!e)e={x:x*this.size,y:y*this.size,canvas:canvas(r.w,r.h),revision:-1,sight:null};if(e.revision!==g.visionRevision){const ids=[];cells(g,r,(xx,yy)=>ids.push(yy*g.n+xx));const sight=Uint8Array.from(ids,i=>(p.explored[i]?1:0)|(p.visible[i]?2:0));let changed=!e.sight||e.sight.length!==sight.length;if(!changed)for(let i=0;i<sight.length;i++)if(sight[i]!==e.sight[i]){changed=true;break;}
 if(changed)this.fogRegion(e.canvas,r,ids);e.sight=sight;e.revision=g.visionRevision;}
 this.touch(this.fogChunks,key,e,this.maxFogChunks);this.paint(ctx,e,cam,zoom,v,8);});}
 fogRegion(c,r,ids){const g=this.game,art=this.art,p=g.players[0],ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#0b1117';ctx.fillRect(0,0,c.width,c.height);ctx.save();ctx.translate(-r.x,-r.y);ctx.globalCompositeOperation='destination-out';
 const cut=(mask,alpha)=>{ctx.beginPath();for(const i of ids){if(!mask[i])continue;const x=i%g.n,y=Math.floor(i/g.n),h=g.height(x,y),q=art.project(x+.5,y+.5,h),drop=h*8+2;ctx.moveTo(q.x-25,q.y);ctx.lineTo(q.x,q.y-13);ctx.lineTo(q.x+25,q.y);ctx.lineTo(q.x+25,q.y+drop);ctx.lineTo(q.x,q.y+13+drop);ctx.lineTo(q.x-25,q.y+drop);ctx.closePath();}ctx.globalAlpha=alpha;ctx.filter='blur(3px)';ctx.fill();ctx.filter='none';};cut(p.explored,.44);cut(p.visible,1);ctx.restore();}
}
root.FractureTerrain={Layer,surface,renderRegion,styles,cells};
})(globalThis);
