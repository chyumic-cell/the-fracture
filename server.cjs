'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.md':'text/plain; charset=utf-8','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
// .env is intentionally local and ignored by Git. Browser code never receives this key.
function loadLocalEnv(){const file=path.join(root,'.env');if(!fs.existsSync(file))return;for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){const m=/^([A-Z0-9_]+)=(.*)$/.exec(line.trim());if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');}}
loadLocalEnv();
function readJson(req){return new Promise((resolve,reject)=>{let body='',size=0;req.on('data',part=>{size+=part.length;if(size>65536){reject(Error('Request too large'));req.destroy();return;}body+=part;});req.on('end',()=>{try{resolve(JSON.parse(body||'{}'));}catch{reject(Error('Invalid JSON'));}});req.on('error',reject);});}
function json(res,status,body){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));}
function extractJson(content){if(typeof content!=='string')return null;const match=content.match(/\{[\s\S]*\}/);if(!match)return null;try{return JSON.parse(match[0]);}catch{return null;}}
let routerAt=0;
async function openRouterDecision(req,res){
 if(!process.env.OPENROUTER_API_KEY)return json(res,503,{error:'OpenRouter is not configured on this local server.'});
 if(Date.now()-routerAt<1800)return json(res,429,{error:'OpenRouter strategist is rate-limited locally.'});
 let input;try{input=await readJson(req);}catch(error){return json(res,400,{error:error.message});}
 const state=input?.state;if(!state||typeof state!=='object')return json(res,400,{error:'Missing strategist state.'});
 const instruction='You are a high-level RTS strategist. Decide one immediate intent from the supplied private game state. Use only supplied remembered intelligence; old contacts are uncertain. You cannot invent units, resources, map knowledge, targets, costs, or actions. Return only JSON: {"action":"attack|raid|siege|recon|defend|fortify|hold","targetId":number|null,"unitPriorities":["unit-id"],"researchPriorities":["research-id"],"rationale":"brief"}. Choose at most three valid unit and research IDs from the supplied lists. Prefer recon when target intelligence is old. The local AI validates everything and controls real-time combat.';
 try{routerAt=Date.now();const response=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.OPENROUTER_API_KEY,'X-Title':'The Fracture RTS'},body:JSON.stringify({model:'openrouter/free',temperature:.25,max_tokens:120,messages:[{role:'system',content:instruction},{role:'user',content:JSON.stringify(state)}]})});
  if(!response.ok)return json(res,502,{error:'OpenRouter request failed.'});const payload=await response.json(),decision=extractJson(payload?.choices?.[0]?.message?.content);return json(res,200,{decision});
 }catch{return json(res,502,{error:'OpenRouter request failed.'});}
}
async function setOpenRouterKey(req,res){
 let input;try{input=await readJson(req);}catch(error){return json(res,400,{error:error.message});}
 const key=typeof input?.key==='string'?input.key.trim():'';
 if(!/^sk-or-v1-[A-Za-z0-9_-]{20,}$/.test(key))return json(res,400,{error:'Invalid OpenRouter key.'});
 // Memory-only override for the active local server. It is not written to a save or file.
 process.env.OPENROUTER_API_KEY=key;
 return json(res,200,{ok:true});
}
const server=http.createServer(async(req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 if(req.method==='POST'&&pathname==='/api/openrouter/decision')return openRouterDecision(req,res);
 if(req.method==='POST'&&pathname==='/api/openrouter/key')return setOpenRouterKey(req,res);
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD, POST'});return res.end();}
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
