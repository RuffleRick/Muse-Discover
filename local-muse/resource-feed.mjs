import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {DATA} from './core.mjs';
const file=path.join(DATA,'resources.json');let refreshPromise;
export function localDay(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
export function resourceUrl(value){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||!u.hostname.includes('.')||/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)||/\.(local|localhost|internal)$/.test(u.hostname))return null;u.hash='';return u.href;}catch{return null;}
}
function clean(value){return String(value||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().slice(0,180);}
function valid(items){return Array.isArray(items)?items.filter(i=>i&&typeof i.title==='string'&&resourceUrl(i.url)).map(i=>({title:clean(i.title),url:resourceUrl(i.url),source:new URL(i.url).hostname.replace(/^www\./,'')})):[];}
export function learningResult(item){return /\bcodex\b/i.test(item.title)&&/\b(openai|cli|code|coding|developers?|workflows?|skills?|prompts?|review\w*|debug\w*|test\w*|build\w*|config\w*|usage|pm|productivity|software)\b/i.test(item.title)&&/\b(tutorials?|guides?|how|learn\w*|workflows?|skills?|prompts?|review\w*|debug\w*|test\w*|build\w*|config\w*|tips?|examples?|cli)\b/i.test(item.title);}
export function chooseResults(items,history=[],day=localDay()){
 const unique=new Map();for(const item of valid(items))if(!unique.has(item.url))unique.set(item.url,item);
 const seen=new Set(history);const hash=s=>{let n=0;for(const ch of s)n=(n*31+ch.charCodeAt(0))>>>0;return n;};
 const ranked=[...unique.values()].sort((a,b)=>Number(seen.has(a.url))-Number(seen.has(b.url))||hash(day+a.url)-hash(day+b.url));
 const selected=[],domains=new Map();
 for(const item of ranked){if((domains.get(item.source)||0)>=2)continue;selected.push(item);domains.set(item.source,(domains.get(item.source)||0)+1);if(selected.length===5)return selected;}
 for(const item of ranked){if(selected.some(i=>i.url===item.url))continue;selected.push(item);if(selected.length===5)break;}
 return selected;
}
async function cache(){try{const c=JSON.parse(await readFile(file,'utf8'));if(c&&typeof c==='object')return c;}catch{}return {items:[],history:[]};}
function present(c){return {day:localDay(),items:valid(c.items).slice(0,5),refreshedAt:c.refreshedAt||null,checkedToday:c.version===2&&c.attemptedDay===localDay(),warnings:c.warnings||[],mode:'automatic-daily-web'};}
async function json(url){
 const r=await fetch(url,{signal:AbortSignal.timeout(12000),redirect:'error',headers:{Accept:'application/json'}});if(!r.ok)throw Error('Search source unavailable');
 const reader=r.body.getReader();let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1000000)throw Error('Search response too large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
async function searchCommunity(){const d=await json('https://dev.to/api/articles?tag=codex&per_page=50');if(!Array.isArray(d))throw Error('Community search unavailable');return d.map(i=>({title:i.title,url:i.url})).filter(learningResult);}
async function searchDiscussions(day){
 const topics=['codex workflow','codex skills','codex guide','codex review','codex build'];const term=topics[Math.floor(Date.parse(day+'T12:00:00Z')/86400000)%topics.length];
 const d=await json('https://hn.algolia.com/api/v1/search?query='+encodeURIComponent(term)+'&tags=story&hitsPerPage=50');if(!Array.isArray(d.hits))throw Error('Discussion search unavailable');return d.hits.filter(i=>i.url).map(i=>({title:i.title,url:i.url})).filter(learningResult);
}
export async function getResources(){return present(await cache());}
export async function refreshResources(){
 if(refreshPromise)return refreshPromise;
 refreshPromise=(async()=>{
  const previous=await cache(),day=localDay();if(previous.version===2&&previous.attemptedDay===day)return present(previous);
  const results=await Promise.allSettled([searchCommunity(),searchDiscussions(day)]);
  const found=results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);const history=Array.isArray(previous.history)?previous.history:[];
  const candidates=valid(found),selected=chooseResults(candidates,history,day);
  const warnings=[];if(results.some(r=>r.status==='rejected'))warnings.push('One or more search sources were unavailable.');
  if(selected.length<4)warnings.push(selected.length?'Fewer than four relevant results were found today.':'Daily search unavailable. Showing the last saved results; Muse will try again tomorrow.');
  const next={version:2,attemptedDay:day,items:selected.length?selected:valid(previous.items).slice(0,5),refreshedAt:selected.length?new Date().toISOString():previous.refreshedAt||null,history:[...new Set([...selected.map(i=>i.url),...history])].slice(0,100),warnings};
  await mkdir(DATA,{recursive:true});await writeFile(file+'.tmp',JSON.stringify(next,null,2),'utf8');await rename(file+'.tmp',file);return present(next);
 })();try{return await refreshPromise;}finally{refreshPromise=null;}
}
