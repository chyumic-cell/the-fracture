'use strict';
// Additional authored geometry, kept in the same coordinate system as the original meshes.
(function(root){
function kit(M){
 const tint=root.FractureArt.tint;
 const box=(x,y,z,w,l,h,c,m='metal')=>{M.material(m);M.box(x,y,z,w,l,h,c);};
 const line=(a,b,c,w=.8,m='metal')=>{M.material(m);M.seg(a,b,c,w);};
 const orb=(x,y,z,rx,ry,rz,c,m='metal')=>{M.material(m);M.orb(x,y,z,rx,ry,rz,c);};
 const face=(v,c,m='metal')=>{M.material(m);M.face(v,c);};
 const tube=(x,y,z,r,h,c,m='metal',top=r)=>{M.material(m);M.cylinder(x,y,z,r,h,c,12,top);};
 const ring=(x,y,z,r,c,w=.7)=>{for(let i=0;i<12;i++){const a=i*Math.PI/6,b=(i+1)*Math.PI/6;line([x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z],c,w);}};
 const chain=(a,b,c,n=7)=>{for(let j=0;j<n;j++){const t=j/(n-1),p=a.map((v,k)=>v+(b[k]-v)*t+(k===2?-Math.sin(t*Math.PI)*2:0));orb(...p,.6,.6,.9,c);}};
 const fan=(x,y,z,r,c)=>{tube(x,y,z,r,1.2,'#28383e');ring(x,y,z+1.3,r,c);for(let j=0;j<6;j++){const a=j*Math.PI/3;face([[x,y,z+1.5],[x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.8,z+1.5],[x+Math.cos(a+.5)*r*.7,y+Math.sin(a+.5)*r*.7,z+1.5]],c);}tube(x,y,z+1.5,1,1,c);};
 return{tint,box,line,orb,face,tube,ring,chain,fan};
}
function building(M,d,f){
 const {tint,box,line,orb,face,tube,ring,chain,fan}=kit(M),kind=d.kind,style=f.style;
 const siblings=f.buildings.filter(b=>b.kind===kind),variant=Math.max(0,siblings.findIndex(b=>b.id===d.id));
 if(siblings.length>1&&kind!=='extractor'){
  const col=root.FractureArt.buildingLivery(d,f).primary,edge=tint(col,45),organic=['insect','fungal'].includes(style),material=organic?'chitin':['ape','elder'].includes(style)?'wood':'metal',z=kind==='inf'?47:56;
  // Same-role academies/workshops get different functional silhouettes, not just signs.
  if(variant%3===0){
   if(kind==='inf'){for(const side of [-1,1]){line([-25,side*8,z-17],[-25,side*8,z+4],edge,1.6,material);face([[-25,side*8,z+7],[-23,side*8,z+2],[-27,side*8,z+2]],col,material);}}
   else{tube(-24,-4,z-9,8,5,col,material);orb(-24,-4,z,10,8,7,col,organic?'chitin':'glass');ring(-24,-4,z,11,edge,1.1);line([-24,-4,z],[-12,-4,z+12],edge,2,material);}
  }else if(variant%3===1){
   for(const side of [-1,1]){tube(-25,side*8,z-14,4.5,18,col,material);orb(-25,side*8,z+5,5,5,6,edge,organic?'chitin':'glass');line([-25,side*8,z],[-12,side*8,z-5],edge,1.4,material);}
  }else{
   for(const side of [-1,1])line([-27,side*11,z-17],[-27,side*11,z+9],col,2.5,material);line([-27,-11,z+9],[-27,11,z+9],edge,2,material);
   for(let j=-1;j<=1;j++){line([-27,j*7,z+8],[-27,j*7,z-5],edge,.9,material);orb(-27,j*7,z-6,2.5,2.5,4,col,material);}
  }
 }
 const small=kind==='defense'||kind==='extractor',w=small?19:39,l=small?19:29,team=f.color;
 const industry=['industrial','machine'].includes(style),bio=style==='insect'||style==='fungal';
 if(industry){
  const dark=style==='machine'?'#26343e':'#42545b',metal=style==='machine'?'#758995':'#a5b1ad',lamp=style==='machine'?'#ed7968':'#c1d7ca';
  // Service cabinets, insulated conduits and bolted radiator grilles.
  box(w-4,-l+6,3,7,7,12,dark);box(w-4,-l+6,15,7.4,7.4,1.5,metal);fan(w-4,-l+6,17,4.5,metal);
  for(let j=0;j<4;j++)line([w+3.1,-l+2,6+j*2],[w+3.1,-l+10,6+j*2],metal,.5);
  for(const y of [-l+2,-l+10]){line([w+3,y,5],[w+7,y,5],dark,1.5);line([w+7,y,5],[w+7,l-7,5],metal,1.2);}
  for(const x of [-w+5,w-5]){box(x,l,3,3,3,8,dark);orb(x,l,12,1.1,1.1,1,lamp,'glow');}
  if(!small){
   // A protected service gantry remains outside the doorway and inside the footprint.
   for(let j=0;j<5;j++){const y=-18+j*9;line([w+1,y,4],[w+1,y,15],metal,.7);}
   for(const z of [9,15])line([w+1,-18,z],[w+1,18,z],metal,.75);
   if(['armor','inf','air','depot'].includes(kind)){
    for(let j=0;j<3;j++){box(-w+4+j*7,l-1,3,2.7,3,5,dark);line([-w+2+j*7,l+2.1,4],[-w+6+j*7,l+2.1,7],'#cbb877',.8);}
    box(w-8,l-1,5,5,2,3,dark);face([[w-12,l+1.1,6],[w-4,l+1.1,6],[w-4,l+1.1,7.5],[w-12,l+1.1,7.5]],team,'paint');
   }
   if(style==='machine')for(let j=0;j<3;j++){const x=-w+8+j*7;box(x,l-2,4,2,4,11+j*2,dark);for(let z=7;z<14+j*2;z+=3)line([x-1.8,l+2.1,z],[x+1.8,l+2.1,z],metal,.5);orb(x,l+2.4,8,.6,.3,.6,lamp,'glow');}
  }
 }else if(bio){
  if(style==='insect'){
   // Layered wax comb and breathing slits, not another generic spherical pod.
   for(const side of [-1,1])for(let j=0;j<3;j++){const x=side*(w-6),y=-8+j*9,z=5+j%2*3;
    M.material('chitin');const verts=Array.from({length:6},(_,k)=>[x+Math.cos(k*Math.PI/3)*4,y+Math.sin(k*Math.PI/3)*4,z]);
    M.face(verts,'#493c29');for(let k=0;k<6;k++)line(verts[k],verts[(k+1)%6],'#c2a76c',1.4,'chitin');
    line([x-3,y+1,z+1],[x+3,y+1,z+1],'#8d7949',.7,'chitin');
   }
   for(const s of [-1,1]){orb(s*(w-7),l-4,9,6,4,7,'#8b723c','chitin');for(let j=0;j<3;j++)line([s*(w-7)-3,l-.1,6+j*2],[s*(w-7)+3,l-.1,6+j*2],'#392f29',.8,'chitin');}
  }else{
   for(const s of [-1,1])for(let j=0;j<3;j++){
    const x=s*(w-7),y=-4+j*10;orb(x,y,5,4.5,3,5,'#634d61','skin');
    line([x,y,8],[x-s*6,y+4,2],'#b394a6',.8,'skin');orb(x+1,y+2,7,1.1,.8,1.1,'#d0b4ed','glow');
   }
  }
 }else if(style==='ape'){
  for(const s of [-1,1]){const x=s*(w-4);box(x,l-5,2,5,4,7,'#775739','wood');for(const z of [4,7])line([x-5,l-.8,z],[x+5,l-.8,z],'#c1a279',.7,'cloth');for(let j=-1;j<=1;j++)line([x+j*2.8,l-.7,3],[x+j*2.8,l-.7,8],'#4c382a',.5,'wood');}
  if(!small)for(const side of [-1,1]){line([side*(w+1),-12,2],[side*(w+1),-12,25],'#7e5b3a',2,'wood');line([side*(w+1),-12,25],[side*(w-8),-7,18],'#b59d72',.9,'cloth');for(let j=0;j<4;j++)line([side*(w+1)-2,-12,7+j*1.2],[side*(w+1)+2,-12,7+j*1.2],'#c5aa7b',.55,'cloth');}
 }else{
  const palette={reptile:['#b9a67b','#756b45','#dec78b'],wizard:['#aaa6ad','#626184','#ddc792'],elder:['#9fada0','#496859','#d1cdb2'],myth:['#c9c3ac','#777e71','#e5d7ac'],dragon:['#9e8870','#544e44','#d2b882'],night:['#9796a4','#4b485e','#bbb8c5'],demon:['#796565','#493e42','#c4a278']},[stone,dark,edge]=palette[style]||palette.myth;
  for(const side of [-1,1]){
   const x=side*(w-4),y=l-2;
   // Layered plinths, inset reliefs and capitals make the entrance architecture readable.
   box(x,y,3,4.5,4,3,stone,'stone');tube(x,y,6,2.8,15,stone,'stone',2.3);box(x,y,20,3.4,3,2,edge,'stone');
   for(let k=0;k<4;k++){const a=k*Math.PI/2;line([x+Math.cos(a)*2.8,y+Math.sin(a)*2.8,7],[x+Math.cos(a)*2.3,y+Math.sin(a)*2.3,19],edge,.4,'stone');}
   if(style==='reptile'){
    // Carved, plated serpent heads on stepped gate piers.
    box(x,y,22,4,3.5,3,dark,'stone');orb(x+1,y,26,4,3,2.7,stone,'stone');box(x+3,y,23,3,2.6,2,edge,'stone');orb(x+3,y+2.5,26,.8,.4,.6,'#c5d088','glass');
   }else if(style==='wizard'){
    tube(x,y,22,4,2,dark);ring(x,y,26,5,edge);orb(x,y,27,2.5,2.5,4,'#a5acd7','glass');line([x,y,22],[x,y,31],edge,.7);
   }else if(style==='elder'){
    for(let j=0;j<4;j++){const z=8+j*4;line([x+2.7,y,7],[x+3,y+2,z],dark,.7,'wood');face([[x+3,y+2,z],[x+7,y+2,z+3],[x+5,y+5,z+2]],j%2?'#76916a':'#9da779','cloth');}
    orb(x,y,24,2.8,2.8,3.5,edge,'stone');
   }else if(style==='night'){
    tube(x,y,22,3.5,12,dark,'slate',.2);line([x,y,29],[x,y,38],edge,.7);line([x-2,y,34],[x+2,y,34],edge,.65);
   }else if(style==='demon'||style==='dragon'){
    tube(x,y,22,4,2,dark,'metal',5);orb(x,y,26,1.5,1.5,3,'#e2a36b','glow');for(let j=0;j<4;j++){const a=j*Math.PI/2;line([x+Math.cos(a)*3,y+Math.sin(a)*3,24],[x+Math.cos(a)*4,y+Math.sin(a)*4,29],edge,1);}
   }else{orb(x,y,24,3.5,3.5,3.5,edge,'stone');for(let j=-1;j<=1;j++)line([x-2+j*2,y+3,24],[x-2+j*2,y+3,27],stone,.6,'stone');}
  }
  if(!small){
   for(const side of [-1,1]){const x=side*(w-2);box(x,0,3,3,11,4,dark,'stone');box(x,0,7,3.5,11.5,1,edge,'stone');for(let j=-1;j<=1;j++){face([[x+3.6,j*6-2,4],[x+3.6,j*6+2,4],[x+3.6,j*6+2,6],[x+3.6,j*6-2,6]],stone,'stone');}}
   if(style==='demon')for(const s of [-1,1])chain([s*(w-4),l-2,20],[s*(w-12),l+1,4],edge,8);
  }
 }
}
root.FractureDetailArt={kit,building};
})(globalThis);
