'use strict';
const $=id=>document.getElementById(id),art=new FractureArt.Art(),cards=[];
let time=0,last=0,lastDraw=0,paused=false,revision=0;
const labels={bullet:['Bullets','Small, fast tracer rounds'],shell:['Tank & artillery shells','Metal rounds with a blast impact'],rocket:['Rockets','Fins, exhaust and smoke'],arrow:['Arrows','Wood shaft, head and feather fletching'],bolt:['Crossbow bolts','Short, flatter-flying quarrels'],javelin:['Javelins','Long thrown spears'],rock:['Stones','Tumbling rock; size varies by weapon'],potion:['Potions','Glass vials and colored splashes'],firepot:['Firepots','Clay vessels with a burning fuse'],acid:['Acid & venom spit','Droplets and a wet impact'],spore:['Spores','Barbed organic pods'],spine:['Biological darts','Bone spines, stingers and venom darts'],spell:['Spells','Runes and a luminous magical impact'],pulse:['Energy pulses','Compact, fast machine bolts'],flame:['Flame','Directional tongues of fire']};
const observer=new IntersectionObserver(entries=>{for(const e of entries)e.target._card.visible=e.isIntersecting;},{rootMargin:'120px'});
function card(host,title,detail,data,description=''){
 const a=document.createElement('article'),c=document.createElement('canvas'),h=document.createElement('h3'),sub=document.createElement('small');
 c.width=256;c.height=host==='projectiles'?80:224;c.setAttribute('role','img');c.setAttribute('aria-label',title+' preview');h.textContent=title;sub.textContent=detail;a.append(c,h,sub);
 if(description){const box=document.createElement('details'),label=document.createElement('summary'),p=document.createElement('p');label.textContent='Purpose & details';p.textContent=description;box.append(label,p);a.append(box);}
 const entry={...data,c,article:a,host,visible:false,drawn:-1,search:(title+' '+detail+' '+description).toLowerCase()};a._card=entry;a.dataset.asset=data.d?.id||data.kind||title;cards.push(entry);$(host).append(a);observer.observe(a);
}
function load(){
 observer.disconnect();cards.length=0;for(const id of ['units','buildings','fortifications','extensions','projectiles'])$(id).replaceChildren();art.cache.clear();art.ruinCache?.clear();
 const f=FD.factions[$('faction').value];$('name').textContent=f.name+' / Units';
 for(const d of f.units){const s=FractureProjectiles.profile(d,f),weapon=d.worker?'Worker':d.transport?'Transport':d.role==='merchant'?'Trade':!d.damage?'Support':s.kind==='melee'?'Close combat':labels[s.kind]?.[0]||s.kind;card('units',d.name,(d.naval?'Naval / ':d.air?'Air / ':'Ground / ')+weapon,{d,f,kind:'unit'},FractureHelp.unit(d));}
 for(const d of f.buildings)card('buildings',d.name,({hq:'Headquarters',inf:'Infantry production',armor:'Heavy production',air:'Flight production',deepMine:'Deep extraction',dock:'Naval production',market:'Trade & merchant recruitment',lab:'Research'})[d.kind]||d.kind,{d,f,kind:'building'},FractureHelp.building(d,f));
 for(const d of f.extensions)card('extensions',d.name,'Attaches to '+FD.buildings[d.building].name,{d,f,kind:'extension'},'A physical extension of '+FD.buildings[d.building].name+'.');
 const wall=f.buildings.find(d=>d.kind==='wall');
 if(wall)for(const [name,mask,angle,gate]of [['Straight wall',17,0,false],['Diagonal wall',34,Math.PI/4,false],['Corner',5,0,false],['Crossroads',85,0,false],['Closed gate',17,0,'closed'],['Open gate',17,0,'open'],['Diagonal gate',34,Math.PI/4,'open']])card('fortifications',name,wall.name,{d:wall,f,kind:'wall',mask,angle,gate},gate?'Three connected sections. Opens for friendly units; enemies remain blocked.':'Connected sections use this civilization\'s wall materials.');
 for(const [kind,[name,desc]]of Object.entries(labels))card('projectiles',name,desc,{kind:'projectile',projectile:kind});
 revision++;filter();
}
function filter(){document.querySelector('main').dataset.view=$('category').value;let count=0;const category=$('category').value,q=$('search').value.trim().toLowerCase();
 for(const card of cards){const match=category==='all'||category===card.host||category==='trade'&&(card.d?.kind==='market'||card.d?.role==='merchant')||category==='naval'&&card.kind==='unit'&&card.d.naval||category==='air'&&card.kind==='unit'&&card.d.air;card.article.hidden=!(match&&card.search.includes(q));if(!card.article.hidden)count++;}
 for(const s of document.querySelectorAll('[data-section]'))s.hidden=!cards.some(c=>c.host===s.dataset.section&&!c.article.hidden);
 $('summary').textContent=FD.factions[$('faction').value].name+' / '+count+' designs shown';$('empty').hidden=count>0;
}
const detailBounds=new WeakMap();
function detailed(x,im){
 let b=detailBounds.get(im);if(!b){const pix=im.getContext('2d').getImageData(0,0,im.width,im.height).data;let l=im.width,t=im.height,r=-1,d=-1;for(let i=0;i<im.width*im.height;i++)if(pix[i*4+3]){const xx=i%im.width,yy=Math.floor(i/im.width);l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,yy);d=Math.max(d,yy);}b=r>=0?{x:l,y:t,w:r-l+1,h:d-t+1}:{x:0,y:0,w:im.width,h:im.height};detailBounds.set(im,b);}
 const scale=Math.min(224/b.w,196/b.h),w=b.w*scale,h=b.h*scale;x.drawImage(im,b.x,b.y,b.w,b.h,128-w/2,212-h,w,h);
}
function paint(im){return FractureArt.paintOwner(im,$('playerColor').value);}
function gateImage(card){const {d,f,mask,angle,gate}=card,c=document.createElement('canvas');c.width=480;c.height=440;const x=c.getContext('2d'),unit=30/(d.size*.53),scale=.65;x.imageSmoothingEnabled=false;
 for(const role of [-1,0,1]){const im=paint(art.building(d,f,{mask,gate:{angle,role,open:gate==='open'}})),dx=role*(Math.cos(angle)-Math.sin(angle))*unit*.8*2,dy=role*(Math.cos(angle)+Math.sin(angle))*unit*.4*2;x.drawImage(im,84+dx*scale,77+dy*scale,480*scale,440*scale);}return c;
}
function draw(card){const {c,d,f,kind}=card,x=c.getContext('2d'),detail=$('viewScale').value==='detail';x.clearRect(0,0,c.width,c.height);x.imageSmoothingEnabled=false;
 if(kind==='unit'){
  const dir=$('direction').value==='rotate'?Math.floor(time/2)%8:+$('direction').value;let action=$('action').value;
  if(['gather','build'].includes(action)&&!d.worker||action==='heal'&&!d.heal)action='idle';
  const frame=Math.floor(time*(action==='attack'?5:7))%(['attack','gather','build','heal'].includes(action)?4:6),im=paint(art.unit(d,f,dir*Math.PI/4,action,frame,d.transport?+$('occupancy').value:0));
  if(detail)detailed(x,im);else{const vs=FractureArt.unitScale(d);x.drawImage(im,128-44.8*vs,142-69.6*vs,89.6*vs,89.6*vs);}
 }else if(kind==='projectile'){
  const name=card.projectile,s={...FractureProjectiles.categories[name],kind:name},t=time%1;x.save();x.translate(22+t*207,48-Math.sin(t*Math.PI)*s.arc);x.scale(2,2);x.rotate(Math.atan2(-Math.cos(t*Math.PI)*s.arc*Math.PI,207));FractureProjectiles.draw(x,s,t,time*7);x.restore();if(t>.8){x.save();x.translate(229,48);FractureProjectiles.impact(x,{projectileKind:name,color:s.color,time:(1-t)*2,max:.4});x.restore();}
 }else if(kind==='extension'){const im=paint(art.extension(d,f));if(detail)detailed(x,im);else x.drawImage(im,0,0,256,224);}
 else{
  const state=$('construction').value,scale=detail?1:Math.min(1,d.size*.53),w=240*scale,h=220*scale,left=128-w/2,top=196-h*.823;
  if(detail&&state==='1')detailed(x,kind==='wall'&&card.gate?gateImage(card):paint(art.building(d,f,kind==='wall'?{mask:card.mask}:null)));
  else if(kind==='wall'){x.drawImage(card.gate?gateImage(card):paint(art.building(d,f,{mask:card.mask})),left,top,w,h);}
  else if(state==='ruin')x.drawImage(art.ruin(d,f,0),left,top,w,h);
  else{const progress=+state;if(progress<1)x.drawImage(art.construction(d,f,progress,false),left,top,w,h);x.globalAlpha=progress<1?.35+progress*.65:1;x.drawImage(paint(art.building(d,f)),left,top,w,h);x.globalAlpha=1;if(progress<1)x.drawImage(art.construction(d,f,progress,true),left,top,w,h);}
 }
 card.drawn=revision;c.dataset.rendered='true';
}
for(const f of Object.values(FD.factions)){const option=document.createElement('option');option.value=f.id;option.textContent=f.name;$('faction').append(option);}
$('faction').onchange=load;$('category').onchange=filter;$('search').oninput=filter;
for(const id of ['action','direction','viewScale','construction','occupancy','playerColor'])$(id).onchange=()=>revision++;
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused));};
function loop(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;if(!paused&&!document.hidden)time+=dt*+$('speed').value;
 if(!document.hidden&&now-lastDraw>=80){lastDraw=now;let built=0;for(const c of cards){if(!c.visible||c.article.hidden)continue;const animated=c.kind==='unit'||c.kind==='projectile';if(c.drawn===revision&&(!animated||paused))continue;if(!animated&&built++>=2)continue;draw(c);}}
 requestAnimationFrame(loop);
}
const requested=new URLSearchParams(location.search);if(FD.factions[requested.get('faction')])$('faction').value=requested.get('faction');if([...$('category').options].some(o=>o.value===requested.get('category')))$('category').value=requested.get('category');
load();requestAnimationFrame(loop);
