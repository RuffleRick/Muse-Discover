import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {DATA} from './core.mjs';
const indexes=[{url:'https://developers.openai.com/blog/topic/codex.md',kind:'Article'},{url:'https://developers.openai.com/cookbook/topic/codex.md',kind:'Tutorial'},{url:'https://developers.openai.com/learn/codex.md',kind:'Tutorial'}];
const starter=[
 {title:'Rethinking skills and prompts for GPT-6 Astra',url:'https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra',kind:'Article'},
 {title:'Automating repetitive work at OpenAI with Codex',url:'https://developers.openai.com/blog/automating-repetitive-work-at-openai-with-codex',kind:'Article'},
 {title:'Using Goals in Codex',url:'https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex',kind:'Tutorial'},
 {title:'Iterating Development Workflows with Codex',url:'https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex',kind:'Tutorial'},
 {title:'Introducing the Codex app',url:'https://www.youtube.com/watch?v=HFM3se4lNiw',kind:'Video'},
 {title:'Build beautiful frontends with OpenAI Codex',url:'https://www.youtube.com/watch?v=fK_bm84N7bs',kind:'Video'},
 {title:'Codex code review',url:'https://www.youtube.com/watch?v=HwbSWVg5Ln4',kind:'Video'}
];
const file=path.join(DATA,'resources.json');let refreshPromise;
export function resourceUrl(value){
 try{
  const u=new URL(value,'https://developers.openai.com');
  if(u.protocol!=='https:'||u.username||u.password||u.port)return null;
  if(u.hostname==='developers.openai.com'&&/^\/(blog|cookbook|learn)\//.test(u.pathname)){u.pathname=u.pathname.replace(/\.md$/,'');u.search='';u.hash='';return u.href;}
  if(u.hostname==='www.youtube.com'&&u.pathname==='/watch'&&/^[\w-]{11}$/.test(u.searchParams.get('v')||''))return 'https://www.youtube.com/watch?v='+u.searchParams.get('v');
 }catch{}return null;
}
export function parseResources(markdown,kind){
 const items=[];
 for(const match of markdown.matchAll(/^- \[([^\]\n]+)\]\(([^)\s]+)\)/gm)){
  const url=resourceUrl(match[2]);if(!url)continue;
  const title=match[1].replace(/<[^>]*>/g,'').slice(0,180).trim();if(title)items.push({title,url,kind:url.includes('youtube.com/')?'Video':kind});
 }return items;
}
function localDay(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
function validItems(items){return Array.isArray(items)?items.filter(i=>i&&typeof i.title==='string'&&resourceUrl(i.url)&&['Article','Tutorial','Video'].includes(i.kind)).map(i=>({...i,url:resourceUrl(i.url),title:i.title.slice(0,180)})):[];}
async function cache(){try{const saved=JSON.parse(await readFile(file,'utf8'));if(saved&&typeof saved==='object'&&!Array.isArray(saved))return saved;}catch{}return {items:starter,refreshedAt:null,warnings:[]};}
export function dailyPicks(items,day){
 const offset=Math.floor(Date.parse(day+'T12:00:00Z')/86400000);
 return ['Article','Tutorial','Video'].flatMap(kind=>{const group=items.filter(i=>i.kind===kind);return Array.from({length:Math.min(3,group.length)},(_,n)=>group[(offset+n)%group.length]);});
}
function present(c){
 const items=validItems(c.items),catalog=items.length?items:starter,day=localDay();
 return {day,items:dailyPicks(catalog,day),total:catalog.length,refreshedAt:c.refreshedAt||null,checkedToday:!!c.refreshedAt&&localDay(new Date(c.refreshedAt))===day,warnings:c.warnings||[],source:'OpenAI Developers',mode:'manual-daily'};
}
export async function getResources(){return present(await cache());}
async function fetchIndex(index){
 const response=await fetch(index.url,{signal:AbortSignal.timeout(12000),redirect:'error',headers:{Accept:'text/markdown'}});if(!response.ok)throw Error('Resource index unavailable');
 const reader=response.body.getReader();let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>256000)throw Error('Resource index too large');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const items=parseResources(Buffer.concat(chunks).toString('utf8'),index.kind);if(!items.length)throw Error('Resource index format changed');return items;
}
export async function refreshResources(){
 if(refreshPromise)return refreshPromise;
 refreshPromise=(async()=>{
  const previous=await cache();if(present(previous).checkedToday)return present(previous);
  if(previous.attemptedAt&&Date.now()-Date.parse(previous.attemptedAt)<60000)return present(previous);
  const results=await Promise.allSettled(indexes.map(fetchIndex));
  const fetched=results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
  const warnings=results.some(r=>r.status==='rejected')?['Some sources could not be checked. Saved links remain available.']:[];
  const combined=[...fetched,...validItems(previous.items),...starter];
  const unique=new Map();for(const item of combined)if(!unique.has(item.url))unique.set(item.url,item);
  const items=[...unique.values()].slice(0,120);
  const next={items,refreshedAt:results.every(r=>r.status==='fulfilled')?new Date().toISOString():previous.refreshedAt||null,attemptedAt:new Date().toISOString(),warnings};
  await mkdir(DATA,{recursive:true});await writeFile(file+'.tmp',JSON.stringify(next,null,2),'utf8');await rename(file+'.tmp',file);return present(next);
 })();try{return await refreshPromise;}finally{refreshPromise=null;}
}
