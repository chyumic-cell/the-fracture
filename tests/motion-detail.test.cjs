'use strict';
const assert=require('node:assert/strict');require('../src/sprite-mesh.js');const {step}=global.FractureMotion;
for(let f=0;f<600;f++){const t=f/100,a=step(t,0),b=step(t,.5);assert(a.lift>=0&&b.lift>=0);assert(a.planted||b.planted,'A walking biped must keep a support foot');assert(Math.abs(a.x)<=7.5);if(a.planted)assert.equal(a.lift,0);}
assert.deepEqual(step(0),step(6));assert(Math.abs((step(.5).x-step(0).x)-(step(1).x-step(.5).x))<1e-9,'Stance moves at constant speed against ground travel');
const fake={canvas:{width:336,height:336},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},M=new FractureSpriteMesh(fake,0),d={role:'ranged',air:false};for(let i=0;i<6;i++){M.pose(d,'walk',i);assert.deepEqual(M.posed([3,2,0]),[3,2,0],'Ground-contact vertices do not bob');}
M.pose(d,'attack',2);assert.deepEqual(M.posed([28,0,18]),[28,0,18],'Projectile release keeps original muzzle anchor');M.pose(d,'build',1);const before=M.posed([4,0,25]);M.pose(d,'build',2);assert.notDeepEqual(before,M.posed([4,0,25]));
console.log('PASS planted support foot, constant stance speed, continuous gait loop, grounded vertices, attack release anchor, working weight shift');
