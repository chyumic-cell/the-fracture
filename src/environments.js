/* World environments are visual: they never consume simulation RNG or alter navigation. */
'use strict';
(function(root){
function createEnvironments(){
 const fields=['grass','dry','soil','stone','sand','deep','shallow','shadow','light','foam'];
 const styles={
  Kareth:{grass:[85,104,63],dry:[126,122,78],soil:[103,86,62],stone:[125,125,111],sand:[161,151,110],deep:[36,73,85],shallow:[81,124,123],scenery:'temperate'},
  Elyndra:{grass:[65,100,64],dry:[113,126,77],soil:[106,88,67],stone:[115,128,116],sand:[163,159,120],deep:[33,70,83],shallow:[79,130,128],scenery:'temperate'},
  aetherland:{grass:[92,62,40],dry:[121,79,47],soil:[69,43,29],stone:[112,102,115],sand:[156,108,73],deep:[38,17,61],shallow:[88,48,114],shadow:[24,16,27],light:[228,204,174],foam:[28,20,34],scenery:'aetherland',vegetation:.28},
  osland:{grass:[40,99,49],dry:[63,113,54],soil:[28,71,37],stone:[153,155,119],sand:[134,130,66],deep:[104,82,19],shallow:[163,139,45],shadow:[17,32,23],light:[229,225,174],foam:[35,31,16],scenery:'osland',vegetation:.75},
  starfall:{grass:[102,90,124],dry:[125,111,143],soil:[69,60,89],stone:[148,159,176],sand:[163,155,185],deep:[15,71,80],shallow:[64,159,158],shadow:[23,24,42],light:[215,230,241],foam:[40,57,59],scenery:'starfall',vegetation:.45},
  Mediterranean:{grass:[111,123,74],dry:[161,151,101],soil:[130,106,75],stone:[163,153,126],sand:[201,187,143],deep:[25,91,119],shallow:[81,157,155],scenery:'temperate'},
  desert:{grass:[166,137,86],dry:[191,162,107],soil:[138,103,66],stone:[154,130,101],sand:[207,180,129],deep:[30,83,99],shallow:[77,142,143],scenery:'desert'},
  arctic:{grass:[200,214,219],dry:[222,230,229],soil:[130,146,154],stone:[114,132,146],sand:[184,207,216],deep:[36,63,83],shallow:[85,130,151],shadow:[26,43,58],light:[236,245,248],scenery:'arctic'},
  hell:{grass:[104,37,32],dry:[135,51,39],soil:[66,29,29],stone:[115,64,59],sand:[158,68,49],deep:[39,12,20],shallow:[100,25,34],shadow:[25,8,13],light:[236,133,96],foam:[24,8,7],scenery:'hell'},
  dreadhollow:{grass:[99,102,99],dry:[121,119,113],soil:[60,63,64],stone:[163,161,148],sand:[132,122,115],deep:[48,8,21],shallow:[111,24,38],shadow:[16,21,28],light:[202,219,225],foam:[29,12,17],scenery:'dreadhollow',vegetation:0},
  // Jungle (Kareth): humid green floor, tea-brown river water and broad-leaf canopy trees hung with vines.
  jungle:{grass:[46,90,40],dry:[72,102,44],soil:[64,50,33],stone:[86,98,78],sand:[120,106,68],deep:[50,40,20],shallow:[96,80,42],shadow:[10,22,12],light:[212,230,172],foam:[44,36,18],scenery:'jungle',vegetation:1},
  // Duskbloom (Elyndra): a twilight fungal forest of indigo ground, glowing teal water and giant luminous mushrooms.
  duskbloom:{grass:[54,48,94],dry:[72,64,114],soil:[39,33,66],stone:[90,86,130],sand:[106,98,142],deep:[12,72,80],shallow:[40,154,148],shadow:[12,10,26],light:[198,208,255],foam:[118,228,208],scenery:'duskbloom',vegetation:.6},
  // Rotmire: a plague bog of jaundiced moss, bruise-violet mud and black-green bile water.
  rotmire:{grass:[92,96,40],dry:[121,110,46],soil:[76,54,80],stone:[94,78,104],sand:[163,147,80],deep:[24,46,22],shallow:[70,104,34],shadow:[19,20,16],light:[224,228,158],foam:[148,158,58],scenery:'rotmire',vegetation:.3},
  moon:{grass:[127,127,127],dry:[154,154,154],soil:[90,90,90],stone:[164,164,164],sand:[181,181,181],deep:[28,28,28],shallow:[69,69,69],shadow:[20,20,20],light:[231,231,231],foam:[20,20,20],scenery:'moon'}
 };
 for(const p of Object.values(styles)){p.shadow??=[23,35,31];p.light??=[221,211,183];p.foam??=[21,25,21];p.vegetation??=p.scenery==='temperate';}
 const earthChoices=[['varied','Varied climates'],['temperate','Temperate'],['desert','Desert'],['arctic','Arctic'],['jungle','Jungle']],morvaneChoices=[['varied','Varied wastes'],['hell','Hell'],['moon','Moon'],['dreadhollow','Dreadhollow'],['rotmire','Rotmire']];
 const elyndraChoices=[['varied','Varied realms'],['aetherland','Aetherland'],['osland','Osland'],['starfall','Starfall'],['duskbloom','Duskbloom']];
 // Varied on Elyndra and Morvane bands that world's own looks across the map, north to south.
 const variedZones={Elyndra:['starfall','aetherland','osland','duskbloom'],Morvane:['moon','dreadhollow','rotmire','hell']};
 const worldChoices=theme=>theme==='Morvane'?morvaneChoices:theme==='Elyndra'?elyndraChoices:earthChoices;
 const choices=theme=>worldChoices(theme).map(([id,name])=>({id,name}));
 // Invalid or legacy selections fall back to the current world-specific default.
 const resolve=o=>worldChoices(o.theme).some(e=>e[0]===o.environment)?o.environment:o.theme==='Morvane'?'hell':o.theme==='Elyndra'?'aetherland':'temperate';
 const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
 const hash=(x,y,s)=>{let n=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,144269);n=Math.imul(n^n>>>13,1274126177);return((n^n>>>16)>>>0)/4294967295;};
 function noise(x,y,s){const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(0,1,x-ix),fy=smooth(0,1,y-iy);return(hash(ix,iy,s)*(1-fx)+hash(ix+1,iy,s)*fx)*(1-fy)+(hash(ix,iy+1,s)*(1-fx)+hash(ix+1,iy+1,s)*fx)*fy;}
 function climate(o,x=0,y=0){const n=o.size||200,latitude=y/n+(noise(x/n*4,y/n*4,(o.seed||0)+1889)-.5)*.22;return{cold:1-smooth(.18,.40,latitude),hot:smooth(.61,.84,latitude)};}
 // Weights of each zone at (x,y): a wavy latitude picks a band, with a smooth blend between neighbours.
 function zoneWeights(o,x,y){const zones=variedZones[o.theme],n=o.size||200,count=zones.length,latitude=y/n+(noise(x/n*4,y/n*4,(o.seed||0)+1889)-.5)*.22,t=Math.max(.5,Math.min(count-.5,latitude*count));return zones.map((zone,k)=>({zone,weight:1-smooth(.3,.7,Math.abs(t-(k+.5)))})).filter(z=>z.weight>0);}
 function scenery(o,x=0,y=0){const id=resolve(o);if(id!=='varied')return id;if(variedZones[o.theme])return zoneWeights(o,x,y).reduce((a,b)=>b.weight>a.weight?b:a).zone;const c=climate(o,x,y);return c.cold>.55?'arctic':c.hot>.55?'desert':'temperate';}
 function palette(o,x=0,y=0){const id=resolve(o),base=styles[o.layout==='mediterranean'?'Mediterranean':o.theme]||styles.Kareth;if(id==='temperate')return base;if(id!=='varied')return styles[id];if(variedZones[o.theme]){const zones=zoneWeights(o,x,y),p={scenery:zones.reduce((a,b)=>b.weight>a.weight?b:a).zone,vegetation:0};for(const f of fields)p[f]=[0,1,2].map(k=>zones.reduce((sum,z)=>sum+styles[z.zone][f][k]*z.weight,0));for(const z of zones)p.vegetation+=Number(styles[z.zone].vegetation)*z.weight;return p;}const {cold,hot}=climate(o,x,y),p={scenery:cold>.55?'arctic':hot>.55?'desert':'temperate',vegetation:Math.max(0,1-(cold+hot)*2.2)};for(const f of fields)p[f]=base[f].map((v,k)=>v*(1-cold-hot)+styles.arctic[f][k]*cold+styles.desert[f][k]*hot);return p;}
 const types=o=>resolve(o)!=='varied'?[resolve(o)]:variedZones[o.theme]||['temperate','desert','arctic'];
 const name=(o,e)=>({hell:'Stalagmite',moon:'Rock pillar',arctic:'Snow pine',desert:'Desert tree',temperate:'Tree',aetherland:'Aether pine',osland:'Emeraldwood',starfall:'Starfall silverwood',dreadhollow:'Hollow tree',rotmire:'Gallows tree',jungle:'Jungle tree',duskbloom:'Duskcap'})[scenery(o,e.x,e.y)];
 function miniColors(game){const colors=new Uint8ClampedArray(game.n*game.n*3),mixed=resolve(game.options)==='varied',base=palette(game.options),step=4,width=Math.ceil(game.n/step)+1,grid=mixed?Array.from({length:width*width},(_,i)=>palette(game.options,(i%width)*step,Math.floor(i/width)*step)):null;
  for(let i=0;i<game.map.length;i++){const x=i%game.n,y=Math.floor(i/game.n),t=game.map[i],field=t.water?'deep':t.height>1?'stone':'grass';if(!mixed){colors.set(base[field],i*3);continue;}const cell=Math.floor(y/step)*width+Math.floor(x/step),u=x%step/step,v=y%step/step,a=grid[cell][field],b=grid[cell+1][field],c=grid[cell+width][field],d=grid[cell+width+1][field];for(let k=0;k<3;k++)colors[i*3+k]=(a[k]*(1-u)+b[k]*u)*(1-v)+(c[k]*(1-u)+d[k]*u)*v;}return colors;}

 return{styles,choices,resolve,climate,scenery,palette,types,name,miniColors};
}
const api=createEnvironments();api.workerSource='const environments=('+createEnvironments.toString()+')();';root.FractureEnvironments=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
