'use strict';
const assert=require('node:assert/strict'),server=require('../server.cjs'),fs=require('node:fs'),path=require('node:path');
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));try{const base='http://127.0.0.1:'+server.address().port,asset='assets/campaign/audio/The Fracture - paced.mp3',size=fs.statSync(path.join(__dirname,'..',asset)).size;
 const head=await fetch(base+'/'+asset,{method:'HEAD'});assert.equal(head.headers.get('content-type'),'audio/mpeg');assert.equal(Number(head.headers.get('content-length')),size);
 const range=await fetch(base+'/'+asset,{headers:{Range:'bytes=1000-1099'}});assert.equal(range.status,206);assert.equal(range.headers.get('content-range'),`bytes 1000-1099/${size}`);const actual=Buffer.from(await range.arrayBuffer()),file=fs.readFileSync(path.join(__dirname,'..',asset));assert(actual.equals(file.subarray(1000,1100)));
 const bad=await fetch(base+'/'+asset,{headers:{Range:`bytes=${size+1}-`}});assert.equal(bad.status,416);
 console.log('PASS media MIME, exact partial-byte responses, HEAD, and invalid-range handling.');
 }finally{server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
