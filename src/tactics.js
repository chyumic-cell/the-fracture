'use strict';
// Adapted gameplay layout principles from Frontier Command. No artwork is shared.
(function(root){
function layout(units,kind,center,facing,rank,definition){
 if(!units.length)return[];const bands=Array.from({length:5},()=>[]),slots=[];for(const u of units)bands[rank(u)].push(u);for(const b of bands)b.sort((a,b)=>a.id-b.id);const spacing=Math.max(.9,...units.map(u=>['tank','giant','siege'].includes(definition(u).role)?1.25:.9));
 if(kind==='circle'){let radius=0,used=false;for(let tier=4;tier>=0;tier--){const band=bands[tier],n=band.length;if(!n)continue;const fit=n===1?0:Math.max(1.1,spacing/(2*Math.sin(Math.PI/n)));radius=Math.max(fit,used?radius+spacing:0);for(let i=0;i<n;i++){const face=facing+i/n*Math.PI*2;slots.push({unit:band[i],tier,x:center.x+Math.cos(face)*radius,y:center.y+Math.sin(face)*radius,face});}used=true;}}
 else{const cols=kind==='column'?2:Math.max(1,Math.ceil(Math.sqrt(units.length)*1.5));let row=0;for(let tier=0;tier<5;tier++){const band=bands[tier];for(let start=0;start<band.length;){const capacity=kind==='wedge'?Math.min(cols,row*2+1):cols,n=Math.min(capacity,band.length-start);for(let i=0;i<n;i++)slots.push({unit:band[start+i],tier,dx:-row*spacing,dy:(i-(n-1)/2)*spacing,face:facing});start+=n;row++;}}const midpoint=(row-1)*spacing/2;for(const s of slots){const x=s.dx+midpoint;s.x=center.x+x*Math.cos(facing)-s.dy*Math.sin(facing);s.y=center.y+x*Math.sin(facing)+s.dy*Math.cos(facing);}}
 // Assign each role band to its closest slots instead of using creation/selection order.
 // Minimum squared-distance matching preserves lanes on open ground and avoids crossing pairs.
 for(let tier=0;tier<5;tier++){const people=bands[tier],places=slots.filter(s=>s.tier===tier),n=people.length;if(n<2)continue;
  const u=new Float64Array(n+1),v=new Float64Array(n+1),match=new Int32Array(n+1),way=new Int32Array(n+1);
  for(let i=1;i<=n;i++){match[0]=i;let j0=0;const min=new Float64Array(n+1).fill(Infinity),used=new Uint8Array(n+1);do{used[j0]=1;const i0=match[j0];let delta=Infinity,j1=0;for(let j=1;j<=n;j++)if(!used[j]){const a=people[i0-1],b=places[j-1],cost=(a.x-b.x)**2+(a.y-b.y)**2-u[i0]-v[j];if(cost<min[j]){min[j]=cost;way[j]=j0;}if(min[j]<delta){delta=min[j];j1=j;}}for(let j=0;j<=n;j++){if(used[j]){u[match[j]]+=delta;v[j]-=delta;}else min[j]-=delta;}j0=j1;}while(match[j0]);do{const j1=way[j0];match[j0]=match[j1];j0=j1;}while(j0);}
  for(let j=1;j<=n;j++)places[j-1].unit=people[match[j]-1];
 }
 return slots;
}
root.FractureTactics={layout};if(typeof module!=='undefined')module.exports=root.FractureTactics;
})(globalThis);
