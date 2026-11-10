'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),C=require('../src/save-codec.js'),{noise}=require('../src/simulation.js');
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
function fixture(n=12,playerCount=2,entityCount=4){
 const seed=62483,cells=n*n,map=Array.from({length:cells},(_,i)=>{const x=i%n,y=Math.floor(i/n),h=noise(x/13,y/13,seed);return{water:h<.26,height:Math.max(0,Math.floor((h-.37)*7)),texture:noise(x/5,y/5,seed+19),road:false};});
 const entities=Array.from({length:entityCount},(_,i)=>i%3?{id:i+1,kind:'tree',x:(i*31.37)%n,y:(i*17.93)%n,hp:1,size:.4,variant:i%4}:{id:i+1,kind:'resource',resource:i%4,x:(i*9.14)%n,y:(i*23.51)%n,hp:1,amount:600,maxAmount:900,size:.85});
 const nav=Array.from({length:cells},(_,i)=>(i%19===0||i%37<3)?1:0),tiles=map.map(t=>(t.water?128:0)|t.height);
 const players=Array.from({length:playerCount},(_,id)=>({id,faction:'humans',stock:[320,60,60,10],tech:[],visible:new Uint8Array(cells).fill(1),explored:new Uint8Array(cells).fill(1),knownNav:Uint8Array.from(nav),knownTiles:Uint8Array.from(tiles),knowledge:Object.fromEntries(entities.map(e=>[e.id,{...e,queue:[],ghost:true}]))}));
 return{version:1,options:{size:n,seed,factions:players.map(p=>p.faction)},map,entities,players,time:31.125,rng:987654,winner:null,controlGroups:{'1':[1,2]},custom:{nested:[true,'exact']}};
}
function plain(snapshot){return{...snapshot,players:snapshot.players.map(p=>({...p,...Object.fromEntries(['visible','explored','knownNav','knownTiles'].filter(k=>p[k]).map(k=>[k,Array.from(p[k])]))}))};}
test('Small save round trip preserves every map, entity, player, and custom field',()=>{
 const original=fixture();original.players[0].aiState={economy:{goal:'build:lab'},enemyMemory:[{id:999,x:1.25,y:2.75}]};original.players[0].knowledge['1'].amount=17;original.players[0].knowledge['1'].custom={path:[1,2]};delete original.players[0].knowledge['2'].variant;original.players[0].knowledge['999']={id:999,kind:'building',type:'humans_b0',x:7,y:9,hp:10};
 const before=JSON.stringify(plain(original)),encoded=C.encode(original,noise),decoded=C.decode(encoded,noise);assert.equal(JSON.parse(encoded).version,2);assert.deepEqual(decoded,plain(original));assert.equal(JSON.stringify(plain(original)),before);decoded.players[0].knowledge['3'].queue.push({type:'test'});assert.equal(decoded.players[1].knowledge['3'].queue.length,0);assert.equal(decoded.entities[2].queue,undefined);
});
test('Sparse tile edits preserve exact floats, absent fields, unusual heights, and arbitrary extra properties',()=>{
 const s=fixture(8);s.map[0]={water:null,height:256.125,texture:Math.PI,road:'roadwork',custom:{biome:'glass',values:[1,2,null]}};s.map[1]={height:-3,extra:'no standard fields'};s.map[2].texture=0.10000000000000002;s.map[3].road=true;s.map[4].height=63;s.map[5].height=64;Object.defineProperty(s.map[6],'__proto__',{value:{safe:'ordinary property'},enumerable:true});const result=C.decode(C.encode(s,noise),noise);assert.deepEqual(result.map,s.map);assert.equal(Object.getPrototypeOf(result.map[6]),Object.prototype);assert.equal({}.safe,undefined);
});
test('Literal textures work without a generator and incorrect noise generators fail clearly',()=>{
 const s=fixture(6),encoded=C.encode(s);assert.deepEqual(C.decode(encoded),plain(s));assert.throws(()=>C.decode(C.encode(s,noise)),/Invalid save data: texture generator is unavailable/);assert.throws(()=>C.decode(C.encode(s,noise),()=>0),/texture generator differs/);
});
test('All byte values and raw-versus-run encodings round trip exactly',()=>{
 const s=fixture(32,1);for(let i=0;i<s.map.length;i++){s.players[0].knownTiles[i]=i%256;s.players[0].knownNav[i]=i%2;}const data=JSON.parse(C.encode(s,noise));assert.equal(data.gridsPacked[data.playersPacked[0].arrays.knownTiles].kind,'raw');assert.equal(data.gridsPacked[data.playersPacked[0].arrays.visible].kind,'rle');assert.deepEqual(C.decode(data,noise),plain(s));
});
test('Existing version-one saves load unchanged, including optional missing navigation fields',()=>{
 const s=plain(fixture(8));delete s.players[0].knownNav;delete s.players[0].knownTiles;delete s.players[0].knowledge;const legacy=JSON.stringify(s);assert.deepEqual(C.decode(legacy),s);assert.equal(C.decode(s),s);
});
test('Browser UMD works without CommonJS, Buffer, or base64 globals',()=>{
 const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../src/save-codec.js'),'utf8'),context);const input=fixture(8),text=context.FractureSaveCodec.encode(input,noise),output=context.FractureSaveCodec.decode(text,noise);assert.equal(JSON.stringify(output),JSON.stringify(C.decode(text,noise)));
});
test('Malformed descriptors, byte corruption, bad references, and unsupported formats reject clearly',()=>{
 const source=JSON.parse(C.encode(fixture(8),noise));const corrupt=edit=>{const data=JSON.parse(JSON.stringify(source));edit(data);assert.throws(()=>C.decode(data,noise),/Invalid save data:/);};
 assert.throws(()=>C.decode('{'),/Invalid save data: could not parse JSON/);assert.throws(()=>C.decode('{"version":99}'),/Invalid save data:/);
 corrupt(s=>s.mapPacked.bytes.n++);corrupt(s=>s.mapPacked.bytes.data='%%%?');corrupt(s=>s.mapPacked.bytes.hash^=1);corrupt(s=>s.mapPacked.bytes.data='AAE=');corrupt(s=>s.mapPacked.bytes.data='/////w8=');corrupt(s=>s.mapPacked.extra.push([999,{},0]));corrupt(s=>s.mapPacked.extra.push([1,{},0],[1,{},0]));corrupt(s=>s.playersPacked[0].memory[0][1]=99999);corrupt(s=>s.memoryPacked[0][0]='does-not-exist');corrupt(s=>s.data.options.size=1000000);
});
test('Fully explored 500-by-500 four-player save fits below four megabytes of UTF-16 storage',()=>{
 const s=fixture(500,4,6500),start=performance.now(),encoded=C.encode(s,noise),encodedAt=performance.now(),decoded=C.decode(encoded,noise),end=performance.now();assert(encoded.length*2<4*1024*1024,'UTF-16 save bytes: '+encoded.length*2);assert.deepEqual(decoded.map,s.map);assert.deepEqual(decoded.entities,s.entities);assert.deepEqual(decoded.players,plain(s).players);console.log(JSON.stringify({map:'500x500',players:4,entities:s.entities.length,utf16Bytes:encoded.length*2,characters:encoded.length,encodeMs:Math.round(encodedAt-start),decodeMs:Math.round(end-encodedAt)}));
});
console.log('TOTAL '+count+' compact-save checks passed');
