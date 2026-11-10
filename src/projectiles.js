'use strict';
(function(root){
const categories={bullet:{speed:34,arc:0,color:'#ecd29a'},shell:{speed:15,arc:13,color:'#c1b79b'},rocket:{speed:19,arc:2,color:'#c1c7b4'},arrow:{speed:13,arc:9,color:'#c9b98c'},bolt:{speed:19,arc:3,color:'#b5bcaa'},javelin:{speed:12,arc:14,color:'#c2bca2'},rock:{speed:10,arc:24,color:'#aaa58c'},potion:{speed:11,arc:24,color:'#b898ce'},firepot:{speed:10,arc:25,color:'#c5985e'},acid:{speed:14,arc:7,color:'#a3bd6e'},spore:{speed:12,arc:8,color:'#a8ba91'},spine:{speed:20,arc:3,color:'#b8c08b'},spell:{speed:15,arc:4,color:'#acb9d9'},pulse:{speed:26,arc:0,color:'#9fd5d2'},flame:{speed:17,arc:0,color:'#e2aa63'},melee:{speed:0,arc:0,color:'#d0c0a0'}};
function profile(d,f){let kind='bullet',flavor='';const n=d.name||'';
if(d.kind==='defense'||d.kind==='hq'){kind=({industrial:'bullet',machine:'pulse',insect:'acid',fungal:'spine',dragon:'flame',demon:'flame',ape:'rock',elder:'arrow',myth:'spell',wizard:'spell',night:'spell',reptile:'spine'})[f.style];}
else if(d.range<1.2)kind='melee';
else if(['Skink Scout','Kobold Scout','Imp Skirmisher','Harpy Raider','Centaur Scout'].includes(n))kind='javelin';
else if(['Harpy Scout','Warrior Lancer','Prowler'].includes(n))kind='spine';
else if(['Winged Hunter','Hydra','Spitter'].includes(n))kind='acid';
else if(n==='Gargoyle')kind='rock';
else if(n==='Goblin Sapper')kind='firepot';
else if(n==='Vampire Operative')kind='bolt';
else if(['Runner','Goblin Scout','Imp Scout','Troll Siege Breaker','Great Stone Thrower'].includes(n))kind='rock';
else if(['Dragon Sage','Blood Mage','Runic Siege Engine','Tormentor','Archdemon','Greater Demon'].includes(n))kind='spell';
else if(n==='Revenant Soldier')kind='rocket';
else if(n==='Siege Walker')kind='shell';
else if(n==='Armored Drake')kind='flame';
else if(/Crossbow/.test(n))kind='bolt';else if(/Archer/.test(n))kind='arrow';
else if(/Spear|Javelin|Lancer/.test(n))kind='javelin';
else if(/Sling|Catapult|Stone Thrower|Siege Breaker/.test(n))kind='rock';
else if(/Firepot/.test(n))kind='firepot';else if(n==='Hexer')kind='potion';
else if(/Acid|Bombardier|Siege Termite/.test(n))kind='acid';
else if(/Spore|Spitter/.test(n)||f.id==='symbiotes'&&/Brute|Beast|Colossus/.test(n))kind='spore';
else if(f.id==='insects'||/Listener/.test(n))kind='spine';
else if(/Venom/.test(n)){kind='spine';flavor='venom';}
else if(/Rocket|Fighter Aircraft|Gunship/.test(n))kind='rocket';
else if(/Tank|Self-Propelled|Artillery|Nightbreaker/.test(n)&&f.id!=='wizards')kind='shell';
else if(/Flame|Dragon|Wyvern|Siege Fiend|Archdemon|Greater Demon/.test(n)&&n!=='Dragon Sage')kind='flame';
else if(f.id==='machines')kind='pulse';
else if(f.id==='wizards'||/Spellweaver|Seer|Subjugator|Gorgon|Wraith|Ghost|Ancient Vampire|Neural Binder/.test(n))kind='spell';
else if(f.id==='infernal')kind='flame';
else if(f.id==='myth')kind='rock';
if(d.naval&&d.damage>0)kind=({humans:d.navalRole==='scout'?'bullet':d.navalRole==='escort'?'rocket':'shell',reptilians:d.navalRole==='escort'?'spine':'shell',machines:'pulse',primates:d.navalRole==='escort'?'javelin':'rock',insects:d.navalRole==='escort'?'spine':'acid',wizards:'spell',elders:d.navalRole==='scout'?'arrow':'spell',myth:d.navalRole==='escort'?'arrow':'rock',dragons:'firepot',night:d.navalRole==='escort'?'rocket':'shell',infernal:'firepot',symbiotes:d.navalRole==='escort'?'spine':'spore'})[f.id];
if(kind==='spell')flavor=({night:'blood',wizard:'arcane',elder:'rune',myth:'oracle',fungal:'neural'})[f.style]||'arcane';
let color=categories[kind].color;if(kind==='spell')color=({blood:'#b97e9a',arcane:'#b6a6d1',rune:'#a2c9ae',oracle:'#d4c490',neural:'#afcda2'})[flavor];
let muzzle={x:27,y:6,z:27};if(d.id==='primates_condor_rider')muzzle={x:20,y:5,z:43};if(/Tank|Fighting Vehicle|Nightbreaker/.test(n))muzzle={x:28,y:0,z:18};if(/Self-Propelled/.test(n))muzzle={x:34,y:0,z:18};if(/Dwarven Artillery/.test(n))muzzle={x:28,y:0,z:20};if(/Catapult|Runic Siege/.test(n))muzzle={x:18,y:0,z:37};if(/Dragon|Wyvern/.test(n)&&n!=='Dragon Sage')muzzle={x:n==='Ancient Dragon'?39:n==='Mature Dragon'?37:32,y:0,z:n==='Dragon Whelp'?23:30};if(f.id==='insects'||f.id==='symbiotes')muzzle={x:19,y:0,z:20};if(f.id==='machines')muzzle={x:26,y:0,z:['tank','giant'].includes(d.role)?30:22};if(/Staff|Spell|Wizard|Hexer|Seer|Sage|Healer|Transfigurer/.test(n))muzzle={x:13,y:6,z:45};if(n==='Hexer')muzzle={x:16,y:6,z:30};
if(/Cyclops|Great Stone|Troll Siege/.test(n))muzzle={x:20,y:11,z:40};
if(/Harpy/.test(n))muzzle={x:21,y:6,z:28};
if(/Fighter Aircraft|Gunship/.test(n))muzzle={x:18,y:15,z:9};
if(kind==='arrow')muzzle={x:27,y:4,z:n==='Centaur Archer'?36:23};
if(n==='Hydra')muzzle={x:27,y:0,z:42};
if(n==='Winged Hunter')muzzle={x:26,y:0,z:32};
if(n==='Siege Walker')muzzle={x:35,y:0,z:30};
if(n==='Bombardier Caste')muzzle={x:4,y:4,z:38};
if(n==='Siege Termite')muzzle={x:18,y:0,z:26};
if(n==='Warrior Lancer')muzzle={x:27,y:0,z:34};
if(n==='Vampire Operative')muzzle={x:23,y:6,z:27};
if(d.naval)muzzle={x:d.navalRole==='siege'?43:32,y:0,z:d.navalRole==='escort'?27:d.navalRole==='siege'?25:19};
return{kind,flavor,color,...categories[kind],color,muzzle,small:kind==='rock'&&/Sling|Runner|Scout/.test(n)};}
function draw(ctx,s,t,spin=0){const {poly,ellipse}=root.FractureArt,k=s.kind,c=s.color;ctx.lineCap='round';const line=(x,y,xx,yy,col,w=1)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();};
if(k==='bullet'){line(-5,0,3,0,'#b39d70',1.1);line(-1,0,3,0,'#efdbac',1.1);}
else if(k==='shell'){line(-9,0,-3,0,'#bbaa7e70',1.5);poly(ctx,[[-4,-1.6],[2,-1.6],[5,0],[2,1.6],[-4,1.6]],'#aeb5a7','#303d38');line(-3,-1,2,-1,'#e1d3a7',.8);}
else if(k==='rocket'){for(let j=0;j<3;j++)ellipse(ctx,-10-j*5,Math.sin(spin+j)*1.5,2+j,1.7+j*.3,'#a5a69750');poly(ctx,[[-5,-1.5],[3,-1.5],[7,0],[3,1.5],[-5,1.5]],'#c3c9b6','#40524b');poly(ctx,[[-4,-1],[-7,-4],[-2,-1]],'#8d9d92');poly(ctx,[[-4,1],[-7,4],[-2,1]],'#8d9d92');poly(ctx,[[-6,-1],[-12,0],[-6,1]],'#e4b66d');}
else if(['arrow','bolt','javelin','spine'].includes(k)){const length=k==='javelin'?13:k==='arrow'?9:7;line(-length*.6,0,length*.45,0,c,k==='spine'?1.6:1);poly(ctx,[[length*.6,0],[length*.22,-1.6],[length*.22,1.6]],k==='spine'?'#d2d2a0':'#d2d1b9');if(k==='arrow'||k==='bolt')for(const side of [-1,1])line(-length*.55,0,-length*.8,side*2,k==='arrow'?'#d1bf90':'#8fb6ae',.8);}
else if(k==='rock'){ctx.rotate(spin);const r=s.small?2.3:5;poly(ctx,[[-r,-r*.4],[-r*.3,-r],[r*.7,-r*.8],[r,r*.3],[r*.3,r],[-r*.8,r*.5]],'#969c8b','#505f53');poly(ctx,[[-r*.3,-r],[r*.7,-r*.8],[0,0],[-r,-r*.4]],'#b6b8a0');}
else if(k==='potion'||k==='firepot'){ctx.rotate(spin*2);ellipse(ctx,0,0,3,3.7,k==='potion'?'#a599b7':'#9e7854');ellipse(ctx,-.8,-.6,1.7,2,k==='potion'?c:'#d3ab6a');ctx.fillStyle=k==='potion'?'#d0c5b4':'#7c624a';ctx.fillRect(-1,-5,2,3);if(k==='firepot'){poly(ctx,[[-1,-4],[-2,-8],[1,-6],[3,-8],[2,-4]],'#edc681');}else line(-1,-5,1,-5,'#af9b70',1.5);}
else if(k==='acid'){for(let j=0;j<3;j++)ellipse(ctx,-5-j*3,Math.sin(spin+j)*1.8,1.4-j*.3,1.2,c);poly(ctx,[[4,0],[-2,-2.7],[-5,0],[-2,2.7]],'#92ac5c');ellipse(ctx,0,-.5,2.8,1.8,'#c5d991');}
else if(k==='spore'){ellipse(ctx,0,0,3.8,3,c);for(let j=0;j<5;j++){const a=j*1.256+spin;line(Math.cos(a)*3,Math.sin(a)*2.5,Math.cos(a)*5,Math.sin(a)*4,'#a7bb8d',1);}ellipse(ctx,-1,-1,1.5,1,'#d0d9af');}
else if(k==='flame'){poly(ctx,[[6,0],[1,-3],[-4,-1],[-10,-4],[-6,0],[-10,3],[-2,2],[1,4]],'#bf7951');poly(ctx,[[5,0],[-2,-2],[-6,0],[-1,2]],'#ebc379');line(-2,0,4,0,'#f0dba5',1.2);}
else{for(let j=0;j<3;j++)line(-4-j*3,0,-6-j*3,Math.sin(j+spin)*2,c+'70',1);ellipse(ctx,0,0,k==='pulse'?3:4,k==='pulse'?1.5:3,c);ellipse(ctx,1,-.5,1.4,1.3,'#e0edda');if(k==='spell'){ctx.strokeStyle=c;ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,0,6,spin,spin+Math.PI*1.4);ctx.stroke();line(-2,-4,2,4,'#ded7c0',.7);}}
}
function impact(ctx,e){const {ellipse,poly}=root.FractureArt,progress=1-e.time/e.max,k=e.projectileKind,color=e.color||'#c2b69b',r=3+progress*13;
 if(['acid','spore','potion'].includes(k)){ellipse(ctx,0,1,r,r*.35,color+'70');for(let j=0;j<6;j++){const a=j*Math.PI/3;ellipse(ctx,Math.cos(a)*r,Math.sin(a)*r*.4-progress*2,1.5,1.8,color);}}
 else if(['shell','rocket','firepot','flame'].includes(k)){ellipse(ctx,0,-4,r,r*.65,'#a4704f70');ellipse(ctx,0,-5,r*.55,r*.5,'#e0b975');for(let j=0;j<5;j++)poly(ctx,[[0,-3],[Math.cos(j*1.256)*r,-3+Math.sin(j*1.256)*r],[Math.cos(j*1.256+.3)*r*.6,-3+Math.sin(j*1.256+.3)*r*.6]],'#e7cc91');}
 else if(k==='spell'||k==='pulse'){ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,-7,r,r*.7,0,0,Math.PI*2);ctx.stroke();for(let j=0;j<4;j++)ellipse(ctx,Math.cos(j*1.57)*r,-7+Math.sin(j*1.57)*r*.7,1,2,color);}
 else{for(let j=0;j<4;j++)ellipse(ctx,(j-1.5)*r*.35,-j%2*r*.4,1.2,1.2,k==='rock'?'#a8a48e':'#cfbd91');}
}
root.FractureProjectiles={categories,profile,draw,impact};if(typeof module!=='undefined')module.exports=root.FractureProjectiles;
})(globalThis);
