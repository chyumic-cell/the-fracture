'use strict';
// Anatomical art profiles are independent of combat roles and never alter unit statistics.
(function(root){
const profiles={
 Engineer:'human',Scout:'human',Rifleman:'human','Rocket Infantry':'human',Medic:'human','Heavy Gunner':'human',Commando:'human',
 'War-Beast':'lizard','Winged Hunter':'wyvern',Familiar:'cat','Magical Beast':'cat','Enchanted Golem':'golem','Broom Rider':'broom','Spell Artillery':'orb',
 'Centaur Scout':'centaur','Centaur Archer':'centaur','Gorgon Seer':'gorgon','Cyclops Stone Thrower':'cyclops','Harpy Scout':'harpy','Harpy Raider':'harpy',Chimera:'chimera',Hydra:'hydra',
 Drake:'dragon','Armored Drake':'dragon',Wyvern:'wyvern','Dragon Whelp':'dragon','Mature Dragon':'dragon','Ancient Dragon':'dragon',
 'Lycan Tracker':'wolf','Lycan Assault Trooper':'wolf','Lycan Heavy Fighter':'wolf','Stitched Horror':'horror','Ghost Scout':'ghost',Wraith:'ghost',Hellhound:'hound',Gargoyle:'gargoyle',
 'Battering Ram':'ram','Heavy Catapult':'catapult','Runic Siege Engine':'runic','Advanced Dwarven Artillery':'cannon',
 'Siege Walker':'crawler','Heavy Walker':'walker','Siege Crawler':'crawler','Hunter-Killer':'walker',Juggernaut:'walker','Construction Drone':'robot','Recon Spider':'robot','Blade Drone':'robot','Pulse Sentry':'robot','Repair Drone':'robot','Command Relay':'robot',
 'Root Colossus':'treant','Carapace Beast':'shellbeast',Brute:'horror',Husk:'husk',Stalker:'husk','Neural Binder':'brain'
};
// Curated uniform colors belong to unit types; player ownership still uses its separate marker.
const uniforms={
 'Kobold Worker':['#a08753','#d0bb86'],'Kobold Scout':['#51745e','#adc29b'],'Kobold Slinger':['#905c48','#d1aa7c'],
 'Draconian Spearman':['#596d88','#b0b8bc'],'Draconian Flameguard':['#8b4938','#c8a274'],'Dragon Sage':['#79698e','#cfbc96'],
 Laborer:['#938360','#c3b78f'],'Skink Scout':['#4d745d','#adc79a'],Legionnaire:['#8b6950','#c2b18b'],'Venom Rifleman':['#567a75','#b6c8a2'],'Shock Guard':['#626477','#c1bac5'],Subjugator:['#88596e','#cbb28e'],'Imperial Guard':['#9a835b','#ddd0a5'],
 Engineer:['#97865d','#c5b987'],Scout:['#67774e','#acb790'],Rifleman:['#526f83','#9baeb1'],
 'Rocket Infantry':['#8a7156','#c5b18a'],Medic:['#b8b9a1','#f0d8bc'],'Heavy Gunner':['#555e68','#a2a7aa'],Commando:['#3d5650','#839987'],
 'Vampire Operative':['#425d6c','#92a9af'],'Vampire Duelist':['#824d61','#c0a18e'],
 'Vampire Marksman':['#4e7164','#a0b49a'],'Blood Mage':['#963e49','#d4ad77'],'Ancient Vampire':['#7c6991','#d3c3a5'],
 'Ghoul Laborer':['#797666','#aaa18a'],'Revenant Soldier':['#617183','#b0b4ab'],'Undead Knight':['#66636e','#bdb7a1'],
 'Apprentice Worker':['#817b91','#b5ac91'],'Spellguard':['#556d8e','#b5c3cd'],'Duelist':['#87634f','#ceb59b'],
 Healer:['#8c9c83','#d8d3ad'],Hexer:['#65784f','#b7b889'],Wardbreaker:['#5e626e','#b4b6c3'],
 Transfigurer:['#45807c','#b2c7a8'],'Grand Wizard':['#79528d','#d2b57d'],
 'Elf Archer':['#4f7c56','#b7b98a'],'Elf Spellweaver':['#647d95','#c1c4b6'],
 'Dwarf Shieldbearer':['#75818c','#c4b98a'],'Dwarf Crossbowman':['#8e7053','#b5aa84'],
 'Orc Warrior':['#816449','#b89f77'],'Orc Berserker':['#755250','#b5a18c'],
 'Goblin Worker':['#90805b','#b6ad86'],'Goblin Scout':['#627352','#a2ad80'],'Goblin Sapper':['#6f6379','#b1a099']
};
function uniform(d,f){const u=root.FractureArt.unitLivery(d,f);return uniforms[d.name]||[u.primary,u.trim];}
function identity(d,f){if(profiles[d.name])return profiles[d.name];if(f.id==='insects'||f.id==='symbiotes')return 'colony';if(/Tank|Fighting Vehicle|Self-Propelled|Aircraft|Gunship|Nightbreaker/.test(d.name))return 'vehicle';if(f.id==='machines')return 'robot';if(/Minotaur/.test(d.name))return 'minotaur';if(/Satyr/.test(d.name))return 'satyr';if(/Kobold/.test(d.name))return 'kobold';if(/Draconian|Dragon Sage/.test(d.name))return 'draconian';if(/Goblin/.test(d.name))return 'goblin';if(/Dwarf/.test(d.name))return 'dwarf';if(/Elf/.test(d.name))return 'elf';if(/Orc/.test(d.name))return 'orc';if(/Troll/.test(d.name))return 'troll';if(f.id==='primates')return 'ape';if(f.id==='reptilians')return /Thrall/.test(d.name)?'thrall':'reptilian';if(f.id==='wizards')return 'wizard';if(f.id==='night')return /Undead|Revenant/.test(d.name)?'skeleton':/Ghoul/.test(d.name)?'ghoul':'vampire';if(f.id==='infernal')return /Imp/.test(d.name)?'imp':'demon';return 'human';}
function render(ctx,d,f,angle,action,frame){
 if(root.FractureSpecialistArt?.render(ctx,d,f,angle,action,frame)||root.FractureMachineArt?.render(ctx,d,f,angle,action,frame)||root.FractureSymbioteArt?.renderUnit(ctx,d,f,angle,action,frame))return true;
 const kind=identity(d,f);
 const {tint,poly,ellipse}=root.FractureArt,dir=Math.round(angle/(Math.PI/4))*Math.PI/4,ca=Math.cos(dir),sa=Math.sin(dir),dead=action==='dead',walk=action==='walk'?Math.sin(frame*Math.PI/3):0,att=action==='attack',work=action==='gather'||action==='build'||action==='heal',phase=frame%4,wind=att?[0,.8,1,.3][phase]:0,seq=[],team=f.color;
 const p=(x,y,z=0)=>{const xx=x*ca-y*sa,yy=x*sa+y*ca;return[56+(xx-yy)*.8,87+(xx+yy)*.4-(dead?z*.16:z)];};
 const depth=(x,y,z)=>x*(ca+sa)+y*(ca-sa)+z*.04;
 const add=(x,y,z,fn)=>seq.push({depth:depth(x,y,z),fn});
 const mesh=new root.FractureSpriteMesh(ctx,dir,dead).pose(d,action,frame);
 const skinColors=new Set(['#be9877','#be9877','#bcab8e','#c4bcb0','#b6a383','#a66e52','#a57c57','#91a275','#a48c61','#8c9b6b','#879b7f','#aaa28a','#9ea38b','#a5a996']);
 const furKinds=['wolf','ape','cat','hound','minotaur','satyr','chimera'],shellKinds=['colony','dragon','wyvern','lizard','shellbeast','hydra','reptilian','draconian','kobold'];
 const materialFor=(color)=>skinColors.has(color)?'skin':/^#(c[5-9]|d[0-9a-f]|e[0-9a-f])/.test(color)?'bone':furKinds.includes(kind)?'fur':shellKinds.includes(kind)?'chitin':['vehicle','robot','walker','crawler','cannon','runic'].includes(kind)?'metal':'cloth';
 const orb=(...args)=>{mesh.material(materialFor(args[6]));mesh.orb(...args);},seg=(...args)=>{mesh.material(materialFor(args[2]));mesh.seg(...args);},face=(v,color)=>{mesh.material(materialFor(color));mesh.face(v,color);},box=(...args)=>{mesh.material(['vehicle','robot','walker','crawler','cannon'].includes(kind)?'metal':'paint');mesh.box(...args);},limb=(...args)=>{mesh.material(materialFor(args[2]));mesh.limb(...args);},loft=(rings,color,material='cloth')=>{mesh.material(material);mesh.loft(rings,color);};
 // Cross-sections follow the animal's spine, giving its ribcage, jaw and tail a continuous surface.
 const spine=(rings,color,material=materialFor(color),sides=12)=>{mesh.material(material);mesh.rings(rings.map(([x,y,z,ry,rz])=>Array.from({length:sides},(_,i)=>[x,y+Math.cos(i*Math.PI*2/sides)*ry,z+Math.sin(i*Math.PI*2/sides)*rz])),color,true);
 if(material==='chitin'&&rings.length>3){for(let j=1;j<rings.length-1;j++){const [x,y,z,ry,rz]=rings[j];if(ry<3)continue;mesh.material('chitin');for(const side of [-1,1])mesh.seg([x,y+side*ry*.65,z+rz*.7],[x-1,y+side*ry*.94,z+rz*.25],tint(color,16),.65);}}
 };
 const tendon=(points,radii,color,material=materialFor(color),sides=8)=>{mesh.material(material);const rings=points.map((p,k)=>{const a=points[Math.max(0,k-1)],b=points[Math.min(points.length-1,k+1)],axis=b.map((q,j)=>q-a[j]),len=Math.hypot(...axis)||1;for(let j=0;j<3;j++)axis[j]/=len;const u=Math.abs(axis[2])>.94?[1,0,0]:[-axis[1],axis[0],0],ul=Math.hypot(...u)||1;for(let j=0;j<3;j++)u[j]/=ul;const v=[axis[1]*u[2]-axis[2]*u[1],axis[2]*u[0]-axis[0]*u[2],axis[0]*u[1]-axis[1]*u[0]];return Array.from({length:sides},(_,i)=>p.map((q,j)=>q+(u[j]*Math.cos(i*Math.PI*2/sides)+v[j]*Math.sin(i*Math.PI*2/sides))*radii[k]));});mesh.rings(rings,color,true);};
 const eye=(x,y,z,color='#d6b877')=>{orb(x,y,z,.68,.68,.56,'#253039');orb(x+.16,y,z+.08,.34,.4,.35,color);},horn=(a,b,color='#d4c4a0',width=2)=>tendon([a,a.map((q,j)=>q+(b[j]-q)*.6),b],[width*.62,width*.34,.06],color,'bone');
 const claw=(x,y,z,forward=1)=>{const scale=kind==='cat'?.55:1;for(let k=-1;k<=1;k++)horn([x,y+k*1.4*scale,z],[x+forward*3.5*scale,y+k*1.7*scale,z-1.2*scale],'#d6cab0',.8*scale);};
 const wings=(x,z,span,color,feather=false)=>{for(const side of [-1,1]){const flap=d.air?(action==='walk'?walk:Math.sin(frame*Math.PI/3)*.35):-.3,tip=[x-7,side*span,z+7+flap*9],elbow=[x+2,side*span*.48,z+13],root=[x,side*4,z];
 if(feather){for(let j=0;j<7;j++){const y=side*(9+j*(span-9)/7),zz=z+8+flap*j,xx=x-3-j*1.7;face([[xx+4,y-side*3,zz+4],[xx+5,y+side*3,zz+3],[xx-13-j*.3,y+side*2,zz-11],[xx-10,y-side*2,zz-10]],tint(color,j%2?18:-10));}}else{face([root,elbow,[x-14,side*8,z-1]],tint(color,-7));face([elbow,tip,[x-21,side*span*.72,z-5]],tint(color,-16));face([elbow,[x-21,side*span*.72,z-5],[x-14,side*8,z-1]],tint(color,-22));for(let j=1;j<5;j++)seg(elbow,[x-15-j,side*(8+j*(span*.72-8)/5),z-2-j*.6],tint(color,5),.35);for(const v of [tip,[x-21,side*span*.72,z-5],[x-14,side*8,z-1]])seg(elbow,v,tint(color,36),1);}
 seg(root,elbow,tint(color,24),2);seg(elbow,tip,tint(color,32),1.5);}};
 const tail=(x,z,length,color)=>spine([[x,0,z,4.5,4.2],[x-length*.24,1,z*.81,3.7,3.4],[x-length*.5,2+walk*1.4,z*.53,2.5,2.2],[x-length*.77,4+walk*2,z*.28,1.3,1.1],[x-length,5+walk*3,3,.18,.2]],color);
 const muzzle=(x,y,z,color,length=7,wolf=false)=>{const feline=kind==='cat'||kind==='chimera',bovine=kind==='minotaur',reptile=!wolf&&!feline&&!bovine,open=att&&phase===2?1.7:.3,wide=bovine?4.7:feline?4.4:reptile?4.5:3.8,snout=feline?length*.68:length;
 spine([[x-4,y,z,wide*.6,3.2],[x-1,y,z+.5,wide,4.2],[x+2.5,y,z,wide*.9,3.6],[x+4.6,y,z-1,wide*.6,1.9],[x+snout,y,z-1.5,wide*.46,1.4]],color);
 spine([[x-1,y,z-2.6,wide*.68,1.6],[x+3,y,z-3-open*.6,wide*.65,1.35],[x+snout-.6,y,z-3.1-open,wide*.42,.8]],tint(color,9));
 for(const side of [-1,1]){face([[x+2,y+side*wide*.73,z-2.3],[x+snout,y+side*wide*.46,z-2.1],[x+snout-.6,y+side*wide*.43,z-3-open],[x+2,y+side*wide*.68,z-3-open*.3]],'#302e29');orb(x+.8,y+side*(wide-.25),z+1.2,1.7,.6,1.1,tint(color,-30));eye(x+1.6,y+side*(wide+.04),z+1.4,wolf?'#d4bd75':reptile?'#d7c178':'#b5c3a1');tendon([[x-1,y+side*(wide-.1),z+2.8],[x+1.6,y+side*wide,z+2.6],[x+3.3,y+side*wide*.82,z+1.8]],[.7,1,.35],tint(color,-12));
 if(reptile){face([[x-3,y+side*wide*.65,z+2],[x-6,y+side*(wide+2),z+3],[x-3,y+side*(wide+1),z-2],[x+1,y+side*wide*.85,z-2]],tint(color,-12));for(const j of [0,1])horn([x+3+j*2.5,y+side*(wide*.6-j*.25),z-2.4],[x+3.2+j*2.5,y+side*(wide*.55-j*.25),z-3.8-open*.5],'#d8c9a6',.65);}
 else if(!bovine){face([[x-3,y+side*2,z+2.8],[x-3.2,y+side*4.2,z+8],[x+.1,y+side*4,z+3.2]],tint(color,-18));face([[x-2.8,y+side*2.4,z+3.2],[x-3.1,y+side*4,z+7.2],[x-1,y+side*3.7,z+3.3]],tint(color,13));horn([x+3,y+side*2.4,z-2.5],[x+3.6,y+side*2.2,z-4-open*.5],'#d8ceaf',.7);}
 else{orb(x-2,y+side*4.8,z+.5,2.5,1.2,1.3,color);}
 if(reptile)orb(x+snout-.7,y+side*wide*.4,z-.8,.7,.35,.45,'#29372d');}
 if(wolf||feline||bovine){spine([[x+snout-.6,y,z-1,wide*.46,1.2],[x+snout+.7,y,z-1.2,wide*.42,1]],'#33352f');if(feline)for(const side of [-1,1])orb(x+snout-1,y+side*1.7,z-2,1.8,1.8,1.2,tint(color,24));}
 };
 const legs4=(length,width,z,color,hooves=false,wyvern=false,center=0)=>{for(const offset of wyvern?[-length]:[-length,length])for(const side of [-1,1]){const x=offset+center,hind=offset<0,bulk=(z<15?.68:1)*(kind==='cat'?.82:1),gait=action==='walk'?root.FractureMotion.step(frame,(hind?0:.5)+(side<0?.5:0),6):{x:0,lift:0},stride=gait.x,hip=[x,side*width,z],knee=[x+(hind?3.6:-2.7)+stride*.45,side*(width+1.2),z*.52+gait.lift*.4],hock=[x+(hind?-2.1:-.7)+stride,side*(width+1.8),4.2+gait.lift],foot=[x+1.8+stride,side*(width+2),1.7+gait.lift];
 limb(hip,knee,color,(hind?8:6.5)*bulk);orb(...hip,(hind?4.6:3.6)*bulk,3.6*bulk,(hind?5.8:5.2)*bulk,color);limb(knee,hock,tint(color,-7),(hind?4.7:4)*bulk);orb(...knee,2.3*bulk,2*bulk,2.3*bulk,tint(color,5));tendon([hock,foot],[1.6,1.7],color);if(hooves){box(foot[0]+.6,foot[1],.5+gait.lift,2.5,1.8,2.5,'#403f35');seg([foot[0]+3,foot[1],.7+gait.lift],[foot[0]+3,foot[1],2.7+gait.lift],'#252d29',.45);}else{spine([[foot[0]-1,foot[1],2+gait.lift,1.8,1.5],[foot[0]+2,foot[1],1.8+gait.lift,2.4,1.3],[foot[0]+3.5,foot[1],1.4+gait.lift,1.8,.7]],tint(color,-9));claw(foot[0]+3,foot[1],1.8+gait.lift);}}};
 const dragonWings=(x,z,span,color)=>{for(const side of [-1,1]){const flap=action==='walk'?walk:Math.sin(frame*Math.PI/3)*.22,root=[x+4,side*5,z],elbow=[x+4,side*span*.42,z+15+flap*3],tip=[x-5,side*span,z+17+flap*8],fingers=[[x-17,side*span*.82,z+1+flap*5],[x-22,side*span*.52,z-2+flap*2],[x-17,side*span*.24,z-4],[x-7,side*6,z-4]],leading=[elbow,tip];
 tendon([root,elbow,tip],[2.7,2,0.3],tint(color,23));const nodes=[tip,...fingers];for(let j=0;j<nodes.length-1;j++){const a=nodes[j],b=nodes[j+1],scallop=a.map((q,k)=>(q+b[k])*.5+(k===0?3:k===2?2:0));face([elbow,a,scallop,b],tint(color,j%2?-11:-4));seg(elbow,b,tint(color,24),j===3?1.4:1.1);seg(a,scallop,tint(color,8),.5);seg(scallop,b,tint(color,8),.5);}face([root,elbow,fingers[3]],tint(color,-9));for(let j=0;j<fingers.length-1;j++)for(const t of [.38,.68]){const a=elbow.map((v,k)=>v+(fingers[j][k]-v)*t),b=elbow.map((v,k)=>v+(fingers[j+1][k]-v)*t);seg(a,b,tint(color,-23),.35);}horn(elbow,[elbow[0]+3,elbow[1]+side*1.5,elbow[2]+5],'#cbb78f',1.4);
 }};
 const weapon=(type,hand,color='#aebbb4')=>{const [x,y,z]=hand,rest=!att;if(type==='none')return;const release=p=>{if(att&&phase===2)ctx.canvas.weaponMuzzle={x:p[0],y:p[1],z:p[2]};};
 if(type==='potion'){release(hand);orb(x,y,z,2,2,3,'#a795ba');seg([x,y,z+2],[x,y,z+5],'#c8c0a5',1.5);return;}if(type==='sword'||type==='axe'||type==='club'||type==='spear'){const end=type==='spear'?[x+(rest?2:23),y,z+(rest?25:4)]:[x+(rest?3:phase===1?-4:18),y,z+(rest?-12:phase===1?20:5)];seg(hand,end,type==='sword'?'#7b8179':'#8b7653',type==='club'?3:1.6);
 if(type==='sword'){const dx=end[0]-x,dz=end[2]-z,len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,base=[x+dx*.13,y,z+dz*.13],tip=[end[0]+dx*.15,y,end[2]+dz*.15],wide=1.7;mesh.material('metal');for(const side of [-1,1]){mesh.face([[base[0]+nx*wide,y,base[2]+nz*wide],[base[0],y+side*.6,base[2]],[tip[0],y,tip[2]]],side===1?'#c5d0c2':'#8c9e98');mesh.face([[base[0]-nx*wide,y,base[2]-nz*wide],[tip[0],y,tip[2]],[base[0],y+side*.6,base[2]]],side===1?'#a6b7b0':'#798e8b');}seg([x+nx*3.3,y,z+nz*3.3],[x-nx*3.3,y,z-nz*3.3],'#b49e6e',1.4);orb(x-dx*.17,y,z-dz*.17,1,1,1,'#c4b481');}
 else if(type==='axe'){const vertices=[[end[0]-4.5,end[2]+5],[end[0]+1,end[2]+6],[end[0]+6,end[2]+3],[end[0]+7,end[2]-2],[end[0]+1,end[2]-4],[end[0]-4.5,end[2]-2]];mesh.material('metal');for(const side of [-1,1])mesh.face(vertices.map(([xx,zz])=>[xx,y+side*.8,zz]),side>0?'#b4c0b6':'#768b83');for(let j=0;j<vertices.length;j++){const a=vertices[j],b=vertices[(j+1)%vertices.length];mesh.face([[a[0],y-.8,a[1]],[b[0],y-.8,b[1]],[b[0],y+.8,b[1]],[a[0],y+.8,a[1]]],'#d0d3bd');}box(end[0]-2,y,end[2]-2,1.4,1.6,5,'#687b74');}
 else if(type==='spear'){const dx=end[0]-x,dz=end[2]-z,len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,tip=[end[0]+dx/len*7,y,end[2]+dz/len*7];for(const side of [-1,1]){face([[end[0]+nx*2,y,end[2]+nz*2],tip,[end[0],y+side*.55,end[2]-1]],side>0?'#cbd2ba':'#899d94');face([[end[0]-nx*2,y,end[2]-nz*2],[end[0],y+side*.55,end[2]-1],tip],side>0?'#a8b7a4':'#758d86');}seg([end[0]-dx/len*3,y,end[2]-dz/len*3],end,'#b6a779',2.1);}
 else{tendon([[end[0]-(end[0]-x)*.3,y,end[2]-(end[2]-z)*.3],end,[end[0]+(end[0]-x)*.08,y,end[2]+(end[2]-z)*.08]],[2.4,4,3.4],'#82755d','wood');for(const side of [-1,1])horn([end[0],y+side*2.6,end[2]],[end[0]+2,y+side*5,end[2]+2],'#b5b39a',1.2);}
 }else if(type==='bow'){release([x+4,y,z]);const bx=x,bz=z+(att?0:-2),top=[bx,y,bz+10],bottom=[bx,y,bz-10],mid=[bx+4,y,bz];seg(top,mid,'#b79c66',1.4);seg(mid,bottom,'#a88e5b',1.4);const pull=[bx-(att&&phase<2?(phase===0?3:10):0),y,bz];seg(top,pull,'#d5c9a5',.6);seg(bottom,pull,'#d5c9a5',.6);if(att&&phase<2)seg(pull,[bx+9,y,bz],'#d4c6a1',.75);
 }else if(type==='staff'){release([x,y,z+18]);seg([x,y,3],[x,y,z+17],'#8d8064',1.8);orb(x,y,z+18,2.5,2.5,3.5,team);for(const side of [-1,1])horn([x,y+side*2,z+15],[x,y+side*4,z+20],'#c5b080',1);
 }else if(type==='rock'){release([x+3,y,z]);orb(x+3,y,z,5,5,5,'#9c9f8c');}
 else if(type==='sling'){release([x+5,y,z+7]);seg([x,y,z],[x+5,y,z+(att?7:-8)],'#ae996b',.8);orb(x+5,y,z+(att?7:-8),1.5,1,1,'#a3a38c');}
 else{const length=type==='rocket'?20:type==='heavy'?18:type==='crossbow'?10:14,tip=[x+length,y,z+(att?0:-5)];release(tip);seg([x-4,y,z+1],tip,type==='rocket'?'#768b79':'#5d706b',type==='rocket'?5:type==='heavy'?3.7:2.2);box(x+2,y,z-1.8,4,1.65,3.5,'#4b615c');box(x-4,y,z-.5,2.3,1.5,2.5,'#596c62');seg([x+1,y,z-1],[x-.5,y,z-5],'#384b46',2);if(type!=='crossbow'&&type!=='rocket'){box(x+4,y,z-5.5,1.3,1.1,4,'#334a43');seg([x+2,y,z+3],[x+7,y,z+3],'#a2aea0',1.15);for(let j=0;j<3;j++)seg([x+7+j*1.5,y-1,z-1.5],[x+7+j*1.5,y+1,z-1.5],'#9da89a',.55);}if(type==='crossbow')seg([x+7,y-7,z],[x+7,y+7,z],'#9d875e',2);if(type==='heavy')for(const side of [-1,1])seg([x+7,y+side*1.7,z],[tip[0],tip[1]+side*1.7,tip[2]],'#9ba99c',.8);if(att&&phase===2&&type!=='crossbow')orb(...tip,3,2,2,'#edca79');}
 };
 const shield=(x,y,z,color=team,large=false)=>{const w=large?7:5,h=large?10:7,ring=[[x,y-w,z+h-2],[x,y-w,z-h+2],[x,y,z-h-3],[x,y+w,z-h+2],[x,y+w,z+h-2],[x,y,z+h+1]];mesh.material('metal');for(let j=0;j<ring.length;j++){mesh.face([ring[j],ring[(j+1)%ring.length],[x+3,y,z]],j%2?tint(color,-9):color);mesh.seg(ring[j],ring[(j+1)%ring.length],'#b6b099',.9);}mesh.orb(x+3.2,y,z,1.5,2.2,2.2,'#c5b284');for(const side of [-1,1]){mesh.seg([x+1.8,y+side*3,z+4],[x+2.5,y+side*2,z-3],tint(color,35),.6);}};
 if(kind==='vehicle'){
 const col=f.id==='night'?'#665e76':f.id==='reptilians'?'#7e8955':'#687e79',ifv=/Fighting Vehicle/.test(d.name),siege=d.role==='siege',r=action==='walk'?frame*.8:0;
 if(d.air){box(-1,0,9,18,4,5,col);orb(13,0,15,8,4,4,'#456c78');face([[24,0,11],[-12,-26,9],[-17,-23,9],[-8,0,12],[-17,23,9],[-12,26,9]],col);for(const side of [-1,1]){box(-15,side*3,13,4,1,8,col);seg([-4,side*15,9],[12,side*15,9],'#b4b9a6',3);orb(-18,side*3,11,2,2,2,'#c1a875');}if(d.role==='gunship'){seg([0,0,15],[0,0,28],'#8b9c92',2);seg([-Math.cos(r)*27,-Math.sin(r)*27,29],[Math.cos(r)*27,Math.sin(r)*27,29],'#4a5b57',1.7);seg([Math.sin(r)*27,-Math.cos(r)*27,29],[-Math.sin(r)*27,Math.cos(r)*27,29],'#65766d',1.7);for(const side of [-1,1])seg([-13,side*7,6],[13,side*7,6],'#9caaa0',2);}}
 else{for(const side of [-1,1]){const outer=[[-20,3],[-16,.8],[15,.8],[20,3],[20,7],[16,10],[-16,10],[-20,7]],inner=[[-17,4],[-14,2.7],[13,2.7],[17,4],[17,6],[13.5,8],[-13.5,8],[-17,6]],yy=side*15.6;
 box(0,side*11,2,18,3.7,6,'#303f3b');for(let i=-14;i<=14;i+=7){orb(i,side*14.6,5,3.3,1.3,3.3,'#7f8a78');orb(i,side*15.9,5,1.3,.28,1.3,'#b0b39b');seg([i-Math.cos(r)*2,side*16,5-Math.sin(r)*2],[i+Math.cos(r)*2,side*16,5+Math.sin(r)*2],'#54675f',.8);}
 mesh.material('metal');for(let j=0;j<outer.length;j++){const a=outer[j],b=outer[(j+1)%outer.length],c=inner[j],e=inner[(j+1)%inner.length];mesh.face([[a[0],yy,a[1]],[b[0],yy,b[1]],[e[0],yy,e[1]],[c[0],yy,c[1]]],j%2?'#657365':'#506256');mesh.face([[a[0],side*7.5,a[1]],[b[0],side*7.5,b[1]],[b[0],yy,b[1]],[a[0],yy,a[1]]],'#596a5d');const count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3));for(let k=0;k<count;k++){const t=(k+.35+(r%1)*.35)/count,xx=a[0]+(b[0]-a[0])*t,zz=a[1]+(b[1]-a[1])*t;mesh.seg([xx,side*7.5,zz+.2],[xx,side*15.9,zz+.2],'#8e9780',.9);}}
 box(-1,side*11,9,17,3,2,col);for(let j=-12;j<=12;j+=6){box(j,side*13.9,7.9,2.7,.5,3.4,tint(col,9));seg([j,side*14.5,8.2],[j,side*14.5,10.8],'#a4ad96',.6);}}
 box(0,0,6,21,9,7,col);face([[22,-9,7],[22,9,7],[14,9,14],[14,-9,14]],'#83968a');for(const side of [-1,1]){box(18,side*7,10,1.4,1.3,1.6,'#c4be8d');seg([20,side*7,7],[17,side*7,7],'#b5b397',1.4);face([[-17,side*9,12],[15,side*9,12],[11,side*11,15],[-13,side*11,15]],tint(col,-6));}box(-3,0,13,ifv?13:9,7,ifv?5:7,col);if(!ifv){loft([[-2,0,18,9,7.8],[-2,0,21.8,8.3,7],[-3,0,23.5,5.8,5.2]],col,'metal');box(-9,0,17,5,6,5,col);for(const side of [-1,1]){face([[5,side*2,18],[6,side*5,19],[3,side*7,22],[-2,side*7,22]],tint(col,12));seg([2,side*7.6,19],[-7,side*7.6,19],'#b3b29a',.8);}}const barrel=siege?34:ifv?26:28;seg([4,0,18],[barrel,0,18],'#9aa99a',ifv?2:4);orb(barrel,0,18,.8,2,2,'#2f3e3c');orb(-4,-3,22,4,3,1,'#3e514d');seg([-4,-3,24],[5,-3,24],'#657a70',1.3);for(const side of [-1,1]){box(-10,side*9,10,7,2,3,'#8d9076');for(let j=0;j<3;j++)seg([-8+j*3,side*7,20],[-8+j*3,side*9,23],'#b1af8d',1.5);}for(let j=-2;j<=2;j++)box(-14,j*2.5,14,4,.6,1,'#354845');seg([-12,-6,17],[-12,-6,31],'#a3b4a0',.65);}
 }else if(kind==='colony'){
 const fungal=f.id==='symbiotes',termite=/Termite|Bombardier/.test(d.name),mass=d.worker?.78:d.name==='Soldier Ant'?1.13:d.role==='siege'?1.35:d.role==='heavy'?1.3:d.role==='scout'?.64:1,col=root.FractureArt.mixColor(termite?'#b39c67':'#8e673c',root.FractureArt.unitLivery(d,f).primary,.72);
 for(let j=0;j<3;j++)for(const side of [-1,1]){const x=(j-1)*7,step=walk*(j%2?1:-1)*side*4;seg([x,side*4,13],[x-3+step,side*11*mass,7],col,2.3);orb(x-3+step,side*11*mass,7,1.5,1.5,1.5,'#b3a478');seg([x-3+step,side*11*mass,7],[x+3+step,side*19*mass,1],col,1.6);}
 spine([[-22*mass,0,13,1.6,2],[-18*mass,0,14,5.2*mass,5.3*mass],[-12*mass,0,15,7.2*mass,7*mass],[-6*mass,0,15,5.5*mass,5.8*mass],[-2,0,15,2.8,3.3]],col,'chitin');
 for(let j=0;j<4;j++){const x=-19*mass+j*4.4*mass,w=(4.1+Math.sin((j+.5)/4*Math.PI)*2.4)*mass;spine([[x-1.5,0,15,w*.93,w*.81],[x,0,15,w,w*.88],[x+1.2,0,15,w*.89,w*.8]],tint(col,j%2?7:-6),'chitin',10);}
 spine([[-1,0,16,2.5,3.1],[2,0,17,5.3,5.4],[6,0,18,4.6,4.8],[8,0,18,2.6,3.1]],tint(col,7),'chitin');spine([[7,0,19,2.6,3.2],[10,0,20,d.role==='melee'?6:4.6,4.8],[14,0,19,3.6,3.4],[16,0,18,2.3,2.5]],tint(col,-3),'chitin',10);
 for(const side of [-1,1]){face([[8,side*3,23],[11,side*4.3,23.8],[14,side*3,21.6],[11,side*4.6,20.4]],tint(col,15));tendon([[14,side*3,18],[19+wind*2,side*6,17+wind*2],[23+wind*2,side*4,15+wind*3],[24,side*1.5,16+wind*3]],[2.2,1.8,1,.1],tint(col,24),'chitin');}
 for(let j=0;j<4;j++)seg([-17+j*3,-5,17],[-17+j*3,5,17],tint(col,-23),.65);
 for(const side of [-1,1]){eye(12,side*3,21,'#d8bf74');seg([12,side*3,21],[18,side*(d.role==='scout'?12:8),d.role==='scout'?33:28],tint(col,20),.8);seg([13,side*3,18],[20+wind*3,side*8,15+wind*4],tint(col,25),d.role==='melee'?3:1.8);seg([20+wind*3,side*8,15+wind*4],[24,side*2,14+wind*4],'#c7b28b',1.5);}
 // Caste anatomy remains obvious in silhouette, including without the color palette.
 if(d.name==='Worker Ant'){for(const side of [-1,1]){spine([[-12,side*5,17,2.4,3],[-9,side*5,19,3,3.5],[-6,side*5,17,2.4,3]],'#b09b6c','chitin');}}
 if(d.name==='Scout Ant'){for(const side of [-1,1])tendon([[12,side*3,21],[16,side*12,33],[8,side*20,34]],[.85,.6,.1],tint(col,25),'chitin');}
 if(d.name==='Soldier Ant'){
  spine([[7,0,21,5.2,4.5],[11,0,23,8.5,7],[16,0,21,6.7,5],[18,0,19,3.5,3]],tint(col,-7),'chitin');
  for(const side of [-1,1])tendon([[17,side*4.5,19],[23+wind,side*11,18],[29+wind,side*7,15],[27,side*2,14]],[3.4,2.5,1.2,.15],'#c2aa7e','chitin');
 }
 if(d.name==='Acid Spitter'){spine([[-21,0,17,3,4],[-15,0,24,8,10],[-7,0,25,8.2,9],[-2,0,20,3,4]],'#83975c','chitin');for(const side of [-1,1])for(let j=0;j<3;j++)seg([-18+j*5,side*5,26],[-15+j*5,side*7,19],'#c1cc8a',1);}
 if(d.name==='Royal Guard'){spine([[-14,0,22,7,5],[-8,0,27,11,8],[0,0,27,9,8],[8,0,24,6,5]],'#796142','chitin');for(const side of [-1,1]){face([[1,side*3,29],[-2,side*7,40],[-7,side*10,30]],'#ccb879');horn([13,side*4,24],[18,side*8,35],'#d7c69d',2);}}
 if(d.worker){for(const side of [-1,1])seg([16,side*4,16],[21,side*6,work?12+phase*3:13],'#c7b487',2);orb(-12,0,19,6,5,3,tint(col,17));}
 if(d.role==='heavy'){for(let j=0;j<4;j++)orb(-11+j*5,0,21,5,10,3,tint(col,j%2?10:-13));}
 if(d.role==='rifle'||d.name==='Spitter'){orb(-8,0,23,8,6,6,fungal?'#9eb77c':'#b2b86d');seg([4,0,21],[20,0,21],col,3);orb(20,0,21,1,2,2,'#3b4931');}
 if(d.role==='siege'){orb(-9,0,23,14,9,9,col);for(const side of d.name==='Bombardier Caste'?[-1,1]:[0]){const end=d.name==='Bombardier Caste'?[4,side*4,38]:[18,0,26];seg([-3,side*4,25],end,tint(col,15),5);orb(...end,2,2,2,'#354333');}}
 if(d.role==='aa'){seg([4,0,22],[27,0,34],tint(col,30),3);for(const side of [-1,1])horn([6,side*4,20],[14,side*10,31],'#d0bd8c',2);}
 if(d.role==='elite'){for(const side of [-1,1]){horn([0,side*5,20],[-6,side*10,35],'#cbb47e',2);seg([10,side*4,20],[23,side*7,23+wind*4],tint(col,27),3);}}
 if(d.role==='stealth'){for(const side of [-1,1])orb(-13,side*7,16,4,3,5,'#b3a66a');}
 if(d.air){for(const side of [-1,1]){face([[0,side*3,21],[-8,side*(d.role==='fighter'?32:25),27+walk*5],[-20,side*20,16],[-6,side*3,18]],'#a8b6a0');for(let j=0;j<4;j++)seg([0,side*3,21],[-7-j*3,side*(13+j*4),22+walk*3],'#c9c8a3',.5);}}
 if(fungal){for(let j=0;j<4;j++){seg([-13+j*5,0,19],[-14+j*5,0,28+j%2*3],col,2);orb(-14+j*5,0,28+j%2*3,4,4,2,'#a8b28b');}for(let j=0;j<7;j++)orb(-14+j*3,j%2?4:-4,22,1.3,1.3,1,'#d4c78f');if(d.name==='Listener'){seg([0,0,23],[0,0,40],col,2);orb(0,0,40,9,1.5,6,'#b6c29d');}}
 }else if(['dragon','wyvern','lizard','hound','cat','chimera','hydra','shellbeast'].includes(kind)){
 const ancient=d.name==='Ancient Dragon',mature=d.name==='Mature Dragon',small=d.name==='Dragon Whelp'||d.name==='Familiar',dragon=['dragon','wyvern','lizard'].includes(kind),col=({'Drake':'#7f674a','Armored Drake':'#566a73','Wyvern':'#507d68','Dragon Whelp':'#c08b51','Mature Dragon':'#985a45','Ancient Dragon':'#686482'})[d.name]|| (kind==='hound'?'#6b5147':kind==='hydra'?'#718b68':kind==='chimera'?'#af9263':kind==='cat'?'#938393':kind==='shellbeast'?'#8b9674':ancient?'#9b6650':mature?'#a67c52':kind==='wyvern'?'#829277':'#9b8e61'),length=small?8:ancient?18:mature?16:13,z=small?12:19,broad=small?5:kind==='hound'?6.3:kind==='cat'?6:8;
 // Fit ownership bands to the small familiar and to the hydra's visible necks.
 if(d.name==='Familiar')mesh.ownership([{x:[-5,-1],y:[-7,7],z:[8,20]}]);
 if(kind==='hydra')mesh.ownership([{x:[-8,-3],y:[-13,13],z:[16,30]},{x:[5,14],y:[-10,10],z:[29,32]}]);
 legs4(kind==='wyvern'?7:length*.65,small?3.8:6.3,z,col,false,kind==='wyvern');
 spine([[-length,0,z-1,broad*.35,3],[-length*.76,0,z,broad*.79,z*.38],[-length*.36,0,z-1,broad*.86,z*.36],[length*.05,0,z-2,broad*.73,z*.32],[length*.48,0,z+.4,broad,z*.43],[length*.78,0,z+1,broad*.82,z*.4],[length*.9,0,z+2,broad*.42,z*.26]],col);
 const tl=small?16:26;spine([[-length+2,0,z-1,broad*.52,3.5],[-length-tl*.25,1,z*.75,broad*.37,2.8],[-length-tl*.52,2+walk,z*.47,broad*.23,1.7],[-length-tl*.8,4+walk*2,z*.25,.8,.8],[-length-tl,5+walk*3,3,.12,.15]],col);
 // Broad shoulder blades and haunches merge into the chest and pelvis, above articulated elbows/hocks.
 for(const side of [-1,1]){limb([length*.3,side*broad*.74,z+4],[length*.65,side*broad*.78,z-1],tint(col,-3),small?5:7.2);limb([-length*.65,side*broad*.65,z+3],[-length*.4,side*(broad*.8),z-1],tint(col,2),small?5:8);}
 if(kind==='hydra'){for(let j=-1;j<=1;j++){const zz=42-Math.abs(j)*4;tendon([[5,j*3,22],[8,j*5,30],[12,j*8,zz-1],[18,j*10,zz]],[4.9,4.3,3.5,3.1],col);muzzle(18,j*10,zz,col,6);for(const side of [-1,1])horn([15,j*10+side*3,zz+3],[10,j*10+side*6,zz+7],'#c2b58f',1.4);}}
 else{const headZ=z+(kind==='cat'?6:kind==='hound'?9:13)+(att?wind*3:0);tendon([[length*.57,0,z+3],[length*.8,0,z+(kind==='cat'?4:kind==='hound'?7:9)],[length+1,0,headZ-1],[length+5,0,headZ]],[small?3.5:6.2,small?3:5.1,small?2.7:3.9,small?2.2:3.5],col);muzzle(length+5,0,headZ,col,kind==='hound'?8:small?5:8,kind==='hound'||kind==='cat');
 if(kind==='chimera'){for(const side of [-1,1])for(let j=0;j<5;j++)face([[length-1-j,side*(4+j*.45),z+14-j],[length-6-j,side*(7+j*.2),z+10-j],[length-1-j,side*5,z+7-j]],tint(col,j%2?-24:-9));tendon([[0,5,24],[2,7,33],[7,9,40]],[4,3.2,2.7],'#a19b7b');muzzle(7,9,40,'#a19b7b',4);for(const side of [-1,1])tendon([[5,9+side*3,44],[1,9+side*6,47],[-1,9+side*5,43],[1,9+side*4,41]],[1.8,1.5,.9,.12],'#d1c09a','bone');}
 }
 if(dragon){for(let j=0;j<6;j++){const x=-length*.7+j*length*.25,w=broad*(.6+Math.sin(j*Math.PI/6)*.24);face([[x-2,-w,z-4.5],[x+1,-w,z-5],[x+2,0,z-7],[x+1,w,z-5],[x-2,w,z-4.5],[x-1,0,z-6.5]],tint(col,18+j%2*7));}
 for(const side of [-1,1]){for(let j=0;j<4;j++){const x=-length*.5+j*length*.32;face([[x-2,side*broad*.8,z+3],[x+2,side*broad*.91,z+2],[x+1,side*(broad+.2),z-.6],[x-2,side*broad*.86,z+1]],tint(col,j%2?-9:5));}tendon([[length+1,side*3,z+16],[length-3,side*5,z+20],[length-8,side*6,z+20.5]],[2.1,1.3,.06],'#c9b991','bone');horn([length+1,side*4.2,z+11],[length-3,side*7,z+10],'#bcaa82',1.2);}
 for(let j=0;j<7;j++){const x=-length-10+j*(length*1.8+10)/6,zz=x< -length?z*.65:z+6.7;face([[x-2,0,zz],[x-3,0,zz+(ancient?6:4.6)],[x+2.5,0,zz+.2]],'#b6a27a');}
 if(d.air)dragonWings(-2,z+6,ancient?37:mature?33:small?23:30,(ancient?'#9699b3':mature?'#704136':small?'#d3ab70':tint(col,-19)));
 if(/Armored/.test(d.name)||kind==='lizard'){for(let j=0;j<4;j++){const x=-length*.6+j*length*.4;spine([[x-2.2,0,z+2,broad+1,4.2],[x,0,z+2,broad+1.5,5.3],[x+2,0,z+2,broad+.7,4.5]],'#7b877e','metal',10);for(const side of [-1,1])horn([x,side*(broad+1),z+3],[x-2,side*(broad+4),z+6],'#c1b99d',1.5);}}
 if(d.name==='Drake'){for(let j=0;j<4;j++)horn([-9+j*6,0,z+7],[-12+j*6,0,z+14-j*.6],'#c6ad7b',2);}
 if(small&&d.name==='Dragon Whelp'){for(const side of [-1,1])face([[length+1,side*3,z+12],[length-4,side*8,z+18],[length-7,side*5,z+11]],'#d8b77b');}
 if(mature){for(const side of [-1,1])for(let j=0;j<3;j++)face([[length-2-j*3,side*4,z+12],[length-6-j*3,side*(9-j),z+15],[length-7-j*3,side*5,z+8]],'#bb8b5a');}
 if(ancient)for(const side of [-1,1])horn([length+2,side*2,z+17],[length-4,side*3,z+25],'#d2c09a',1.7);
 if(att&&phase===2&&d.range>2)orb(length+16,0,z+9,5,3,3,'#e2a767');}
 if(kind==='hound'){for(const side of [-1,1])for(let j=0;j<5;j++)face([[5-j*3,side*3,z+7],[2-j*3,side*5,z+10],[j*-3,side*4,z+3]],j%2?'#8e513c':'#57433b');for(const side of [-1,1])horn([length+2,side*3,z+16],[length-5,side*6,z+20],'#b99870',1.6);}
 if(kind==='shellbeast'){for(let j=0;j<5;j++){const x=-length+3+j*5;spine([[x-3,0,z+3,8.6,5],[x,0,z+4,10.3,8],[x+2.7,0,z+3,9,5]],tint(col,j%2?7:-6),'chitin',10);for(const side of [-1,1])horn([x,side*9,z+5],[x-3,side*13,z+8],'#c9bd96',1.9);}}
 if(d.name==='Familiar'){mesh.material('glow');mesh.face([[27,6,30],[29,6,27],[27,6,24],[25,6,27]],'#bba6d0');mesh.face([[27,6,30],[27,8,27],[27,6,24],[27,4,27]],'#8f86b4');if(att&&phase===2)mesh.orb(27,6,27,2.4,2.4,2.4,'#d2c1e3');}
 if(kind==='cat'){for(const side of [-1,1]){for(let j=0;j<3;j++)seg([length+9,side*3,z+5-j*.6],[length+9+j,side*8,z+5-j],'#c6bcaf',.45);if(!small){face([[length-1,side*4,z+12],[length-5,side*9,z+10],[length-6,side*6,z+4],[length+1,side*5,z+6]],tint(col,20));horn([length+4,side*2,z+10],[length+1,side*4,z+15],'#b7a8c3',1.5);}}}
 }else if(['ram','catapult','runic','cannon'].includes(kind)){
 const timber='#917852',metal='#82928a';for(const x of [-14,14])for(const y of [-10,10]){orb(x,y,4,4,2,5,'#5f604d');orb(x,y,4,2,2.1,2,'#b4ac88');const r=action==='walk'?frame*.8:0;seg([x-Math.cos(r)*3,y,4-Math.sin(r)*3],[x+Math.cos(r)*3,y,4+Math.sin(r)*3],'#c8b58a',1);}box(0,0,5,20,9,4,timber);for(const y of [-8,8])seg([-16,y,8],[15,y,8],'#b0a17b',2);
 if(kind==='ram'){seg([-17,0,14],[25,0,14],timber,10);orb(25,0,14,5,5,5,metal);for(const x of [-9,4,16])seg([x,-6,15],[x,6,15],metal,2);face([[-20,-13,15],[20,-13,15],[20,0,29],[-20,0,29]],'#69766a');face([[-20,13,15],[20,13,15],[20,0,29],[-20,0,29]],'#84927a');}
 else if(kind==='cannon'){seg([-5,0,15],[28,0,20],metal,8);orb(28,0,20,2,3,3,'#273b36');box(-4,0,10,9,8,8,metal);}
 else{for(const y of [-7,7]){seg([-10,y,8],[0,y,29],timber,3);seg([10,y,8],[0,y,29],timber,3);}const arm=att?(phase===1?-15:phase===2?18:8):-13;seg([0,0,29],[arm,0,44-wind*10],timber,4);orb(arm,0,47-wind*10,5,5,4,kind==='runic'?team:'#a9aa92');seg([0,-8,27],[0,8,27],metal,2);if(kind==='runic')for(const y of [-7,7])orb(0,y,30,2,2,3,'#a3c9c1');}
 }else if(['robot','walker','crawler','orb','brain'].includes(kind)){
 const mechanical=kind!=='brain',col=mechanical?'#829b9a':'#b7a18c',large=['walker','crawler'].includes(kind),n=kind==='walker'?2:kind==='crawler'?4:3;
 for(let j=0;j<n;j++)for(const side of [-1,1]){const x=(j-(n-1)/2)*8,step=walk*(j%2?1:-1)*side*4;seg([x,side*5,large?23:15],[x+step-3,side*13,10],col,3);orb(x+step-3,side*13,10,2,2,2,team);seg([x+step-3,side*13,10],[x+step+3,side*17,2],col,2);box(x+step+4,side*17,1,3,2,2,'#4e6661');}
 if(kind==='brain'){orb(0,0,24,14,10,12,col);for(let i=0;i<7;i++)seg([-9+i*3,-7,28],[-10+i*3,7,28],tint(col,-18),1.5);for(const side of [-1,1])seg([0,side*7,17],[-11,side*18,3],'#869f81',2);eye(10,-4,27,'#a5dbb3');}
 else if(kind==='orb'){orb(0,0,24,12,12,11,'#7d889a');for(const side of [-1,1]){seg([-9,side*9,13],[4,side*14,32],'#b7aa78',2);orb(4,side*14,32,2,2,3,team);}orb(0,0,26,7,7,7,'#abd7d2');}
 else{box(0,0,large?19:13,large?12:8,large?9:6,large?10:7,col);orb(6,0,large?31:23,large?7:5,large?6:4,4,'#586f72');eye(10,-3,large?32:24,'#95e2db');box(-8,0,large?26:19,4,5,2,'#445c5c');if(d.worker){for(const side of [-1,1]){seg([8,side*4,19],[18,side*7,12+(work?phase*3:0)],col,2);seg([18,side*7,12+(work?phase*3:0)],[22,side*3,14+(work?phase*3:0)],'#c0b993',1.5);}}
 else if(d.role==='support'){orb(-6,0,27,4,4,5,'#b6d6b3');seg([5,0,23],[19,0,21],team,2);}
 else if(d.role==='scout'){seg([-4,0,24],[-4,0,37],col,1);orb(-4,0,37,5,5,2,'#a0c7bc');}
 else if(d.role==='melee')for(const side of [-1,1])weapon('sword',[10,side*7,20+wind*8]);
 else{const end=d.role==='siege'?35:26;seg([8,0,large?30:22],[end,0,(large?30:22)+wind*2],col,4);orb(end,0,large?30:22,1.5,2,2,'#2b4140');if(d.name==='Juggernaut')for(const side of [-1,1])box(-5,side*12,28,7,3,7,'#5b7271');}
 if(d.name==='Hunter-Killer'){for(const side of [-1,1]){seg([2,side*11,27],[25,side*12,25],'#9db3aa',3);box(-8,side*8,28,3,3,5,'#506a69');}}
 if(d.name==='Command Relay'){seg([-4,0,24],[-4,0,43],'#a3bab1',2);for(let j=0;j<3;j++)orb(-4,0,31+j*5,7-j,7-j,1,'#91bfb6');}
 if(d.name==='Sentinel'){for(const side of [-1,1]){box(-2,side*13,14,7,3,6,'#5d7778');seg([4,side*13,17],[23,side*13,17],'#9fb5ae',3);}}
 if(d.name==='Interceptor Drone')face([[20,0,18],[-14,-22,18],[-8,0,22],[-14,22,18]],'#8fa8a6');
 if(d.air)wings(-2,25,24,'#869fa0');}
 }else if(kind==='ghost'){
 const col=d.name==='Wraith'?'#91b9b7':'#b3cec2';orb(0,0,29,5,4,5,col);face([[0,-7,26],[0,7,26],[-7,11,4],[-3,3,10],[-9,0,2],[-3,-5,11],[-7,-10,5]],tint(col,-18));for(const side of [-1,1])seg([0,side*5,25],[8+wind*8,side*10,18],col,2);eye(4,-2,30,'#d8efd1');if(d.name==='Wraith'){seg([7,7,6],[7,7,46],'#718b85',2);face([[7,7,46],[21,7,43],[28,7,35],[15,7,40],[7,7,40]],'#c5d4c6');}
 }else{
 const wolf=kind==='wolf',ape=kind==='ape',bull=kind==='minotaur',stone=kind==='golem',centaur=kind==='centaur',harpy=kind==='harpy',demon=['demon','imp','gargoyle'].includes(kind),small=['goblin','kobold','imp'].includes(kind),huge=['troll','cyclops','horror','treant','golem'].includes(kind)||/Archdemon|Greater Demon|Siege Fiend/.test(d.name),short=kind==='dwarf';
 const primates={Gatherer:[30,6.5,'#a87544'],Runner:[24,4.2,'#71664f'],'Club Warrior':[34,8,'#645e57'],'Spear Warrior':[30,5.4,'#907855'],Slinger:[27,4.8,'#776f66'],'Javelin Hunter':[31,5.7,'#777d73'],Shieldback:[37,9,'#606c6e'],'Powder Gunner':[29,5.8,'#94958c'],'Firepot Thrower':[32,6.4,'#a16945'],'Silverback Champion':[40,9.4,'#949a97'],'Great Stone Thrower':[42,10,'#777266']},apeForm=primates[d.name]||[31,7,'#8b7660'];
 const skin=({wolf:d.name==='Lycan Tracker'?'#9b917a':d.name==='Lycan Assault Trooper'?'#838d89':'#738083',ape:apeForm[2],minotaur:'#9e8060',golem:'#9a9e92',goblin:'#91a16e',kobold:'#a18d64',draconian:'#a48c61',reptilian:'#91a275',orc:'#8c9b6b',troll:'#879b7f',cyclops:'#bcab8e',horror:'#aaa28a',husk:'#9ea38b',ghoul:'#a5a996',skeleton:'#c5c4ae',vampire:'#c4bcb0',demon:'#a66e52',imp:'#a57c57',gargoyle:'#939c93',treant:'#8c9170',satyr:'#b6a383'})[kind]||'#be9877';
 let cloth=({human:d.role==='heavy'?'#48565a':d.role==='scout'||d.role==='stealth'?'#53604c':'#586965',wizard:'#686397',elf:'#50856b',dwarf:'#777f7c',orc:'#786d53',vampire:'#594658',ghoul:'#756e68',skeleton:'#6b7780',satyr:'#b09a69',minotaur:'#967e57',draconian:'#967952',reptilian:'#7c885d',kobold:'#a18b5d',goblin:'#82794f',demon:'#755c4f',imp:'#9a7152',treant:'#7c8b63'})[kind]||tint(team,-22);
 const outfit=uniform(d,f);
 if(outfit)cloth=outfit[0];else{if(d.worker)cloth=tint(cloth,10);if(d.role==='support')cloth=tint(cloth,24);if(d.role==='stealth')cloth=tint(cloth,-25);}

 const h=huge?43:bull?37:wolf?34:ape?apeForm[0]:small?23:short?26:36,width=huge?9:ape?apeForm[1]:bull?7:wolf?6:short?6:small?3.5:d.role==='heavy'?5.8:d.role==='scout'?3.9:4.5,zz=centaur?13:kind==='broom'?11:0,robe=['wizard','vampire'].includes(kind)||/Mage|Sage|Seer|Healer|Flamecaster/.test(d.name),armor=d.role==='heavy'||d.role==='elite'||/Shieldbearer|Knight|Legionnaire|Guard/.test(d.name)||kind==='human'&&!d.worker&&d.role!=='support',swing=(action==='heal'?[2,4,6,4][phase]:work?[3,16,1,4][phase]:att?[2,16,9,1][phase]:0),bent=wolf||ape||huge?4:0;
 mesh.ownership([{x:[-width*1.8,width*1.8],y:[-width*1.5,width*1.5],z:[zz+h*.48,zz+h*.57]},{x:[-width,width],y:[-width*1.5,width*1.5],z:[zz+h*.79,zz+h*.84]}]);
 if(centaur){legs4(9,5.4,16,'#9c8262',true,false,-6);spine([[-23,0,16,2.5,3.8],[-18,0,17,6.6,7],[-10,0,16,6.4,6.5],[-3,0,17,6.1,7.3],[2,0,19,5.5,8],[5,0,21,3.4,5]],'#9c8262','fur');tendon([[-22,0,19],[-26,0,13],[-28,1+walk,5]],[2.3,2,1],'#665747','fur');for(const side of [-1,1]){limb([-17,side*5,20],[-12,side*6,14],'#9c8262',7);limb([1,side*4,23],[3,side*5,15],'#9c8262',6);}}
 else if(kind==='gorgon'){for(let j=0;j<5;j++)orb(-j*4,Math.sin(j)*5,3+j,5,5,4,'#8e9f72');}
 else{for(const side of [-1,1]){const gait=action==='walk'?root.FractureMotion.step(frame,side<0?.5:0,small?5.5:7.5):{x:0,lift:0},stride=gait.x,footLift=gait.lift,hoof=kind==='satyr'||bull,digit=wolf||harpy||kind==='gargoyle'||hoof,legColor=wolf||ape||huge||hoof?skin:tint(cloth,-17),hip=[-bent*.3,side*3.5,zz+h*.45],knee=[(digit?3.2:-bent)-stride*.5,side*4.3,zz+(digit?11:9)+footLift*.45],ankle=[stride+(digit?-2.7:0),side*4.4,zz+(digit?5:3)+footLift];
 limb(hip,knee,legColor,huge?8:bull||wolf?6.5:ape?apeForm[1]*.85:4.8);orb(...knee,huge?2.8:2,huge?2.4:1.8,huge?2.8:2,tint(legColor,4));limb(knee,ankle,tint(legColor,-5),huge?6:digit?4.1:4);if(digit)tendon([ankle,[stride+.7,side*4.4,zz+2+footLift]],[1.8,1.6],legColor);if(hoof){box(stride+1,side*4.4,zz+.5+footLift,2.7,2.1,2.8,'#454d41');seg([stride+3.6,side*4.4,zz+.6+footLift],[stride+3.6,side*4.4,zz+2.9+footLift],'#28352d',.45);}else{spine([[stride-1,side*4.4,zz+1.8+footLift,1.9,1.4],[stride+1.5,side*4.4,zz+1.8+footLift,2.1,1.5],[stride+3.4,side*4.4,zz+1.2+footLift,1.7,.8]],wolf||harpy?skin:'#3e4b43');if(wolf||harpy||demon)claw(stride+3,side*4.4,zz+2+footLift);}}}
 if(robe)face([[-2,-width,h-7+zz],[-2,width,h-7+zz],[-5,width+3,zz+4],[-7,-width-3,zz+4]],tint(cloth,-17));
 const bare=ape||wolf||bull||huge||kind==='satyr',bodyColor=bare?skin:cloth;
 loft([[-bent*.4,0,h*.43+zz,width*.62,width*.78],[-bent*.35,0,h*.54+zz,width*.64,width*.74],[-bent*.35,0,h*.72+zz,width*.85,width*1.14],[-bent*.2,0,h*.83+zz,width*.72,width*1.06],[0,0,h*.91+zz,width*.38,width*.37]],bodyColor,bare?furKinds.includes(kind)?'fur':'skin':'cloth');
 // Chest, shoulder and abdominal planes read as anatomy instead of a single round torso.
 if(bare){for(const side of [-1,1]){orb(width*.45-bent*.2,side*width*.48,h*.73+zz,width*.48,width*.52,h*.095,tint(skin,5));orb(-bent*.2,side*width,h*.79+zz,width*.5,width*.46,h*.1,tint(skin,-3));}for(let j=0;j<2;j++)orb(width*.56-bent*.4,0,h*(.56+j*.065)+zz,width*.28,width*.48,h*.04,tint(skin,-4));}
 else{for(const side of [-1,1])seg([width*.63,side*width*.7,h*.5+zz],[width*.76,side*width*.63,h*.72+zz],tint(cloth,-20),.45);seg([width*.85,0,h*.57+zz],[width*.85,0,h*.8+zz],tint(cloth,19),.55);}
 if(robe){loft([[-2,0,zz+4,width*.85,width+2],[-1,0,h*.4+zz,width*.7,width*.85],[0,0,h*.57+zz,width*.68,width*.9]],cloth);for(let j=0;j<10;j++){const a=j*Math.PI/5;seg([-2+Math.cos(a)*width*.83,Math.sin(a)*(width+2),zz+4],[-1+Math.cos(a)*width*.68,Math.sin(a)*width*.85,h*.4+zz],tint(cloth,j%2?13:-15),.65);}}
if(wolf){orb(-3,0,h-6,width+1.5,7,8,tint(skin,-18));orb(1,0,h-2,5,5,6,skin);for(const side of [-1,1]){orb(-4,side*5,h-4,4,3,7,tint(skin,-22));for(let j=0;j<5;j++)face([[-2-j*.7,side*(4+j*.5),h-j],[-6-j*.5,side*(5+j*.6),h-5-j],[-1-j*.4,side*(5+j*.3),h-4-j]],tint(skin,j%2?-17:12));}tail(-4,14,16,skin);for(let j=0;j<6;j++)face([[-5,j%2?6:-6,h-6-j],[-8,j%2?8:-8,h-12-j],[-3,j%2?5:-5,h-10-j]],tint(skin,j%2?-22:7));}
 if(armor){mesh.material(kind==='human'?'paint':'metal');mesh.loft([[-.4,0,h*.57+zz,width*.76,width*.86],[-.5,0,h*.74+zz,width*.98,width*1.13],[-.6,0,h*.85+zz,width*.76,width*.91]],tint(cloth,22),10);
 face([[width*.7,-width*.6,h*.85+zz],[width*.8,width*.6,h*.85+zz],[width+1,width*.5,h*.65+zz],[width+1,0,h*.59+zz],[width+1,-width*.5,h*.65+zz]],tint(cloth,25));
 seg([width+1,0,h*.62+zz],[width*.75,0,h*.82+zz],tint(cloth,48),.7);
 for(const side of [-1,1]){seg([width*.8,side*width*.6,h*.82+zz],[width+1,side*width*.5,h*.66+zz],'#b8ab83',.7);const kg=action==='walk'?root.FractureMotion.step(frame,side<0?.5:0,small?5.5:7.5):{x:0,lift:0};orb(-bent-kg.x*.5,side*4.3,zz+9+kg.lift*.45,2,1.6,2.2,tint(cloth,17));}
for(const side of [-1,1]){mesh.material('metal');const shoulder=d.role==='heavy'?3.2:2.5;mesh.material(kind==='human'?'paint':'metal');mesh.loft([[-.7,side*(width+.6),h-7+zz,shoulder,2.4],[-.7,side*(width+.5),h-4.9+zz,shoulder,2.5],[-1,side*(width+.3),h-3.8+zz,shoulder*.65,1.7]],tint(cloth,23),8);mesh.seg([1.1,side*(width+1),h-7+zz],[-2,side*(width+3),h-7+zz],'#b7b6a1',.65);for(let j=0;j<2;j++)mesh.box(1.3,side*(width+.7),h-10+zz+j*1.7,1.8,2,1.7,tint(cloth,13+j*11));} seg([3,-width,h*.65+zz],[3,width,h*.65+zz],'#baa775',1);}
 if(!huge&&!wolf){seg([1,-width+1,h-5+zz],[2,width-1,h*.5+zz],'#665d45',1.2);seg([1,-width,h*.47+zz],[1,width,h*.47+zz],'#444c42',1.7);for(const side of [-1,1])box(1,side*(width-1),h*.44+zz,1.7,1.2,3,'#ac9b77');}
 if(!wolf&&!ape&&!huge){for(const side of [-1,1])seg([1,side*(width-1),h*.54+zz],[1,side*(width-2),h*.76+zz],tint(cloth,-24),.65);orb(2,0,h*.48+zz,1.1,1.1,1,'#c6af78');}
 // Layered equipment is sculpted around the body, not painted onto the sprite.
 if(armor&&!bare){
  const steel=kind==='human'?'#718b88':kind==='elf'?'#8b9d8d':kind==='skeleton'?'#929c9d':tint(cloth,33),edge=kind==='human'?'#a7b9ac':'#c8bc96';
  for(const side of [-1,1]){
   // Overlapping waist lames and hanging thigh plates leave the animated legs free.
   mesh.material('metal');for(let j=0;j<3;j++)mesh.face([[width*.73,side*width*.1,h*.58+zz-j*1.3],[width*.85,side*width*.82,h*.58+zz-j*1.3],[width*.88,side*width*.92,h*.53+zz-j*1.3],[width*.82,side*width*.2,h*.53+zz-j*1.3]],j%2?steel:tint(steel,-8));
   mesh.face([[width*.8,side*1.2,h*.47+zz],[width*.75,side*4.6,h*.47+zz],[width*.6,side*5.3,h*.35+zz],[width*.75,side*1.5,h*.34+zz]],steel);
   mesh.seg([width*.75,side*1.5,h*.35+zz],[width*.6,side*5.2,h*.36+zz],edge,.55);
   for(let j=0;j<3;j++)mesh.orb(width*.9,side*(1.6+j*1.1),h*.45+zz,.25,.3,.3,edge);
  }
  mesh.material('cloth');mesh.loft([[0,0,h*.82+zz,width*.63,width*.84],[0,0,h*.89+zz,width*.52,width*.63]],tint(cloth,-26),10);
 }
 if(robe&&!bare){
  // A modeled shoulder mantle and folded lining give casters a real layered silhouette.
  mesh.material('cloth');mesh.loft([[-1.8,0,h*.71+zz,width*.88,width*1.25],[-1,0,h*.84+zz,width*.85,width*1.32],[0,0,h*.9+zz,width*.42,width*.52]],tint(cloth,9),12);
  for(const side of [-1,1]){mesh.seg([width*.8,side*width,h*.72+zz],[width*.65,side*width*.7,h*.83+zz],'#c8b483',.65);mesh.material('metal');mesh.orb(width*.79,side*width*.6,h*.78+zz,.5,.5,.7,'#d4c39b');}
 }
 if(kind==='human'){
  const heavy=d.role==='heavy',scout=d.role==='scout'||d.role==='stealth',vest=tint(cloth,-13);
  if(!d.worker&&d.role!=='support'){
   mesh.material('cloth');mesh.box(-width*.75,0,h*.48+zz,2.3,width*.75,h*.28,vest);
   for(const side of [-1,1]){
    // Folded ammunition pouches and straps have volume and closures.
    mesh.material('cloth');for(let j=0;j<2;j++){mesh.box(width*.91,side*(1.5+j*1.7),h*.57+zz,.85,.75,3.7,tint(vest,j*7));mesh.seg([width*1.11,side*(.8+j*1.7),h*.67+zz],[width*1.11,side*(2.1+j*1.7),h*.67+zz],'#a4ac8b',.4);}
    mesh.material('metal');mesh.seg([-width*.8,side*width*.65,h*.76+zz],[-width*.8,side*width*.65,h*.51+zz],'#92a498',.7);
   }
   if(heavy){mesh.material('metal');mesh.box(-width-1,0,h*.48+zz,2.7,5,h*.32,'#4b5a62');for(let j=0;j<5;j++)mesh.box(-width-3.8,-3.5+j*1.7,h*.54+zz,.35,.5,5,'#b8a479');mesh.seg([-width-1,4,h*.65+zz],[-1,7,h*.52+zz],'#82765b',1.8);}
  }
  if(d.worker){mesh.material('cloth');mesh.box(-5,0,h*.44+zz,2.2,3.8,8,'#827557');mesh.material('metal');for(let j=0;j<3;j++){mesh.seg([-7,-2+j*2,h*.46+zz],[-7,-2+j*2,h*.7+zz],'#bac2ac',.7);mesh.box(-7,-2+j*2,h*.69+zz,.6,1,1.5,'#677a72');}}
 }
 if(kind==='elf'&&!armor){
  mesh.material('cloth');mesh.loft([[-2,0,h*.49+zz,width*.65,width*.8],[-1,0,h*.73+zz,width*.81,width*1.1],[0,0,h*.87+zz,width*.4,width*.6]],cloth,12);
  for(const side of [-1,1]){mesh.seg([width*.67,side*width*.7,h*.73+zz],[width*.54,side*width*.65,h*.49+zz],'#b1b28a',.6);for(let j=0;j<3;j++)mesh.face([[width*.78,side*(2+j*.3),h*.76+zz-j*2],[width*.83,side*(4+j*.2),h*.74+zz-j*2],[width*.8,side*(2+j*.3),h*.71+zz-j*2]],'#839e70');}
 }
 if(ape||bull||wolf||huge){
  mesh.material('cloth');const harness=outfit[0];for(const side of [-1,1]){mesh.seg([width*.78,side*width*.68,h*.83+zz],[width*.82,side*width*.48,h*.49+zz],harness,2.2);mesh.face([[width*.84,-width*.55,h*.5+zz],[width*.84,width*.55,h*.5+zz],[width*.8,width*.7,h*.34+zz],[width*.8,-width*.7,h*.34+zz]],harness);}mesh.seg([width*.9,-width*.55,h*.38+zz],[width*.9,width*.55,h*.38+zz],outfit[1],.8);
 }
 if(ape||bull||wolf){
  // Shoulder and chest fur grows along the anatomy; tufts break up the round muscle forms.
  for(const side of [-1,1])for(let j=0;j<5;j++){
   const y=side*(width*.52+j*.35),z=h*.82+zz-j*1.5;mesh.material('fur');
   mesh.face([[width*.45,y,z+2],[width*.75,y+side*1.8,z+.8],[width*.58,y+side*1.2,z-3]],tint(skin,j%2?-16:13));
  }
  if(bull){mesh.material('cloth');mesh.loft([[0,0,h*.35+zz,width*.79,width*1.05],[0,0,h*.49+zz,width*.73,width*.82]],'#67533b',12);for(const side of [-1,1])mesh.seg([width*.7,side*1.5,h*.35+zz],[width*.7,side*1.5,h*.48+zz],'#c0a474',.7);}
 }
 // Small fitted pieces distinguish leather, fabric and forged armor at normal zoom.
 if(!bare){
  const leather=kind==='human'?'#53645c':'#70604b',trim=outfit?outfit[1]:armor?'#c4b68f':'#b8a184',front=width*.82;
  mesh.material('cloth');mesh.seg([front,-width*.55,h*.8+zz],[front+.1,width*.5,h*.53+zz],leather,1.5);
  mesh.material('metal');mesh.box(front+.5,0,h*.64+zz,.45,1.1,1.7,trim);
  for(const side of [-1,1]){
   mesh.material('cloth');mesh.box(.8,side*(width*.85),h*.44+zz,1.8,1.5,3.2,leather);
   mesh.material('metal');mesh.box(2.65,side*(width*.85),h*.47+zz,.2,.7,.6,trim);
   if(armor){for(let j=0;j<3;j++){mesh.material('metal');mesh.seg([width*.85,side*(width*.65),h*(.68+j*.045)+zz],[width*.95,side*(width*.30),h*(.67+j*.045)+zz],j%2?trim:tint(cloth,40),.45);}}
  }
  if(robe){for(const side of [-1,1]){mesh.material('cloth');mesh.seg([width*.83,side*(width+1.5),zz+4],[width*.68,side*(width*.82),h*.43+zz],trim,.9);for(let j=0;j<4;j++){const z=zz+6+j*2;mesh.seg([width*.82,side*(width+.5),z],[width*.82,side*(width-1),z+1],tint(trim,-16),.4);}}}
  if(d.worker){mesh.material('wood');mesh.seg([-3,width+1,h*.4+zz],[-4,width+1,h*.64+zz],'#9a835d',.9);mesh.material('metal');mesh.box(-4,width+1,h*.65+zz,1.8,.7,1.4,'#b4b8a6');}
 }
 let hands=[];for(const side of [-1,1]){const bowPose=att&&/Archer/.test(d.name),hand=bowPose?[side===1?18:[15,8,18,15][phase],4,zz+h*.7]:[att||work?8+wind*5:2-(action==='walk'?root.FractureMotion.step(frame,side<0?.5:0,small?5.5:7.5).x*.42:0),side*(width+2),zz+(att||work?h*.55+swing:h*.36)],elbow=bowPose?[side===1?10:2,side===1?7:-7,zz+h*.69]:[bent+2+(action==='walk'?(hand[0]-2)*.5:0),side*(width+3),zz+h*.52];limb([0,side*width,h-7+zz],elbow,ape||wolf||bull||huge?skin:cloth,huge?7.8:ape?apeForm[1]*.92:wolf||bull?6.6:small?3.7:4.6);orb(...elbow,huge?2.8:1.9,huge?2.8:1.8,huge?2.8:1.9,ape||wolf||bull||huge?skin:cloth);limb(elbow,hand,skin,huge?6.5:wolf?5.5:ape?apeForm[1]*.69:bull?4.8:small?3.2:3.8);if(armor){const cuff=hand.map((v,i)=>v*.55+elbow[i]*.45);seg(cuff,hand,tint(cloth,18),3.4);}orb(...hand,wolf?2.3:1.25,wolf?2:1.25,wolf?2.4:1.45,skin);hands.push(hand);
 if(!wolf&&!demon&&!huge&&!ape){const forward=hand.map((v,i)=>v+(v-elbow[i])*.18);mesh.material(armor?'metal':'skin');for(let k=-1;k<=1;k++)mesh.seg([hand[0]+.6,hand[1]+k*.65,hand[2]-.3],[forward[0]+.7,forward[1]+k*.65,forward[2]-.8],armor?tint(cloth,40):tint(skin,-5),.65);mesh.material('skin');mesh.seg([hand[0]+.5,hand[1]-side*1.2,hand[2]+.5],[hand[0]+1.6,hand[1]-side*1.1,hand[2]-.5],skin,.8);}
 if(wolf||demon||kind==='treant')claw(...hand);}
 const hx=bent+1,hz=h+zz,headPart={origin:[hx,0,hz-4],scale:(wolf||bull)? .92 : ape? .88 : (small||short)? .84 : .76};mesh.part=headPart;
 if(wolf)muzzle(hx+1,0,hz,skin,9,true);
 else if(bull){muzzle(hx,0,hz,skin,6);for(const side of [-1,1]){horn([hx,side*3,hz+4],[hx-2,side*9,hz+8],'#d8c8a0',3);horn([hx-2,side*9,hz+8],[hx+2,side*12,hz+13],'#e0d1b0',2);}}
 else if(['reptilian','draconian','kobold'].includes(kind)){muzzle(hx,0,hz,skin,small?4:6);mesh.part=null;tail(-3,12,small?12:18,skin);mesh.part=headPart;for(let j=0;j<(d.name==='Kobold Scout'?2:4);j++)face([[hx-3,0,hz+3-j],[hx-7,0,hz+(d.name==='Kobold Slinger'?7:11)-j*2],[hx-1,0,hz+4-j]],outfit?outfit[1]:'#b8a77a');}
 else{orb(hx-.5,0,hz+.5,small?3.5:huge?5.5:3.7,small?3:huge?4.7:3.3,huge?5.5:4.5,skin);loft([[hx+.8,0,hz-4,2.1,2.2],[hx+1.6,0,hz-1.5,2.9,3],[hx+.8,0,hz+1.5,2.8,3]],skin,'skin',8);orb(hx+3.8,0,hz-.2,ape?3:1.45,ape?2.8:1.1,ape?2:1.8,tint(skin,8));for(const side of [-1,1]){orb(hx+2.6,side*2.6,hz-.5,1.5,.8,1.4,tint(skin,9));seg([hx+2.7,side*.9,hz+2],[hx+3,side*3,hz+1.9],tint(skin,-25),.9);}
if(kind==='cyclops')eye(hx+4.5,0,hz+1,'#e0d9b7');else for(const side of [-1,1])eye(hx+3,side*2.4,hz+1,kind==='vampire'||kind==='skeleton'?'#ce9f89':'#354239');
 if(['elf','goblin','orc'].includes(kind))for(const side of [-1,1])face([[hx,side*3,hz+2],[hx-2,side*(small?9:7),hz+5],[hx,side*3,hz-1]],skin);
 if(short){orb(hx+2,0,hz-5,4,3,5,'#8b7b62');for(let j=-1;j<=1;j++)seg([hx+4,j*2,hz-2],[hx+4,j*2,hz-9],'#b7a382',1);}
 if(kind==='orc'||kind==='troll')for(const side of [-1,1])horn([hx+4,side*2,hz-3],[hx+5,side*2,hz+1],'#d9cfaa',1.3);
 if(!ape&&!demon&&kind!=='golem'&&kind!=='treant'){seg([hx+3.8,-1.4,hz-2.5],[hx+4.1,1.4,hz-2.5],tint(skin,-42),.45);for(const side of [-1,1]){orb(hx,side*3.5,hz-.1,.8,.8,1.5,skin);seg([hx+2.7,side*2.1,hz+2.2],[hx+3.4,side*2.7,hz+2.1],tint(skin,-35),.6);}}
 if(ape){const agile=['Runner','Slinger','Spear Warrior','Javelin Hunter'].includes(d.name),headSize=agile?.8:1;orb(hx-1,0,hz+2,5*headSize,4*headSize,3*headSize,tint(skin,-30));orb(hx+4,0,hz-2,3.5*headSize,3*headSize,2.5*headSize,tint(skin,18));if(d.name==='Spear Warrior')spine([[hx+2,0,hz-1,2.3,2],[hx+8,0,hz-2,1.7,1.6]],tint(skin,-15),'skin');if(d.name==='Silverback Champion')for(const side of [-1,1])face([[hx-3,side*3,hz+3],[hx-5,side*6,hz+7],[hx-7,side*8,hz-4],[hx-3,side*4,hz-5]],'#b1b3a6');}

 }
 if(demon||kind==='satyr'){for(const side of [-1,1]){horn([hx,side*3,hz+3],[hx-3,side*6,hz+11],tint(skin,-12),2.5);horn([hx-3,side*6,hz+11],[hx+1,side*8,hz+15],'#cfbc95',1.2);}mesh.part=null;tail(-2,12,14,skin);mesh.part=headPart;}
 if(kind==='gorgon')for(let j=0;j<6;j++){const side=j%2?1:-1;seg([hx-1,side*2,hz+3],[hx-4+j,side*7,hz+7+j%3],skin,1.5);eye(hx-4+j,side*7,hz+8+j%3);}
 if(kind==='human'){
  const helmet=d.worker?'#a99558':tint(cloth,8);
  loft([[hx-1,0,hz+1.7,4.2,3.8],[hx-1.3,0,hz+3.3,4.3,3.9],[hx-1.7,0,hz+5.4,3.3,3.3],[hx-2,0,hz+6,1.7,2]],helmet,'paint');
  mesh.material('paint');mesh.seg([hx+2.5,-3.7,hz+1.8],[hx+2.5,3.7,hz+1.8],tint(helmet,15),.8);
  if(d.worker){mesh.box(hx-1,0,hz+5.6,2,.65,.7,tint(helmet,19));}else if(d.role==='scout'||d.role==='stealth'){mesh.face([[hx+2,-3,hz+2],[hx+5,-2.8,hz+1.7],[hx+5,2.8,hz+1.7],[hx+2,3,hz+2]],helmet);}
 }

 if(kind==='human'){
  const helmet=d.worker?'#c6ab63':tint(cloth,18);
  mesh.material('metal');for(const side of [-1,1]){
   mesh.seg([hx-2,side*3.9,hz+2],[hx+2.2,side*3.9,hz+2],tint(helmet,24),.65);
   mesh.orb(hx-.5,side*3.8,hz+.3,1,.6,1.5,tint(helmet,-18));
   mesh.material('cloth');mesh.seg([hx,side*3.5,hz-.2],[hx+1.2,side*1.8,hz-3.1],'#5b6458',.55);
  }
  if(!d.worker&&d.role!=='support'){mesh.material('metal');mesh.box(hx+3.8,0,hz+.8,.65,3.2,1.7,'#293e44');mesh.material('glass');for(const side of [-1,1])mesh.orb(hx+4.5,side*1.6,hz+1.5,.4,1.1,.6,'#91b7b6');}
 }
 // Hair, beards and fitted helmets give civilian and martial faces distinct silhouettes.
 if(kind==='elf'){const hair=robe?'#c3c2a9':d.role==='stealth'?'#49453a':'#8e8059';spine([[hx-3.8,0,hz+1.4,2.5,3.8],[hx-1.8,0,hz+2,3.9,3.6],[hx+1.2,0,hz+3,3.2,2.2]],hair,'fur');for(const side of [-1,1]){tendon([[hx-2,side*3,hz+1],[hx-3,side*3.5,hz-3],[hx-4,side*2.8,hz-6]],[1.4,1.3,.25],hair,'fur');seg([hx-1,side*3.4,hz+2],[hx+1.6,side*2.5,hz+3],'#b5ae83',.5);}if(armor){loft([[hx-.7,0,hz+1.8,4,3.7],[hx-.7,0,hz+4.6,3.6,3.5],[hx-1.3,0,hz+6.3,1.2,1.6]],'#889c8c','metal');for(const side of [-1,1])face([[hx+1.5,side*3,hz+3],[hx+3,side*3,hz+1],[hx+2.1,side*3,hz-2],[hx,side*3.5,hz]],'#a0b3a1');}}
 if(short){const beard=/Runesmith|Engineer/.test(d.name)?'#b1a285':'#84664c';spine([[hx,0,hz-4,3.3,3.6],[hx+2,0,hz-4,3.7,4],[hx+4,0,hz-4.5,2.5,3]],beard,'fur');for(const side of [-1,1]){tendon([[hx+2.5,side*2,hz-3],[hx+3,side*2.2,hz-7],[hx+1.5,side*2,hz-10]],[1.25,1,.3],tint(beard,15),'fur');seg([hx+3,side*2.2,hz-7],[hx+3,side*2.2,hz-8],'#c4b487',1.3);}loft([[hx-1,0,hz+1.7,4.8,4.2],[hx-1,0,hz+4.5,4.2,4],[hx-1.4,0,hz+6,2.6,2.8]],d.worker?'#8d8063':'#7a8782','metal');seg([hx+3.6,-3.8,hz+1.8],[hx+3.6,3.8,hz+1.8],'#c4b58c',.9);for(const side of [-1,1])face([[hx+2.5,side*3.4,hz+2],[hx+3,side*3.7,hz-2],[hx,side*4,hz-3],[hx-1,side*4.1,hz+1]],'#8a9890');}
 if(['centaur','satyr','minotaur'].includes(kind)){const hair=kind==='centaur'?'#654c38':'#74604a';spine([[hx-3.3,0,hz,3.2,4],[hx-1,0,hz+2.7,3.8,3],[hx+1.3,0,hz+3,2.7,2]],hair,'fur');if(kind==='centaur')for(const side of [-1,1])tendon([[hx-2,side*3,hz+1],[hx-3.5,side*3.5,hz-5]],[1.3,.3],hair,'fur');}
 if(kind==='wizard'){
  // A closed, dimensional hat stays readable when seen edge-on.
  loft([[hx-.6,0,hz+2,7,6.2],[hx-.6,0,hz+2.8,7,6.2]],tint(cloth,-12),'cloth');
  loft([[hx-1,0,hz+2.7,4.1,3.8],[hx-1.4,0,hz+7.5,3.2,3],[hx-2,0,hz+12,1.8,1.6],[hx-4,0,hz+15.5,.8,.7],[hx-6,0,hz+15.6,.2,.2]],tint(cloth,6),'cloth');
  loft([[hx-1,0,hz+3.1,4.15,3.85],[hx-1.1,0,hz+4.4,3.95,3.65]],'#948366','cloth');if(/Grand/.test(d.name)){orb(hx+3,0,hz-5,3,2,7,'#c8c6b1');box(-4,0,17,3,5,8,'#787897');}}
 if(kind==='vampire'){face([[hx-4,-6,hz-6],[hx-4,6,hz-6],[hx-6,8,hz+3],[hx-8,0,hz-2],[hx-6,-8,hz+3]],tint(cloth,15));orb(hx-1,0,hz+3,4,3.7,2,'#423f43');}
 if(kind==='skeleton'){seg([hx+3,-2,hz-3],[hx+3,2,hz-3],'#4c5550',1);for(let j=-1;j<=1;j++)seg([hx+4,j,hz-2],[hx+4,j,hz-4],'#d6d1b7',.6);}
 mesh.part=null;
 if(ape){
  if(d.name==='Runner'){tendon([[-4,0,12],[-13,0,8],[-19,4,11],[-20,6,17]],[1.8,1.4,.9,.3],skin,'fur');}
  if(d.name==='Shieldback'){for(const side of [-1,1]){mesh.material('wood');mesh.face([[-4,side*5,h*.88],[-7,side*11,h*.85],[-9,side*12,h*.5],[-5,side*5,h*.46]],'#75644c');for(let j=0;j<3;j++)mesh.seg([-5-j,side*(6+j*2),h*.84],[-7-j,side*(6+j*2),h*.5],'#b8a480',1.2);}}
  if(d.name==='Firepot Thrower'){for(const side of [-1,1]){orb(-6,side*5,18,3.7,3.5,4.7,'#a47752');seg([-6,side*5,22],[-6,side*5,26],'#c9b48a',.8);}}
 }
 if(kind==='kobold'){
  if(d.worker){box(-4.5,0,h*.45,3.2,5,9,'#806c4e');for(const side of [-1,1])seg([-7,side*4,h*.46],[-7,side*4,h*.8],'#c3b18a',.8);}
  else if(d.name==='Kobold Scout'){face([[-3,-4,h*.85],[-3,4,h*.85],[-9,6,h*.4],[-11,0,h*.32],[-9,-6,h*.4]],tint(cloth,-13));}
  else if(d.name==='Kobold Slinger'){box(-5,3,h*.35,3.5,3.4,7,'#a48b64');for(let j=0;j<3;j++)orb(-6,2+j*1.5,h*.7,1.5,1.4,1.4,'#aca68e');}
 }
 if(stone)for(let j=0;j<4;j++)seg([4,-5,16+j*7],[5,5,16+j*7],j%2?team:'#596a61',1.5);
 if(kind==='treant'){for(const side of [-1,1]){seg([-2,side*4,hz],[-5,side*10,hz+16],'#7f8467',3);seg([-5,side*10,hz+16],[0,side*17,hz+20],'#9d9c77',1.5);orb(-5,side*12,hz+13,6,5,4,'#768c64');}}
 if(d.air&&(harpy||demon))wings(-2,h-7,harpy?30:33,harpy?'#aa9a7a':tint(skin,-14),harpy);
 if(kind==='broom'){seg([-23,0,zz+4],[24,0,zz+4],'#a88f60',2);for(let j=-3;j<=3;j++)seg([-15,j,zz+4],[-27,j*1.5,zz+2],'#bcab76',1);}
 if(d.worker){box(-5,0,h*.5+zz,3.5,4,8,kind==='human'?'#8b8769':tint(cloth,-15));const hand=hands[1];seg(hand,[hand[0]+4,hand[1],hand[2]+9],'#a08d62',1.5);seg([hand[0]-1,hand[1],hand[2]+9],[hand[0]+10,hand[1],hand[2]+9],'#b0beb1',2);}
 else if(!wolf&&!harpy&&!['golem','horror','treant','husk'].includes(kind)){
 let tool=/Archer/.test(d.name)?'bow':/Crossbow/.test(d.name)?'crossbow':/Spear|Javelin|Lancer/.test(d.name)?'spear':/Slinger/.test(d.name)?'sling':/Club|Stone Thrower/.test(d.name)?'club':/Berserker|Minotaur|Orc Warrior/.test(d.name)?'axe':d.role==='support'||kind==='wizard'||/Spellweaver|Seer|Flamecaster|Subjugator/.test(d.name)?'staff':d.role==='aa'?'rocket':d.role==='heavy'&&!['dwarf','orc','ape'].includes(kind)?'heavy':d.range<1.2?'sword':'rifle';
 const kit={'Kobold Scout':'spear','Medic':'none','Centaur Scout':'spear','Gargoyle':'rock','Goblin Sapper':'potion','Spellguard':'staff','Duelist':'sword','Wardbreaker':'staff','Vampire Operative':'crossbow','Vampire Marksman':'rifle','Imp Scout':'sling','Imp Skirmisher':'spear','Siege Fiend':'staff','Tormentor':'spear','Archdemon':'axe','Greater Demon':'axe','Infernal Guard':'spear','Skink Scout':'spear','Kobold Scout':'spear','Goblin Scout':'sling','Troll Brute':'club','Troll Siege Breaker':'rock','Draconian Flameguard':'staff','Dragon Sage':'staff','Blood Mage':'staff','Silverback Champion':'club','Shieldback':'club','Dwarf Shieldbearer':'axe','Undead Knight':'sword'};tool=kit[d.name]||tool;
 if(d.name==='Hexer')tool='potion';if(kind==='cyclops')tool='rock';if(kind==='ape'&&!/Powder/.test(d.name))tool=/Slinger/.test(d.name)?'sling':/Spear|Javelin/.test(d.name)?'spear':/Firepot|Stone Thrower/.test(d.name)?'rock':'club';if(d.name==='Runner'){tool='sling';box(-5,0,13,3,4,8,'#7b6b50');seg([-2,-5,26],[2,5,14],'#c9b48a',2);}if(d.name==='Firepot Thrower')tool='potion';weapon(tool,hands[1]);
 if(d.name==='Spellguard')shield(4,-width-4,h*.6,team,false);
 if(d.name==='Wardbreaker'){for(const side of [-1,1]){box(-6,side*4,18,2,2,9,'#8c839e');orb(-6,side*4,29,2,2,3,'#c6b6df');}}
 if(d.name==='Spear Warrior')shield(3,-width-4,h*.6,'#ad9570',true);
 if(d.name==='Javelin Hunter')for(let j=0;j<3;j++)seg([-4,-2+j*2,12],[-5,-2+j*2,41],'#b5a178',1);
 if(d.name==='Troll Brute'){for(const side of [-1,1])orb(0,side*8,34,5,3,4,'#727c73');}
 if(d.name==='Vampire Operative')face([[-4,-6,h-5],[-4,6,h-5],[-8,7,5],[-10,-7,5]],tint(cloth,-14));
 if(/Flameguard|Flamecaster|Siege Fiend/.test(d.name)){orb(hands[1][0],hands[1][1],hands[1][2]+17,3,3,4,'#dd9f5d');}
 if(d.name==='Tormentor'){seg(hands[0],[25,-10,5+wind*18],'#b09265',1);seg([25,-10,5+wind*18],[31,-5,4],'#b09265',1);}

 if(/Shield|Guardian|Knight|Legionnaire|Flameguard/.test(d.name))shield(3,-width-3,h*.6+zz,team,true);
 if(kind==='human'&&d.role==='support'){box(-5,0,16,4,5,8,'#c5c8b1');seg([-6,-3,22],[-6,3,22],'#a16258',1.5);seg([-6,0,19],[-6,0,25],'#a16258',1.5);}
 if(tool==='bow')for(let j=0;j<3;j++)seg([-4,-3+j*2,15],[-5,-3+j*2,34],'#c4b18c',1);
 }
 if(harpy){if(d.name==='Harpy Raider'){box(-3,0,25,3,4,6,'#8e8369');for(const side of [-1,1])orb(0,side*6,28,3,2,2,'#b1a17a');weapon('spear',hands[1]);}else{for(let j=0;j<3;j++)seg([hx-3,j-1,hz+2],[hx-6,j*2,hz+11],'#d1bc8c',1);}}
 if(d.name==='Harpy Scout')weapon('spear',hands[1]);
 if(d.name==='Archdemon'){wings(-5,h-7,34,'#8d5b4b');for(const side of [-1,1]){horn([0,side*9,35],[-6,side*14,47],'#d1b690',3);}}
 if(d.name==='Greater Demon')shield(5,-12,26,'#a97b54',true);
 if(wolf){for(const side of [-1,1])for(let j=0;j<6;j++)seg([-2-j*.4,side*(4+j%2),h-4-j*1.7],[-6-j*.4,side*(5+j%2),h-7-j*1.7],j%2?'#777d76':'#acada0',.7);}
 if(d.name==='Lycan Heavy Fighter'){for(const side of [-1,1])box(0,side*6,24,3,2,5,'#778589');}if(d.name==='Lycan Assault Trooper'){for(const side of [-1,1]){seg([6,side*4,27],[5.8,side*-4,18],'#684d3d',1.6);box(6.2,side*3.5,18,1,1.3,3.4,'#7c674d');}orb(6.4,0,22.5,1.2,1.2,1.2,'#bbb28c');}if(d.name==='Lycan Tracker')orb(-4,0,26,6,5,4,'#827b6d');
 if(kind==='horror'){for(let j=0;j<4;j++)seg([7,-4,17+j*5],[7,4,17+j*5],'#695c53',1);for(let j=0;j<7;j++)seg([7,-2+j*.8,19],[7,-1+j*.8,23],'#c8bd97',.7);}
 }
 mesh.finish();return true;
}
root.FractureIdentity={identity,render,profiles,uniform};
})(globalThis);
