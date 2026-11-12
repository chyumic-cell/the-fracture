'use strict';
(function(root){
function install(Game,D){
const P=Game.prototype,base={placement:P.placement,order:P.order,tickUnit:P.tickUnit,damage:P.damage,demolish:P.demolish,tickBuilding:P.tickBuilding},distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
P.flightEndurance=function(u){const d=this.def(u);return .7*(90+(this.players[u.owner].tech.includes(d.building+'_specialization')?45:0));};
P.aviationFields=function(u){return this.entitiesByKind('building').filter(b=>b.owner===u.owner&&b.hp>0&&b.progress>=1&&this.def(b).kind==='air');};
P.refuelingCorridor=function(u,q){
 const a=u.refuelOrigin;if(!a)return false;const dx=u.x-a.x,dy=u.y-a.y,D=Math.hypot(dx,dy),qx=q.x-a.x,qy=q.y-a.y;
 if(D<.001)return Math.hypot(qx,qy)<.001;
 const along=(qx*dx+qy*dy)/D,lateral=Math.abs(qx*dy-qy*dx)/D;
 // Full 45-degree cone aperture: fill its maximum width, without tapering.
 return along>=-.001&&along<=1.3*D+.001&&lateral<=1.3*D*Math.tan(Math.PI/8)+.001;
};
P.eligibleAirfields=function(u){return this.aviationFields(u).filter(b=>this.refuelingCorridor(u,b)).sort((a,b)=>{const unsafe=b=>this.time-(b.hitAt??-Infinity)<240;return Number(unsafe(a))-Number(unsafe(b))||distance(u,a)-distance(u,b)||a.id-b.id;});};
P.selectRefuelField=function(u,id){const b=this.eligibleAirfields(u).find(b=>b.id===id);if(!b)return {ok:false,reason:'Choose a functioning aviation facility inside this aircraft corridor.'};u.manualRefuel=id;u.returning=true;u.refuel=0;u.path=[];u.destination=null;return {ok:true};};
P.tickAviation=function(u,dt){
 if(!this.def(u).air)return false;
 if(u.aviationTick===this.time)return !!u.aviationHandled;
 u.aviationTick=this.time;u.aviationHandled=false;
 if(!u.refuelOrigin){const b=this.aviationFields(u).sort((a,b)=>distance(u,a)-distance(u,b))[0];if(b)u.refuelOrigin={x:b.x,y:b.y,id:b.id};}
 if(!u.enduranceVersion){u.flight=Math.min(u.flight??this.flightEndurance(u),this.flightEndurance(u));u.enduranceVersion=1;}
 if(!u.returning)u.flight=Math.max(0,u.flight-dt);
 if(u.flight>0&&!u.returning)return false;
 u.returning=true;u.aviationHandled=true;u.windup=null;
 const fields=this.eligibleAirfields(u),b=fields.find(b=>b.id===u.manualRefuel)||fields[0];
 if(!b){this.damage(u,999999,null);return true;}
 if(u.refuelTarget!==b.id){u.refuelTarget=b.id;u.refuel=0;u.path=[];u.destination=null;}
 if(distance(u,b)<b.size+1.8){u.action='land';u.refuel=(u.refuel||0)+dt;if(u.refuel>=6){u.refuelOrigin={x:b.x,y:b.y,id:b.id};u.flight=this.flightEndurance(u);u.returning=false;u.bombs=2;u.refuel=0;delete u.manualRefuel;delete u.refuelTarget;u.path=[];u.destination=null;}}
 else this.go(u,{x:b.x,y:b.y},dt);
 return true;
};
P.transportChoices=function(unit,destination,threats=[],fleet=null){
 const owner=unit.owner,choices=[],routeLength=(start,path)=>{let sum=0,last=start;for(const q of path){sum+=distance(last,q);last=q;}return sum;},risk=(a,b,air)=>threats.filter(e=>{const d=this.def(e);if(!d?.damage||air&&!d.aa||!air&&d.airOnly)return false;const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((e.x-a.x)*dx+(e.y-a.y)*dy)/(dx*dx+dy*dy||1)));return distance(e,{x:a.x+t*dx,y:a.y+t*dy})<(d.range||1)+3;}).length;
 const land=this.path(unit,destination);if(distance(land.at(-1)||unit,destination)<2)choices.push({mode:'land',score:routeLength(unit,land)/this.def(unit).speed+risk(unit,destination,false)*20});
 for(const carrier of (fleet||this.entitiesByKind('unit')).filter(u=>u.owner===owner&&u.hp>0&&this.def(u).transport&&!u.returning)){
  const d=this.def(carrier),capacity=d.transport-this.transportLoad(carrier).length;if(capacity<=0)continue;
  let length,landing;
  if(d.air){length=distance(carrier,unit)+distance(unit,destination);if(length/d.speed+8>(carrier.flight??0))continue;const probe={...carrier,...destination};if(!this.eligibleAirfields(probe).length)continue;landing=destination;}
  else{const pickup=this.coastApproach(carrier,unit);landing=this.coastApproach(carrier,destination);if(!pickup||!landing||distance(pickup,unit)>4||distance(landing,destination)>4)continue;const first=this.path(carrier,pickup),second=this.path({...carrier,...pickup},landing);if(distance(first.at(-1)||carrier,pickup)>1||distance(second.at(-1)||pickup,landing)>1)continue;length=routeLength(carrier,first)+routeLength(pickup,second);}
  choices.push({mode:d.air?'air':'naval',carrier:carrier.id,landing,score:length/d.speed+8+risk(unit,destination,d.air)*25+10/capacity});
 }
 return choices.sort((a,b)=>a.score-b.score);
};
P.tradePortKind=function(u){return this.def(u).navalRole==='merchant'?'dock':'market';};
P.tradeLeg=function(u,port){
 const q=this.approach(u,port,1),path=this.path(u,q),end=path.at(-1)||u;
 if(distance(end,q)>.8||distance(q,port)>port.size+1.8)return null;
 let length=0,prev=u;for(const step of path){length+=distance(prev,step);prev=step;}
 return {point:q,length};
};
P.transportLoad=function(t){return(this.entities.filter(u=>u.hp>0&&u.embarkedBy===t.id));};
P.board=function(ids,transportId,owner=0){const t=this.entity(transportId);if(!t||t.owner!==owner||!this.def(t).transport)return{ok:false,reason:'Choose your own transport.'};let count=0;for(const id of ids){const u=this.entity(id);if(!u||u.owner!==owner||u.kind!=='unit'||this.def(u).air||this.def(u).naval||u.embarkedBy)continue;delete u.march;u.windup=null;u.order={kind:'board',target:t.id};u.path=[];u.destination=null;count++;}return{ok:count>0,reason:count?'':'Select land units to board.'};};
P.unload=function(t,where){const passengers=this.transportLoad(t),used=[],spots=[];for(let y=Math.floor(where.y)-3;y<=Math.floor(where.y)+3;y++)for(let x=Math.floor(where.x)-3;x<=Math.floor(where.x)+3;x++){const q={x:x+.5,y:y+.5};if(distance(q,t)>3.6||this.blocked(q.x,q.y,false)||Math.abs(this.height(q.x,q.y)-(where.height??this.height(where.x,where.y)))>=1)continue;if(this.entities.some(u=>u.kind==='unit'&&u.hp>0&&!u.embarkedBy&&!this.def(u).air&&distance(u,q)<.55))continue;spots.push(q);}spots.sort((a,b)=>distance(a,where)-distance(b,where));for(const u of passengers){const q=spots.shift();if(!q)break;delete u.embarkedBy;u.x=q.x;u.y=q.y;u.path=[];u.destination=null;u.order=null;u.action='idle';used.push(u.id);}if(!used.length)t.blockReason='Move beside an open shoreline or landing area to unload.';else t.blockReason=null;return used.length;};
P.coastApproach=function(t,where){let best=null,score=Infinity;for(let y=Math.floor(where.y)-4;y<=Math.floor(where.y)+4;y++)for(let x=Math.floor(where.x)-4;x<=Math.floor(where.x)+4;x++){const q={x:x+.5,y:y+.5};if(this.blocked(q.x,q.y,this.movementMode(t),t.owner))continue;const cost=distance(q,where)+distance(t,q)*.04;if(cost<score){score=cost;best=q;}}return best;};
P.placement=function(type,owner,x,y,actual=false,ignoreId=null,paid=false){const d=D.buildings[type];if(d?.kind==='dock'){const miss=this.missing(owner,d);if(miss.length)return'Requires '+miss.join(', ');let land=0,water=0;for(let yy=Math.floor(y-d.size);yy<=Math.floor(y+d.size);yy++)for(let xx=Math.floor(x-d.size);xx<=Math.floor(x+d.size);xx++){const t=this.tile(xx,yy),i=yy*this.n+xx,p=this.players[owner];if(!t||!p.explored[i])return'Explore a shoreline first';const known=actual||p.visible[i]?t:{water:!!(p.knownTiles[i]&128),height:p.knownTiles[i]&127};if(known.height>1)return'Choose a low shoreline';if(known.water)water++;else land++;}if(!land||!water)return'Place across a shoreline, partly on land and partly on water';const err=this.constructionObstruction(this.constructionBlockers(owner,x,y,d.size,ignoreId,actual,type));return err||(!paid&&!this.affordable(owner,d.cost)?'Insufficient resources':null);}
 const err=base.placement.call(this,type,owner,x,y,actual,ignoreId,paid);if(err)return err;if(d?.kind==='deepMine'){const node=this.entities.find(e=>e.kind==='resource'&&e.amount<=0&&D.resources[e.resource]===d.resource&&distance(e,{x,y})<.8&&(actual||this.known(owner,e)));if(!node)return'Place directly on an exhausted '+d.resource+' deposit';}return null;};
P.order=function(ids,order){if(['clearMines','unload','extract','trade'].includes(order.kind)&&root.fracture?.game===this)root.FractureAudio?.order(ids,order);if(order.kind==='clearMines'){for(const id of ids){const u=this.entity(id);if(!u||!this.def(u).disarmsMines||u.embarkedBy)continue;delete u.march;u.windup=null;u.path=[];u.destination=null;u.order={kind:'clearMines',x:order.x,y:order.y,sweep:0,elapsed:0};}return;}if(order.kind==='board'){const u=this.entity(ids[0]);return this.board(ids,order.target,u?.owner??0);}if(['unload','extract','trade'].includes(order.kind)){for(const id of ids){const u=this.entity(id);if(!u||u.embarkedBy)continue;const d=this.def(u),t=this.entity(order.target);if(order.kind==='unload'&&!d.transport||order.kind==='extract'&&(!d.worker||!t||t.owner!==u.owner||this.def(t).kind!=='deepMine'||t.progress<1)||order.kind==='trade'&&(!['merchant','navalMerchant'].includes(d.role)||!t||t.hp<=0||t.progress<1||this.def(t).kind!==this.tradePortKind(u)||this.hostile(u.owner,t.owner)))continue;delete u.insideMine;u.order={...order,...(order.kind==='unload'?{height:this.height(order.x,order.y)}:{})};u.path=[];u.destination=null;u.mineTimer=0;u.mineProduced=false;if(order.kind==='trade'){const from=this.entities.filter(e=>e.owner===u.owner&&e.id!==t.id&&e.kind==='building'&&e.hp>0&&e.progress>=1&&this.def(e).kind===this.tradePortKind(u)&&distance(e,t)>=8&&this.tradeLeg(u,e)&&this.tradeLeg({...u,...this.tradeLeg(u,e).point},t)).sort((a,b)=>distance(a,u)-distance(b,u))[0];if(!from){u.order=null;u.blockReason='Requires a reachable friendly trading port at least eight tiles away.';}else{u.order={kind:'trade',from:from.id,to:t.id,target:from.id,loaded:false};u.blockReason=null;}}}return;}for(const id of ids){const u=this.entity(id);if(u?.insideMine)delete u.insideMine;}return base.order.call(this,ids.filter(id=>!this.entity(id)?.embarkedBy),order);};
P.exchange=function(owner,resource,credits=20){const p=this.players[owner];if(!Number.isInteger(resource)||resource<0||resource>3||credits!==20)return{ok:false,reason:'Choose a resource.'};if((p.tradeCredits||0)<credits)return{ok:false,reason:'Requires 20 Trade Credits.'};if(!this.entities.some(e=>e.owner===owner&&e.kind==='building'&&e.hp>0&&e.progress>=1&&['market','dock'].includes(this.def(e).kind)))return{ok:false,reason:'Complete a market or dock first.'};p.tradeCredits-=credits;p.stock[resource]+=10;return{ok:true};};
P.tickUnit=function(u,dt){if(u.embarkedBy){const carrier=this.entity(u.embarkedBy);if(carrier){u.x=carrier.x;u.y=carrier.y;u.action='idle';}return;}const d=this.def(u),o=u.order;if(d.air&&this.tickAviation(u,dt))return;if(o?.kind==='clearMines'&&d.disarmsMines){
  // Inspect a small area at walking distance; this does not grant map vision or
  // reveal the hidden mine to ordinary attackers. Progress is interruptible.
  const nearby=this.entitiesByKind('building').filter(b=>b.hp>0&&this.def(b).kind==='trap'&&b.progress>=1&&this.hostile(u.owner,b.owner)&&distance(b,u)<2.6&&distance(b,o)<5.5).sort((a,b)=>distance(a,u)-distance(b,u));
  let mine=this.entity(o.mine);if(!mine||mine.hp<=0||distance(mine,u)>3)mine=nearby[0];
  if(mine){if(o.mine!==mine.id){o.mine=mine.id;o.elapsed=0;}if(distance(u,mine)>1.55){const a=Math.atan2(u.y-mine.y,u.x-mine.x);this.go(u,{x:mine.x+Math.cos(a)*1.4,y:mine.y+Math.sin(a)*1.4},dt);return;}
   u.action='gather';u.face=Math.atan2(mine.y-u.y,mine.x-u.x);u.phase+=dt*3;o.elapsed=this.time-(u.hitAt??-100)<.4?0:(o.elapsed||0)+dt;u.blockReason='Dismantling mine · '+Math.floor(o.elapsed)+' / 12s';if(o.elapsed>=12){mine.hp=0;mine.disarmed=true;o.mine=null;o.elapsed=0;u.blockReason=null;this.effects.push({kind:'disarm',x:mine.x,y:mine.y,owner:u.owner,time:.4,max:.4});}return;
  }
  o.mine=null;o.elapsed=0;u.blockReason='Inspecting ground for hidden mines';const k=o.sweep||0;if(k>=16){u.order=null;u.blockReason=null;u.action='idle';return;}const q={x:o.x-3+(k%4)*2,y:o.y-3+Math.floor(k/4)*2};if(this.blocked(q.x,q.y,false,u.owner)){o.sweep=k+1;return;}if(distance(u,q)<.45||this.go(u,q,dt*.55,.4))o.sweep=k+1;return;
 }
 if(o?.kind==='board'){const t=this.entity(o.target);if(!t||t.owner!==u.owner){u.order=null;return;}if(this.transportLoad(t).length>=this.def(t).transport){u.blockReason='Transport is full.';return;}if(distance(u,t)<=2.8&&!this.cliffBetween(u.x,u.y,t.x,t.y)){u.embarkedBy=t.id;u.order=null;u.path=[];u.action='idle';u.blockReason=null;}else this.go(u,this.approach(u,t,1),dt);return;}
 if(o?.kind==='unload'){const dest=this.coastApproach(u,o);if(!dest){u.blockReason='No navigable landing approach.';return;}if(distance(u,dest)<.65){this.unload(u,o);if(!this.transportLoad(u).length)u.order=null;}else this.go(u,dest,dt);return;}
 if(o?.kind==='trade'){
 const target=this.entity(o.target),from=this.entity(o.from),to=this.entity(o.to),kind=this.tradePortKind(u);
 if(![target,from,to].every(b=>b&&b.hp>0&&b.progress>=1&&this.def(b).kind===kind&&!this.hostile(u.owner,b.owner))){u.order=null;u.blockReason='Trade route lost a trading port.';return;}
 if(!o.leg||o.navVersion!==this.navVersion){o.leg=this.tradeLeg(u,target);o.navVersion=this.navVersion;if(!o.leg){u.blockReason='No connected route to the trading port.';u.action='idle';return;}u.blockReason=null;}
 if(distance(u,o.leg.point)<.65){
  if(o.loaded){const income=Math.max(1,Math.floor((o.routeLength||distance(from,to))*1.5));this.players[u.owner].tradeCredits=(this.players[u.owner].tradeCredits||0)+income;u.tradeEarned=(u.tradeEarned||0)+income;}
  o.loaded=true;o.target=o.target===o.from?o.to:o.from;u.destination=null;u.path=[];o.leg=this.tradeLeg(u,this.entity(o.target));o.routeLength=o.leg?.length||0;
 }else this.go(u,o.leg.point,dt,.4);return;
 }
 if(o?.kind==='extract')return this.tickDeepWorker(u,dt);
 return base.tickUnit.call(this,u,dt);};
P.tickDeepWorker=function(u,dt){const mine=this.entity(u.order?.target);if(!mine||mine.progress<1||mine.owner!==u.owner){delete u.insideMine;u.order=null;return;}const p=this.players[u.owner],r=D.resources.indexOf(this.def(mine).resource),workers=this.entities.filter(v=>v.hp>0&&v.order?.kind==='extract'&&v.order.target===mine.id).sort((a,b)=>a.id-b.id),rank=workers.indexOf(u),miner=rank<Math.max(1,Math.ceil(workers.length/2)),solo=workers.length===1;
 if(u.carry>0){delete u.insideMine;const drop=this.entities.filter(b=>b.kind==='building'&&b.hp>0&&b.owner===u.owner&&b.progress>=1&&['hq','depot','extractor'].includes(this.def(b).kind)).sort((a,b)=>distance(u,a)-distance(u,b))[0];if(!drop){u.blockReason='A headquarters or collection station is needed.';return;}if(distance(u,drop)<drop.size+1.8){p.stock[u.carryType]+=u.carry;p.gathered[u.carryType]+=u.carry;u.carry=0;u.mineTimer=0;u.path=[];u.destination=null;}else this.go(u,this.approach(u,drop,1),dt);return;}
 if(distance(u,mine)>mine.size+1.7){delete u.insideMine;this.go(u,this.approach(u,mine,1),dt);return;}u.face=Math.atan2(mine.y-u.y,mine.x-u.x);u.action='gather';u.phase+=dt*4;mine.stockpile=mine.stockpile||0;
 if(!miner){const take=Math.min(12*Math.max(1,this.aiEconomicRate(u.owner,'gather')),mine.stockpile);if(take>=6){mine.stockpile-=take;u.carry=take;u.carryType=r;}return;}
 u.mineTimer=(u.mineTimer||0)+dt;if(u.mineTimer<8){if(mine.stockpile<144)u.insideMine=mine.id;return;}delete u.insideMine;if(!u.mineProduced&&mine.stockpile<144){mine.stockpile=Math.min(144,mine.stockpile+6*this.aiEconomicRate(u.owner,'gather'));u.mineProduced=true;mine.lastExtraction=this.time;}if(u.mineTimer>=10){u.mineTimer=0;u.mineProduced=false;if(solo){u.carry=Math.min(12*Math.max(1,this.aiEconomicRate(u.owner,'gather')),mine.stockpile);u.carryType=r;mine.stockpile-=u.carry;}}};
P.damage=function(e,value,source){if(this.def(e)?.concealedTrap)return;const was=e.hp>0,cargo=this.def(e)?.transport?this.transportLoad(e):[];base.damage.call(this,e,value,source);if(was&&e.hp<=0){for(const u of cargo)base.damage.call(this,u,999999,source);for(const u of this.entities)if(u.insideMine===e.id){delete u.insideMine;u.order=null;u.action='idle';}}};
P.demolish=function(ids,owner=0){const cargo=ids.flatMap(id=>{const e=this.entity(id);return e?.owner===owner?this.transportLoad(e).map(u=>u.id):[];});const removed=new Set(ids.filter(id=>this.entity(id)?.owner===owner));for(const u of this.entitiesByKind('unit'))if(removed.has(u.insideMine)){delete u.insideMine;u.order=null;u.mineTimer=0;u.mineProduced=false;u.action='idle';u.path=[];u.destination=null;}return base.demolish.call(this,[...new Set([...ids,...cargo])],owner);};
}
root.FractureExpansionRuntime={install};if(typeof module!=='undefined')module.exports=root.FractureExpansionRuntime;
})(globalThis);

