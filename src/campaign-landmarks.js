'use strict';
/* Campaign scenery shares the ordinary terrain/nav state; it does not invent invisible barriers. */
(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function decorate(g,m){
 if(!g.campaign)return;
 g.campaign.landmarks=[];
 if(m.number===1){
  const s=g.campaign.sites.find(s=>s.id==='bridge');if(!s)return;
  const h=g.players[0].home,len=Math.hypot(s.x-h.x,s.y-h.y),ax=(s.x-h.x)/len,ay=(s.y-h.y)/len;
  const b={kind:'bridge',x:s.x,y:s.y,ax,ay,length:12,width:5.2};
  // A narrow river crosses the approach. The deck and its approaches remain ordinary walkable cells.
  for(let y=Math.floor(s.y-17);y<=s.y+17;y++)for(let x=Math.floor(s.x-17);x<=s.x+17;x++){
   const dx=x+.5-s.x,dy=y+.5-s.y,a=dx*ax+dy*ay,c=-dx*ay+dy*ax,t=g.tile(x,y);if(!t)continue;
   if(Math.abs(a)<7&&Math.abs(c)<3.6){t.height=0;t.water=false;t.road=true;continue;}
   if(Math.abs(a)<4.8&&Math.abs(c)<15.5){
    const occupied=g.entities.some(e=>e.hp>0&&e.kind!=='tree'&&Math.hypot(e.x-x-.5,e.y-y-.5)<(e.size||.5)+2);
    if(!occupied&&!g.campaign.sites.some(q=>q!==s&&Math.hypot(q.x-x-.5,q.y-y-.5)<5)){t.water=true;t.height=0;t.road=false;}
   }
  }
  g.entities=g.entities.filter(e=>e.kind!=='tree'||Math.hypot(e.x-s.x,e.y-s.y)>10);
  g.campaign.landmarks.push(b);
 }
 for(const s of g.campaign.sites){
  const e=g.entity(s.entityId);if(!e)continue;
  if(/gateway|crossing apparatus|dimensional|passage mechanism/i.test(s.name))e.campaignVisual='gateway';
  else if(s.kind==='rescue')e.campaignVisual='camp';
  else if(/infirmary/i.test(s.name))e.campaignAdornment='infirmary';
  else if(e.campaignFaction==='symbiotes'&&/relay|node|junction|heart/i.test(s.name))e.campaignAdornment='network';
 }
}
function polygon(ctx,points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x??p[0],p.y??p[1]):ctx.moveTo(p.x??p[0],p.y??p[1]));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function drawGround(ctx,g,point,zoom){
 if(!g.campaign)return;
 for(const b of g.campaign.landmarks||[]){
  if(b.kind==='shed-tail'){const p=point(b.x,b.y);if(!g.visible(0,b)&&!g.players[0].explored[Math.floor(b.y)*g.n+Math.floor(b.x)])continue;ctx.save();ctx.translate(p.x,p.y);ctx.scale(zoom,zoom);const elapsed=g.time-b.at,twist=elapsed<3?Math.sin(elapsed*14)*3:0;for(let j=11;j>=0;j--){const x=-j*2.1,y=j*j*.09+Math.sin(j*.3)*twist,r=Math.max(1,5-j*.35);ctx.fillStyle=j%2?'#748760':'#9da36e';ctx.beginPath();ctx.ellipse(x,y,r,r*.55,-.4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#4d5d46';ctx.stroke();ctx.fillStyle='#bcb888';ctx.fillRect(x-1,y-r*.6,2,2);}ctx.restore();continue;}
  const map=(a,c,z=0)=>{const p=point(b.x+b.ax*a-b.ay*c,b.y+b.ay*a+b.ax*c);return{x:p.x,y:p.y-z*zoom};};
  const L=b.length/2,W=b.width/2;
  const q=[map(-L,-W),map(L,-W),map(L,W),map(-L,W)];
  const side=q.map(p=>({x:p.x,y:p.y+8*zoom}));
  polygon(ctx,[q[1],q[2],side[2],side[1]],'#5d615a','#444942');
  polygon(ctx,[q[2],q[3],side[3],side[2]],'#757565','#55594d');
  polygon(ctx,q,'#9d9d83','#c2b99b');
  for(let a=-L;a<L;a+=.7)for(let c=-W;c<W;c+=.65){
   const aa=Math.min(L,a+.68),cc=Math.min(W,c+.63);
   const shade=Math.abs(Math.floor(a*7+c*13))%4;
   polygon(ctx,[map(a,c),map(aa,c),map(aa,cc),map(a,cc)],['#a8a58d','#b4ad92','#969780','#c0b89d'][shade],'#7e816c');
  }
  for(const c of [-W,W]){
   for(let a=-L;a<L;a+=.8){const z=4;
    polygon(ctx,[map(a,c),map(Math.min(L,a+.72),c),map(Math.min(L,a+.72),c,z),map(a,c,z)],c<0?'#727966':'#898d75','#565e50');
    polygon(ctx,[map(a,c,z),map(Math.min(L,a+.72),c,z),map(Math.min(L,a+.72),c+.15,z),map(a,c+.15,z)],'#c1b89a');
   }
  }
 }
}
function box(ctx,x,y,w,h,depth,color){
 polygon(ctx,[[x,y],[x+w,y-depth],[x+w,y-depth-h],[x,y-h]],color,'#424a49');
 polygon(ctx,[[x+w,y-depth],[x+w+depth,y-depth/2],[x+w+depth,y-depth/2-h],[x+w,y-depth-h]],'#596565','#394547');
 polygon(ctx,[[x,y-h],[x+w,y-depth-h],[x+w+depth,y-depth/2-h],[x+depth,y+depth/2-h]],'#a4ada3','#556365');
}
function drawObject(ctx,g,e,d){
 if(!g.campaign||!e.campaignVisual)return false;
 const size=d.size||1.5,scale=clamp(size/1.8,.75,1.4);ctx.save();ctx.scale(scale,scale);
 if(e.campaignVisual==='gateway'){
  polygon(ctx,[[-50,8],[-7,-16],[55,6],[9,30]],'#788377','#414e4c');
  for(let j=0;j<9;j++)polygon(ctx,[[-43+j*10,8-j*.08],[-33+j*10,2-j*.08],[-27+j*10,6-j*.08],[-37+j*10,12-j*.08]],j%2?'#939886':'#7f887b','#647369');
  const lit=!!g.campaign.sites.find(s=>s.entityId===e.id)?.secured;
  const gradient=ctx.createRadialGradient(2,-51,3,2,-51,45);gradient.addColorStop(0,lit?'#c1b9d994':'#65839d66');gradient.addColorStop(.6,lit?'#7962ae8a':'#2c465cbb');gradient.addColorStop(1,'#111e2a');
  ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(0,-47,31,43,0,0,Math.PI*2);ctx.fill();
  for(let j=0;j<8;j++){const a=j*.82+g.time*.15;ctx.strokeStyle=lit?'#bfb4dc88':'#7399af77';ctx.beginPath();ctx.ellipse(Math.sin(a)*3,-48,12+j*2,29+j,Math.sin(a)*.15,0,3.4);ctx.stroke();}
  box(ctx,-47,10,14,78,9,'#87918a');box(ctx,29,6,14,78,9,'#7b8782');
  for(let j=0;j<7;j++){
   const a=Math.PI*(j+.5)/7,x=Math.cos(a)*37,y=-63-Math.sin(a)*29;
   polygon(ctx,[[x-10,y+6],[x+8,y+3],[x+7,y-11],[x-8,y-9]],j%2?'#a8ad98':'#8b968a','#4e605b');
  }
  for(const x of [-39,38])for(let j=0;j<6;j++){ctx.strokeStyle='#576b64';ctx.beginPath();ctx.moveTo(x-7,-j*12);ctx.lineTo(x+7,-j*12-3);ctx.stroke();ctx.fillStyle=lit?'#c9b9f0':'#9ec0ca';ctx.fillRect(x-2,-j*12-6,3,3);}
  for(const x of [-21,19]){box(ctx,x,15,8,15,5,'#727e78');ctx.fillStyle='#afbbad';ctx.fillRect(x+1,-1,6,3);}
 }else if(e.campaignVisual==='camp'){
  polygon(ctx,[[-48,6],[-4,-16],[48,5],[5,28]],'#797b63','#636b55');
  // Canvas tents, raised along their real occupied foundation; ropes are decorative.
  for(const [x,y,k] of [[-19,0,1],[19,-15,.8]]){
   ctx.save();ctx.translate(x,y);ctx.scale(k,k);
   polygon(ctx,[[-26,13],[-2,-30],[28,0]],'#bbb69b','#6e786b');
   polygon(ctx,[[-2,-30],[17,-39],[46,-10],[28,0]],'#8c9d90','#5c6c65');
   polygon(ctx,[[-19,10],[-2,-22],[8,10]],'#626d60','#9b9d85');
   polygon(ctx,[[-14,10],[-2,-16],[3,10]],'#293f3c');
   ctx.strokeStyle='#a6aa90';ctx.beginPath();ctx.moveTo(-2,-31);ctx.lineTo(-33,18);ctx.moveTo(17,-39);ctx.lineTo(52,-5);ctx.stroke();
   for(const p of [[-33,18],[52,-5]]){ctx.fillStyle='#4e5544';ctx.fillRect(p[0],p[1]-4,2,5);}ctx.restore();
  }
  for(const [x,y]of[[-36,18],[31,17],[39,10]])box(ctx,x,y,8,8,4,'#8f8262');
  ctx.strokeStyle='#aabcab';ctx.beginPath();ctx.moveTo(-4,1);ctx.lineTo(-4,-49);ctx.stroke();polygon(ctx,[[-4,-48],[10,-45],[10,-36],[-4,-39]],'#b8ad82');
 }
 ctx.restore();return true;
}
function drawAdornment(ctx,g,e,d){
 if(!g.campaign)return;
 if(e.campaignAdornment==='infirmary'){
  const y=-(d.size||1.8)*28;ctx.fillStyle='#d2cbb2';ctx.fillRect(-19,y,24,15);ctx.strokeStyle='#6e7666';ctx.strokeRect(-19,y,24,15);ctx.fillStyle='#a55c51';ctx.fillRect(-10,y+2,5,11);ctx.fillRect(-13,y+5,11,5);
 }
 if(e.campaignAdornment==='network'){
  const lit=!g.campaign.sites.find(s=>s.entityId===e.id)?.secured;
  for(let j=0;j<9;j++){const a=j*2.4,xx=Math.cos(a)*45,yy=Math.sin(a)*16;ctx.strokeStyle=j%2?'#675967':'#514c48';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(xx,yy);ctx.quadraticCurveTo(xx*.5,yy-20,0,-(d.size||2)*25);ctx.stroke();ctx.fillStyle=lit?'#b1a0ca':'#777673';ctx.fillRect(xx-1,yy-1,2,2);}
 }
}
const api={decorate,drawGround,drawObject,drawAdornment};root.FractureCampaignLandmarks=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);

