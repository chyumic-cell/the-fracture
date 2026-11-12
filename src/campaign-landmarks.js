'use strict';
/* Campaign scenery shares the ordinary terrain/nav state; it does not invent invisible barriers. */
(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function decorate(g,m){
 if(!g.campaign)return;
 g.campaign.landmarks=[];
 // No physical bridge crossings: campaign sites use ordinary land and transports.
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
  // Legacy bridge landmarks are not rendered.
 }
}
function drawBridge(ctx,point,zoom,b){
 const center=point(b.x,b.y,0);if(center.x < -650 || center.x > ctx.canvas.width+650 || center.y < -300 || center.y > ctx.canvas.height+300)return;
 const map=(a,c,z=0)=>{const p=point(b.x+b.ax*a-b.ay*c,b.y+b.ay*a+b.ax*c,0);return {x:p.x,y:p.y-z*zoom};},L=b.length/2,W=b.width/2;
 const face=(v,color,edge)=>polygon(ctx,v.map(q=>map(...q)),color,edge);
 // Continuous masonry side, with stone piers and recessed arches below the walking surface.
 face([[-L,W,0],[L,W,0],[L,W,-28],[-L,W,-28]],'#72786e','#454d49');
 face([[L,-W,0],[L,W,0],[L,W,-28],[L,-W,-28]],'#59645e','#444d47');
 for(let a=-L;a<L;a+=.55)for(let z=-26;z<0;z+=6){const shift=(Math.round(z/6)%2)*.24,left=Math.max(-L,a+shift),right=Math.min(L,a+shift+.53);if(right>left)face([[left,W,z],[right,W,z],[right,W,z+5.7],[left,W,z+5.7]],z%12?'#798074':'#6b7469');}
 for(const a of [-3.8,0,3.8]){const left=map(a-1.3,W,-28),right=map(a+1.3,W,-28),top=map(a,W,-7);ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.quadraticCurveTo(top.x-(right.x-left.x)*.42,top.y,top.x,top.y);ctx.quadraticCurveTo(top.x+(right.x-left.x)*.42,top.y,right.x,right.y);ctx.closePath();ctx.fillStyle='#263d3d';ctx.fill();ctx.strokeStyle='#aaa792';ctx.lineWidth=2*zoom;ctx.stroke();}
 // Muted, staggered paving rather than a flat checkerboard slab.
 face([[-L,-W,0],[L,-W,0],[L,W,0],[-L,W,0]],'#94977f','#b3b29c');
 let row=0;for(let c=-W;c<W;c+=.46,row++)for(let a=-L-(row%2)*.35;a<L;a+=.7){const l=Math.max(-L,a+.012),r=Math.min(L,a+.685),up=Math.min(W,c+.445);if(r<=l)continue;const seed=Math.abs(Math.imul(Math.round(a*70),137)^Math.imul(row,541));face([[l,c,0],[r,c,0],[r,up,0],[l,up,0]],['#999c87','#9fa18b','#939982','#a5a58e'][seed%4],'#818873');for(let j=0;j<4;j++){const x=l+(r-l)*((seed+j*17)%97)/97,y=c+(up-c)*((seed+j*29)%89)/89,q=map(x,y,.1);ctx.fillStyle=j%2?'#c2be9c70':'#515e4f55';ctx.fillRect(Math.round(q.x),Math.round(q.y),zoom,zoom);}}
 for(const c of [-W,W]){face([[-L,c,0],[L,c,0],[L,c,7],[-L,c,7]],c<0?'#777f6b':'#838b74','#515f52');face([[-L,c-.09,7],[L,c-.09,7],[L,c+.09,7],[-L,c+.09,7]],'#b9b69b','#939a7f');for(let a=-L;a<=L;a+=.75){const q=map(a,c,0),r=map(a,c,7);ctx.strokeStyle='#596653';ctx.lineWidth=zoom;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.stroke();}}
}
const gateways=new Map();
function gatewaySprite(f,lit){const key=f.id+':'+lit;if(gateways.has(key))return gateways.get(key);const c=document.createElement('canvas');c.width=c.height=336;const mesh=new root.FractureSpriteMesh(c.getContext('2d'),0,false,{originY:96}),tech=['reptile','industrial','machine','night'].includes(f.style),stone=tech?'#777d70':'#8c9387',trim=tech?'#b39b68':'#b5b29a';
 mesh.material(tech?'metal':'stone');mesh.box(0,0,0,34,22,4,'#6e796d');mesh.box(0,0,4,31,19,3,stone);
 for(const x of [-26,26]){mesh.box(x,0,7,7,10,6,trim);mesh.box(x,0,13,5,7,35,stone);mesh.box(x,0,44,6,8,4,trim);for(let z=19;z<42;z+=9){mesh.box(x,-7.2,z,2.6,.5,3,trim);mesh.material('glow');mesh.box(x,-7.8,z+1,1,.25,1,lit?'#bca6db':'#718c95');mesh.material(tech?'metal':'stone');}}
 // Radial voussoirs share exact inner/outer edges: no detached blocks above the lintel.
 for(let i=0;i<13;i++){const a=i*Math.PI/13,b=(i+1)*Math.PI/13,ring=y=>[[Math.cos(a)*31,y,45+Math.sin(a)*27],[Math.cos(b)*31,y,45+Math.sin(b)*27],[Math.cos(b)*21,y,45+Math.sin(b)*19],[Math.cos(a)*21,y,45+Math.sin(a)*19]];const front=ring(-7),back=ring(7);mesh.face(front,i%2?stone:trim);mesh.face([...back].reverse(),stone);for(let j=0;j<4;j++)mesh.face([front[j],back[j],back[(j+1)%4],front[(j+1)%4]],j===0?trim:stone);}
 mesh.material('glass');const disc=Array.from({length:48},(_,i)=>{const a=i*Math.PI/24;return[Math.cos(a)*20.5,1,35+Math.sin(a)*29];});mesh.face(disc,lit?'#665980':'#304955');
 for(let ring=0;ring<4;ring++){mesh.material('glow');for(let j=0;j<28;j++){const a=j*Math.PI/14,b=(j+.6)*Math.PI/14,r=17-ring*3;mesh.seg([Math.cos(a)*r,.4,35+Math.sin(a)*r*1.35],[Math.cos(b)*r,.4,35+Math.sin(b)*r*1.35],lit?'#a79aba':'#486676',.23);}}
 mesh.material('metal');for(const x of [-18,18]){mesh.box(x,-16,7,4,4,6,stone);mesh.box(x,-16,13,3.2,3.2,1.5,trim);}mesh.finish();gateways.set(key,c);return c;
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
  const f=root.FD.factions[e.campaignFaction||g.players[e.owner].faction],lit=!!g.campaign.sites.find(s=>s.entityId===e.id)?.secured;
  if(root.FractureSpriteMesh)ctx.drawImage(gatewaySprite(f,lit),-100,-171.43,200,200);
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

