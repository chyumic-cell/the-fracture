'use strict';
(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function random(seed){let s=seed>>>0||1;return()=>{let t=s+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function canonical(layout){const key=String(layout||'plains').toLowerCase().replace(/[ _]/g,'-');if(['mediterranean','continental','coastal','small-islands','large-islands'].includes(key))return key;return ['mountain-passes','mountainpasses','passes','mountains','mountain'].includes(key)?'mountain-passes':['steppes','steppe','plateaus'].includes(key)?'steppes':['labyrinth','maze'].includes(key)?'labyrinth':'plains';}
function shuffle(values,rand){for(let i=values.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[values[i],values[j]]=[values[j],values[i]];}return values;}
function makeGrid(n,count,margin=0){const size=(n-margin*2)/count,nodes=[];for(let y=0;y<count;y++)for(let x=0;x<count;x++)nodes.push({id:y*count+x,col:x,row:y,x:Math.floor(margin+(x+.5)*size)+.5,y:Math.floor(margin+(y+.5)*size)+.5,height:0,degree:0});return{nodes,count,size,margin};}
function neighbors(grid,id){const {count}=grid,x=id%count,y=Math.floor(id/count),out=[];if(x>0)out.push(id-1);if(x<count-1)out.push(id+1);if(y>0)out.push(id-count);if(y<count-1)out.push(id+count);return out;}
function connections(grid,rand,loops){
 // A randomized spanning tree guarantees a route to every chamber. Extra mountain/steppe links give alternate approaches.
 const visited=new Uint8Array(grid.nodes.length),stack=[0],edges=[],keys=new Set();visited[0]=1;
 const add=(a,b)=>{const key=Math.min(a,b)+':'+Math.max(a,b);if(keys.has(key))return;keys.add(key);edges.push([a,b]);grid.nodes[a].degree++;grid.nodes[b].degree++;};
 while(stack.length){const a=stack[stack.length-1],options=shuffle(neighbors(grid,a).filter(b=>!visited[b]),rand);if(!options.length){stack.pop();continue;}const b=options[0];visited[b]=1;stack.push(b);add(a,b);}
 if(loops)for(const node of grid.nodes)for(const b of neighbors(grid,node.id))if(b>node.id&&rand()<loops)add(node.id,b);
 return edges;
}
function disc(state,x,y,r,height,road=false){const {map,n}=state;for(let yy=Math.max(0,Math.floor(y-r));yy<=Math.min(n-1,Math.ceil(y+r));yy++)for(let xx=Math.max(0,Math.floor(x-r));xx<=Math.min(n-1,Math.ceil(x+r));xx++){if(Math.hypot(xx+.5-x,yy+.5-y)>r)continue;const t=map[yy*n+xx];t.water=false;t.height=height;if(road)t.road=true;}}
function corridor(state,a,b,width=4.6,heightAt=()=>0){
 const {map,n,protectedCells}=state,dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),r=width/2;if(length<.01){disc(state,a.x,a.y,r,heightAt(0),true);return;}
 for(let y=Math.max(0,Math.floor(Math.min(a.y,b.y)-r));y<=Math.min(n-1,Math.ceil(Math.max(a.y,b.y)+r));y++)for(let x=Math.max(0,Math.floor(Math.min(a.x,b.x)-r));x<=Math.min(n-1,Math.ceil(Math.max(a.x,b.x)+r));x++){
  const t=clamp(((x+.5-a.x)*dx+(y+.5-a.y)*dy)/(length*length),0,1),distance=Math.hypot(x+.5-(a.x+dx*t),y+.5-(a.y+dy*t));if(distance>r)continue;
  const index=y*n+x,tile=map[index];tile.water=false;tile.height=Math.round(heightAt(t));tile.road=distance<1.65;if(distance<=1.6)protectedCells[index]=1;
 }
}
function baseClearings(state){for(const start of state.starts)disc(state,start.x,start.y,9,0);}
function attachBases(state,grid){for(const start of state.starts){const nearest=grid.nodes.reduce((best,node)=>Math.hypot(node.x-start.x,node.y-start.y)<Math.hypot(best.x-start.x,best.y-start.y)?node:best);corridor(state,start,nearest,5);}}
function maritime(state,kind){
 const {n,map,starts,rand}=state,phase=rand()*6.28;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=(x+.5)/n,v=(y+.5)/n,t=map[y*n+x];t.height=0;t.road=false;
 if(kind==='coastal')t.water=u>.65+Math.sin(v*9+phase)*.075+Math.sin(v*23-phase)*.025;
 else if(kind==='mediterranean'){const ex=(u-.5)/(.37+Math.sin(v*12+phase)*.035),ey=(v-.5)/(.29+Math.sin(u*11-phase)*.03);t.water=ex*ex+ey*ey<1||u>.88&&Math.abs(v-.5)<.09;}
 else if(kind==='continental'){const a=((u-.24)/(.195+Math.sin(v*16+phase)*.02))**2+((v-.46)/.41)**2,b=((u-.76)/(.205+Math.sin(v*14-phase)*.025))**2+((v-.54)/.39)**2;t.water=Math.min(a,b)>1;}
 else t.water=true;
 }
 const island=(cx,cy,radius)=>{const p=rand()*6.28;for(let y=Math.max(1,Math.floor(cy-radius*1.3));y<Math.min(n-1,cy+radius*1.3);y++)for(let x=Math.max(1,Math.floor(cx-radius*1.3));x<Math.min(n-1,cx+radius*1.3);x++){const a=Math.atan2(y-cy,x-cx),r=radius*(1+.12*Math.sin(a*3+p)+.075*Math.sin(a*7-p));if(Math.hypot(x-cx,y-cy)<r)map[y*n+x].water=false;}};
 if(kind.endsWith('islands')){const large=kind==='large-islands';for(const p of starts)island(p.x,p.y,large?Math.max(17,n*.11):13+rand()*3);const count=Math.max(3,Math.floor(n*n/(large?12000:3200)));for(let i=0;i<count;i++){const radius=large?12+rand()*Math.min(22,n*.045):5+rand()*7,c={x:radius+3+rand()*(n-radius*2-6),y:radius+3+rand()*(n-radius*2-6)};if(starts.every(p=>Math.hypot(c.x-p.x,c.y-p.y)>radius+(large?Math.max(17,n*.11):16)+7))island(c.x,c.y,radius);}}
 if(kind==='mediterranean')for(let i=0;i<Math.max(2,n/100);i++)island(n*(.34+rand()*.34),n*(.4+rand()*.2),3+rand()*Math.max(3,n*.02));
 const placed=[];
 for(const start of starts){let best=null,score=Infinity;for(let y=11;y<n-11;y+=2)for(let x=11;x<n-11;x+=2){if(placed.some(p=>Math.hypot(x-p.x,y-p.y)<20))continue;let dry=true;for(let a=0;a<16;a++){const xx=Math.floor(x+Math.cos(a*Math.PI/8)*10),yy=Math.floor(y+Math.sin(a*Math.PI/8)*10);if(map[yy*n+xx].water){dry=false;break;}}if(!dry||map[y*n+x].water)continue;const d=Math.hypot(x-start.x,y-start.y);if(d<score){score=d;best={x,y};}}
 if(best){start.x=best.x;start.y=best.y;}else island(start.x,start.y,13);placed.push({...start});disc(state,start.x,start.y,9,0);
 }
 // All islands can contain deposits; distant islands are intentionally reached by ship or air.
 state.maritime=true;state.playableCells=Uint8Array.from(map,t=>t.water?0:1);
}
function plains(state){
 const {map,n,rand,starts}=state;for(const t of map){t.height=0;t.road=false;}
 const count=Math.max(1,Math.floor(n*n/4500));
 for(let k=0;k<count;k++){const c={x:10+rand()*(n-20),y:10+rand()*(n-20)},radius=8+rand()*7,phase=rand()*6.28;
 if(starts.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<radius+14)||map[Math.floor(c.y)*n+Math.floor(c.x)].water)continue;
 for(let y=Math.max(1,Math.floor(c.y-radius*1.3));y<Math.min(n-1,c.y+radius*1.3);y++)for(let x=Math.max(1,Math.floor(c.x-radius*1.3));x<Math.min(n-1,c.x+radius*1.3);x++){const a=Math.atan2(y-c.y,x-c.x),edge=radius*(1+.13*Math.sin(a*3+phase)+.08*Math.sin(a*5-phase)),t=map[y*n+x];if(!t.water&&Math.hypot(x-c.x,y-c.y)<edge)t.height=3;}
 const entrances=rand()<.65?1:2,start=rand()*6.28;for(let j=0;j<entrances;j++){const a=start+j*Math.PI,to={x:c.x+Math.cos(a)*(radius+6),y:c.y+Math.sin(a)*(radius+6)};
 corridor(state,c,to,3.8,t=>3*(1-clamp((t-.5)/.4,0,1)));state.ramps.push({x:to.x,y:to.y,fromHeight:3,toHeight:0,width:3.8});}
 state.regions.push({...c,height:3});
 }
 // Lowland routes retain generous buildable bases and natural bends.
 for(let i=1;i<starts.length;i++){const a=starts[i-1],b=starts[i],bend=(rand()-.5)*12,mid={x:(a.x+b.x)/2+bend,y:(a.y+b.y)/2-bend};corridor(state,a,mid,5);corridor(state,mid,b,5);}baseClearings(state);
}
function mountains(state){
 const {n,map,rand}=state,grid=makeGrid(n,Math.max(3,Math.round(n/42))),phases=Array.from({length:grid.count+1},()=>rand()*Math.PI*2),phasesY=Array.from({length:grid.count+1},()=>rand()*Math.PI*2),ridge=Math.min(5.8,grid.size*.17);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  let distance=Infinity;
  // Long, gently bent ridges enclose broad lowland regions; crossings are cut explicitly below.
  for(let k=1;k<grid.count;k++){distance=Math.min(distance,Math.abs(x+.5-k*grid.size-Math.sin(y/16+phases[k])*2.2),Math.abs(y+.5-k*grid.size-Math.sin(x/17+phasesY[k])*2.2));}
  const t=map[y*n+x];t.water=false;t.road=false;t.height=distance<ridge*.38?5:distance<ridge*.72?4:distance<ridge?3:0;
 }
 const edges=connections(grid,rand,.28);
 for(const [a,b] of edges){const from=grid.nodes[a],to=grid.nodes[b],mid={x:(from.x+to.x)/2,y:(from.y+to.y)/2},jitter=(rand()-.5)*Math.min(8,grid.size*.24);if(from.col===to.col)mid.x+=jitter;else mid.y+=jitter;corridor(state,from,mid,4.6);corridor(state,mid,to,4.6);}
 attachBases(state,grid);baseClearings(state);state.regions=grid.nodes;
}
function steppes(state){
 const {n,map,rand,starts}=state,grid=makeGrid(n,Math.max(6,Math.round(n/32))),phaseX=rand()*6.28,phaseY=rand()*6.28;
 const regionAt=(x,y)=>clamp(Math.floor((y+Math.sin(x/13+phaseY)*2)/grid.size),0,grid.count-1)*grid.count+clamp(Math.floor((x+Math.sin(y/15+phaseX)*2)/grid.size),0,grid.count-1);
 for(const node of grid.nodes)node.height=Math.floor(rand()*4)*2;const baseRegions=new Set();
 // Every plateau intersecting a base clearing remains low. This keeps a ramp from being cut in half by spawn protection.
 for(const start of starts)for(let y=Math.max(0,Math.floor(start.y-13));y<=Math.min(n-1,Math.ceil(start.y+13));y++)for(let x=Math.max(0,Math.floor(start.x-13));x<=Math.min(n-1,Math.ceil(start.x+13));x++)if(Math.hypot(x+.5-start.x,y+.5-start.y)<=13){const id=regionAt(x+.5,y+.5);grid.nodes[id].height=0;baseRegions.add(id);}
 // Preserve a useful height range even when four small-map clearings occupy much of the rim.
 const central=grid.nodes.filter(v=>!baseRegions.has(v.id));for(const [i,h] of [2,4,6].entries())if(central.length>i&&!central.some(v=>v.height===h))central[i].height=h;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const t=map[y*n+x];t.water=false;t.road=false;t.height=grid.nodes[regionAt(x+.5,y+.5)].height;}
 const edges=connections(grid,rand,.38);
 for(const [a,b] of edges){
  const from=grid.nodes[a],to=grid.nodes[b],length=Math.hypot(to.x-from.x,to.y-from.y),rise=to.height-from.height,rampLength=Math.max(6,Math.abs(rise)*2+2),heightAt=t=>from.height+rise*clamp((t-.5)*length/rampLength+.5,0,1);
  corridor(state,from,to,5.4,heightAt);
  if(rise)state.ramps.push({x:(from.x+to.x)/2,y:(from.y+to.y)/2,fromHeight:from.height,toHeight:to.height,length:rampLength,width:5.4,axis:from.col===to.col?'y':'x'});
 }
 // Base-to-center links are level because all regions touched by a base were made low above.
 attachBases(state,grid);baseClearings(state);state.regions=grid.nodes;
}
function labyrinthScore(state){const {n,map,starts}=state;let score=Infinity;const queue=new Int32Array(n*n),steps=new Int32Array(n*n);for(let k=0;k<starts.length-1;k++){steps.fill(-1);const s=starts[k],first=Math.floor(s.y)*n+Math.floor(s.x);let head=0,tail=1;queue[0]=first;steps[first]=0;while(head<tail){const i=queue[head++],x=i%n,y=Math.floor(i/n);for(const j of [x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1])if(j>=0&&steps[j]<0&&map[j].height===0){steps[j]=steps[i]+1;queue[tail++]=j;}}for(let j=k+1;j<starts.length;j++){const t=starts[j],d=steps[Math.floor(t.y)*n+Math.floor(t.x)];if(d<0)return 0;score=Math.min(score,d/(Math.abs(t.x-s.x)+Math.abs(t.y-s.y)));}}return score;}
function labyrinth(state){
 const {n,map,rand}=state;let best=null,bestScore=-1;
 // Judge the actual carved ground, including base clearings that can join nearby corridors.
 for(let attempt=0;attempt<8;attempt++){
  const grid=makeGrid(n,Math.max(5,Math.floor((n-6)/12)),3);state.protectedCells.fill(0);
  for(const t of map){t.water=false;t.height=5;t.road=false;}
  const edges=connections(grid,rand,0);
  for(const node of grid.nodes){const chamber=node.id%9===4;disc(state,node.x,node.y,chamber?Math.min(5.3,grid.size*.43):2.7,0);}
  for(const [a,b]of edges)corridor(state,grid.nodes[a],grid.nodes[b],5);
  attachBases(state,grid);baseClearings(state);state.regions=grid.nodes;
  const score=labyrinthScore(state);if(score>=1.4)return;
  if(score>bestScore){bestScore=score;best={tiles:Uint8Array.from(map,t=>t.height|(t.road?64:0)),protectedCells:state.protectedCells.slice(),regions:grid.nodes};}
 }
 for(let i=0;i<map.length;i++){map[i].height=best.tiles[i]&63;map[i].road=!!(best.tiles[i]&64);}state.protectedCells=best.protectedCells;state.regions=best.regions;
}

