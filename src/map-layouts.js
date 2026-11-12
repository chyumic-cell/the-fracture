'use strict';
(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function random(seed){let s=seed>>>0||1;return()=>{let t=s+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function canonical(layout){const key=String(layout||'plains').toLowerCase().replace(/[ _]/g,'-');if(['rivers','narrows','mediterranean','continental','coastal','small-islands','large-islands'].includes(key))return key;return ['mountain-passes','mountainpasses','passes','mountains','mountain'].includes(key)?'mountain-passes':['steppes','steppe','plateaus'].includes(key)?'steppes':['labyrinth','maze'].includes(key)?'labyrinth':'plains';}
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
function waterways(state,dense=false){
 const {map,n,starts,rand}=state;
 function channel(points,width){for(let k=1;k<points.length;k++){const a=points[k-1],b=points[k],dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
  for(let y=Math.max(0,Math.floor(Math.min(a.y,b.y)-width-3));y<Math.min(n,Math.ceil(Math.max(a.y,b.y)+width+3));y++)for(let x=Math.max(0,Math.floor(Math.min(a.x,b.x)-width-3));x<Math.min(n,Math.ceil(Math.max(a.x,b.x)+width+3));x++){
   if(starts.some(s=>Math.hypot(s.x-x-.5,s.y-y-.5)<13))continue;
   const t=clamp(((x+.5-a.x)*dx+(y+.5-a.y)*dy)/(len||1),0,1),d=Math.hypot(x+.5-a.x-t*dx,y+.5-a.y-t*dy);if(d>width+3)continue;
   const cell=map[y*n+x];cell.height=0;cell.road=false;if(d<=width)cell.water=true;
  }
 }}
 // Meandering drainage networks: tributaries join the main stem, distributaries
 // fork toward the edge, and anabranches reunite downstream. No canal grid.
 const bend=(a,b,amplitude=12)=>{const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy),count=Math.max(3,Math.ceil(length/6)),phase=rand()*Math.PI*2,out=[];for(let k=0;k<=count;k++){const t=k/count,wave=Math.sin(t*Math.PI)*(Math.sin(t*Math.PI*3+phase)*.65+Math.sin(t*Math.PI*5-phase)*.35)*amplitude;out.push({x:clamp(a.x+dx*t-dy/(length||1)*wave,0,n),y:clamp(a.y+dy*t+dx/(length||1)*wave,0,n)});}return out;};
 const phase=rand()*Math.PI*2,stem=[];
 for(let y=0;y<=n;y+=5){const t=y/n;stem.push({x:clamp(n*(.5+.15*Math.sin(t*6+phase)+.06*Math.sin(t*17-phase)),8,n-8),y:Math.min(y,n)});}if(stem.at(-1).y<n)stem.push({...stem.at(-1),y:n});
 channel(stem,dense?3:3.6);
 const branches=Math.max(3,Math.floor(n/(dense?95:55)));
 for(let k=0;k<branches;k++){const at=Math.floor(stem.length*(.18+.64*(k+.3+rand()*.4)/branches)),junction=stem[at],side=k%2?1:-1,source={x:clamp(junction.x+side*n*(.22+rand()*.2),3,n-3),y:clamp(junction.y-n*(.09+rand()*.17),3,n-3)},branch=bend(source,junction,Math.min(22,n*.075));channel(branch,2.8+rand()*.7);
  if(!dense||k%2===0){const fork=branch[Math.floor(branch.length*.45)],head={x:clamp(source.x-side*n*.08,3,n-3),y:clamp(source.y-n*.14,3,n-3)};channel(bend(head,fork,Math.min(16,n*.055)),2.8);}
  if(k%2===0){const lower=stem[Math.min(stem.length-1,at+Math.max(5,Math.floor(stem.length*.16)))],middle={x:clamp(junction.x+side*n*.13,4,n-4),y:(junction.y+lower.y)/2};channel([...bend(junction,middle,7),...bend(middle,lower,8).slice(1)],3);}
  if(k%3===1)channel([source,{x:source.x+.1,y:source.y+.1}],6+rand()*2);
 }
 // Unequal delta arms peel away from the downstream stem.
 const delta=stem[Math.floor(stem.length*.7)];for(const side of [-1,1])channel(bend(delta,{x:clamp(delta.x+side*n*(.2+rand()*.18),2,n-2),y:n},Math.min(24,n*.09)),dense?2.8:3.2);
 // A disconnected backwater remains a local transport system.
 const lake={x:n*.13,y:n*.72};channel(bend(lake,{x:n*.22,y:n*.84},n*.035),3.6);channel([lake,{x:lake.x+.1,y:lake.y+.1}],6);
 state.maritime=true;state.playableCells=Uint8Array.from(map,t=>!t.water&&t.height<state.rockHeight?1:0);
}
function rivers(state){for(const t of state.map){t.height=0;t.water=false;t.road=false;}state.rockHeight=99;waterways(state);baseClearings(state);state.playableCells=Uint8Array.from(state.map,t=>t.water?0:1);}
function startingHarbors(state){
 const {n,map,starts,protectedCells}=state;
 for(const start of starts){const parent=new Int32Array(n*n);parent.fill(-1);const first=Math.floor(start.y)*n+Math.floor(start.x),queue=[first];parent[first]=first;let shore=-1;
  for(let head=0;head<queue.length&&shore<0;head++){const i=queue[head],x=i%n,y=Math.floor(i/n);for(const j of [x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1]){if(j<0)continue;if(map[j].water){shore=i;break;}if(parent[j]<0){parent[j]=i;queue.push(j);}}}
  if(shore<0)continue;
  const clear=(i,r)=>{const cx=i%n,cy=Math.floor(i/n);for(let y=Math.max(0,cy-r);y<=Math.min(n-1,cy+r);y++)for(let x=Math.max(0,cx-r);x<=Math.min(n-1,cx+r);x++){const j=y*n+x;if(map[j].water||Math.hypot(x-cx,y-cy)>r)continue;map[j].height=0;protectedCells[j]=1;}};
  clear(shore,6);for(let i=shore;i!==first;i=parent[i])clear(i,2);
 }
}
function connectNarrowsRamps(state){
 const {n,map,rockHeight,protectedCells}=state;
 // River cuts and base clearings can truncate a previously carved ramp. Relax
 // only playable dry floors; never fill water or lower deliberate rock barriers.
 const pending=[],queued=new Uint8Array(n*n);
 for(let i=0;i<map.length;i++)if(!map[i].water&&map[i].height<rockHeight){pending.push(i);queued[i]=1;}
 for(let head=0;head<pending.length;head++){
  const i=pending[head],x=i%n,y=Math.floor(i/n);queued[i]=0;
  for(const j of [x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1]){
   if(j<0||map[j].water||map[j].height>=rockHeight||map[j].height<=map[i].height+1)continue;
   map[j].height=map[i].height+1;map[j].road=true;protectedCells[j]=1;
   if(!queued[j]){queued[j]=1;pending.push(j);}
  }
 }
}
function connectAllTerraces(state){
 const {map,n,protectedCells}=state,labels=new Int32Array(n*n);labels.fill(-1);const parent=[];let count=0;
 const neighbors=i=>{const x=i%n,y=Math.floor(i/n);return[x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1].filter(j=>j>=0&&!map[j].water);};
 for(let i=0;i<map.length;i++)if(!map[i].water&&labels[i]<0){const q=[i];labels[i]=count;for(let k=0;k<q.length;k++)for(const j of neighbors(q[k]))if(labels[j]<0&&Math.abs(map[j].height-map[q[k]].height)<=1){labels[j]=count;q.push(j);}parent.push(count++);}
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;},edges=[];
 for(let i=0;i<map.length;i++)if(labels[i]>=0)for(const j of neighbors(i))if(j>i&&labels[i]!==labels[j])edges.push([i,j,Math.abs(map[i].height-map[j].height)]);
 edges.sort((a,b)=>a[2]-b[2]);
 for(const [a,b]of edges){const ra=root(labels[a]),rb=root(labels[b]);if(ra===rb)continue;parent[rb]=ra;const high=map[a].height>map[b].height?a:b,low=high===a?b:a,base=map[low].height,label=labels[high],q=[[high,0]],seen=new Set([high]);
  // Short ramps are separated by flat terraces at every three-height tier.
  for(let k=0;k<q.length;k++){const [i,d]=q[k],cap=base+Math.floor(d/7)*3+clamp(d%7-3,0,3);if(map[i].height<=cap)continue;map[i].height=cap;map[i].road=true;protectedCells[i]=1;for(const j of neighbors(i))if(labels[j]===label&&!seen.has(j)){seen.add(j);q.push([j,d+1]);}}
 }
}
function narrows(state){
 const {n,map,rand}=state,levels=n<=100?1:n<=300?2:n<=500?3:n<=600?4:5,grid=makeGrid(n,Math.max(5,Math.floor((n-6)/12)),3);
 state.rockHeight=levels*3+4;for(const t of map){t.water=false;t.road=false;t.height=state.rockHeight;}
 for(const node of grid.nodes){const ring=Math.min(node.col,node.row,grid.count-1-node.col,grid.count-1-node.row);node.height=Math.min(levels-1,Math.floor(ring/(grid.count/(levels*2))))*3;}
 // Spawn approaches must not cut directly from the lowlands to a high tier.
 for(const start of state.starts){const near=grid.nodes.reduce((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)<Math.hypot(b.x-start.x,b.y-start.y)?a:b);near.height=0;}
 let adjusted=true;while(adjusted){adjusted=false;for(const node of grid.nodes)for(const id of neighbors(grid,node.id)){if(node.height>grid.nodes[id].height+3){node.height=grid.nodes[id].height+3;adjusted=true;}}}
 for(const node of grid.nodes)disc(state,node.x,node.y,node.id%17===4?5.3:2.7,node.height);
 const edges=connections(grid,rand,0);
 for(const [a,b] of edges){const from=grid.nodes[a],to=grid.nodes[b],rise=to.height-from.height;
  const length=Math.hypot(to.x-from.x,to.y-from.y),rampLength=Math.max(6,Math.abs(rise)*2+2);
  corridor(state,from,to,5,t=>from.height+rise*clamp((t-.5)*length/rampLength+.5,0,1));
  if(a%5===0&&!rise){const m={x:(from.x+to.x)/2,y:(from.y+to.y)/2};disc(state,m.x,m.y,4,Math.round((from.height+to.height)/2));}
  if(rise)state.ramps.push({x:(from.x+to.x)/2,y:(from.y+to.y)/2,fromHeight:from.height,toHeight:to.height,width:5});
 }
 for(const start of state.starts){const node=grid.nodes.reduce((a,b)=>Math.hypot(a.x-start.x,a.y-start.y)<Math.hypot(b.x-start.x,b.y-start.y)?a:b);corridor(state,start,node,5,t=>node.height*t);}
 baseClearings(state);smoothProtectedRamps(state);waterways(state,true);baseClearings(state);startingHarbors(state);connectNarrowsRamps(state);
 // Every former rock mass becomes a playable upper terrace. Assign its tier
 // from the nearest corridor, then cut explicit single-tier ramp entrances.
 const queue=[],visited=new Uint8Array(n*n),terraceHeight=new Uint8Array(n*n);for(let i=0;i<map.length;i++)if(!map[i].water&&map[i].height<state.rockHeight){visited[i]=1;terraceHeight[i]=Math.min((levels-1)*3,Math.ceil(map[i].height/3)*3+3);queue.push(i);}
 for(let head=0;head<queue.length;head++){const i=queue[head],x=i%n,y=Math.floor(i/n);for(const j of [x?i-1:-1,x<n-1?i+1:-1,y?i-n:-1,y<n-1?i+n:-1])if(j>=0&&!visited[j]&&!map[j].water){visited[j]=1;map[j].height=terraceHeight[j]=terraceHeight[i];queue.push(j);}}
 // Terrace interiors must sit one tier above their bordering corridor, while
 // remaining within the size's elevation count.
 for(let i=0;i<map.length;i++)if(!map[i].water&&!visited[i])map[i].height=0;
 for(let pass=0;pass<2;pass++)ensurePlateauAccess(state);
 for(let pass=0;pass<3;pass++)connectAllTerraces(state);
 state.regions=grid.nodes;
 state.playableCells=Uint8Array.from(map,t=>!t.water&&t.height<state.rockHeight?1:0);
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
  const from=grid.nodes[a],to=grid.nodes[b],length=Math.hypot(to.x-from.x,to.y-from.y),rise=to.height-from.height,count=Math.abs(rise)/2,sign=Math.sign(rise),rampRun=3,landingRun=3,total=count*rampRun+Math.max(0,count-1)*landingRun,offset=(length-total)/2;
  // Each climb ends on a flat intermediate terrace before the next ramp starts.
  const heightAt=t=>{let distance=t*length-offset,h=from.height;for(let k=0;k<count;k++){if(distance<=rampRun)return h+sign*2*clamp(distance/rampRun,0,1);distance-=rampRun;h+=sign*2;if(distance<=landingRun||k===count-1)return h;distance-=landingRun;}return h;};
  corridor(state,from,to,5.4,heightAt);
  for(let k=0;k<count;k++){const at=(offset+k*(rampRun+landingRun)+rampRun/2)/length;state.ramps.push({x:from.x+(to.x-from.x)*at,y:from.y+(to.y-from.y)*at,fromHeight:from.height+sign*k*2,toHeight:from.height+sign*(k+1)*2,length:rampRun,width:5.4,axis:from.col===to.col?'y':'x'});}

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

function ensurePlateauAccess(state){
 const {map,n,protectedCells}=state,parent=new Int32Array(n*n);parent.fill(-1);
 const root=i=>{let a=i;while(parent[a]!==a)a=parent[a];while(parent[i]!==i){const next=parent[i];parent[i]=a;i=next;}return a;},join=(a,b)=>{a=root(a);b=root(b);if(a!==b)parent[b]=a;};
 for(let i=0;i<map.length;i++)if(!map[i].water)parent[i]=i;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x;if(parent[i]<0)continue;for(const j of [x?i-1:-1,y?i-n:-1])if(j>=0&&parent[j]>=0&&Math.abs(map[i].height-map[j].height)<2)join(i,j);}
 // Preserve cliff faces. Add only a local access ramp when two adjacent dry
 // regions have no existing traversable connection; never replace river cells.
 for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++){
  const i=y*n+x;if(parent[i]<0)continue;
  for(const j of [i+1,i+n]){
   if(parent[j]<0||root(i)===root(j))continue;const high=map[i].height>map[j].height?i:j,low=high===i?j:i,rise=map[high].height-map[low].height;if(rise<2){join(i,j);continue;}
   if(state.rockHeight&&state.regions!==undefined){
    if(rise>3)continue;const hx=high%n,hy=Math.floor(high/n),lx=low%n,ly=Math.floor(low/n),dx=hx-lx,dy=hy-ly,run=6,from=map[low].height,to=map[high].height,sx=lx-dx*2,sy=ly-dy*2;let valid=true;
    for(let k=0;k<=run;k++)for(let side=-2;side<=2;side++){const xx=sx+dx*k-dy*side,yy=sy+dy*k+dx*side,t=xx>=0&&yy>=0&&xx<n&&yy<n?map[yy*n+xx]:null;if(!t||t.water||t.height<from||t.height>to)valid=false;}
    if(!valid)continue;for(let k=0;k<=run;k++)for(let side=-2;side<=2;side++){const index=(sy+dy*k+dx*side)*n+sx+dx*k-dy*side;map[index].height=Math.round(from+(to-from)*k/run);map[index].road=true;protectedCells[index]=1;}join(i,j);state.ramps.push({x:sx+dx*3,y:sy+dy*3,fromHeight:from,toHeight:to,width:5,length:6});continue;
   }
   const hx=high%n,hy=Math.floor(high/n),lx=low%n,ly=Math.floor(low/n),dx=hx-lx,dy=hy-ly,run=rise*2+2;
   let valid=true;for(let k=0;k<=run;k++)for(let side=-2;side<=2;side++){const xx=lx+dx*k-dy*side,yy=ly+dy*k+dx*side,t=state.map[yy*n+xx];if(xx<0||yy<0||xx>=n||yy>=n||!t||t.water||k>1&&root(yy*n+xx)!==root(high)){valid=false;break;}}
   if(!valid)continue;const from=map[low].height,to=map[high].height;
   for(let k=0;k<=run;k++)for(let side=-2;side<=2;side++){const xx=lx+dx*k-dy*side,yy=ly+dy*k+dx*side,index=yy*n+xx;map[index].height=Math.round(from+(to-from)*k/run);map[index].road=Math.abs(side)<2;protectedCells[index]=1;}
   join(i,j);state.ramps.push({x:lx+dx*run/2,y:ly+dy*run/2,fromHeight:from,toHeight:to,width:5,length:run});
  }
 }
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
 if(selected==='rivers')rivers(state);else if(selected==='narrows')narrows(state);else if(['mediterranean','continental','coastal','small-islands','large-islands'].includes(selected))maritime(state,selected);else if(selected==='mountain-passes')mountains(state);else if(selected==='steppes')steppes(state);else if(selected==='labyrinth')labyrinth(state);else plains(state);
 if(selected==='steppes')smoothProtectedRamps(state);
 if(selected==='plains'||selected==='steppes')ensurePlateauAccess(state);
 // Fixed opening deposits occupy the base interior; only the approaches outside it require obstruction protection.
 for(const start of starts)for(let y=Math.max(0,Math.floor(start.y-8));y<=Math.min(n-1,Math.ceil(start.y+8));y++)for(let x=Math.max(0,Math.floor(start.x-8));x<=Math.min(n-1,Math.ceil(start.x+8));x++)if(Math.hypot(x+.5-start.x,y+.5-start.y)<8)state.protectedCells[y*n+x]=0;
 return{layout:selected,protectedCells:state.protectedCells,playableCells:state.playableCells||playable(state),ramps:state.ramps,regions:state.regions};
}
root.FractureMapLayouts={apply};if(typeof module!=='undefined')module.exports=root.FractureMapLayouts;
})(globalThis);


