'use strict';
(function(root){
const BYTE_FIELDS=['visible','explored','knownNav','knownTiles'],TILE_FIELDS=new Set(['water','height','road','texture']);
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',MAX_CELLS=1048576;
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
function fail(detail){throw new Error('Invalid save data: '+detail);}
function put(o,key,value){Object.defineProperty(o,key,{value,enumerable:true,writable:true,configurable:true});}
function toBase64(bytes){let out='',part='';for(let i=0;i<bytes.length;i+=3){const a=bytes[i],b=bytes[i+1],c=bytes[i+2];part+=ALPHABET[a>>2]+ALPHABET[(a&3)<<4|(b===undefined?0:b>>4)]+(b===undefined?'=':ALPHABET[(b&15)<<2|(c===undefined?0:c>>6)])+(c===undefined?'=':ALPHABET[c&63]);if(part.length>=16384){out+=part;part='';}}return out+part;}
function fromBase64(text,maxBytes){
 if(typeof text!=='string'||text.length%4||text.length>Math.ceil(maxBytes/3)*4||!/^[A-Za-z0-9+/]*={0,2}$/.test(text))fail('malformed byte encoding');
 const count=text.length/4*3-(text.endsWith('==')?2:text.endsWith('=')?1:0);if(count>maxBytes)fail('byte stream exceeds its limit');
 const out=new Uint8Array(count);let at=0;for(let i=0;i<text.length;i+=4){const a=ALPHABET.indexOf(text[i]),b=ALPHABET.indexOf(text[i+1]),c=text[i+2]==='='?0:ALPHABET.indexOf(text[i+2]),d=text[i+3]==='='?0:ALPHABET.indexOf(text[i+3]);if(at<count)out[at++]=a<<2|b>>4;if(at<count)out[at++]=(b&15)<<4|c>>2;if(at<count)out[at++]=(c&3)<<6|d;}
 // Reject noncanonical padding, which otherwise conceals corrupted low bits.
 if(toBase64(out)!==text)fail('noncanonical byte encoding');return out;
}
function byteHash(values){let hash=2166136261;for(let i=0;i<values.length;i++)hash=Math.imul(hash^values[i],16777619);return hash>>>0;}
function packBytes(values){
 if(!values||!Number.isInteger(values.length)||values.length>MAX_CELLS)fail('invalid byte-array length');
 const raw=new Uint8Array(values.length),runs=[];for(let i=0;i<values.length;i++){const v=values[i];if(!Number.isInteger(v)||v<0||v>255)fail('byte value outside 0..255');raw[i]=v;}
 for(let i=0;i<raw.length;){const value=raw[i];let end=i+1;while(end<raw.length&&raw[end]===value)end++;let count=end-i;do{const byte=count&127;count=Math.floor(count/128);runs.push(byte|(count?128:0));}while(count);runs.push(value);i=end;}
 const rle=runs.length<raw.length;return{n:raw.length,kind:rle?'rle':'raw',data:toBase64(rle?runs:raw),hash:byteHash(raw)};
}
function unpackBytes(packed,expected){
 if(!record(packed)||packed.n!==expected||!Number.isInteger(expected)||expected<0||expected>MAX_CELLS||!['raw','rle'].includes(packed.kind)||!Number.isInteger(packed.hash)||packed.hash<0||packed.hash>4294967295)fail('invalid byte-array descriptor');
 const bytes=fromBase64(packed.data,packed.kind==='raw'?expected:expected*2+8);
 if(packed.kind==='raw'){if(bytes.length!==expected)fail('truncated raw byte array');if(byteHash(bytes)!==packed.hash)fail('byte-array checksum mismatch');return Array.from(bytes);}
 const out=new Array(expected);let written=0,index=0;
 while(index<bytes.length){let count=0,shift=0,byte;do{if(index>=bytes.length||shift>21)fail('truncated or oversized run');byte=bytes[index++];count+=(byte&127)*2**shift;shift+=7;}while(byte&128);
  if(count<1||written+count>expected||index>=bytes.length)fail('invalid byte run length');const value=bytes[index++];out.fill(value,written,written+count);written+=count;
 }
 if(written!==expected)fail('truncated run-length array');if(byteHash(out)!==packed.hash)fail('byte-array checksum mismatch');return out;
}
function dimensions(snapshot){const n=snapshot?.options?.size;if(!Number.isInteger(n)||n<1||n*n>MAX_CELLS)fail('invalid map dimensions');return n;}
function probe(noise,seed){return[noise(0,0,seed),noise(.2,.4,seed),noise(5.8,9.1,seed)];}
function packMap(map,n,seed,noise){
 if(!Array.isArray(map)||map.length!==n*n)fail('map length does not match dimensions');
 const bytes=new Uint8Array(map.length),extra=[],generated=typeof noise==='function'&&Number.isFinite(seed),texture=generated?{kind:'noise-v1',seed:seed+19,probe:probe(noise,seed+19)}:{kind:'literal'};
 for(let i=0;i<map.length;i++){
  const tile=map[i];if(!record(tile))fail('map tile must be an object');const overrides={},height=tile.height;let absent=0;
  const smallHeight=Number.isInteger(height)&&height>=0&&height<=63;bytes[i]=(smallHeight?height<<2:0)|(tile.water===true?1:0)|(tile.road===true?2:0);
  if(!has(tile,'water'))absent|=1;else if(typeof tile.water!=='boolean')put(overrides,'water',tile.water);
  if(!has(tile,'height'))absent|=2;else if(!smallHeight)put(overrides,'height',height);
  if(!has(tile,'road'))absent|=4;else if(typeof tile.road!=='boolean')put(overrides,'road',tile.road);
  if(!has(tile,'texture'))absent|=8;else if(!generated||tile.texture!==noise((i%n)/5,Math.floor(i/n)/5,seed+19))put(overrides,'texture',tile.texture);
  for(const key of Object.keys(tile))if(!TILE_FIELDS.has(key))put(overrides,key,tile[key]);
  if(absent||Object.keys(overrides).length)extra.push([i,overrides,absent]);
 }
 return{bytes:packBytes(bytes),texture,extra};
}
function unpackMap(packed,n,noise){
 if(!record(packed)||!record(packed.texture)||!Array.isArray(packed.extra))fail('invalid packed map');
 const bytes=unpackBytes(packed.bytes,n*n),mode=packed.texture,generated=mode.kind==='noise-v1';if(!generated&&mode.kind!=='literal')fail('unknown texture encoding');
 if(generated){if(typeof noise!=='function'||!Number.isFinite(mode.seed)||!Array.isArray(mode.probe)||mode.probe.length!==3)fail('texture generator is unavailable');const actual=probe(noise,mode.seed);if(actual.some((v,i)=>v!==mode.probe[i]))fail('texture generator differs from this save');}
 const map=bytes.map((b,i)=>({water:!!(b&1),height:b>>2,texture:generated?noise((i%n)/5,Math.floor(i/n)/5,mode.seed):0,road:!!(b&2)}));
 const seen=new Set();for(const entry of packed.extra){if(!Array.isArray(entry)||entry.length!==3||!Number.isInteger(entry[0])||entry[0]<0||entry[0]>=map.length||seen.has(entry[0])||!record(entry[1])||!Number.isInteger(entry[2])||entry[2]<0||entry[2]>15)fail('invalid tile override');const [index,overrides,absent]=entry;seen.add(index);for(const key of Object.keys(overrides))put(map[index],key,overrides[key]);if(absent&1)delete map[index].water;if(absent&2)delete map[index].height;if(absent&4)delete map[index].road;if(absent&8)delete map[index].texture;}
 return map;
}
function same(a,b){return a===b||record(a)&&record(b)&&JSON.stringify(a)===JSON.stringify(b)||Array.isArray(a)&&Array.isArray(b)&&JSON.stringify(a)===JSON.stringify(b);}
function packPlayers(players,entities,cells){
 if(!Array.isArray(players))fail('players must be an array');const bases=new Map((entities||[]).map(e=>[String(e.id),e])),memory=[],memo=new Map(),grids=[],gridMemo=new Map();
 const packed=players.map(p=>{
  if(!record(p))fail('invalid player');const data={...p},arrays={};for(const key of BYTE_FIELDS)if(has(p,key)){if(p[key]?.length!==cells)fail('player grid length does not match map');const grid=packBytes(p[key]),signature=JSON.stringify(grid);let ref=gridMemo.get(signature);if(ref===undefined){ref=grids.length;grids.push(grid);gridMemo.set(signature,ref);}arrays[key]=ref;delete data[key];}
  const result={data,arrays};if(record(p.knowledge)){
   const refs=[];for(const [id,snapshot]of Object.entries(p.knowledge)){
    if(!record(snapshot))fail('invalid remembered entity');const encoded=JSON.stringify(snapshot);let ref=memo.get(encoded);
    if(ref===undefined){const base=bases.get(String(snapshot.id)),changes={},removed=[];if(base){for(const key of Object.keys(snapshot))if(!has(base,key)||!same(snapshot[key],base[key]))put(changes,key,snapshot[key]);for(const key of Object.keys(base))if(!has(snapshot,key))removed.push(key);}else for(const key of Object.keys(snapshot))put(changes,key,snapshot[key]);ref=memory.length;memory.push([base?String(snapshot.id):null,changes,removed]);memo.set(encoded,ref);}
    refs.push([id,ref]);
   }
   result.memory=refs;delete data.knowledge;
  }
  return result;
 });return{players:packed,memory,grids};
}
function unpackPlayers(players,memory,entities,cells,grids){
 if(!Array.isArray(players)||!Array.isArray(memory)||!Array.isArray(grids)||players.length>128||grids.length>players.length*4)fail('invalid player or memory table');const decodedGrids=grids.map(grid=>unpackBytes(grid,cells));const bases=new Map((entities||[]).map(e=>[String(e.id),e]));
 const snapshots=memory.map(entry=>{if(!Array.isArray(entry)||entry.length!==3||!(entry[0]===null||typeof entry[0]==='string')||!record(entry[1])||!Array.isArray(entry[2])||entry[2].some(k=>typeof k!=='string'))fail('invalid memory snapshot');const base=entry[0]===null?null:bases.get(entry[0]);if(entry[0]!==null&&!base)fail('remembered entity base is missing');const snapshot={...base,...entry[1]};for(const key of entry[2])delete snapshot[key];return snapshot;});
 return players.map(p=>{
  if(!record(p)||!record(p.data)||!record(p.arrays))fail('invalid packed player');const result={...p.data};for(const [key,value]of Object.entries(p.arrays)){if(!BYTE_FIELDS.includes(key)||!Number.isInteger(value)||value<0||value>=decodedGrids.length)fail('invalid packed player grid reference');result[key]=decodedGrids[value].slice();}
  if(has(p,'memory')){if(!Array.isArray(p.memory))fail('invalid player memory');const knowledge={},seen=new Set();for(const entry of p.memory){if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||seen.has(entry[0])||!Number.isInteger(entry[1])||entry[1]<0||entry[1]>=snapshots.length)fail('invalid memory reference');seen.add(entry[0]);
    // Copies must not alias another player or live entities after loading.
    put(knowledge,entry[0],JSON.parse(JSON.stringify(snapshots[entry[1]])));
   }result.knowledge=knowledge;
  }
  return result;
 });
}
function encode(snapshot,noise){
 if(!record(snapshot)||snapshot.version!==1)fail('unsupported source save version');const n=dimensions(snapshot),data={...snapshot};delete data.version;delete data.map;delete data.players;
 const packedMap=packMap(snapshot.map,n,snapshot.options.seed,noise),packedPlayers=packPlayers(snapshot.players,snapshot.entities,n*n);
 return JSON.stringify({version:2,codec:'fracture-packed-1',data,mapPacked:packedMap,playersPacked:packedPlayers.players,memoryPacked:packedPlayers.memory,gridsPacked:packedPlayers.grids});
}
function decode(text,noise){
 let payload;try{payload=typeof text==='string'?JSON.parse(text):text;}catch{fail('could not parse JSON');}
 if(!record(payload))fail('save must be an object');if(payload.version===1)return payload;
 if(payload.version!==2||payload.codec!=='fracture-packed-1'||!record(payload.data))fail('unsupported save version or codec');
 const n=dimensions(payload.data);if(!Array.isArray(payload.data.entities))fail('entities must be an array');
 const map=unpackMap(payload.mapPacked,n,noise),players=unpackPlayers(payload.playersPacked,payload.memoryPacked,payload.data.entities,n*n,payload.gridsPacked);
 return{...payload.data,version:1,map,players};
}
const api={encode,decode};root.FractureSaveCodec=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
