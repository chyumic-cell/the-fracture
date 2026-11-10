'use strict';
(function(root){
function render(ctx,d,f,stage,front){
 const M=new root.FractureSpriteMesh(ctx,0,false,{originX:120,originY:181,logicalWidth:240}),{box,line,orb,tube,face}=root.FractureDetailArt.kit(M),extension=!!d.building,small=['defense','extractor'].includes(d.kind),w=extension?25:small?25:48,l=extension?22:small?25:37,h=(extension?30:small?42:72)*(.4+stage*.3),metal=['industrial','machine'].includes(f.style),bio=['insect','fungal'].includes(f.style),mat=metal?'metal':bio?'chitin':'wood',beam=metal?'#899a9d':bio?f.style==='fungal'?'#937482':'#b39b69':'#a58a62',dark=metal?'#394e57':bio?'#554951':'#63513b',rope=metal?'#b8bfb4':'#d1bc8d';
 const post=(x,y)=>{line([x,y,2],[x,y,h+8],beam,metal?1.3:2,mat);box(x,y,0,3,3,2,dark,mat);for(let z=12;z<h;z+=20){if(metal)tube(x,y,z,1.1,1.2,rope);else for(let j=0;j<3;j++)line([x-1.5,y-1.2,z+j*.8],[x+1.5,y+1.2,z+j*.8],rope,.45,'cloth');}};
 const spans=front?[[[w,-l],[w,l]],[[-w,l],[w,l]]]:[[[-w,-l],[-w,l]],[[-w,-l],[w,-l]]];
 for(const [a,b]of spans){const length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(length/24),vx=(b[0]-a[0])/n,vy=(b[1]-a[1])/n;
  for(let i=0;i<=n;i++)post(a[0]+vx*i,a[1]+vy*i);
  for(let z=12;z<h;z+=20){
   line([a[0],a[1],z],[b[0],b[1],z],beam,1.5,mat);line([a[0],a[1],z+8],[b[0],b[1],z+8],beam,.8,mat);
   const nx=vy? -5:0,ny=vx?-5:0;
   for(let i=0;i<n;i++){const x=a[0]+vx*i,y=a[1]+vy*i;
    line([x,y,z-10],[x+vx,y+vy,z+7],beam,.85,mat);
    if(!bio){const steps=Math.ceil(Math.hypot(vx,vy)/4);for(let j=0;j<steps;j++){const t=j/steps,t2=(j+.85)/steps;face([[x+vx*t,y+vy*t,z],[x+vx*t2,y+vy*t2,z],[x+vx*t2+nx,y+vy*t2+ny,z],[x+vx*t+nx,y+vy*t+ny,z]],j%3===0?dark:beam,metal?'metal':'wood');}}
    else for(let j=0;j<4;j++){const t=j/4;line([x+vx*t,y+vy*t,z],[x+vx*t+nx,y+vy*t+ny,z-2],rope,.5,'cloth');}
   }
  }
 }
 if(front){
  // Angled ladder stands against the near-side platform, with individual rungs.
  const x=-w+10,y=l+2,top=Math.min(h,42);for(const dx of [-2.6,2.6])line([x+dx,y+8,1],[x+dx,y,top],beam,.85,mat);for(let z=3;z<top;z+=4){const yy=y+8*(1-z/top);line([x-2.6,yy,z],[x+2.6,yy,z],rope,.65,mat);}
  if(!bio){for(let j=0;j<3;j++)box(w-14,l-6,1+j*1.2,8,1.5,1,beam,mat);box(-w+7,l-7,2,3,3,5,dark,mat);line([-w+5,l-7,7],[-w+9,l-7,7],rope,.8);}
  else{orb(w-8,l-8,4,5,4,3,dark,mat);for(let j=0;j<3;j++)line([w-8,l-8,6],[w-18+j*6,l-3,2],beam,.8,mat);}
 }else if(stage>0){
  // Small hoist, hanging load and counter brace.
  const x=w-5,y=-l;line([x,y,3],[x,y,h+15],beam,2,mat);line([x,y,h+15],[x-17,y,h+15],beam,1.7,mat);line([x,y,h+5],[x-14,y,h+15],beam,1.2,mat);line([x-15,y,h+15],[x-15,y,h-10],rope,.4,'cloth');box(x-15,y,h-13,3,3,4,dark,mat);
 }
 M.finish();
}
root.FractureConstructionArt={render};
})(globalThis);
