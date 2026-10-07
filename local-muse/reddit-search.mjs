import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export const MONTHLY_SEARCH_LIMIT=900;
export const isSearchSnippet=s=>s?.kind==='search-snippet'||String(s?.id||'').startsWith('reddit-search-');
const clean=(s,max)=>typeof s==='string'?s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,max):'';
export function redditSnippets(results,now=Date.now()){
 const sources=[],seen=new Set();
 for(const r of Array.isArray(results)?results.slice(0,20):[]){
  let u;try{u=new URL(r.url);}catch{continue;}
  if(u.protocol!=='https:'||u.username||u.password||!['reddit.com','www.reddit.com','old.reddit.com'].includes(u.hostname)||u.port)continue;
  const match=u.pathname.match(/^\/r\/([a-z0-9_]+)\/comments\/([a-z0-9]+)(?:\/|$)/i);if(!match)continue;
  const title=clean(r.title,300),excerpt=clean(r.content,1200),id=match[2].toLowerCase();
  if(!title||excerpt.length<100||seen.has(id)||/^\[(?:deleted|removed)\]$/i.test(excerpt))continue;
  seen.add(id);sources.push({id:'reddit-search-'+id,title,url:'https://www.reddit.com/r/'+match[1]+'/comments/'+id+'/',excerpt,site:'Reddit · Tavily search snippet',kind:'search-snippet',provider:'Tavily',author:'',discussionId:id,retrievedAt:new Date(now).toISOString()});
 }
 return sources.slice(0,10);
}
// Separate private configuration/meter: never part of portable library exports or backups.
export function createRedditSearch(directory,{fetcher=fetch,now=()=>Date.now()}={}){
 const file=path.join(directory,'reddit-search.json');let queue=Promise.resolve();
 const locked=fn=>{const result=queue.catch(()=>{}).then(fn);queue=result;return result;};
 const month=()=>new Date(now()).toISOString().slice(0,7);
 async function load(){
  let d;try{d=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return {key:'',enabled:false,month:month(),used:0,revision:'off'};throw Error('Reddit search settings could not be read. Search is paused.');}
  if(typeof d.key!=='string'||typeof d.enabled!=='boolean'||typeof d.month!=='string'||!Number.isInteger(d.used)||d.used<0)throw Error('Reddit search settings are invalid. Search is paused.');
  if(d.month!==month()){d.month=month();d.used=0;d.blocked=false;d.backoffUntil=0;}
  return d;
 }
 async function store(d){await mkdir(directory,{recursive:true});await writeFile(file+'.tmp',JSON.stringify(d,null,2),{encoding:'utf8',mode:0o600});await rename(file+'.tmp',file);}
 function publicStatus(d){return {configured:!!d.key,enabled:d.enabled&&!!d.key,month:d.month,used:d.used,limit:MONTHLY_SEARCH_LIMIT,paused:!!d.blocked||d.used>=MONTHLY_SEARCH_LIMIT||now()<(d.backoffUntil||0),cacheVersion:d.revision||'off'};}
 return {
  status:()=>locked(async()=>publicStatus(await load())),
  configure:input=>locked(async()=>{
   const d=await load();
   if(input.remove===true){d.key='';d.enabled=false;}
   else{
    if(input.enabled!==true&&input.enabled!==false)throw Error('Choose whether Reddit search is enabled.');
    if(input.key){if(typeof input.key!=='string'||!/^tvly-[a-zA-Z0-9_-]{10,250}$/.test(input.key.trim()))throw Error('Enter a valid Tavily API key.');d.key=input.key.trim();}
    if(input.enabled&&(!d.key||input.freePlanConfirmed!==true))throw Error('Connect a key and confirm Tavily’s free plan with paid usage disabled.');
    d.enabled=input.enabled;
   }
   d.revision=randomUUID();await store(d);return publicStatus(d);
  }),
  search:term=>locked(async()=>{
   const d=await load(),status=publicStatus(d);
   if(!status.enabled)return {sources:[],warnings:['Reddit search is off. Connect Tavily’s free plan in Library tools to include search snippets.']};
   if(status.paused)return {sources:[],warnings:['Reddit search is paused by its monthly limit or provider backoff. Other sources remain available.']};
   // Reserve before the network call. Failures count too; reconnecting never resets usage.
   d.used++;await store(d);
   let response;
   try{response=await fetcher('https://api.tavily.com/search',{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+d.key,'Content-Type':'application/json'},body:JSON.stringify({query:'site:reddit.com '+clean(term,120),include_domains:['reddit.com'],include_domains_mode:'restrict',search_depth:'basic',auto_parameters:false,topic:'general',chunks_per_source:3,max_results:10,include_answer:false,include_raw_content:false,include_images:false,include_usage:true,safe_search:true}),signal:AbortSignal.timeout(20000)});}
   catch{throw Error('Reddit search provider could not be reached. Other sources remain available.');}
   if(!response.ok){
    if([432,433].includes(response.status))d.blocked=true;
    if(response.status===429){const retry=response.headers.get('retry-after')||'',delay=/^\d+$/.test(retry)?Number(retry)*1000:Date.parse(retry)-now();d.backoffUntil=now()+Math.max(60000,Number.isFinite(delay)?delay:300000);}
    await store(d);
    throw Error([401,403].includes(response.status)?'Tavily rejected the API key. Reconnect in Library tools.':[432,433].includes(response.status)?'Tavily’s usage limit was reached. Reddit search is paused until next month.':response.status===429?'Tavily requested a pause. Reddit search will respect its backoff.':'Reddit search provider returned HTTP '+response.status+'.');
   }
   let payload;try{payload=await response.json();if(!payload||typeof payload!=='object'||!Array.isArray(payload.results))throw Error();}catch{throw Error('Reddit search provider returned an unreadable response.');}
   if(Number(payload.usage?.credits)>1){d.blocked=true;await store(d);throw Error('Unexpected search credit usage. Reddit search is paused until next month.');}
   const sources=redditSnippets(payload.results,now());
   return {sources,warnings:[sources.length?'Reddit results are Tavily search snippets, not full threads or verified need signals. Open the links to check context.':'No usable Reddit search snippets found for this topic.']};
  })
 };
}
