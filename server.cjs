'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end();}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)||pathname.split('/').some(p=>p==='.git'||p==='.env')){res.writeHead(403);return res.end();}
 fs.stat(file,(error,stat)=>{
  if(error||!stat.isFile()){res.writeHead(404);return res.end('Not found');}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.setHeader('Accept-Ranges','bytes');
  let start=0,end=stat.size-1,status=200;
  if(req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':'bytes */'+stat.size});return res.end();}
   if(!match[1])start=Math.max(0,stat.size-Number(match[2]));else start=Number(match[1]);
   if(match[1]&&match[2])end=Math.min(end,Number(match[2]));
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start<0){res.writeHead(416,{'Content-Range':'bytes */'+stat.size});return res.end();}
   status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);
  }
  res.setHeader('Content-Length',Math.max(0,end-start+1));res.writeHead(status);
  if(req.method==='HEAD'||stat.size===0)return res.end();
  const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 });
});
if(require.main===module){const port=Number(process.env.PORT)||4088;server.listen(port,'127.0.0.1',()=>console.log('The Fracture: http://127.0.0.1:'+port));}
module.exports=server;