function smoothProtectedRamps(state){
 const {map,n,protectedCells}=state;
 // Flattening a protected base can trim the end of a nearby ramp. Restore one-level steps along the reserved lane.
 for(let pass=0;pass<7;pass++){let changed=false;for(let i=0;i<map.length;i++)if(protectedCells[i]){const x=i%n,y=Math.floor(i/n);let h=map[i].height;for(const j of [x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1])if(j>=0&&protectedCells[j])h=Math.min(h,map[j].height+1);if(h<map[i].height){map[i].height=h;changed=true;}}if(!changed)break;}
}
function playable(state){
 const {n,map,starts}=state,seen=new Uint8Array(n*n);if(!starts.length)return seen;const first=clamp(Math.floor(starts[0].y),0,n-1)*n+clamp(Math.floor(starts[0].x),0,n-1),queue=new Int32Array(n*n);let head=0,tail=1;queue[0]=first;seen[first]=1;
 while(head<tail){const i=queue[head++],x=i%n,y=Math.floor(i/n),h=map[i].height;for(const j of [x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1])if(j>=0&&!seen[j]&&!map[j].water&&Math.abs(map[j].height-h)<2){seen[j]=1;queue[tail++]=j;}}
 return seen;
}
function apply({map,n,starts,rng,seed=1,layout='plains'}){
 if(!Array.isArray(map)||map.length!==n*n)throw new Error('Map layouts require a complete square tile array.');
 const selected=canonical(layout),state={map,n,starts,rand:rng&&typeof rng.next==='function'?()=>rng.next():random(seed),protectedCells:new Uint8Array(n*n),regions:[],ramps:[]};
 if(['mediterranean','continental','coastal','small-islands','large-islands'].includes(selected))maritime(state,selected);else if(selected==='mountain-passes')mountains(state);else if(selected==='steppes')steppes(state);else if(selected==='labyrinth')labyrinth(state);else plains(state);
 if(selected==='steppes')smoothProtectedRamps(state);
 // Fixed opening deposits occupy the base interior; only the approaches outside it require obstruction protection.
 for(const start of starts)for(let y=Math.max(0,Math.floor(start.y-8));y<=Math.min(n-1,Math.ceil(start.y+8));y++)for(let x=Math.max(0,Math.floor(start.x-8));x<=Math.min(n-1,Math.ceil(start.x+8));x++)if(Math.hypot(x+.5-start.x,y+.5-start.y)<8)state.protectedCells[y*n+x]=0;
 return{layout:selected,protectedCells:state.protectedCells,playableCells:state.playableCells||playable(state),ramps:state.ramps,regions:state.regions};
}
root.FractureMapLayouts={apply};if(typeof module!=='undefined')module.exports=root.FractureMapLayouts;
})(globalThis);


