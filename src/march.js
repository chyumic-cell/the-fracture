'use strict';
(function(root){
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function install(Game,D){
 const P=Game.prototype,base={order:P.order,tick:P.tick,tickUnit:P.tickUnit,go:P.go};
 P.order=function(ids,order){if(root.fracture?.game===this)root.FractureAudio?.order(ids,order);for(const id of ids){const u=this.entity(id);if(u)delete u.march;}const result=base.order.call(this,ids,order);
  if(!['move','attackMove'].includes(order.kind)||ids.length<3)return result;
  const units=ids.map(id=>this.entity(id)).filter(u=>u?.kind==='unit'&&!this.movementMode(u)&&!u.embarkedBy&&u.order?.kind===order.kind);
  if(units.length<3)return result;
  const center={x:units.reduce((s,u)=>s+u.x,0)/units.length,y:units.reduce((s,u)=>s+u.y,0)/units.length};
  // Dispersed selection keeps individual routes until it can assemble at the order.
  if(units.some(u=>distance(u,center)>18)||distance(center,order)<5)return result;
  const probe=[...units].sort((a,b)=>distance(a,center)-distance(b,center))[0],start=this.blocked(center.x,center.y,false,probe.owner)?{x:probe.x,y:probe.y}:center,route=this.path({...probe,...start},order);
  if(!route.length||distance(route.at(-1),order)>2)return result;
  const group={id:(this.marchSequence=(this.marchSequence||0)+1),ids:units.map(u=>u.id),route:[start,...route],cursor:0,anchor:{...start},history:[{...start}],speed:Math.min(...units.map(u=>this.def(u).speed)),destination:{x:order.x,y:order.y},kind:order.formation||'line',face:order.face??Math.atan2(order.y-start.y,order.x-start.x),narrow:false};
  const heading=Math.atan2(order.y-start.y,order.x-start.x),ca=Math.cos(heading),sa=Math.sin(heading);group.start={...start};group.travelled=0;group.offsets={};group.initial={};group.blendDistance=Math.max(8,...units.map(u=>distance(u,start)*1.8));
  for(const slot of this.formationLayout(units,group.kind,start,heading)){const dx=slot.x-start.x,dy=slot.y-start.y;group.offsets[slot.unit.id]={x:dx*ca+dy*sa,y:-dx*sa+dy*ca};}
  group.trailOrder=[...units].sort((a,b)=>(b.x-a.x)*ca+(b.y-a.y)*sa||a.id-b.id).map(u=>u.id);
  for(const u of units){group.initial[u.id]={x:u.x-start.x,y:u.y-start.y};u.march={id:group.id,final:{...u.order}};u.order={...u.order,x:u.x,y:u.y};}
  (this.marches||(this.marches=[])).push(group);return result;
 };
 function trail(g,back){let left=back,b=g.anchor;for(let i=g.history.length-1;i>=0;i--){const a=g.history[i],len=distance(a,b);if(len>=left&&len>0)return{x:b.x+(a.x-b.x)*left/len,y:b.y+(a.y-b.y)*left/len};left-=len;b=a;}return {...b};}
 P.updateMarches=function(dt){if(!this.marches?.length)return;const keep=[];
  for(const g of this.marches){const us=g.ids.map(id=>this.entity(id)).filter(u=>u?.march?.id===g.id&&!u.embarkedBy&&['move','attackMove'].includes(u.order?.kind));if(us.length<2){for(const u of us){u.order=u.march.final;delete u.march;}continue;}
   // Contact pauses the shared anchor; individual attack-move behavior remains active.
   const contact=g.ids.some(id=>this.entity(id)?.windup),lag=Math.max(...us.map(u=>distance(u,u.order)));
   const previousAnchor={...g.anchor};if(!contact&&lag<6){let travel=g.speed*dt*.9;while(travel>0&&g.cursor<g.route.length-1){const q=g.route[g.cursor+1],len=distance(g.anchor,q);if(len<=travel){g.anchor={...q};travel-=len;g.cursor++;}else{g.anchor.x+=(q.x-g.anchor.x)*travel/len;g.anchor.y+=(q.y-g.anchor.y)*travel/len;travel=0;}}}
   g.travelled=(g.travelled||0)+distance(previousAnchor,g.anchor);
   if(distance(g.history.at(-1),g.anchor)>.35){g.history.push({...g.anchor});if(g.history.length>us.length*6+40)g.history.shift();}
   if(g.cursor>=g.route.length-1){for(const u of us){u.order=u.march.final;delete u.march;u.destination=null;u.path=[];}continue;}
   const next=g.route[Math.min(g.cursor+3,g.route.length-1)],face=Math.atan2(next.y-g.anchor.y,next.x-g.anchor.x),slots=g.offsets?us.map(u=>{const o=g.offsets[u.id];return {unit:u,x:g.anchor.x+o.x*Math.cos(face)-o.y*Math.sin(face),y:g.anchor.y+o.x*Math.sin(face)+o.y*Math.cos(face)};}):this.formationLayout(us,g.kind,g.anchor,face),owner=us[0].owner;
   const clear=(a,b)=>{const n=Math.max(1,Math.ceil(distance(a,b)*3));for(let j=1;j<=n;j++){const q={x:a.x+(b.x-a.x)*j/n,y:a.y+(b.y-a.y)*j/n},prev={x:a.x+(b.x-a.x)*(j-1)/n,y:a.y+(b.y-a.y)*(j-1)/n};if(!this.canTraverse(prev.x,prev.y,q.x,q.y,false,owner))return false;}return true;};
   const blocked=slots.some(s=>!clear(g.anchor,s)||!clear(s,{x:s.x+Math.cos(face)*2,y:s.y+Math.sin(face)*2}));
   if(blocked)g.clearSince=null;else g.clearSince??=this.time;
   g.narrow=blocked||g.narrow&&this.time-g.clearSince<1.8;
   const sorted=[...us].sort((a,b)=>g.trailOrder?g.trailOrder.indexOf(a.id)-g.trailOrder.indexOf(b.id):this.formationRank(a)-this.formationRank(b)||a.id-b.id);
   for(const [i,u]of sorted.entries()){const slot=g.narrow?trail(g,i*.78):slots.find(s=>s.unit.id===u.id);const blend=Math.min(1,(g.travelled||0)/(g.blendDistance||1)),initial=g.initial?.[u.id],x=initial?g.anchor.x+initial.x+(slot.x-g.anchor.x-initial.x)*blend:slot.x,y=initial?g.anchor.y+initial.y+(slot.y-g.anchor.y-initial.y)*blend:slot.y;u.order={...u.march.final,x,y,face};u.march.speed=g.speed;u.march.narrow=g.narrow;}
   keep.push(g);
  }this.marches=keep;
 };
 P.go=function(u,p,dt,near){if(u.march&&u.order===p&&!u.windup){const speed=this.def(u).speed,lag=distance(u,p);dt*=Math.min(1,u.march.speed/speed*(lag>3?1.25:1));
 if(lag<5){let clear=true,prev=u;const steps=Math.max(1,Math.ceil(lag*4));for(let i=1;i<=steps;i++){const q={x:u.x+(p.x-u.x)*i/steps,y:u.y+(p.y-u.y)*i/steps};if(!this.canTraverse(prev.x,prev.y,q.x,q.y,false,u.owner,true)){clear=false;break;}prev=q;}
 if(clear){const step=Math.min(lag,speed*dt),a=Math.atan2(p.y-u.y,p.x-u.x);u.x+=Math.cos(a)*step;u.y+=Math.sin(a)*step;u.face=a;u.action='walk';u.phase+=step*9;u.stuck=0;u.path=[];u.destination=null;return lag-step<Math.max(.12,near||.25);}}
 }return base.go.call(this,u,p,dt,near);};
 P.tickUnit=function(u,dt){const order=u.order;const result=base.tickUnit.call(this,u,dt);if(u.march&&!u.order&&order&&u.hp>0)u.order=order;return result;};
 P.tick=function(dt){if(!this.paused&&this.winner===null){this.updateMarches(Math.min(dt,.15));if(!this.marches)for(const u of this.entitiesByKind('unit'))if(u.march){u.order=u.march.final;delete u.march;}}return base.tick.call(this,dt);};
}
root.FractureMarch={install};if(typeof module!=='undefined')module.exports=root.FractureMarch;
})(globalThis);
