'use strict';
// Adapted gameplay layout principles from Frontier Command. No artwork is shared.
(function(root){
function layout(units,kind,center,facing,rank,definition){
 if(!units.length)return[];const bands=Array.from({length:5},()=>[]),slots=[];for(const u of units)bands[rank(u)].push(u);for(const b of bands)b.sort((a,b)=>a.id-b.id);const spacing=Math.max(.9,...units.map(u=>['tank','giant','siege'].includes(definition(u).role)?1.25:.9));
 if(kind==='circle'){let radius=0,used=false;for(let tier=4;tier>=0;tier--){const band=bands[tier],n=band.length;if(!n)continue;const fit=n===1?0:Math.max(1.1,spacing/(2*Math.sin(Math.PI/n)));radius=Math.max(fit,used?radius+spacing:0);for(let i=0;i<n;i++){const face=facing+i/n*Math.PI*2;slots.push({unit:band[i],tier,x:center.x+Math.cos(face)*radius,y:center.y+Math.sin(face)*radius,face});}used=true;}}
 else{const cols=kind==='column'?2:Math.max(1,Math.ceil(Math.sqrt(units.length)*1.5));let row=0;for(let tier=0;tier<5;tier++){const band=bands[tier];for(let start=0;start<band.length;){const capacity=kind==='wedge'?Math.min(cols,row*2+1):cols,n=Math.min(capacity,band.length-start);for(let i=0;i<n;i++)slots.push({unit:band[start+i],tier,dx:-row*spacing,dy:(i-(n-1)/2)*spacing,face:facing});start+=n;row++;}}const midpoint=(row-1)*spacing/2;for(const s of slots){const x=s.dx+midpoint;s.x=center.x+x*Math.cos(facing)-s.dy*Math.sin(facing);s.y=center.y+x*Math.sin(facing)+s.dy*Math.cos(facing);}}
 return slots;
}
root.FractureTactics={layout};if(typeof module!=='undefined')module.exports=root.FractureTactics;
})(globalThis);
