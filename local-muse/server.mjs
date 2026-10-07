import http from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {ROOT,DATA,load,save,text,categories,collect,makeKit} from './core.mjs';
import {generate,stopModel,model} from './engine.mjs';
import {explorationOptions} from './exploration.mjs';
import {createMobileAccess} from './mobile-access.mjs';
import {createRedditSearch} from './reddit-search.mjs';
import {MAX_IMPORT_BYTES,exportLibrary,validateLibrary,mergeLibrary,clearGenerated,createBackup,listBackups,readBackup} from './library-tools.mjs';
const port=3008;
const origin='http://127.0.0.1:'+port;
const mobile=createMobileAccess(ROOT);
const redditSearch=createRedditSearch(DATA);
let mobileChanging=false;
await mkdir(DATA,{recursive:true});
let state=await load();
let job=null,closing=false,managing=false,lastSeen=Date.now();
const backupDirectory=path.join(DATA,'backups');
let writeQueue=Promise.resolve();
function persist(){writeQueue=writeQueue.catch(()=>{}).then(()=>save(state));return writeQueue;}
function reply(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function body(req,limit=20000){
 const chunks=[];let size=0;
 for await (const chunk of req){size+=chunk.length;if(size>limit)throw Error('Request is too large.');chunks.push(chunk);}
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
 sourceSet=await collect(state,input.category,input.query,{redditSearch});
 await persist();
 }
 if(closing)throw Error('Muse is shutting down.');
 job.sources=sourceSet.sources.length;
 const existing=[...new Map([...state.pins.map(p=>p.idea),...state.ideas].map(i=>[i.id,i])).values()];
 const ideas=await generate(sourceSet,parent,existing,message=>job.message=message,input.exploration,combined);
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
 if(managing){reply(res,409,{error:'A library operation is in progress. Please wait.'});return;}
 }
 if(url.pathname==='/api/reddit-search'&&req.method==='GET'){
 lastSeen=Date.now();reply(res,200,await redditSearch.status());return;
 }
 if(url.pathname==='/api/reddit-search'&&req.method==='POST'){
 if(job?.state==='running'){reply(res,409,{error:'Wait for generation to finish before changing search settings.'});return;}
 lastSeen=Date.now();reply(res,200,await redditSearch.configure(await body(req)));return;
 }
 if(url.pathname==='/api/mobile'&&req.method==='GET'){
 lastSeen=Date.now();reply(res,200,await mobile.status());return;
 }
 if(['/api/mobile/enable','/api/mobile/disable'].includes(url.pathname)&&req.method==='POST'){
 if(mobileChanging){reply(res,409,{error:'Mobile setup is in progress.'});return;}
 mobileChanging=true;lastSeen=Date.now();
 try{await body(req);if(url.pathname.endsWith('/enable'))reply(res,200,await mobile.enable());else{await mobile.disable();reply(res,200,await mobile.status());}}
 finally{mobileChanging=false;}
 return;
 }
 if(url.pathname==='/api/status'&&req.method==='GET'){
 lastSeen=Date.now();reply(res,200,{app:'muse-local',job,model,libraryCount:state.ideas.length});return;
 }
 if(url.pathname==='/api/state'&&req.method==='GET'){
 lastSeen=Date.now();
 reply(res,200,{ideas:state.ideas,pins:state.pins,categories,model,job,mode:'local-on-demand'});return;
 }
 if(url.pathname==='/api/library/export'&&req.method==='GET'){
 lastSeen=Date.now();reply(res,200,exportLibrary(state));return;
 }
 if(url.pathname==='/api/library/backups'&&req.method==='GET'){
 lastSeen=Date.now();reply(res,200,{backups:await listBackups(backupDirectory)});return;
 }
 if(['/api/library/import','/api/library/backup','/api/library/restore','/api/library/clear'].includes(url.pathname)&&req.method==='POST'){
 if(job?.state==='running'){reply(res,409,{error:'Wait for idea generation to finish before changing the library.'});return;}
 managing=true;lastSeen=Date.now();
 try{
 const b=await body(req,url.pathname==='/api/library/import'?MAX_IMPORT_BYTES+10000:20000);
 let next,reason='manual';
 if(url.pathname==='/api/library/import'){next=mergeLibrary(state,validateLibrary(b.library));reason='pre-import';}
 if(url.pathname==='/api/library/clear'){if(b.confirm!==true)throw Error('Confirm clearing the generated library.');next=clearGenerated(state);reason='pre-clear';}
 if(url.pathname==='/api/library/restore'){if(b.confirm!==true)throw Error('Confirm replacing the library and pins with this backup.');next={...state,...await readBackup(backupDirectory,b.name)};reason='pre-restore';}
 await writeQueue.catch(()=>{});
 const backup=await createBackup(state,backupDirectory,reason);
 if(next){await save(next);state=next;job=null;}
 reply(res,200,{backup,ideas:state.ideas.length,pins:state.pins.length});
 }finally{managing=false;}
 return;
 }
 if(url.pathname==='/api/generate'&&req.method==='POST'){
 if(job?.state==='running'){reply(res,409,{error:'A generation is already in progress.'});return;}
 const input=await body(req);
 if(managing||job?.state==='running'){reply(res,409,{error:'Muse is busy. Please wait.'});return;}
 input.category=categories.includes(input.category)?input.category:'Everything';
 input.query=text(input.query,120);input.parentId=text(input.parentId,100);
 input.exploration=explorationOptions(input.exploration);
 lastSeen=Date.now();job={id:randomUUID(),state:'running',message:'Starting…',startedAt:Date.now()};
 reply(res,202,{job});void runJob(input);return;
 }
 if(url.pathname==='/api/pin'&&req.method==='POST'){
 const b=await body(req);const id=text(b.id,100);
 if(managing){reply(res,409,{error:'A library operation is in progress. Please wait.'});return;}
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
 while(mobileChanging)await new Promise(resolve=>setTimeout(resolve,100));
 await mobile.disable();
 await stopModel();
 await writeQueue.catch(()=>{});
 server.close();
 setTimeout(()=>process.exit(0),100).unref();
}
process.on('SIGINT',()=>void shutdown());process.on('SIGTERM',()=>void shutdown());
process.on('uncaughtException',e=>{console.error(e);void shutdown();});
setInterval(()=>{if(!mobile.enabled()&&!mobileChanging&&Date.now()-lastSeen>120000)void shutdown();},15000).unref();
server.listen(port,'127.0.0.1',()=>console.log('Muse ready at '+origin+' — model starts only on an explicit generation request.'));
