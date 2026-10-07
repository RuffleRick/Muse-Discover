import http from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {ROOT,DATA,load,save,text,categories,collect,makeKit} from './core.mjs';
import {generate,stopModel,model} from './engine.mjs';
import {getResources,refreshResources} from './resource-feed.mjs';
import {explorationOptions} from './exploration.mjs';
const port=3008;
const origin='http://127.0.0.1:'+port;
await mkdir(DATA,{recursive:true});
let state=await load();
let job=null,closing=false,lastSeen=Date.now();
let writeQueue=Promise.resolve();
function persist(){writeQueue=writeQueue.then(()=>save(state));return writeQueue;}
function reply(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function body(req){
 const chunks=[];let size=0;
 for await (const chunk of req){size+=chunk.length;if(size>20000)throw Error('Request is too large.');chunks.push(chunk);}
 return JSON.parse(Buffer.concat(chunks).toString()||'{}');
}
async function runJob(input){
 try{
 let sourceSet,parent,combined;
 if(input.parentId){
 parent=state.ideas.find(i=>i.id===input.parentId)||state.pins.find(p=>p.idea.id===input.parentId)?.idea;
 if(!parent)throw Error('The selected concept is no longer available.');
 if(input.exploration.combineId){
 combined=state.ideas.find(i=>i.id===input.exploration.combineId)||state.pins.find(p=>p.idea.id===input.exploration.combineId)?.idea;
 if(!combined||combined.id===parent.id)throw Error('Choose another saved idea to combine.');
 }
 sourceSet={category:parent.category,term:parent.name,sources:parent.sources,warnings:[]};
 if(combined)sourceSet.sources=[...new Map([...parent.sources,...combined.sources].map(s=>[s.id,s])).values()];
 }else{
 job.message='Finding public discussions…';
 sourceSet=await collect(state,input.category,input.query);
 await persist();
 }
 if(closing)throw Error('Muse is shutting down.');
 job.sources=sourceSet.sources.length;
 const ideas=await generate(sourceSet,parent,state.ideas,message=>job.message=message,input.exploration,combined);
 if(closing)throw Error('Muse is shutting down.');
 state.ideas.push(...ideas);
 if(state.ideas.length>5000)state.ideas=state.ideas.slice(-5000);
 await persist();
 job={...job,state:'done',message:'Saved '+ideas.length+' fresh concepts. The model is stopped.',ideas,warnings:sourceSet.warnings,finishedAt:Date.now()};
 }catch(e){job={...job,state:'error',message:e.message,finishedAt:Date.now()};console.error(e.message);}
}
const server=http.createServer(async(req,res)=>{
 try{
 if(req.headers.host!=='127.0.0.1:'+port){reply(res,403,{error:'Local access only.'});return;}
 const url=new URL(req.url,origin);
 if(req.method==='POST'){
 if(req.headers.origin!==origin||!req.headers['content-type']?.startsWith('application/json')){reply(res,403,{error:'Open Muse locally to perform this action.'});return;}
 if(closing){reply(res,503,{error:'Muse is closing.'});return;}
 }
 if(url.pathname==='/api/status'&&req.method==='GET'){
 lastSeen=Date.now();reply(res,200,{app:'muse-local',job,model,libraryCount:state.ideas.length});return;
 }
 if(url.pathname==='/api/state'&&req.method==='GET'){
 lastSeen=Date.now();
 reply(res,200,{ideas:state.ideas,pins:state.pins,categories,model,job,mode:'local-on-demand'});return;
 }
 if(url.pathname==='/api/resources'&&req.method==='GET'){
 reply(res,200,await getResources());return;
 }
 if(url.pathname==='/api/resources/refresh'&&req.method==='POST'){
 await body(req);lastSeen=Date.now();reply(res,200,await refreshResources());return;
 }
 if(url.pathname==='/api/generate'&&req.method==='POST'){
 if(job?.state==='running'){reply(res,409,{error:'A generation is already in progress.'});return;}
 const input=await body(req);
 input.category=categories.includes(input.category)?input.category:'Everything';
 input.query=text(input.query,120);input.parentId=text(input.parentId,100);
 input.exploration=explorationOptions(input.exploration);
 lastSeen=Date.now();job={id:randomUUID(),state:'running',message:'Starting…',startedAt:Date.now()};
 reply(res,202,{job});void runJob(input);return;
 }
 if(url.pathname==='/api/pin'&&req.method==='POST'){
 const b=await body(req);const id=text(b.id,100);
 const idea=state.ideas.find(i=>i.id===id)||state.pins.find(p=>p.idea.id===id)?.idea;
 if(!idea){reply(res,404,{error:'Concept not found.'});return;}
 const index=state.pins.findIndex(p=>p.idea.id===id);
 if(b.remove){if(index>=0)state.pins.splice(index,1);}
 else if(index>=0)state.pins[index].note=text(b.note,2000);
 else state.pins.unshift({idea,note:text(b.note,2000),createdAt:new Date().toISOString()});
 await persist();reply(res,200,{pins:state.pins});return;
 }
 if(url.pathname==='/api/kit'&&req.method==='POST'){
 const b=await body(req);const idea=state.ideas.find(i=>i.id===b.id)||state.pins.find(p=>p.idea.id===b.id)?.idea;
 if(!idea){reply(res,404,{error:'Concept not found.'});return;}
 const platform=['web app','desktop tool','Unity game prototype'].includes(b.platform)?b.platform:'web app';
 reply(res,200,makeKit(idea,platform,text(b.note,2000)));return;
 }
 if(url.pathname==='/api/stop'&&req.method==='POST'){
 reply(res,200,{message:'Muse is stopped. Your ideas and pins are saved.'});
 void shutdown();return;
 }
 const assets={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
 if(req.method==='GET'&&assets[url.pathname]){
 const type=url.pathname==='/'?'text/html; charset=utf-8':url.pathname.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8';
 res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'"});res.end(await readFile(path.join(ROOT,'public',assets[url.pathname])));return;
 }
 reply(res,404,{error:'Not found.'});
 }catch(e){reply(res,400,{error:e.message});}
});
async function shutdown(){
 if(closing)return;closing=true;
 await stopModel();
 await writeQueue.catch(()=>{});
 server.close();
 setTimeout(()=>process.exit(0),100).unref();
}
process.on('SIGINT',()=>void shutdown());process.on('SIGTERM',()=>void shutdown());
process.on('uncaughtException',e=>{console.error(e);void shutdown();});
setInterval(()=>{if(Date.now()-lastSeen>120000)void shutdown();},15000).unref();
server.listen(port,'127.0.0.1',()=>console.log('Muse ready at '+origin+' — model starts only on an explicit generation request.'));

