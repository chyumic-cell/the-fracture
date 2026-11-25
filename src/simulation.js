'use strict';
(function(root){
const campaignAPI=()=>root.FractureCampaign||(typeof require!=='undefined'?require('./campaign.js'):null);
// Kinds a player remembers through fog. Hoisted so the vision pass does not rebuild it per entity.
const REMEMBERED=new Set(['building','resource','tree']);
const D=root.FD||(typeof require!=='undefined'?require('./data.js'):null), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class RNG{constructor(seed){this.s=seed>>>0||1;}next(){let t=this.s+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}between(a,b){return a+this.next()*(b-a);}}
function hash(x,y,s){let n=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,144269);n=Math.imul(n^n>>>13,1274126177);return((n^n>>>16)>>>0)/4294967295;}
function noise(x,y,s){let ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);return(hash(ix,iy,s)*(1-fx)+hash(ix+1,iy,s)*fx)*(1-fy)+(hash(ix,iy+1,s)*(1-fx)+hash(ix+1,iy+1,s)*fx)*fy;}
class Game{
 constructor(options={}){
 this.options={seed:Math.floor(Math.random()*999999),size:200,theme:'Kareth',layout:'natural',resourceAmount:1,resourcePlacement:'random',startingResources:true,factions:['humans','reptilians'],difficulty:'standard',teams:[0,1],...options};this.n=this.options.size;this.rng=new RNG(this.options.seed);this.time=0;this.nextId=1;this.entities=[];this.projectiles=[];this.effects=[];this.events=[];this.winner=null;this.paused=false;this.fogTick=0;this.aiTick=0;this.navVersion=0;
 this.controlGroups={};this.players=this.options.factions.map((f,i)=>({id:i,faction:f,team:(this.options.teams||[])[i]??i,stock:[320,60,60,10],tech:[],special:0,kills:0,lost:0,gathered:[0,0,0,0],ai:i>0||this.options.spectate,explored:new Uint8Array(this.n*this.n),visible:new Uint8Array(this.n*this.n),attackAt:90,plan:'Establishing economy',nextDecision:0,knownNav:new Uint8Array(this.n*this.n),knownTiles:new Uint8Array(this.n*this.n),knowledge:{}}));
 this.map=Array.from({length:this.n*this.n},(_,i)=>{const x=i%this.n,y=Math.floor(i/this.n),h=noise(x/13,y/13,this.options.seed),j=noise(x/5,y/5,this.options.seed+19);return{water:h<.26,height:Math.max(0,Math.floor((h-.37)*7)),texture:j,road:false};});
 // Skirmish starts are random per seed. `starts` pins exact positions and
 // `startPositions:'ring'` restores the original fixed ring, both for deterministic tests
 // and for scripted content that needs a known layout.
 this.starts=Array.isArray(this.options.starts)&&this.options.starts.length===this.players.length?this.options.starts.map(q=>({x:Math.round(q.x),y:Math.round(q.y)})):this.options.startPositions==='ring'?this.ringStarts():this.randomStarts();
 for(const pos of this.starts)for(let y=-9;y<=9;y++)for(let x=-9;x<=9;x++){let t=this.tile(pos.x+x,pos.y+y);if(t&&Math.hypot(x,y)<9){t.water=false;t.height=0;}}
 // Meandering land passages ensure every starting base is connected.
 for(let k=1;k<this.starts.length;k++){const a=this.starts[k-1],b=this.starts[k],bend=this.rng.between(-5,5),steps=Math.ceil(dist(a,b)*3);for(let j=0;j<=steps;j++){const t=j/steps,x=a.x+(b.x-a.x)*t+Math.sin(t*Math.PI)*bend,y=a.y+(b.y-a.y)*t-Math.sin(t*Math.PI)*bend;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const tile=this.tile(x+dx,y+dy);if(tile&&Math.hypot(dx,dy)<2.3){tile.water=false;if(Math.hypot(dx,dy)<1.5)tile.height=0;}}}}
 {
 const layouts=root.FractureMapLayouts||(typeof require!=='undefined'?require('./map-layouts.js'):null),result=layouts.apply({map:this.map,n:this.n,starts:this.starts,rng:this.rng,seed:this.options.seed,layout:this.options.layout});this.routeMask=result.protectedCells;this.playableCells=result.playableCells;this.forestCells=result.forestCells;
 }
 this.generateResources();
 this.players.forEach((p,i)=>{p.home={...this.starts[i]};const f=D.factions[p.faction];this.spawnBuilding(f.buildings[0].id,i,p.home.x,p.home.y,true);for(let j=0;j<5;j++)this.spawnUnit(f.units[0].id,i,p.home.x-2+j*.8,p.home.y+3);});
 this.rebuildNav();this.updateVision();if(this.options.neutralSettlements&&!this.campaign)this.generateSettlements();
 }
 // Starting positions are drawn at random from the seed, not from a fixed ring. A minimum
 // separation keeps openings playable, and candidate sets are scored so that no player is
 // dropped into materially worse ground than the others. Falls back to the old ring if the
 // map cannot satisfy the constraints.
 ringStarts(){return this.players.map((p,i)=>{const a=Math.PI*2*i/this.players.length+Math.PI*.72;return{x:Math.round(this.n/2+Math.cos(a)*this.n*.31),y:Math.round(this.n/2+Math.sin(a)*this.n*.31)};});}
 randomStarts(){
  const n=this.n,count=this.players.length,margin=Math.max(12,Math.round(n*.09));
  const minSep=Math.max(26,n*(count<=2?.4:count<=4?.29:.22));
  const quality=(x,y)=>{let land=0,flat=0,total=0;for(let dy=-8;dy<=8;dy+=2)for(let dx=-8;dx<=8;dx+=2){const t=this.tile(x+dx,y+dy);if(!t)continue;total++;if(!t.water)land++;if(!t.water&&t.height===this.tile(x,y)?.height)flat++;}return total?(land/total)*.7+(flat/total)*.3:0;};
  // Naval access must stay possible from every start, so a position is only accepted when
  // water lies inside the radius the game itself searches when siting a dock. Sampled on a
  // stride for cost; layouts only add water, never remove it, so this bound holds afterwards.
  const waterReach=Math.min(45,Math.max(18,Math.round(n*.34)));
  const anyWater=this.map.some(t=>t.water);
  const nearWater=(x,y)=>{if(!anyWater)return true;for(let r=4;r<=waterReach;r+=4)for(let a=0;a<24;a++){const ang=a/24*Math.PI*2,t=this.tile(x+Math.cos(ang)*r,y+Math.sin(ang)*r);if(t&&t.water)return true;}return false;};
  let best=null,bestScore=-Infinity;
  for(let attempt=0;attempt<300;attempt++){
   const picks=[];
   for(let i=0;i<count;i++){
    let placed=null;
    for(let tries=0;tries<150;tries++){
     const x=Math.round(this.rng.between(margin,n-margin)),y=Math.round(this.rng.between(margin,n-margin));
     if(picks.some(q=>dist(q,{x,y})<minSep))continue;
     if(!nearWater(x,y))continue;
     placed={x,y};break;
    }
    if(!placed)break;
    picks.push(placed);
   }
   if(picks.length<count)continue;
   const qs=picks.map(q=>quality(q.x,q.y)),mean=qs.reduce((a,b)=>a+b,0)/count,spread=Math.max(...qs)-Math.min(...qs);
   const score=mean-spread*1.6;
   if(score>bestScore){bestScore=score;best=picks;}
   if(bestScore>.82)break;
  }
  return best||this.ringStarts();
 }
 generateSettlements(){const types=this.options.theme==='Elyndra'?['wizards','primates']:this.options.theme==='Morvane'?['wizards','humans']:['humans','primates'];for(let k=0;k<Math.min(10,2+Math.floor(this.n/100));k++)for(let attempt=0;attempt<180;attempt++){const x=this.rng.between(8,this.n-8),y=this.rng.between(8,this.n-8);if(this.starts.some(p=>Math.hypot(p.x-x,p.y-y)<17)||this.entities.some(e=>e.kind!=='tree'&&Math.hypot(e.x-x,e.y-y)<5)||this.blocked(x,y)||this.tile(x,y).water)continue;let flat=true;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(!this.tile(x+dx,y+dy)||this.tile(x+dx,y+dy).water||this.height(x+dx,y+dy)!==this.height(x,y))flat=false;if(!flat)continue;this.clearConstructionTrees(x,y,2);const f=types[k%types.length],b=this.spawnBuilding('neutral_'+f,undefined,x,y,true);b.campaignFaction=f;b.campaignImmune=true;b.recruits={};break;}this.rebuildNav();this.updateVision();}
 recruitNeutral(id,owner=0){const b=this.entity(id),p=this.players[owner];if(!b||this.def(b).kind!=='neutral'||!this.visible(owner,b))return{ok:false,reason:'Visit a visible settlement.'};if(!this.entitiesByKind('unit').some(u=>u.owner===owner&&!u.embarkedBy&&Math.hypot(u.x-b.x,u.y-b.y)<6))return{ok:false,reason:'Bring a unit beside the settlement.'};if((b.recruits?.[owner]||0)>=2)return{ok:false,reason:'This settlement has no more volunteers.'};const unit=D.factions[b.campaignFaction].units.find(u=>u.role==='melee'&&!u.special&&!u.air)||D.factions[b.campaignFaction].units.find(u=>u.role==='rifle');if(this.population(owner)+unit.pop>this.capacity(owner))return{ok:false,reason:'More population capacity needed.'};const probe={kind:'unit',owner,type:unit.id,x:b.x,y:b.y},spot=this.approach(probe,b,1.8);if(this.blocked(spot.x,spot.y))return{ok:false,reason:'Clear a place beside the settlement.'};if(!this.pay(owner,[120,0,30,0]))return{ok:false,reason:'Requires 120 Ore and 30 Aetherite.'};const u=this.spawnUnit(unit.id,owner,spot.x,spot.y);u.campaignFaction=b.campaignFaction;b.recruits||={};b.recruits[owner]=(b.recruits[owner]||0)+1;return{ok:true,unit:u};}
 tile(x,y){x=Math.floor(x);y=Math.floor(y);return x>=0&&y>=0&&x<this.n&&y<this.n?this.map[y*this.n+x]:null;}
 rockTerrain(h){return this.options.layout==='narrows'&&h>=(this.n<=100?1:this.n<=300?2:this.n<=500?3:this.n<=600?4:5)*3+4;}
 height(x,y){return this.tile(x,y)?.height||0;}
 // One elevation rule drives terrain drawing, routing and physical movement.
 cliffBetween(x,y,xx,yy,owner=null){const a=this.tile(x,y),b=this.tile(xx,yy);if(!a||!b)return true;if(owner!==null){const p=this.players[owner],i=Math.floor(y)*this.n+Math.floor(x),j=Math.floor(yy)*this.n+Math.floor(xx);if(!p.explored[i]||!p.explored[j])return false;return Math.abs((p.knownTiles[i]&127)-(p.knownTiles[j]&127))>=2;}return Math.abs(a.height-b.height)>=2;}
 cornerHeight(x,y,base){const a=this.tile(x-1,y-1)?.height,b=this.tile(x,y-1)?.height,c=this.tile(x-1,y)?.height,d=this.tile(x,y)?.height;let mask=(a===base?1:0)|(b===base?2:0)|(c===base?4:0)|(d===base?8:0),previous=-1;while(mask!==previous){previous=mask;if(Math.abs(a-b)<2&&(mask&3))mask|=3;if(Math.abs(a-c)<2&&(mask&5))mask|=5;if(Math.abs(b-d)<2&&(mask&10))mask|=10;if(Math.abs(c-d)<2&&(mask&12))mask|=12;}const count=(mask&1?1:0)+(mask&2?1:0)+(mask&4?1:0)+(mask&8?1:0);return count?((mask&1?a:0)+(mask&2?b:0)+(mask&4?c:0)+(mask&8?d:0))/count:base;}
 surfaceHeight(x,y){const ix=Math.floor(x),iy=Math.floor(y),base=this.height(x,y),fx=x-ix,fy=y-iy;const a=this.cornerHeight(ix,iy,base),b=this.cornerHeight(ix+1,iy,base),c=this.cornerHeight(ix+1,iy+1,base),d=this.cornerHeight(ix,iy+1,base);return a*(1-fx)*(1-fy)+b*fx*(1-fy)+c*fx*fy+d*(1-fx)*fy;}
 canTraverse(x,y,xx,yy,air=false,owner=null,actual=false){if(this.blocked(xx,yy,air,owner,actual))return false;if(air)return true;if(this.cliffBetween(x,y,xx,yy,actual?null:owner))return false;const ix=Math.floor(x),iy=Math.floor(y),jx=Math.floor(xx),jy=Math.floor(yy);if(ix!==jx&&iy!==jy){for(const q of [[jx+.5,iy+.5],[ix+.5,jy+.5]])if(this.blocked(...q,false,owner,actual)||this.cliffBetween(x,y,...q,actual?null:owner)||this.cliffBetween(...q,xx,yy,actual?null:owner))return false;}return true;}
 entity(id){if(this.entityIndexSource!==this.entities||this.entityIndexSize!==this.entities.length){this.entityIndex=new Map(this.entities.map(e=>[e.id,e]));this.entityIndexSource=this.entities;this.entityIndexSize=this.entities.length;}const e=this.entityIndex.get(id);return e?.hp>0?e:undefined;}
 entitiesByKind(kind){if(this.kindIndexSource!==this.entities||this.kindIndexSize!==this.entities.length){this.kindIndex=new Map();for(const e of this.entities){if(!this.kindIndex.has(e.kind))this.kindIndex.set(e.kind,[]);this.kindIndex.get(e.kind).push(e);}this.kindIndexSource=this.entities;this.kindIndexSize=this.entities.length;}return this.kindIndex.get(kind)||[];}
 // Cached: this runs once per unit per tick, and rebuilding the combined array each time dominated
 // garbage collection in large battles. entitiesByKind already rebuilds its arrays whenever the
 // entity list changes, so array identity is a sound invalidation signal. Callers only read.
 combatEntities(){const units=this.entitiesByKind('unit'),buildings=this.entitiesByKind('building');
  if(this.combatSourceUnits!==units||this.combatSourceBuildings!==buildings||this.combatSourceSize!==units.length+buildings.length){
   this.combatCache=[...units,...buildings];this.combatSourceUnits=units;this.combatSourceBuildings=buildings;this.combatSourceSize=units.length+buildings.length;}
  return this.combatCache;}
 movementMode(u){const d=this.def(u);return d?.naval?'water':!!d?.air;}
 def(e){return e.kind==='unit'?D.units[e.type]:D.buildings[e.type];}
 say(message,player=0){this.events.push({message,time:this.time,player});if(this.events.length>30)this.events.shift();}
 add(e){e.id=this.nextId++;this.entities.push(e);if(this.entityIndexSource===this.entities){this.entityIndex.set(e.id,e);this.entityIndexSize=this.entities.length;}if(this.kindIndexSource===this.entities){if(!this.kindIndex.has(e.kind))this.kindIndex.set(e.kind,[]);this.kindIndex.get(e.kind).push(e);this.kindIndexSize=this.entities.length;}return e;}
 generateResources(){
 // A local spatial index keeps Colossal maps from doing millions of whole-entity scans.
 const buckets=new Map(),key=(x,y)=>Math.floor(x/3)+','+Math.floor(y/3),remember=e=>{const k=key(e.x,e.y);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(e);return e;};for(const e of this.entities)remember(e);
 const spaced=(x,y,r)=>{const cx=Math.floor(x/3),cy=Math.floor(y/3);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)for(const e of buckets.get((cx+dx)+','+(cy+dy))||[])if((e.x-x)**2+(e.y-y)**2<r*r)return false;return true;};
 const available=(x,y,r)=>{const t=this.tile(x,y);if(!t||t.water)return false;const i=Math.floor(y)*this.n+Math.floor(x);if(this.playableCells&&!this.playableCells[i])return false;if(this.routeMask)for(let yy=Math.max(0,Math.floor(y-r-.45));yy<=Math.min(this.n-1,Math.floor(y+r+.45));yy++)for(let xx=Math.max(0,Math.floor(x-r-.45));xx<=Math.min(this.n-1,Math.floor(x+r+.45));xx++)if(this.routeMask[yy*this.n+xx]&&Math.hypot(xx+.5-x,yy+.5-y)<r+.45)return false;return true;};
 const add=(r,x,y,amount=600)=>{const size=r===3?.65:.85;if(!available(x,y,size)||!spaced(x,y,2))return false;remember(this.add({kind:'resource',resource:r,x,y,hp:1,amount,maxAmount:amount,size}));return true;};
 // Every player's opening deposits must actually exist. If the intended offset is water,
 // blocked, reserved for a route or already occupied, the deposit is nudged outward to the
 // nearest workable tile instead of being silently dropped.
 if(this.options.startingResources!==false)for(const h of this.starts){[[0,4,-4],[0,6,-3],[1,-6,-2],[2,1,7],[3,-5,6]].forEach(([r,dx,dy])=>{
  const amount=r===3?220:900;if(add(r,h.x+dx,h.y+dy,amount))return;
  for(let radius=1;radius<=8;radius++)for(let a=0;a<20;a++){const ang=a/20*Math.PI*2+radius;
   if(add(r,h.x+dx+Math.cos(ang)*radius,h.y+dy+Math.sin(ang)*radius,amount))return;}
 });}
 const abundance=clamp(Number(this.options.resourceAmount)||1,.25,4),distribution=this.options.resourcePlacement||'random',districts=[],districtCount=Math.max(distribution==='balanced'?this.players.length:1,Math.ceil(this.n*this.n/1320*abundance));
 for(let r=0;r<4;r++)for(let c=0;c<districtCount;c++){
  let center=null,best=Infinity;const owner=c%this.starts.length,home=this.starts[owner],goal=Math.min(this.n*.32,18+Math.floor(c/this.starts.length)*3);
  for(let attempt=0;attempt<(distribution==='random'?100:140);attempt++){
   let p;if(distribution==='balanced'&&attempt<90){const a=this.rng.next()*Math.PI*2,d=this.rng.between(Math.max(12,goal-8),goal+8);p={x:home.x+Math.cos(a)*d,y:home.y+Math.sin(a)*d};}else p={x:this.rng.between(4,this.n-4),y:this.rng.between(4,this.n-4)};
   if(p.x<4||p.y<4||p.x>this.n-4||p.y>this.n-4||!available(p.x,p.y,.85)||this.starts.some(h=>dist(h,p)<=10)||districts.some(d=>d.resource!==r&&dist(d,p)<6))continue;
   if(distribution==='random'){center=p;break;}
   const distances=this.starts.map(h=>dist(h,p)),sorted=[...distances].sort((a,b)=>a-b);
   const score=distribution==='balanced'?Math.abs(distances[owner]-goal)+Math.max(0,distances[owner]-sorted[0])*3:Math.abs(sorted[0]-sorted[1])*2+Math.abs(sorted[0]-this.n*.25);
   if(score<best){best=score;center=p;}
  }
  if(center){districts.push({...center,resource:r});for(let j=0;j<3+r%2;j++)add(r,center.x+this.rng.between(-2,2),center.y+this.rng.between(-2,2),r===3?300:1200);}
 }

 for(let i=0;i<this.n*this.n*.035;i++){const p={x:this.rng.between(1,this.n-1),y:this.rng.between(1,this.n-1)};if(available(p.x,p.y,.4)&&this.starts.every(h=>dist(h,p)>7)&&spaced(p.x,p.y,1.7))remember(this.add({...p,kind:'tree',hp:1,size:.4,variant:Math.floor(this.rng.next()*4)}));}
 // Forest map types mark dense woods off their trails. Planted after the ordinary scatter, so every
 // other layout draws exactly the same random sequence; capped to keep entity counts bounded.
 if(this.forestCells){const n=this.n,candidates=[];for(let y=1;y<n-1;y+=2)for(let x=1;x<n-1;x+=2)if(this.forestCells[y*n+x])candidates.push(y*n+x);const chance=Math.min(1,n*n*.07/Math.max(1,candidates.length));
  for(const i of candidates){if(this.rng.next()>=chance)continue;const p={x:i%n+this.rng.next()*2,y:Math.floor(i/n)+this.rng.next()*2};if(available(p.x,p.y,.4)&&this.starts.every(h=>dist(h,p)>9)&&spaced(p.x,p.y,1.7))remember(this.add({...p,kind:'tree',hp:1,size:.4,variant:Math.floor(this.rng.next()*4)}));}}
 delete this.routeMask;delete this.playableCells;delete this.forestCells;
 }
 spawnUnit(type,owner,x,y){const d=D.units[type];return this.add({kind:'unit',type,owner,x,y,hp:d.hp,maxHp:d.hp,face:2,order:null,path:[],carry:0,carryType:0,cooldown:0,action:'idle',phase:0,stuck:0,flight:d.air?63:null});}
 spawnBuilding(type,owner,x,y,complete=false){const d=D.buildings[type];const b=this.add({kind:'building',type,owner,x,y,hp:complete?d.hp:d.hp*.15,maxHp:d.hp,progress:complete?1:0,queue:[],rally:{x:x+3,y:y+3},extension:null,size:d.size,attackTimer:0});this.navVersion++;return b;}
 population(owner){return this.combatEntities().filter(e=>e.owner===owner&&e.hp>0).reduce((n,e)=>n+(e.kind==='unit'?D.units[e.type].pop:(e.queue||[]).reduce((a,q)=>a+(q.kind==='unit'?D.units[q.type].pop:0),0)),0);}
 // Difficulty changes decisions only. The same rules govern both sides, including old saves.
 aiEconomicRate(owner,kind){return 1;}
 capacity(owner){return Math.min(200,this.entities.filter(e=>e.kind==='building'&&e.owner===owner&&e.hp>0&&e.progress>=1).reduce((n,e)=>n+(this.def(e).kind==='hq'?20:this.def(e).kind==='house'?12:0),0));}
 hasBuilding(owner,type){return this.entitiesByKind('building').some(e=>e.kind==='building'&&e.owner===owner&&e.type===type&&e.hp>0&&e.progress>=1);}
 affordable(owner,cost){return cost.every((v,i)=>this.players[owner].stock[i]>=v);}
 pay(owner,cost){if(!this.affordable(owner,cost))return false;cost.forEach((v,i)=>this.players[owner].stock[i]-=v);return true;}
 missing(owner,d,b){const p=this.players[owner],missing=[];for(const r of d.requires||[])if(D.buildings[r]?!this.hasBuilding(owner,r):!p.tech.includes(r))missing.push((D.buildings[r]||D.research[r])?.name||r);if(d.research&&!p.tech.includes(d.research))missing.push(D.research[d.research].name);if(d.extension&&b?.extension!==d.extension)missing.push(d.extension);return missing;}
 queue(bid,type,kind='unit'){const b=this.entity(bid);if(!b||b.kind!=='building'||b.progress<1||b.queue.length>=15)return{ok:false,reason:'Complete the building; queue limit is fifteen.'};const d=kind==='unit'?D.units[type]:kind==='research'?D.research[type]:D.extensions[type],p=this.players[b.owner];if(!d||d.building!==b.type)return{ok:false,reason:'Wrong production building.'};if(this.campaign&&b.owner===0){const reason=campaignAPI().restriction(this,d,kind);if(reason)return{ok:false,reason};}const missing=this.missing(b.owner,d,b);if(missing.length)return{ok:false,reason:'Requires '+missing.join(', ')};
 if(kind==='research'&&(p.tech.includes(type)||this.entities.some(e=>e.owner===b.owner&&e.queue?.some(q=>q.type===type))))return{ok:false,reason:'Already researched or queued.'};
 if(kind==='extension'&&(b.extension||b.queue.some(q=>q.kind==='extension')))return{ok:false,reason:'One extension per production building.'};
 if(kind==='extension'&&!d.upgradeTo){const err=this.extensionPlacement(b,true);if(err)return{ok:false,reason:'Extension site: '+err};}
 if(kind==='unit'&&this.population(b.owner)+d.pop>this.capacity(b.owner))return{ok:false,reason:'More population capacity needed.'};if((d.special||0)>p.special)return{ok:false,reason:'Needs '+d.special+' '+D.factions[p.faction].counter};if(!this.pay(b.owner,d.cost))return{ok:false,reason:'Insufficient resources.'};p.special-=d.special||0;b.queue.push({type,kind,remaining:d.time,total:d.time});if(kind==='extension'&&!d.upgradeTo){this.clearConstructionTrees(b.x+this.def(b).size+1.2,b.y,.5);this.rebuildNav();this.updateVision();}return{ok:true};}
 cancelQueue(bid,index){const b=this.entity(bid);if(!b||!b.queue||index<0||index>=b.queue.length)return false;const q=b.queue.splice(index,1)[0],d=(q.kind==='unit'?D.units:q.kind==='research'?D.research:D.extensions)[q.type],fraction=index===0?q.remaining/q.total:1;d.cost.forEach((v,i)=>this.players[b.owner].stock[i]+=v*fraction);this.players[b.owner].special+=d.special||0;return true;}
 cancelConstruction(bid){const b=this.entity(bid);if(!b||b.kind!=='building'||b.progress>=1)return false;if(b.pendingSite)return this.refundConstructionSite(b);this.def(b).cost.forEach((v,i)=>this.players[b.owner].stock[i]+=v*.75);b.hp=0;this.rebuildNav();return true;}
 demolish(ids,owner=0){let removed=0;const targets=ids.map(id=>this.entity(id)).filter(e=>e&&e.owner===owner&&['unit','building'].includes(e.kind));for(const e of targets){if(e.kind==='building'&&e.progress<1){this.cancelConstruction(e.id);}else{for(let i=(e.queue?.length||0)-1;i>=0;i--)this.cancelQueue(e.id,i);e.hp=0;e.demolished=true;}for(const u of this.entities)if(u.order?.target===e.id){u.order=null;u.path=[];u.destination=null;u.action='idle';}removed++;}if(removed){for(const k of Object.keys(this.controlGroups||{}))this.controlGroups[k]=this.controlGroups[k].filter(id=>this.entity(id));this.rebuildNav();this.updateVision();}return{ok:removed>0,removed,reason:removed?'':'Select your own units or buildings.'};}
 // Explored-site orders reserve payment without changing the hidden world.
 // Workers validate them on arrival before clearing trees or placing collision.
 // Cached within a tick: the AI tests many candidate sites per decision, and each call scanned every
 // entity and every remembered object (about 15,000 on Colossal). Any building added, removed or
 // finished, and any vision pass, gives a new key.
 constructionObjects(owner,actual=false){const key=owner+':'+actual+':'+this.time+':'+(this.visionRevision||0)+':'+this.entities.length+':'+this.navVersion;this.constructionCache??=new Map();const hit=this.constructionCache.get(owner+':'+actual);if(hit&&hit.key===key)return hit.list;const list=this.constructionObjectsUncached(owner,actual);this.constructionCache.set(owner+':'+actual,{key,list});return list;}
 constructionObjectsUncached(owner,actual=false){
  const valid=e=>e.hp>0&&(e.kind==='building'&&(!e.pendingSite||e.owner===owner)||e.kind==='resource'&&e.amount>0);
  if(actual)return this.entities.filter(valid);
  const objects=new Map(),p=this.players[owner];
  for(const e of Object.values(p?.knowledge||{}))if(valid(e)&&e.owner!==owner&&!this.visible(owner,e))objects.set(e.id,e);
  for(const e of this.entities)if(valid(e)&&(e.owner===owner||this.visible(owner,e)))objects.set(e.id,e);
  return [...objects.values()];
 }
 constructionBlockers(owner,x,y,size,ignoreId=null,actual=false,placingType=null){
  const point={x,y},result=[],resourceNames=['Ore','Lastrian Oil','Aetherite','Rift Crystals'];
  for(const e of this.constructionObjects(owner,actual)){
   if(Math.abs(e.x-x)>(e.size||1)+size+3||Math.abs(e.y-y)>(e.size||1)+size+3)continue;
   if(e.id===ignoreId)continue;if(e.kind==='resource'&&D.buildings[placingType]?.kind==='extractor'&&D.resources[e.resource]===D.buildings[placingType].resource)continue;if(D.buildings[placingType]?.kind==='wall'&&this.def(e)?.kind==='wall'&&(Math.floor(e.x)!==Math.floor(x)||Math.floor(e.y)!==Math.floor(y)))continue;
   const visible=this.visible(owner,e),radius=e.size||1,name=e.kind==='resource'?resourceNames[e.resource]+' deposit':this.def(e)?.name||'Building';
   if(dist(e,point)<radius+size+.4)result.push({id:e.id,kind:e.kind,x:e.x,y:e.y,size:radius,name,visible,extension:false});
   if(e.kind==='building'){
    const queued=e.queue?.find(q=>q.kind==='extension'),extension=e.extension||(queued&&!D.extensions[queued.type]?.upgradeTo&&D.extensions[queued.type]?.name)||(Object.values(D.extensions).some(v=>v.building===e.type&&!v.upgradeTo)?'Reserved future':null);
    if(extension){const ex={x:e.x+radius+1.2,y:e.y};if(dist(ex,point)<.5+size+.4)result.push({id:e.id,kind:'extension',...ex,size:.5,name:extension+' extension',visible:visible&&this.visible(owner,ex),extension:true});}
   }
  }
  return result;
 }
 placementBlockers(type,owner,x,y){const d=D.buildings[type];return d?this.constructionBlockers(owner,x,y,d.size,null,false,type).filter(e=>e.visible):[];}
 constructionSiteVisible(owner,x,y,size){const p=this.players[owner];for(let iy=Math.floor(y-size);iy<=Math.floor(y+size-1e-7);iy++)for(let ix=Math.floor(x-size);ix<=Math.floor(x+size-1e-7);ix++)if(ix<0||iy<0||ix>=this.n||iy>=this.n||!p?.visible[iy*this.n+ix])return false;return true;}
 constructionTerrain(owner,x,y,size,actual=false){
  if(!Number.isFinite(x)||!Number.isFinite(y))return'Outside the map';
  const left=Math.floor(x-size),right=Math.floor(x+size-1e-7),top=Math.floor(y-size),bottom=Math.floor(y+size-1e-7),p=this.players[owner];
  if(left<0||top<0||right>=this.n||bottom>=this.n)return'Outside the map';
  // Black, unexplored ground is never a legal construction site. Fog uses remembered terrain.
  for(let iy=top;iy<=bottom;iy++)for(let ix=left;ix<=right;ix++)if(!p?.explored[iy*this.n+ix])return'Explore the entire building site first';
  const terrainAt=(ix,iy)=>{const i=Math.floor(iy)*this.n+Math.floor(ix);return actual||p.visible[i]?this.tile(ix,iy):{water:!!(p.knownTiles[i]&128),height:p.knownTiles[i]&127};},height=terrainAt(x,y).height;
  for(let iy=top;iy<=bottom;iy++)for(let ix=left;ix<=right;ix++){const t=terrainAt(ix,iy);if(t.water)return'Needs dry ground';if(this.rockTerrain(t.height))return'Impassable rock';if(t.height!==height)return'Terrain must be level';}
  return null;
 }
 constructionObstruction(blockers){
  const blocker=blockers.find(e=>e.visible)||blockers[0];
  if(!blocker)return null;
  return blocker.visible?'Blocked by '+blocker.name:'Site unavailable. Move a worker closer to survey the area.';
 }
 extensionPlacement(b,actual=false){
  const d=this.def(b);if(!d||b.owner===undefined)return'Select an owned production building';
  const x=b.x+d.size+1.2,y=b.y;
  return this.constructionTerrain(b.owner,x,y,.5,actual)||this.constructionObstruction(this.constructionBlockers(b.owner,x,y,.5,b.id,actual));
 }
 extensionFits(b){return !this.extensionPlacement(b);}
 clearConstructionTrees(x,y,size){for(const e of this.entities)if(e.kind==='tree'&&e.hp>0&&dist(e,{x,y})<(e.size||.4)+size+.4)e.hp=0;}
 // Push units out of a building's footprint so they don't get stuck inside.
 ejectUnitsFromBuilding(b){const d=this.def(b),r=d.size||1;for(const u of this.entities){if(u.kind!=='unit'||u.hp<=0||u.embarkedBy)continue;if(this.def(u)?.air)continue;const ux=Math.abs(u.x-b.x),uy=Math.abs(u.y-b.y);if(ux>=r+.5||uy>=r+.5)continue;// Unit is inside or very close to building footprint
  const spot=this.approach(u,b,1.5);if(spot&&!this.blocked(spot.x,spot.y,false,u.owner,true)){u.x=spot.x;u.y=spot.y;u.path=[];u.destination=null;u.stuck=0;}}}
 placement(type,owner,x,y,actual=false,ignoreId=null,paid=false){
  const d=D.buildings[type];if(!d)return'Unknown building';
  if(d.kind==='deepMine')return'Upgrade a collector into a deep mine';if(d.kind==='depot')return'Each resource now has its own collector';
  const missing=this.missing(owner,d);if(missing.length)return'Requires '+missing.join(', ');
  if(d.kind==='extractor'){const site=this.collectorSite(type,owner,x,y,actual);if(!site)return'Build on top of a '+({ore:'Ore',oil:'Lastrian Oil',aether:'Aetherite',rift:'Rift Crystal'})[d.resource]+' deposit';x=site.x;y=site.y;}
  if(!Number.isFinite(x)||!Number.isFinite(y))return'Outside the map';
  const terrain=d.kind==='wall'?this.constructionTerrain(owner,Math.floor(x)+.5,Math.floor(y)+.5,.49,actual):this.constructionTerrain(owner,x,y,d.size,actual);if(terrain)return terrain;
  const obstruction=this.constructionObstruction(this.constructionBlockers(owner,x,y,d.size,ignoreId,actual,type));if(obstruction)return obstruction;
  if(Object.values(D.extensions).some(v=>v.building===type&&!v.upgradeTo)){const ex=this.extensionPlacement({id:ignoreId,type,kind:'building',owner,x,y},actual);if(ex)return'Future extension: '+ex;}
  const enemy=this.entities.find(e=>e.kind==='unit'&&e.hp>0&&this.hostile(owner,e.owner)&&!this.def(e).air&&(actual||this.visible(owner,e))&&Math.abs(e.x-x)<d.size*(22*1.6/48)+.35&&Math.abs(e.y-y)<d.size*(22*1.6/48)+.35);if(enemy)return'Enemy troops occupy the building site';
  if(!paid&&!this.affordable(owner,d.cost))return'Insufficient resources';return null;
 }
 build(type,owner,x,y,workerIds=[]){
  if(this.campaign&&owner===0){const reason=campaignAPI().restriction(this,D.buildings[type],'building');if(reason)return{ok:false,reason};}
  {const site=this.collectorSite(type,owner,x,y);if(site){x=site.x;y=site.y;}}
  const preview=this.placement(type,owner,x,y);if(preview)return{ok:false,reason:preview};
  const siteDef=D.buildings[type],pending=siteDef.kind==='wall'?!this.constructionSiteVisible(owner,Math.floor(x)+.5,Math.floor(y)+.5,.49):!this.constructionSiteVisible(owner,x,y,siteDef.size);if(!pending){const err=this.placement(type,owner,x,y,true);if(err)return{ok:false,reason:err};}
  const builders=workerIds.filter(id=>{const u=this.entity(id);return u?.owner===owner&&u.kind==='unit'&&this.def(u)?.worker;});
  if(!builders.length)return{ok:false,reason:'Select a worker.'};
  const d=D.buildings[type];if(!this.pay(owner,d.cost))return{ok:false,reason:'Insufficient resources'};
  const b=this.spawnBuilding(type,owner,x,y);if(pending){b.pendingSite=true;b.reservedCost=[...d.cost];b.siteProgressAt=this.time;}else{this.clearConstructionTrees(x,y,d.size);this.rebuildNav();this.updateVision();}
  this.order(builders,{kind:'build',target:b.id});return{ok:true,building:b,pending};
 }
 fortificationPlan(type,a,b){const kind=D.buildings[type]?.kind,cells=[];let x=Math.floor(a.x),y=Math.floor(a.y),tx=Math.floor(b.x),ty=Math.floor(b.y);if(kind==='trap'){for(let yy=Math.min(y,ty);yy<=Math.max(y,ty)&&cells.length<64;yy+=2)for(let xx=Math.min(x,tx);xx<=Math.max(x,tx)&&cells.length<64;xx+=2)cells.push({x:xx+.5,y:yy+.5});return cells;}const dx=Math.abs(tx-x),dy=Math.abs(ty-y),sx=Math.sign(tx-x),sy=Math.sign(ty-y);let error=dx-dy;while(cells.length<96){cells.push({x:x+.5,y:y+.5});if(x===tx&&y===ty)break;const e=error*2;if(e>-dy){error-=dy;x+=sx;}if(e<dx){error+=dx;y+=sy;}}const ax=Math.floor(a.x)+.5,ay=Math.floor(a.y)+.5,vx=tx+.5-ax,vy=ty+.5-ay,length=vx*vx+vy*vy;return cells.map(c=>{if(!length)return c;const t=((c.x-ax)*vx+(c.y-ay)*vy)/length;return{x:clamp(ax+vx*t,Math.floor(c.x)+.02,Math.floor(c.x)+.98),y:clamp(ay+vy*t,Math.floor(c.y)+.02,Math.floor(c.y)+.98)};});}
 buildFortification(type,owner,a,b,workers){const cells=this.fortificationPlan(type,a,b,owner),built=[];let reason='';for(const c of cells){if(this.entities.some(e=>e.hp>0&&e.type===type&&e.owner===owner&&Math.floor(e.x)===Math.floor(c.x)&&Math.floor(e.y)===Math.floor(c.y)))continue;const r=this.build(type,owner,c.x,c.y,workers);if(r.ok)built.push(r.building);else{reason=r.reason;break;}}if(built.length)this.order(workers,{kind:'build',target:built[0].id});return{ok:built.length>0,reason,placed:built.length};}
 refundConstructionSite(b,reason=null){if(!b?.pendingSite||b.hp<=0)return false;const cost=b.reservedCost||this.def(b).cost;b.hp=0;delete b.reservedCost;for(let i=0;i<cost.length;i++)this.players[b.owner].stock[i]+=cost[i];for(const u of this.entities)if(u.kind==='unit'&&u.order?.target===b.id){u.order=null;u.destination=null;u.path=[];u.action='idle';}if(reason)this.say(this.def(b).name+' canceled: '+reason+'. Full cost refunded.',b.owner);return true;}
 startConstructionSite(b){const err=this.placement(b.type,b.owner,b.x,b.y,true,b.id,true);if(err){this.refundConstructionSite(b,err);return false;}delete b.pendingSite;delete b.reservedCost;delete b.siteProgressAt;this.clearConstructionTrees(b.x,b.y,b.size);this.rebuildNav();this.ejectUnitsFromBuilding(b);this.updateVision();return true;}
 visible(owner,e){if(e.kind==='building'&&this.def(e)?.concealedTrap&&this.hostile(owner,e.owner))return false;if(e.embarkedBy||e.insideMine)return false;if(e.pendingSite&&e.owner!==owner)return false;return !!this.players[owner]?.visible[Math.floor(e.y)*this.n+Math.floor(e.x)];}
 known(owner,e){if(e.kind==='building'&&this.def(e)?.concealedTrap&&this.hostile(owner,e.owner))return false;return !!this.players[owner]?.explored[Math.floor(e.y)*this.n+Math.floor(e.x)];}
 hostile(a,b){return a!==undefined&&b!==undefined&&this.players[a].team!==this.players[b].team;}
 updateVision(){for(const p of this.players){const signature=this.players.filter(a=>a.id!==p.id&&a.team===p.team).map(a=>a.id).join(',');if(p.sharedRouteTeam!==signature){for(const a of this.players)if(a.id!==p.id&&a.team===p.team)for(let i=0;i<this.n*this.n;i++)if(a.explored[i]&&!p.explored[i]){p.explored[i]=1;this.noteExplored(p,i);p.knownNav[i]=a.knownNav[i];p.knownTiles[i]=a.knownTiles[i];p.navigationRevision=(p.navigationRevision||0)+1;}p.sharedRouteTeam=signature;}}this.visionRevision=(this.visionRevision||0)+1;for(const p of this.players){p.visible.fill(0);p.visibleCells=[];}for(const e of this.entities){if(e.hp<=0||e.embarkedBy||e.insideMine||e.owner===undefined||e.owner===this.campaign?.neutralOwner||e.kind==='building'&&e.progress<1)continue;const d=this.def(e),r=e.scanUntil>this.time?13:(d.vision??(d.kind==='hq'?10:d.kind==='defense'?11:6)),p=this.players[e.owner],cx=Math.floor(e.x),cy=Math.floor(e.y);if(r<=0)continue;
  // Same disc and same high-ground rule as before, with squared distances and direct tile reads: this
  // scan runs for every unit and building several times a second.
  const n=this.n,map=this.map,vis=p.visible,cells=p.visibleCells,rr=r*r,air=!!d.air,h0=this.height(e.x,e.y)+2;for(let y=Math.max(0,cy-r);y<=Math.min(n-1,cy+r);y++){const dy=y-cy,row=y*n;for(let x=Math.max(0,cx-r);x<=Math.min(n-1,cx+r);x++){const dx=x-cx,d2=dx*dx+dy*dy;if(d2>rr)continue;const i=row+x;if(!air&&d2>9&&(map[i].height||0)>h0)continue;if(!vis[i]){vis[i]=1;cells.push(i);}}}}
 // Remembered objects and their cells, gathered once for every player's knowledge pass below.
 const remembered=[],rememberedCells=[];for(const e of this.entities){if(!REMEMBERED.has(e.kind)||e.pendingSite||e.hp<=0||e.embarkedBy||e.insideMine)continue;remembered.push(e);rememberedCells.push(Math.floor(e.y)*this.n+Math.floor(e.x));}
 for(const p of this.players){for(const ally of this.players)if(ally.id!==p.id&&ally.team===p.team)for(const i of ally.visibleCells)if(!p.visible[i]){p.visible[i]=1;p.visibleCells.push(i);}for(const i of p.visibleCells){const freshCell=!p.explored[i];if(freshCell){p.explored[i]=1;this.noteExplored(p,i);}if(p.visible[i]){const terrainCode=(this.map[i].water?128:0)|this.map[i].height;if(p.knownNav[i]!==this.nav[i]||p.knownTiles[i]!==terrainCode){p.navigationRevision=(p.navigationRevision||0)+1;if(freshCell)p.freshNavBumps=(p.freshNavBumps||0)+1;if(p.knownNav[i]&&!this.nav[i]||p.knownTiles[i]&&p.knownTiles[i]!==terrainCode){this.knownGain??={};this.knownGain[p.id]=(this.knownGain[p.id]||0)+1;}}p.knownNav[i]=this.nav[i];p.knownTiles[i]=terrainCode;}}
 // Re-snapshot remembered objects only when something a player could notice has actually changed.
 // This ran over every tree, resource and building for every player several times a second, and the
 // literal kind array plus the spread clone made it the largest periodic allocation in the tick.
 const pv=p.visible;for(let k=0;k<remembered.length;k++){if(!pv[rememberedCells[k]])continue;const e=remembered[k];
  if(e.kind==='building'&&!this.visible(p.id,e))continue;
  const seen=p.knowledge[e.id];
  if(seen&&seen.hp===e.hp&&seen.progress===e.progress&&seen.amount===e.amount&&seen.owner===e.owner&&seen.type===e.type&&seen.extension===e.extension&&seen.stockpile===e.stockpile&&seen.wallMask===e.wallMask&&seen.x===e.x&&seen.y===e.y){seen.seenAt=this.time;continue;}
  p.knowledge[e.id]={...e,queue:[],ghost:true,seenAt:this.time};
 }
 for(const [id,e] of Object.entries(p.knowledge))if(this.def(e)?.concealedTrap&&this.hostile(p.id,e.owner)||this.visible(p.id,e)&&!this.entity(Number(id)))delete p.knowledge[id];
 }
 }
 // Building collision follows the drawn isometric foundation, with a small walking clearance.
 // The old expanded circle swallowed visible lanes between neighboring buildings.
 rebuildNav(){this.nav=new Uint8Array(this.n*this.n);for(const e of this.entities){if(e.hp<=0||e.pendingSite||this.def(e)?.kind==='trap'||!['building','resource','tree'].includes(e.kind)||e.kind==='resource'&&e.amount<=0)continue;const r=e.size||1;for(let y=Math.max(0,Math.floor(e.y-r));y<=Math.min(this.n-1,Math.floor(e.y+r));y++)for(let x=Math.max(0,Math.floor(e.x-r));x<=Math.min(this.n-1,Math.floor(e.x+r));x++)if(e.kind==='building'?(this.def(e).kind==='wall'?Math.floor(e.x)===x&&Math.floor(e.y)===y:Math.abs(x+.5-e.x)<r*(22*1.6/48)+.10&&Math.abs(y+.5-e.y)<r*(22*1.6/48)+.10):Math.hypot(x+.5-e.x,y+.5-e.y)<r+.45)this.nav[y*this.n+x]=1;if(e.extension){const x=Math.floor(e.x+r+1.2),y=Math.floor(e.y);if(this.tile(x,y))this.nav[y*this.n+x]=1;}}
 this.navVersion++;}
 blocked(x,y,air=false,owner=null,actual=false){const t=this.tile(x,y);if(!t)return true;if(air==='water'){const i=Math.floor(y)*this.n+Math.floor(x),p=this.players[owner];if(p&&!actual){if(!p.explored[i])return false;return !(p.knownTiles[i]&128)||!!p.knownNav[i];}return !t.water||!!this.nav[i];}if(air)return false;const i=Math.floor(y)*this.n+Math.floor(x),gate=this.gatePassable(i,owner);if(owner!==null&&!actual){const p=this.players[owner];if(!p.explored[i])return false;return !!(p.knownTiles[i]&128)||this.rockTerrain(p.knownTiles[i]&127)||!!p.knownNav[i]&&!gate;}return t.water||this.rockTerrain(t.height)||!!this.nav[i]&&!gate;}
 path(u,dest,knownOnly=false,optimisticOnly=false){
 if(![u.x,u.y,dest?.x,dest?.y].every(Number.isFinite))return[];
 const mode=this.movementMode(u);if(mode===true)return[{x:clamp(dest.x,1,this.n-1),y:clamp(dest.y,1,this.n-1)}];
 const n=this.n,count=n*n,p=this.players[u.owner],sx=Math.floor(u.x),sy=Math.floor(u.y),tx=clamp(Math.floor(dest.x),0,n-1),ty=clamp(Math.floor(dest.y),0,n-1),start=sy*n+sx,goal=ty*n+tx,water=mode==='water';
 if(start<0||start>=count||water&&!this.tile(u.x,u.y)?.water)return[];
 // A search that found no step closer to an unreachable goal stays empty while known terrain only
 // loses links (new exploration); stuck movers re-asking every 1.3s would otherwise repeat a
 // whole-map search each time. Any gain in passability, gate change or knowledge reset clears it.
 const stuckKey=!knownOnly&&u.owner+':'+mode+':'+start+':'+goal,stuckStamp=(this.knownGain?.[u.owner]||0)+':'+(this.gateCells?.size||0);if(stuckKey){const memo=this.stuckPaths?.get(stuckKey);if(memo&&memo.stamp===stuckStamp&&memo.explored<=this.exploredCount(p))return[];}
 // The known-only attempt is accepted only if it ends within one cell of dest; skip it when the
 // known-region map shows no cell around the goal can be reached, which would cost a full search.
 if(!knownOnly&&!optimisticOnly&&p.explored[start]&&p.explored[goal]&&(mode!==false||this.knownNear(u,tx,ty))){const known=this.path(u,dest,true);if(known.length&&dist(known.at(-1),dest)<1)return known;}
 const free=i=>(!knownOnly||!!p.explored[i])&&(!p.explored[i]||(water?!!(p.knownTiles[i]&128)&&!p.knownNav[i]:!(p.knownTiles[i]&128)&&!this.rockTerrain(p.knownTiles[i]&127)&&(!p.knownNav[i]||this.gatePassable(i,u.owner))));
 const slope=(a,b)=>water||!p.explored[a]||!p.explored[b]||Math.abs((p.knownTiles[a]&127)-(p.knownTiles[b]&127))<2;
 // A blocked goal can never be expanded. Stop at its nearest walkable ring instead
 // of exhaustively searching every cell before returning that same nearby point.
 let nearest=0;if(!free(goal)){nearest=Infinity;for(let r=1;r<=12;r++){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=n||y>=n)continue;if(free(y*n+x))nearest=Math.min(nearest,Math.hypot(dx,dy));}if(nearest<=r)break;}}
 const revision=p.navigationRevision||0,key=[u.owner,mode,knownOnly,revision,start,goal,optimisticOnly?1:0].join(':');this.pathCache??=new Map();const cached=this.pathCache.get(key);if(cached)return cached.map(q=>({...q}));
 // Generation stamps reuse scratch storage without allocating/clearing whole maps per unit.
 let w=this.pathWorkspace;if(!w||w.count!==count)w=this.pathWorkspace={count,g:new Float64Array(count),parent:new Int32Array(count),seen:new Uint32Array(count),closed:new Uint32Array(count),stamp:0};
 if(++w.stamp>=4294967295){w.seen.fill(0);w.closed.fill(0);w.stamp=1;}const stamp=w.stamp,heap=[],cost=[],push=(i,f)=>{let k=heap.length;heap.push(i);cost.push(f);while(k>0){const j=(k-1)>>1;if(cost[j]<=f)break;heap[k]=heap[j];cost[k]=cost[j];k=j;}heap[k]=i;cost[k]=f;},pop=()=>{const first=heap[0],i=heap.pop(),f=cost.pop();if(heap.length){let k=0;while(k*2+1<heap.length){let j=k*2+1;if(j+1<heap.length&&cost[j+1]<cost[j])j++;if(cost[j]>=f)break;heap[k]=heap[j];cost[k]=cost[j];k=j;}heap[k]=i;cost[k]=f;}return first;};
 const heuristic=(x,y)=>{const a=Math.abs(x-tx),b=Math.abs(y-ty);return Math.max(a,b)+.41421356237*Math.min(a,b);};
 w.g[start]=0;w.seen[start]=stamp;w.parent[start]=-1;push(start,heuristic(sx,sy));let best=start,bestH=Infinity;
 // An unreachable goal used to make the search flood every reachable cell (490,000 on Colossal, up to a
 // second) only to return the reachable cell nearest the goal. The region map proves the goal cannot be
 // entered and bounds that nearest distance from below (its regions may over-connect, never under-connect),
 // so the search stops at the first cell popped at that distance: the same cell the full search keeps,
 // since later cells only replace the best when strictly nearer.
 if(mode===false&&goal!==start&&!this.exhaustivePaths){const R=this.navRegions(u.owner,!knownOnly),from=this.regionsFrom(R,u.x,u.y);if(from.size&&!(free(goal)&&from.has(R.label(goal)))){let hmin=Math.hypot(sx-tx,sy-ty);const reach=i=>from.has(R.label(i));
  for(let r=1;r<=64&&r<hmin;r++){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=n||y>=n)continue;const h=Math.hypot(dx,dy);if(h<hmin&&reach(y*n+x))hmin=h;}}
  if(hmin>64)for(let i=0;i<count;i++){const h=Math.hypot(i%n-tx,((i/n)|0)-ty);if(h<hmin&&reach(i))hmin=h;}
  if(hmin>0&&(!nearest||hmin>nearest))nearest=hmin;}}
 while(heap.length){const i=pop();if(w.closed[i]===stamp)continue;w.closed[i]=stamp;const x=i%n,y=(i/n)|0,h=Math.hypot(x-tx,y-ty);if(h<bestH){best=i;bestH=h;}if(i===goal||nearest>0&&h<=nearest+.0001)break;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=n||yy>=n)continue;const ni=yy*n+xx;if(w.closed[ni]===stamp||!free(ni)||!slope(i,ni))continue;
   if(dx&&dy){const a=i+dx,b=i+dy*n;if(!free(a)||!free(b)||!slope(i,a)||!slope(i,b)||!slope(a,ni)||!slope(b,ni))continue;}
   const g=w.g[i]+(dx&&dy?Math.SQRT2:1);if(w.seen[ni]!==stamp||g<w.g[ni]){w.seen[ni]=stamp;w.g[ni]=g;w.parent[ni]=i;push(ni,g+heuristic(xx,yy));}
  }
 }
 if(best===start&&goal===start&&free(goal))return[{x:dest.x,y:dest.y}];if(stuckKey&&best===start&&goal!==start){this.stuckPaths??=new Map();this.stuckPaths.set(stuckKey,{stamp:stuckStamp,explored:this.exploredCount(p)});while(this.stuckPaths.size>256)this.stuckPaths.delete(this.stuckPaths.keys().next().value);}const route=[];for(let i=best;i!==start&&i>=0&&route.length<count;i=w.parent[i])route.push({x:i%n+.5,y:Math.floor(i/n)+.5});route.reverse();
 this.pathCache.set(key,route);while(this.pathCache.size>128)this.pathCache.delete(this.pathCache.keys().next().value);return route.map(q=>({...q}));
 }
 // Explored-cell count, recounted at most once per tick and vision pass. Cells are only ever
 // un-explored by a full knowledge reset, which this count reveals.
 // The simulation's own writers keep the count current (noteExplored); other writers (campaign reveals,
 // knowledge resets) call forgetExploredCount, and the next read recounts once. Keyed by the array, so a
 // loaded save or replaced array always starts with a fresh count. A full recount on a Colossal map is
 // 490,000 cells, which was costing about 5% of every frame when it ran each tick.
 exploredCount(p){this.exploredCounts??=new WeakMap();const ex=p.explored;let c=this.exploredCounts.get(ex);if(c!==undefined)return c;c=0;for(let i=0;i<ex.length;i++)c+=ex[i]?1:0;this.exploredCounts.set(ex,c);return c;}
 noteExplored(p,i){const c=this.exploredCounts?.get(p.explored);if(c!==undefined)this.exploredCounts.set(p.explored,c+1);const r=this.regionCache?.get(p.id+':false:false');if(r?.pending){r.pending.push(i);if(r.pending.length>this.n*this.n/16)r.pending=null;}}
 forgetExploredCount(p){this.exploredCounts?.delete(p.explored);}
 // Connected regions of a player's known ground terrain, built with exactly path()'s cell,
 // slope and diagonal rules. open=false keeps explored walkable cells only (path()'s knownOnly
 // search); open=true also treats unexplored cells as walkable (its optimistic search). Two cells
 // share a label exactly when path() can link them, so callers can reject an unreachable goal
 // without an exhaustive A* over the whole map. Rebuilt lazily when knowledge or navigation changes.
 navRegions(owner,open=false,exact=false){const p=this.players[owner],n=this.n,count=n*n,ex=p.explored;this.regionCache??=new Map();if(!open)exact=false;
 const explored=this.exploredCount(p);
 // Newly explored cells only remove links from the optimistic map, so its labels stay a safe
 // over-approximation (a different label still proves no route) until known terrain becomes more
 // passable (knownGain), a gate changes, or knowledge is reset.
 const gates=this.gateCells?.size||0,id=owner+':'+open+':'+exact,cached=this.regionCache.get(id),base=((p.navigationRevision||0)-(open?0:p.freshNavBumps||0))+':'+this.navVersion+':'+gates,key=open&&!exact?(this.knownGain?.[owner]||0)+':'+gates:base+':'+explored;if(cached&&cached.key===key&&(!open||exact||cached.explored<=explored))return cached;
 // Explored-only map: newly explored cells can only add walkable cells and links, so the cells logged
 // since the last build are merged into the existing regions instead of re-flooding every cell
 // (490,000 on Colossal, once per player per vision pass while anything explores).
 if(!open&&cached&&cached.base===base&&cached.source===ex&&cached.pending&&cached.explored+cached.pending.length===explored){for(const i of cached.pending)this.absorbRegionCell(cached,p,i);cached.pending=[];cached.explored=explored;cached.key=key;return cached;}
 // h holds the known height, or 255 for an unexplored cell, which never fails the slope test.
 const free=new Uint8Array(count),h=new Uint8Array(count),known=p.knownTiles,nav=p.knownNav;for(let i=0;i<count;i++){if(!ex[i]){free[i]=open?1:0;h[i]=255;continue;}const t=known[i];h[i]=t&127;free[i]=!(t&128)&&!this.rockTerrain(t&127)&&(!nav[i]||this.gatePassable(i,owner))?1:0;}
 const slope=(a,b)=>{const ha=h[a],hb=h[b];return ha===255||hb===255||(ha>hb?ha-hb:hb-ha)<2;},labels=new Int32Array(count),stack=new Int32Array(count);
 // labels[i] is 0 for a blocked cell, otherwise 1 + the index of a cell in the same region; following
 // it reaches the region's root (labels[r]===r+1). label(i) returns that root's value, so two cells
 // share a label exactly when path() can link them.
 for(let s=0;s<count;s++){if(!free[s]||labels[s])continue;labels[s]=s+1;let top=0;stack[top++]=s;while(top){const i=stack[--top],x=i%n,y=(i/n)|0;
  for(let dy=-1;dy<=1;dy++){const yy=y+dy;if(yy<0||yy>=n)continue;for(let dx=-1;dx<=1;dx++){const xx=x+dx;if(!dx&&!dy||xx<0||xx>=n)continue;const ni=yy*n+xx;if(labels[ni]||!free[ni]||!slope(i,ni))continue;
   if(dx&&dy){const a=i+dx,b=i+dy*n;if(!free[a]||!free[b]||!slope(i,a)||!slope(i,b)||!slope(a,ni)||!slope(b,ni))continue;}labels[ni]=s+1;stack[top++]=ni;}}}}
 const label=i=>{let r=labels[i];if(!r)return 0;r--;while(labels[r]!==r+1)r=labels[r]-1;let c=i;while(labels[c]!==r+1){const next=labels[c]-1;labels[c]=r+1;c=next;}return r+1;};
 const regions={key,base,labels,free,h,slope,n,explored,label,source:ex,pending:open?null:[]};this.regionCache.set(id,regions);return regions;}
 // Adds one newly explored cell to an explored-only region map: its own links, and diagonal links
 // between its neighbours that it opens as a corner cell. All of those lie in its 3x3 block.
 absorbRegionCell(regions,p,c){const {labels,free,h,slope,n,label}=regions,t=p.knownTiles[c];h[c]=t&127;free[c]=!(t&128)&&!this.rockTerrain(t&127)&&(!p.knownNav[c]||this.gatePassable(c,p.id))?1:0;if(!free[c])return;labels[c]=c+1;
  const cx=c%n,cy=(c/n)|0,inBlock=i=>Math.abs(i%n-cx)<=1&&Math.abs(((i/n)|0)-cy)<=1;
  for(let ay=cy-1;ay<=cy+1;ay++)for(let ax=cx-1;ax<=cx+1;ax++){if(ax<0||ay<0||ax>=n||ay>=n)continue;const a=ay*n+ax;if(!free[a])continue;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const bx=ax+dx,by=ay+dy;if(bx<0||by<0||bx>=n||by>=n)continue;const b=by*n+bx;if(b<a&&inBlock(b)||!free[b]||!inBlock(b)||!slope(a,b))continue;
    if(dx&&dy){const k=a+dx,m=a+dy*n;if(!free[k]||!free[m]||!slope(a,k)||!slope(a,m)||!slope(k,b)||!slope(m,b))continue;}const ra=label(a),rb=label(b);if(ra!==rb)labels[rb-1]=ra;}}}
 // Labels path() can enter from (x,y). The start cell is expanded even when it is not itself walkable.
 regionsFrom(regions,x,y){const {free,slope,n,label}=regions,sx=Math.floor(x),sy=Math.floor(y),i=sy*n+sx,out=new Set();if(sx<0||sy<0||sx>=n||sy>=n)return out;if(label(i))out.add(label(i));
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=sx+dx,yy=sy+dy;if(xx<0||yy<0||xx>=n||yy>=n)continue;const ni=yy*n+xx;if(!label(ni)||!slope(i,ni))continue;if(dx&&dy){const a=i+dx,b=i+dy*n;if(!free[a]||!free[b]||!slope(i,a)||!slope(i,b)||!slope(a,ni)||!slope(b,ni))continue;}out.add(label(ni));}return out;}
 // Whether path(u,..,true) could end in the 3x3 block around goal cell (tx,ty): the only cells within
 // one unit of a destination inside that cell.
 knownNear(u,tx,ty){const n=this.n,sx=Math.floor(u.x),sy=Math.floor(u.y);if(Math.abs(sx-tx)<=1&&Math.abs(sy-ty)<=1)return true;const regions=this.navRegions(u.owner,false),from=this.regionsFrom(regions,u.x,u.y);if(!from.size)return false;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=tx+dx,y=ty+dy;if(x>=0&&y>=0&&x<n&&y<n&&from.has(regions.label(y*n+x)))return true;}return false;}
 // Whether a ground unit has a route to q through explored terrain only: the question the AI's
 // supply checks asked with a full path() call. Non-ground movers, and a mover on an unexplored
 // cell (which skips the known-only search), keep the original search.
 knownRoute(u,q){const search=()=>{const route=this.path(u,q),p=this.players[u.owner];return dist(route.at(-1)||u,q)<2&&route.every(v=>p.explored[Math.floor(v.y)*this.n+Math.floor(v.x)]);};if(this.movementMode(u)!==false||!this.players[u.owner].explored[Math.floor(u.y)*this.n+Math.floor(u.x)])return search();
 // q reachable on known ground: true. No known-reachable cell in the 3x3 around q (the only cells within
 // two units of it): false. Otherwise a neighbour is reachable but q is not. If q is reachable through
 // unexplored ground the old search ended there (false). If not, it ended at the reachable cell nearest
 // q, by the shortest optimistic route, and the answer was whether that route stayed on explored
 // ground; a directed optimistic-only search to that cell reproduces it without two whole-map scans.
 const n=this.n,qx=Math.floor(q.x),qy=Math.floor(q.y);if(qx===Math.floor(u.x)&&qy===Math.floor(u.y))return search();if(qx<0||qy<0||qx>=n||qy>=n)return search();
 const regions=this.navRegions(u.owner,false),from=this.regionsFrom(regions,u.x,u.y),label=regions.label(qy*n+qx);if(label&&from.has(label))return true;
 // A cell next to q is reachable on known ground: a known route ends within two units of q, which is
 // what the question asks. (The old full search could answer no here only when its shortest route
 // happened to cut through unexplored ground; on Colossal that search cost up to half a second.)
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=qx+dx,y=qy+dy;if(x>=0&&y>=0&&x<n&&y<n&&from.has(regions.label(y*n+x)))return true;}return false;}
 approach(u,target,range=1){const r=(target.size||.4)+range;let best=null,bestD=Infinity;for(let i=0;i<16;i++){let a=i*Math.PI/8,p={x:Math.floor(target.x+Math.cos(a)*r)+.5,y:Math.floor(target.y+Math.sin(a)*r)+.5};if(!this.blocked(p.x,p.y,this.movementMode(u),u.owner)&&dist(u,p)<bestD){best=p;bestD=dist(u,p);}}return best||{x:target.x,y:target.y};}
 // Choose a reachable cell immediately at the deposit edge, not a building-sized work radius.
 // The chosen edge is reused for up to 2s while the worker is still more than 3 tiles away, so a
 // walking gatherer does not repeat its route searches every tick; near the deposit it re-chooses.
 // Kept in a WeakMap so it never enters saves; hypothetical copies of a worker never hit it.
 gatherSpot(u,t){const cached=this.gatherCache?.get(u)||u.gatherPosition;if(cached&&cached.target===t.id&&dist(u,cached)>3&&cached.nav===this.navVersion&&this.time<cached.until&&!this.blocked(cached.x,cached.y,false,u.owner))return cached;let best=null,score=Infinity;const candidates=[];const radius=this.nodeReach(t);
 for(let y=Math.floor(t.y-radius);y<=Math.floor(t.y+radius);y++)for(let x=Math.floor(t.x-radius);x<=Math.floor(t.x+radius);x++){
 const p={x:x+.5,y:y+.5},centerDistance=dist(p,t);if(centerDistance>radius+.3||this.blocked(p.x,p.y,false,u.owner))continue;
 // Move within the walkable edge cell so small deposits do not require a distant full-cell gap.
 const inset=Math.min(.3,Math.max(0,centerDistance-t.size-.55));p.x+=(t.x-p.x)/centerDistance*inset;p.y+=(t.y-p.y)/centerDistance*inset;const edge=dist(p,t);if(edge>radius-.14||this.blocked(p.x,p.y,false,u.owner))continue;
 const occupied=this.entitiesByKind('unit').some(v=>v!==u&&v.kind==='unit'&&v.hp>0&&dist(v,p)<.5);
 const cost=dist(u,p)+edge*.5+(occupied?1.5:0);candidates.push({point:p,cost});if(cost<score){best=p;score=cost;}}
 // Dense deposits can make the nearest working edge unreachable. Choose a
 // reachable edge instead of repeatedly walking toward a sealed pocket.
 const ground=candidates.length&&this.movementMode(u)===false?(()=>{const regions=this.navRegions(u.owner,true);return{regions,from:this.regionsFrom(regions,u.x,u.y)};})():null;
 for(const {point}of candidates.sort((a,b)=>a.cost-b.cost)){
  if(this.cliffBetween(point.x,point.y,t.x,t.y))continue;
  // A goal in another region of the optimistic map cannot be reached; skip its whole-map search.
  if(ground){const r=ground.regions.label(Math.floor(point.y)*this.n+Math.floor(point.x));if(!r||!ground.from.has(r))continue;}
  const route=this.path(u,point),end=route.at(-1)||u;
  if(Math.floor(end.x)===Math.floor(point.x)&&Math.floor(end.y)===Math.floor(point.y)){(this.gatherCache??=new WeakMap()).set(u,{x:point.x,y:point.y,target:t.id,nav:this.navVersion,until:this.time+2});return point;}
 }
 return null;}
 order(ids,order){this.gatherIndex=null;const list=ids.map(id=>this.entity(id)).filter(e=>e?.kind==='unit');const facing=order.face??(list.length?Math.atan2((order.y??list[0].y)-list[0].y,(order.x??list[0].x)-list[0].x):0),slots=['move','attackMove','patrol'].includes(order.kind)?this.formationLayout(list,order.formation||'line',order,facing):[];const target=order.target?this.entity(order.target):null;
 list.forEach((u,i)=>{const d=this.def(u);if(['build','gather','repair','returnCargo'].includes(order.kind)&&!d.worker)return;if(order.kind==='gather'&&(!target||target.kind!=='resource'||!this.visible(u.owner,target)))return;if(order.kind==='attack'&&(!target||!this.visible(u.owner,target)||!this.hostile(u.owner,target.owner)))return;
 const continuingStrike=u.windup&&(['attackMove','patrol','hold'].includes(order.kind)||order.kind==='attack'&&order.target===u.windup.target)?u.windup:null;
 u.order=order.kind==='stop'?null:{...order};if(order.kind==='hold')u.stance='hold';if(['attack','attackMove','stop'].includes(order.kind))u.stance='normal';if(order.kind==='attack'&&target)u.order.lastSeen={x:target.x,y:target.y};u.path=[];u.destination=null;u.attackTarget=null;u.windup=continuingStrike;u.stuck=0;
 if(['move','attackMove','patrol'].includes(order.kind)){const slot=slots.find(s=>s.unit.id===u.id);u.order.x=clamp(slot?.x??order.x,1,this.n-1);u.order.y=clamp(slot?.y??order.y,1,this.n-1);u.order.face=slot?.face??facing;u.order.origin={x:u.x,y:u.y};}
 if(['stop','hold'].includes(order.kind))u.action='idle';});}
 formationLayout(units,kind,center,facing=0){const t=root.FractureTactics||(typeof require!=='undefined'?require('./tactics.js'):null);return t.layout(units.filter(u=>u.hp>0),kind,center,facing,u=>this.formationRank(u),u=>this.def(u));}
 formationRank(u){const r=this.def(u).role;if(r==='worker')return 4;return ['tank','melee','heavy','giant'].includes(r)?0:['rifle','aa','elite'].includes(r)?1:r==='siege'?3:2;}
 go(u,p,dt,near=.25){if(dist(u,p)<Math.max(.12,near)){u.path=[];u.destination=null;return true;}if(!u.destination||dist(u.destination,p)>.8||u.pathVersion!==this.navVersion||(!u.path.length&&this.time>=(u.nextPathAt||0))){u.nextPathAt=this.time+1.3;u.path=this.path(u,p);u.destination={...p};u.pathVersion=this.navVersion;}
 while(u.path.length>1&&dist(u,u.path[0])<.12)u.path.shift();const v=u.path[0];if(!v){if(dist(u,p)<2.6&&this.blocked(p.x,p.y,this.movementMode(u),u.owner)){u.destination=null;u.stuck=0;return true;}u.stuck+=dt;return false;}const d=dist(u,v),ud=this.def(u),speed=ud.speed*(this.height(v.x,v.y)>this.height(u.x,u.y)?.85:1),step=Math.min(d,speed*dt),nx=u.x+(v.x-u.x)/Math.max(.001,d)*step,ny=u.y+(v.y-u.y)/Math.max(.001,d)*step;
 if(!this.canTraverse(u.x,u.y,nx,ny,this.movementMode(u),u.owner,true)){const i=Math.floor(ny)*this.n+Math.floor(nx),p=this.players[u.owner];const tile=this.map[i];if(!tile||nx<0||ny<0||nx>=this.n||ny>=this.n){u.path=[];u.destination=null;u.pathVersion=-1;u.stuck+=dt;return false;}const freshCell=!p.explored[i];if(freshCell){p.explored[i]=1;this.noteExplored(p,i);}const terrainCode=(tile.water?128:0)|tile.height;if(p.knownNav[i]!==this.nav[i]||p.knownTiles[i]!==terrainCode){p.navigationRevision=(p.navigationRevision||0)+1;if(freshCell)p.freshNavBumps=(p.freshNavBumps||0)+1;if(p.knownNav[i]&&!this.nav[i]||p.knownTiles[i]&&p.knownTiles[i]!==terrainCode){this.knownGain??={};this.knownGain[p.id]=(this.knownGain[p.id]||0)+1;}}p.knownNav[i]=this.nav[i];p.knownTiles[i]=terrainCode;u.path=[];u.pathVersion=-1;u.stuck+=dt;
  // If stuck for too long, nudge the unit to the nearest unblocked tile
  if(u.stuck>3&&!this.def(u).air){const spot=this.approach(u,u,2);if(spot&&!this.blocked(spot.x,spot.y,false,u.owner,true)&&dist(u,spot)>0.3){u.x=spot.x;u.y=spot.y;u.path=[];u.pathVersion=-1;u.stuck=0;}}
  return false;}const dx=nx-u.x,dy=ny-u.y;u.face=Math.atan2(dy,dx);u.x=nx;u.y=ny;u.action='walk';u.phase+=dt*speed*(ud.air||['tank','siege'].includes(ud.role)?5:9);u.stuck=0;if(d<.13||step>=d)u.path.shift();return dist(u,p)<Math.max(.12,near);}
 detectable(owner,t){if(t.owner===undefined||!this.hostile(owner,t.owner)||!this.def(t)?.stealth)return true;return this.entities.some(v=>v.owner!==undefined&&!this.hostile(owner,v.owner)&&v.hp>0&&(this.def(v)?.detector||this.def(v)?.kind==='defense'||v.scanUntil>this.time)&&dist(v,t)<(v.scanUntil>this.time?13:7));}
 range(u){const d=this.def(u),p=this.players[u.owner];return (d.range||0)*(p.tech.includes(d.building+'_specialization')&&D.research[d.building+'_specialization']?.kind==='range'?1.15:1);}
 // The arrival point must be inside weapon reach, not a rounded ring outside it.
 attackReach(u,t){const d=this.def(u);return this.range(u)+(t.size||.35)+(this.height(u.x,u.y)>this.height(t.x,t.y)?d.range*.08:0);}
 attackSpot(u,t){const r=Math.max(.1,this.attackReach(u,t)-.12),air=!!this.def(u).air,mode=this.movementMode(u);if(air){const a=Math.atan2(u.y-t.y,u.x-t.x);return{x:t.x+Math.cos(a)*r,y:t.y+Math.sin(a)*r};}let best=null,score=Infinity;
 for(let y=Math.max(0,Math.floor(t.y-r-.4));y<=Math.min(this.n-1,Math.floor(t.y+r+.4));y++)for(let x=Math.max(0,Math.floor(t.x-r-.4));x<=Math.min(this.n-1,Math.floor(t.x+r+.4));x++){const q={x:x+.5,y:y+.5};if(this.blocked(q.x,q.y,mode,u.owner))continue;const dd=dist(q,t),inset=Math.min(.35,Math.max(0,dd-r+.04));if(dd>0){q.x+=(t.x-q.x)/dd*inset;q.y+=(t.y-q.y)/dd*inset;}if(dist(q,t)>r||dist(q,t)<(this.def(u).minRange||0)+(t.size||.35)||this.blocked(q.x,q.y,mode,u.owner))continue;const travel=dist(u,q);if(travel<score){score=travel;best=q;}}
 return best||this.approach(u,t,Math.max(.65,this.range(u)-.8));}
 canTarget(u,t){const d=this.def(u),td=this.def(t);if(t.embarkedBy||t.insideMine||t.pendingSite||t.campaignImmune||t.campaignLocked||!this.hostile(u.owner,t.owner)||t.hp<=0||!this.visible(u.owner,t))return false;if(td?.air&&!d.aa)return false;if(d.airOnly&&!td?.air)return false;if(!this.detectable(u.owner,t))return false;return true;}
 // Bucketed index over the combat entities, rebuilt once per tick. Target search used to scan every
 // unit and building for every unit on every tick, which dominated the whole simulation in big fights.
 combatGrid(){
  const list=this.combatEntities();
  if(this.gridList===list&&this.gridTime===this.time&&this.gridCount===list.length)return this.grid;
  const cell=8,map=new Map();
  for(let i=0;i<list.length;i++){const e=list[i];if(e.hp<=0)continue;
   const k=Math.floor(e.x/cell)+','+Math.floor(e.y/cell);let b=map.get(k);if(!b)map.set(k,b=[]);b.push(i);}
  this.grid={cell,map,list};this.gridList=list;this.gridTime=this.time;this.gridCount=list.length;
  return this.grid;
 }
 // Same winner as a full scan: the lowest score, ties broken by the entity's position in the list,
 // so the result does not depend on the order the buckets are visited.
 nearestEnemy(u,r){
  const {cell,map,list}=this.combatGrid();let best=null,bv=Infinity,bi=Infinity;
  const reach=r+10,x0=Math.floor((u.x-reach)/cell),x1=Math.floor((u.x+reach)/cell),y0=Math.floor((u.y-reach)/cell),y1=Math.floor((u.y+reach)/cell);
  for(let cx=x0;cx<=x1;cx++)for(let cy=y0;cy<=y1;cy++){
   const bucket=map.get(cx+','+cy);if(!bucket)continue;
   for(const i of bucket){const e=list[i];
    if(e.kind!=='unit'&&e.kind!=='building')continue;
    if(e.hp<=0)continue;
    const dd=dist(u,e);if(dd>r+(e.size||0))continue;
    const v=dd+(e.kind==='building'?3:0);if(v>bv||(v===bv&&i>bi))continue;
    if(!this.canTarget(u,e))continue;
    bv=v;bi=i;best=e;}
  }
  return best;}
 strike(u,target){const d=this.def(u),td=this.def(target),p=this.players[u.owner];const baseDamage=d.damage*(u.focusUntil>this.time?1.18:1)*(1+.12*p.tech.filter(t=>D.research[t]?.kind==='weapons').length);let damage=baseDamage;const C=root.FractureCombat||(typeof require!=='undefined'?require('./combat.js'):null);damage*=C.multiplier(d,td,target.kind==='building');if(this.height(u.x,u.y)>this.height(target.x,target.y))damage*=1.1;
 const P=root.FractureProjectiles||(typeof require!=='undefined'?require('./projectiles.js'):null),shot=P.profile(d,D.factions[p.faction]);
 if(d.bomber){u.bombs=(u.bombs??2)-1;if(u.bombs<=0)u.returning=true;}if(shot.kind==='melee'){this.damage(target,damage,u);this.effects.push({kind:'slash',x:target.x,y:target.y,time:.25,max:.25,face:u.face});}else{const burst=(d.role==='heavy'||/Gunner|Gunship/.test(d.name))&&['bullet','pulse'].includes(shot.kind)?3:1;const flightTime=Math.max(shot.kind==='bomb'?.65:.1,dist(u,target)/shot.speed);for(let b=0;b<burst;b++)this.projectiles.push({x:u.x,y:u.y,fromX:u.x,fromY:u.y,toX:target.x,toY:target.y,target:target.id,source:u.id,owner:u.owner,damage:damage/burst,baseDamage:baseDamage/burst,attackerType:u.type,launchHeight:this.height(u.x,u.y),targetAir:!!td.air,splash:d.splash||0,weapon:shot.kind,shot,face:u.face,flight:flightTime,elapsed:-b*.08,air:!!d.air});}

 }
 damage(e,value,source){if(e.hp<=0||e.pendingSite||e.campaignImmune||e.campaignLocked)return;const d=this.def(e),p=this.players[e.owner],armor=(d.armor||0)+(e.bracedUntil>this.time?5:0)+p.tech.filter(t=>D.research[t]?.kind==='armor').length*2;if(e.campaignEmperor&&campaignAPI().emperorDamage(this,e,Math.max(1,value-armor)))return;e.hp-=Math.max(1,value-armor);e.hitAt=this.time;if(e.owner===0&&source?.owner!==undefined&&this.hostile(e.owner,source.owner)&&this.time>=(this.nextAttackAlert||0)){this.nextAttackAlert=this.time+10;this.audioEvents||=[];this.audioEvents.push({kind:e.kind==='building'?'baseAttack':'underAttack',x:e.x,y:e.y,time:this.time});if(this.audioEvents.length>16)this.audioEvents.shift();this.say(e.kind==='building'?'Our base is under attack!':'Our forces are under attack!',0);}e.hitFace=source&&Number.isFinite(source.x)?Math.atan2(e.y-source.y,e.x-source.x):e.face||0;if(e.hp>0)return;
 if(e.kind==='unit'){p.lost++;this.effects.push({kind:'corpse',type:e.type,x:e.x,y:e.y,owner:e.owner,face:e.face,time:10,max:10});if(source&&this.hostile(source.owner,e.owner)){const k=this.players[source.owner];k.kills++;if(D.factions[k.faction].counter&&d.biological&&!d.reconstructed&&!e.summoned)k.special++;}}
 if(e.kind==='building'){this.effects.push({kind:'ruin',type:e.type,owner:e.owner,campaignFaction:e.campaignFaction,variant:e.id%3,x:e.x,y:e.y,time:15,max:15});this.rebuildNav();}if(e.owner===0)this.say(d.name+' lost.',0);
 }
 // Each resource is delivered only to its own collector or deep mine; the headquarters also takes Ore.
 acceptsResource(b,resource){if(!b||b.kind!=='building'||b.hp<=0||b.progress<1||b.pendingSite)return false;const d=this.def(b);if(!d)return false;if(d.kind==='hq')return resource===0;return(d.kind==='extractor'||d.kind==='deepMine')&&d.resource===D.resources[resource];}
 collectionPoint(u,resource=u.carryType){
 const cache=u.collectionRoute,revision=this.navVersion;
 if(cache&&cache.until>this.time&&cache.revision===revision&&cache.resource===resource){const b=this.entity(cache.id);if(this.acceptsResource(b,resource))return b;}
 const drops=this.entitiesByKind('building').filter(e=>e.owner===u.owner&&this.acceptsResource(e,resource)).sort((a,b)=>dist(u,a)-dist(u,b));
 for(const b of drops){const q=this.approach(u,b,1),route=this.path(u,q);if(dist(route.at(-1)||u,b)<b.size+1.8){u.collectionRoute={id:b.id,until:this.time+8,revision,resource};return b;}}
 u.collectionRoute=null;return null;
 }
 // A collector stands on a deposit node of its own resource: the nearest one within reach of (x,y).
 collectorSite(type,owner,x,y,actual=false){const d=D.buildings[type];if(d?.kind!=='extractor')return null;let best=null,bestD=1.6;const nodes=new Map();if(actual){for(const e of this.entities)if(e.kind==='resource')nodes.set(e.id,e);}else{for(const e of Object.values(this.players[owner]?.knowledge||{}))if(e.kind==='resource')nodes.set(e.id,e);for(const e of this.entities)if(e.kind==='resource'&&this.visible(owner,e))nodes.set(e.id,e);}for(const e of nodes.values()){if(e.hp<=0||D.resources[e.resource]!==d.resource)continue;const r=dist(e,{x,y});if(r<bestD){bestD=r;best=e;}}if(!best)return null;
  // The collector stands on its deposit. When the deposit is at a cliff, wall or unexplored edge, the
  // footprint may shift up to one tile so the deposit stays under the building; the nearest legal spot
  // wins, and with none the deposit's centre is returned so placement reports the real reason.
  const key=type+':'+owner+':'+best.id+':'+actual+':'+this.navVersion+':'+this.exploredCount(this.players[owner])+':'+Math.floor(this.time*2);this.collectorSites??=new Map();const memo=this.collectorSites.get(key);if(memo)return memo;
  let site={x:best.x,y:best.y,id:best.id};const offsets=[];for(let oy=-1;oy<=1;oy+=.5)for(let ox=-1;ox<=1;ox+=.5)offsets.push([ox,oy]);offsets.sort((a,b)=>Math.hypot(...a)-Math.hypot(...b));
  for(const [ox,oy] of offsets){const qx=best.x+ox,qy=best.y+oy;if(this.constructionTerrain(owner,qx,qy,d.size,actual)||this.constructionObstruction(this.constructionBlockers(owner,qx,qy,d.size,null,actual,type)))continue;site={x:qx,y:qy,id:best.id};break;}
  this.collectorSites.set(key,site);while(this.collectorSites.size>64)this.collectorSites.delete(this.collectorSites.keys().next().value);return site;}
 // A collector built over a deposit node is worked from the building's edge, so the reach grows by its footprint.
 nodeReach(t){let extra=0;for(const b of this.entitiesByKind('building')){if(b.hp<=0||this.def(b)?.kind!=='extractor'&&this.def(b)?.kind!=='deepMine')continue;const o=Math.max(Math.abs(b.x-t.x),Math.abs(b.y-t.y));if(o<1.05)extra=Math.max(extra,1.1+o);}return t.size+.95+extra;}
 // Gatherers per (owner, deposit), indexed once per tick: every gathering worker asks this each tick,
 // and a scan of every unit per question was quadratic on large maps.
 gatherers(owner,nodeId){if(this.gatherIndexAt!==this.time||!this.gatherIndex){this.gatherIndex=new Map();this.gatherIndexAt=this.time;for(const v of this.entitiesByKind('unit'))if(v.hp>0&&v.order?.kind==='gather'){const k=v.owner+':'+v.order.target;let list=this.gatherIndex.get(k);if(!list)this.gatherIndex.set(k,list=[]);list.push(v);}}return this.gatherIndex.get(owner+':'+nodeId)||[];}
 nodeLoad(u,node){let n=0;for(const v of this.gatherers(u.owner,node.id))if(v!==u&&v.hp>0&&v.order?.kind==='gather'&&v.order.target===node.id)n++;return n;}
 nodeRank(u,node){let n=0;for(const v of this.gatherers(u.owner,node.id))if(v!==u&&v.id<u.id&&v.hp>0&&v.order?.kind==='gather'&&v.order.target===node.id)n++;return n;}
 collectorName(resource){return D.factions[this.players[0]?.faction]?.buildings.find(b=>b.kind==='extractor'&&b.resource===D.resources[resource])?.name||'a collector';}
 dropReason(resource){const d=D.factions[this.players[0]?.faction]?.buildings.find(b=>b.kind==='extractor'&&b.resource===D.resources[resource]);return'Needs a reachable '+(d?.name||'collector')+(resource===0?' or headquarters':'')+' to deliver this.';}
 tickWorker(u,dt){const p=this.players[u.owner],o=u.order,d=this.def(u);if(!o)return false;let t=this.entity(o.target);if(o.kind==='returnCargo'){if(!u.carry){u.order=null;return true;}const drop=this.collectionPoint(u,u.carryType);if(!drop){u.blockReason=this.dropReason(u.carryType);return true;}if(dist(u,drop)<drop.size+1.8){p.stock[u.carryType]+=u.carry;p.gathered[u.carryType]+=u.carry;u.carry=0;u.path=[];u.destination=null;u.order=null;}else this.go(u,this.approach(u,drop,1),dt,.05);return true;}if(o.kind==='gather'){
 // At most NODE_WORKERS gatherers work one deposit node; the lowest ids keep their place and the rest
 // move to the nearest node of the same resource that still has room.
 if(t&&t.amount>0&&this.nodeRank(u,t)>=Game.NODE_WORKERS){const alt=this.entitiesByKind('resource').filter(e=>e.resource===t.resource&&e.amount>0&&e.id!==t.id&&dist(e,t)<10&&this.visible(u.owner,e)&&this.nodeLoad(u,e)<Game.NODE_WORKERS).sort((a,b)=>dist(u,a)-dist(u,b))[0];if(alt){o.target=alt.id;t=alt;this.gatherIndex=null;}else{if(u.carry>0){o.kind='returnCargo';return true;}u.action='idle';u.blockReason='Every nearby deposit already has '+Game.NODE_WORKERS+' workers.';return true;}}
 if(!t||t.amount<=0){const resource=t?.resource??u.carryType;const next=this.entities.filter(e=>e.kind==='resource'&&e.resource===resource&&e.amount>0&&this.visible(u.owner,e)).sort((a,b)=>dist(u,a)-dist(u,b)).find(n=>{const q=this.approach(u,n,.7);return dist(this.path(u,q).at(-1)||u,q)<2;});if(next){o.target=next.id;t=next;this.gatherIndex=null;}else if(!u.carry){u.order=null;return true;}}
 const drop=this.collectionPoint(u,u.carry>0?u.carryType:t?.resource??u.carryType);
 if(u.carry>=12*Math.max(1,this.aiEconomicRate(u.owner,'gather'))||!t||t.amount<=0||u.carry>0&&t.resource!==u.carryType){if(!drop){u.action='idle';u.blockReason=this.dropReason(u.carryType);return true;}if(dist(u,drop)<drop.size+1.8){p.stock[u.carryType]+=u.carry;p.gathered[u.carryType]+=u.carry;u.carry=0;u.destination=null;u.path=[];}else this.go(u,this.approach(u,drop,1),dt,.05);return true;}
 // Only Ore can be gathered without its own collector (the headquarters takes it); other resources wait
 // for a reachable collector of their kind instead of being dug up with nowhere to go.
 if(t.resource!==0&&!u.carry&&!drop){u.action='idle';u.blockReason='Build '+this.collectorName(t.resource)+' first: only Ore can be gathered without its own collector.';return true;}
 if(t.resource===1&&!this.entitiesByKind('building').some(e=>e.kind==='building'&&e.owner===u.owner&&e.progress>=1&&this.def(e).resource==='oil'&&dist(e,t)<6)){u.action='idle';u.blockReason='An extraction well must be completed beside this oil deposit.';return true;}u.blockReason=null;
 if(dist(u,t)<this.nodeReach(t)&&!this.cliffBetween(u.x,u.y,t.x,t.y)){u.action=t.resource===1?'gatherOil':'gather';u.face=Math.atan2(t.y-u.y,t.x-u.x);u.phase+=dt*5;const amount=Math.min(t.amount,dt*1.5*this.aiEconomicRate(u.owner,'gather')*(p.tech.includes(p.faction+'_economy')?1.3:1));u.carry+=amount;u.carryType=t.resource;t.amount-=amount;if(t.amount<=0){t.amount=0;t.exhausted=true;this.rebuildNav();}}else {const spot=this.gatherSpot(u,t);if(spot)this.go(u,spot,dt,.15);else{u.action='idle';u.blockReason='No accessible working edge on this deposit.';}}return true;
 }
 if(['build','repair'].includes(o.kind)){if(!t||t.owner!==u.owner){u.order=null;return true;}if(dist(u,t)>t.size+1.8){this.go(u,this.approach(u,t,1),dt);if(t.pendingSite){if(!o.sitePosition||dist(u,o.sitePosition)>.25){o.sitePosition={x:u.x,y:u.y};t.siteProgressAt=this.time;}else if(this.time-(t.siteProgressAt??this.time)>30)this.refundConstructionSite(t,'Workers could not reach the site');}return true;}if(t.pendingSite&&!this.startConstructionSite(t))return true;u.action='build';u.face=Math.atan2(t.y-u.y,t.x-u.x);u.phase+=dt*5;if(t.progress<1){const inc=dt/this.def(t).time*this.aiEconomicRate(u.owner,'production');t.progress=Math.min(1,t.progress+inc);t.hp=Math.min(t.maxHp,t.hp+t.maxHp*.85*inc);}else if(o.kind==='repair'&&t.hp<t.maxHp){if(p.stock[0]>=dt){p.stock[0]-=dt;t.hp=Math.min(t.maxHp,t.hp+dt*12);}}else{const next=this.entitiesByKind('building').filter(e=>e.kind==='building'&&e.owner===u.owner&&e.progress<1&&e.hp>0&&this.visible(u.owner,e)).sort((a,b)=>dist(u,a)-dist(u,b))[0];u.order=next?{kind:'build',target:next.id}:null;u.action='idle';}return true;}return false;
 }
 tickUnit(u,dt){if(u.embarkedBy||u.insideMine)return;const d=this.def(u),p=this.players[u.owner];u.action='idle';u.cooldown=Math.max(0,u.cooldown-dt);u.abilityCooldown=Math.max(0,(u.abilityCooldown||0)-dt);
 if(u.windup){const tracked=this.entity(u.windup.target);if(tracked)u.face=Math.atan2(tracked.y-u.y,tracked.x-u.x);u.action='attack';u.windup.time-=dt;if(!u.windup.fired&&u.windup.time<.24){const t=this.entity(u.windup.target);if(t&&this.canTarget(u,t)&&dist(u,t)<=this.attackReach(u,t)+1&&(!d.minRange||dist(u,t)>=d.minRange+(t.size||.35)))this.strike(u,t);u.windup.fired=true;}if(u.windup.time<=0)u.windup=null;return;}
 if(d.air&&this.tickAviation(u,dt))return;
 if(d.worker&&this.tickWorker(u,dt))return;
 if(d.heal){const t=this.entitiesByKind('unit').filter(e=>e.kind==='unit'&&e.owner===u.owner&&e.hp>0&&e.hp<e.maxHp&&dist(u,e)<5).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(t){t.hp=Math.min(t.maxHp,t.hp+(d.heal+(p.tech.includes(p.faction+'_healing')?4:0))*dt);u.action='heal';u.face=Math.atan2(t.y-u.y,t.x-u.x);return;}}
 let o=u.order,enemy=null;if(d.damage>0&&o?.kind==='attack'){const t=this.entity(o.target);if(t&&this.canTarget(u,t)){enemy=t;o.lastSeen={x:t.x,y:t.y};}else{u.order=o.lastSeen?{kind:'attackMove',...o.lastSeen}:null;o=u.order;}}
 if(d.damage>0&&!d.worker&&!['move'].includes(o?.kind))enemy=enemy||this.nearestEnemy(u,(o?.kind==='hold'||u.stance==='hold')?this.range(u):Math.max(7,this.range(u)));
 if(enemy){u.combatReadyAt=this.time;u.face=Math.atan2(enemy.y-u.y,enemy.x-u.x);const range=this.attackReach(u,enemy);if(dist(u,enemy)<=range&&(!d.minRange||dist(u,enemy)>=d.minRange+(enemy.size||.35))){u.path=[];u.action='ready';if(u.cooldown<=0){u.windup={target:enemy.id,time:.65,fired:false};u.cooldown=d.cooldown;u.action='attack';}}else if(o?.kind!=='hold'&&u.stance!=='hold')this.go(u,this.attackSpot(u,enemy),dt,.05);return;}
 if(o&&['move','attackMove','patrol'].includes(o.kind)){if(this.go(u,o,dt,.2)){if(o.kind==='patrol'){const origin=o.origin;o.origin={x:o.x,y:o.y};o.x=origin.x;o.y=origin.y;}else {if(o.face!==undefined)u.face=o.face;u.order=null;}}}
 // Reject on the bounding box before the square root: this ran over every finished building for every
 // machine and symbiote unit on every tick.
 const nearOwnBuilding=()=>{for(const e of this.entitiesByKind('building')){
  if(e.owner!==u.owner||e.progress<1||e.kind!=='building')continue;
  if(e.x-u.x>6||u.x-e.x>6||e.y-u.y>6||u.y-e.y>6)continue;
  if(dist(e,u)<6)return true;}return false;};
 if(D.factions[p.faction].style==='machine'&&u.hp<u.maxHp&&p.stock[0]>dt*.2&&nearOwnBuilding()){u.hp=Math.min(u.maxHp,u.hp+dt*1.2);p.stock[0]-=dt*.2;}
 if(p.faction==='symbiotes'&&u.hp<u.maxHp&&nearOwnBuilding())u.hp=Math.min(u.maxHp,u.hp+dt*.6);
 }
 tickBuilding(b,dt){if(b.progress<1||b.campaignImmune)return;if(this.def(b).kind==='trap'){const victim=this.entities.find(u=>u.kind==='unit'&&u.hp>0&&!this.def(u).air&&this.hostile(b.owner,u.owner)&&Math.hypot(u.x-b.x,u.y-b.y)<.8);if(victim){this.damage(victim,this.def(b).trapDamage,b);this.players[victim.owner].aiMinefields||=[];this.players[victim.owner].aiMinefields.push({x:b.x,y:b.y,at:this.time});b.hp=0;this.effects.push({kind:'impact',projectileKind:'firepot',sound:'mine',owner:b.owner,x:b.x,y:b.y,time:.65,max:.65});}return;}const d=this.def(b),q=b.queue[0];if(q){q.remaining-=dt*(b.owner===0&&q.kind!=='extension'?(this.campaign?.productionRate??1):1)*this.aiEconomicRate(b.owner,'production')*(q.kind==='unit'&&this.players[b.owner].tech.includes(b.type+'_specialization')&&D.research[b.type+'_specialization']?.kind==='training'?1.2:1);if(q.remaining<=0){if(q.kind==='unit'){const udef=D.units[q.type],probe={kind:'unit',x:b.x,y:b.y,type:q.type,owner:b.owner},point=this.approach(probe,b,1.7);if(this.blocked(point.x,point.y,udef.naval?'water':!!udef.air)){q.remaining=0;return;}const u=this.spawnUnit(q.type,b.owner,point.x,point.y);if(b.owner===0){this.audioEvents||=[];this.audioEvents.push({kind:'spawn',type:q.type,x:point.x,y:point.y,time:this.time});if(this.audioEvents.length>16)this.audioEvents.shift();}if(this.campaign&&b.owner===0)campaignAPI().recordProduction(this,q.type);this.order([u.id],{kind:'move',...b.rally});}else if(q.kind==='research'){this.players[b.owner].tech.push(q.type);this.say(D.research[q.type].name+' researched.',b.owner);}else if(D.extensions[q.type].upgradeTo){const to=D.buildings[D.extensions[q.type].upgradeTo],health=b.hp/b.maxHp;b.type=to.id;b.maxHp=to.hp;b.hp=to.hp*health;b.size=to.size;b.collectionRoute=null;this.navVersion++;this.rebuildNav();this.say(to.name+' completed.',b.owner);}else{b.extension=D.extensions[q.type].name;this.rebuildNav();}b.queue.shift();}}
 if(d.kind==='defense'||d.kind==='hq'){b.attackTimer-=dt;if(b.attackTimer<=0){const enemy=this.combatEntities().filter(e=>e.hp>0&&!e.campaignImmune&&!e.campaignLocked&&this.hostile(b.owner,e.owner)&&this.visible(b.owner,e)&&['unit','building'].includes(e.kind)&&this.detectable(b.owner,e)&&dist(b,e)<d.range).sort((a,c)=>dist(a,b)-dist(c,b))[0];if(enemy){b.attackTimer=d.cooldown;const P=root.FractureProjectiles||(typeof require!=='undefined'?require('./projectiles.js'):null),shot=P.profile(d,D.factions[this.players[b.owner].faction]);this.projectiles.push({x:b.x,y:b.y,fromX:b.x,fromY:b.y,toX:enemy.x,toY:enemy.y,target:enemy.id,source:b.id,owner:b.owner,damage:d.damage,splash:0,weapon:shot.kind,shot,face:Math.atan2(enemy.y-b.y,enemy.x-b.x),flight:Math.max(.15,dist(b,enemy)/shot.speed),elapsed:0,building:true});}}}
 }
 ability(ids){for(const id of ids){const u=this.entity(id);if(!u||u.kind!=='unit'||u.abilityCooldown>0)continue;const d=this.def(u);if(d.worker){const b=this.entities.find(e=>e.owner===u.owner&&e.kind==='building'&&e.hp<e.maxHp&&dist(u,e)<6);if(b)this.order([id],{kind:'repair',target:b.id});}else if(d.detector){u.scanUntil=this.time+8;u.abilityCooldown=30;const p=this.players[u.owner];for(let y=Math.max(0,Math.floor(u.y-13));y<Math.min(this.n,u.y+13);y++)for(let x=Math.max(0,Math.floor(u.x-13));x<Math.min(this.n,u.x+13);x++)if(Math.hypot(x-u.x,y-u.y)<13)p.explored[y*this.n+x]=1;this.say('Reconnaissance sweep completed.',u.owner);}else if(d.heal){for(const t of this.entities)if(t.kind==='unit'&&t.owner===u.owner&&t.hp>0&&dist(t,u)<5)t.hp=Math.min(t.maxHp,t.hp+30);u.abilityCooldown=30;}else{if(d.armored){u.bracedUntil=this.time+10;u.order={kind:'hold'};}else u.focusUntil=this.time+10;u.abilityCooldown=35;this.effects.push({kind:'heal',x:u.x,y:u.y,time:.8,max:.8});}}}
 tick(dt){if(this.paused||this.winner!==null)return;dt=Math.min(dt,.15);this.time+=dt;this.fogTick-=dt;if(this.fogTick<=0){this.updateVision();this.fogTick=.4;}for(const e of this.combatEntities())if(e.hp>0){if(e.kind==='unit')this.tickUnit(e,dt);if(e.kind==='building')this.tickBuilding(e,dt);}
 // Gentle separation only; idle workers are not subjected to combat-style jams.
 // Units are swept in x order, so each one is compared only with neighbours less than a tile and a
 // half away in x instead of with every other moving unit (quadratic on a crowded Colossal map).
 const moving=this.entitiesByKind('unit').filter(e=>e.hp>0&&!e.embarkedBy&&!e.insideMine&&!this.def(e).air).sort((a,b)=>a.x-b.x||a.id-b.id);for(let i=0;i<moving.length;i++)for(let j=i+1;j<moving.length;j++){const a=moving[i],b=moving[j];if(b.x-a.x>1.5)break;
  // Reject distant pairs on their bounding box before paying for a square root; this loop is O(n^2)
  // over every moving unit and almost every pair is far apart.
  if(a.x-b.x>.85||b.x-a.x>.85||a.y-b.y>.85||b.y-a.y>.85)continue;
  let dd=dist(a,b);if(dd>.85||dd<.001)continue;const calm=!this.hostile(a.owner,b.owner)&&!a.windup&&!b.windup&&this.time-(a.hitAt??-10)>3&&this.time-(b.hitAt??-10)>3&&!['attack','attackMove'].includes(a.order?.kind)&&!['attack','attackMove'].includes(b.order?.kind);if(calm&&dd<.75&&Math.cos(a.face-b.face)<-.3){for(const u of [a,b])if(u.action==='walk'){const heading=u.order?.x!==undefined?Math.atan2(u.order.y-u.y,u.order.x-u.x):u.face,dx=-Math.sin(heading)*dt*1.3,dy=Math.cos(heading)*dt*1.3;if(this.canTraverse(u.x,u.y,u.x+dx,u.y+dy,this.movementMode(u),u.owner,true)){u.x+=dx;u.y+=dy;}}dd=dist(a,b);}const min=calm?.24:.5;if(dd>=min||dd<.001)continue;const f=(min-dd)*.3,dx=(a.x-b.x)/dd*f,dy=(a.y-b.y)/dd*f;if(this.canTraverse(a.x,a.y,a.x+dx,a.y+dy,this.movementMode(a),a.owner,true)){a.x+=dx;a.y+=dy;}if(this.canTraverse(b.x,b.y,b.x-dx,b.y-dy,this.movementMode(b),b.owner,true)){b.x-=dx;b.y-=dy;}}

 for(const p of this.projectiles){p.elapsed+=dt;const t=this.entity(p.target);if(t&&p.weapon!=='bomb'){p.toX=t.x;p.toY=t.y;}const a=clamp(p.elapsed/p.flight,0,1);p.x=p.fromX+(p.toX-p.fromX)*a;p.y=p.fromY+(p.toY-p.fromY)*a;if(a>=1){const source=this.entity(p.source)||{owner:p.owner};if(t&&p.weapon!=='bomb')this.damage(t,p.damage,source);if(p.splash){const C=root.FractureCombat||(typeof require!=='undefined'?require('./combat.js'):null),weapon=D.units[p.attackerType];for(const e of this.entities)if((e.id!==p.target||p.weapon==='bomb')&&e.hp>0&&['unit','building'].includes(e.kind)&&!e.embarkedBy&&!e.insideMine&&!!this.def(e)?.air===!!p.targetAir&&this.hostile(p.owner,e.owner)&&dist(e,{x:p.toX,y:p.toY})<p.splash){const hit=weapon&&Number.isFinite(p.baseDamage)?p.baseDamage*C.multiplier(weapon,this.def(e),e.kind==='building')*((p.launchHeight??0)>this.height(e.x,e.y)?1.1:1):p.damage;this.damage(e,hit*(p.weapon==='bomb'&&dist(e,{x:p.toX,y:p.toY})<Math.max(.65,e.size||0)?1:.5),source);}}this.effects.push({kind:'impact',projectileKind:p.weapon,color:p.shot?.color,x:p.toX,y:p.toY,time:.45,max:.45});}}
 this.projectiles=this.projectiles.filter(p=>p.elapsed<p.flight);for(const e of this.effects)e.time-=dt;this.effects=this.effects.filter(e=>e.time>0);if(this.entities.some(e=>e.hp<=0))this.entities=this.entities.filter(e=>e.hp>0);
 // Each AI still thinks every 0.2 s, but the players are spread across that interval instead of all
 // thinking in the same frame, where their costs stacked into one long hitch with four or more AIs.
 this.aiTick-=dt;const thinkers=this.players.filter(p=>p.ai);if(this.aiTick<=0){this.aiTick=.2;this.aiPhaseAt=this.time;}const phase=this.time-(this.aiPhaseAt??this.time);thinkers.forEach((p,k)=>{const due=k*.2/thinkers.length;if(p.aiRound!==this.aiPhaseAt&&phase>=due-1e-9){p.aiRound=this.aiPhaseAt;this.ai(p);}});
 if(this.campaign)campaignAPI().update(this,dt);
 else if(this.time>3){const alive=new Set(this.entities.filter(e=>e.kind==='building'&&!e.pendingSite&&['hq','inf','armor','air','elite','counter'].includes(this.def(e).kind)).map(e=>this.players[e.owner].team));if(alive.size<=1){this.winner=alive.size?[...alive][0]:-1;this.say('Match concluded.');}}
 }
 aiBuild(p,bdef,workers,near=null,maxRadius=4.2){if(!bdef||this.missing(p.id,bdef).length||!this.affordable(p.id,bdef.cost))return false;const base=near||p.home;if(bdef.kind==='extractor'&&near){const w=workers.find(w=>w.order?.kind!=='build');if(w&&this.build(bdef.id,p.id,near.x,near.y,[w.id]).ok)return true;}for(let i=0;i<32;i++){const a=this.rng.next()*Math.PI*2,r=near?this.rng.between(2.8,maxRadius):this.rng.between(4,10);const x=base.x+Math.cos(a)*r,y=base.y+Math.sin(a)*r;if(bdef.kind!=='extractor'&&Object.values(p.knowledge||{}).some(n=>n.kind==='resource'&&n.resource<2&&n.amount<=0&&dist(n,{x,y})<bdef.size+1.8))continue;const w=workers.find(w=>w.order?.kind!=='build');if(w&&this.build(bdef.id,p.id,x,y,[w.id]).ok)return true;}return false;}
 armyPower(units){return units.reduce((n,u)=>n+(u.hp/u.maxHp)*Math.sqrt(u.maxHp)*Math.max(4,this.def(u).damage)/(this.def(u).cooldown||1),0);}
 operationStep(p,enemies){const A=root.FractureAICombat||(typeof require!=='undefined'?require('./ai-combat.js'):null);return A.operationStep(this,p,enemies);}
 ai(p){const A=root.FractureAI||(typeof require!=='undefined'?require('./ai.js'):null);return A.step(this,p);}
 serialize(){const codec=root.FractureSaveCodec||(typeof require!=='undefined'?require('./save-codec.js'):null);return codec.encode({version:1,options:this.options,time:this.time,nextId:this.nextId,entities:this.entities,players:this.players.map(p=>({...p,visible:Array.from(p.visible),explored:Array.from(p.explored),knownNav:Array.from(p.knownNav),knownTiles:Array.from(p.knownTiles)})),map:this.map,starts:this.starts,controlGroups:this.controlGroups,rng:this.rng.s,winner:this.winner,...(this.market?{market:this.market}:{}),...(this.campaign?{campaign:this.campaign}:{})},noise);}
 static restore(text){const codec=root.FractureSaveCodec||(typeof require!=='undefined'?require('./save-codec.js'):null),s=codec.decode(text,noise);if(s.version!==1)throw Error('Unsupported save version');const g=Object.create(Game.prototype);Object.assign(g,s);g.n=s.options.size;g.rng=new RNG(s.rng);g.projectiles=[];g.effects=[];g.events=[];g.paused=false;g.fogTick=0;g.aiTick=0;g.navVersion=0;g.players=s.players.map(p=>({...p,visible:Uint8Array.from(p.visible),explored:Uint8Array.from(p.explored),knownNav:Uint8Array.from(p.knownNav||new Array(g.n*g.n).fill(0)),knownTiles:Uint8Array.from(p.knownTiles||new Array(g.n*g.n).fill(0)),knowledge:p.knowledge||{}}));g.controlGroups=s.controlGroups||{};g.rebuildNav();g.updateVision();return g;}
}
const expansion=root.FractureExpansionRuntime||(typeof require!=='undefined'?require('./expansion-runtime.js'):null);if(expansion)expansion.install(Game,D);
const march=root.FractureMarch||(typeof require!=='undefined'?require('./march.js'):null);if(march)march.install(Game,D);
const walls=root.FractureWalls||(typeof require!=='undefined'?require('./walls.js'):null);if(walls)walls.install(Game,D);
// Worker caps: gatherers per deposit node and miners per deep mine.
Game.NODE_WORKERS=3;Game.MINE_WORKERS=6;
root.FractureSim={Game,RNG,noise,hash,dist};if(typeof module!=='undefined')module.exports=root.FractureSim;
})(globalThis);
