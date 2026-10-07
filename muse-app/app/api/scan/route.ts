import {synthesize,type Signal} from "../../lib";
export const dynamic="force-dynamic";
function clean(s:unknown){return String(s||"").replace(/<[^>]*>/g," ").replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&amp;/g,"&").replace(/\s+/g," ").trim();}
async function get(url:string,github=false){
 const r=await fetch(url,{headers:github?{"Accept":"application/vnd.github+json","User-Agent":"Muse-Opportunity-Lab"}:{},signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw new Error(r.status===403||r.status===429?"Source is rate limited. Try again later.":"Source unavailable ("+r.status+").");
 return r.json() as Promise<any>;
}
export async function GET(req:Request){
 const params=new URL(req.url).searchParams;const topic=(params.get("topic")||"productivity").trim().slice(0,80);
 if(topic.length<2)return Response.json({error:"Enter at least two characters."},{status:400});
 const enabled=(params.get("sources")||"hn,github").split(",");
 const jobs:{source:string;run:()=>Promise<Signal[]>}[]=[];
 if(enabled.includes("hn"))jobs.push({source:"Hacker News",run:async()=>{
 const d=await get("https://hn.algolia.com/api/v1/search?query="+encodeURIComponent(topic)+"&tags=story&hitsPerPage=40");
 return d.hits.map((h:any)=>({id:"hn-"+h.objectID,source:"Hacker News",title:clean(h.title),text:clean(h.story_text).split(" ").slice(0,25).join(" "),url:"https://news.ycombinator.com/item?id="+h.objectID,date:h.created_at,engagement:h.num_comments||0})).filter((s:Signal)=>s.title);
 }});
 if(enabled.includes("github"))jobs.push({source:"GitHub Issues",run:async()=>{
 const d=await get("https://api.github.com/search/issues?q="+encodeURIComponent('"'+topic.replace(/["\\]/g,"")+'" is:issue is:open')+"&sort=comments&order=desc&per_page=30",true);
 return d.items.map((h:any)=>({id:"gh-"+h.id,source:"GitHub Issues",title:clean(h.title),text:clean(h.body).split(" ").slice(0,25).join(" "),url:h.html_url,date:h.created_at,engagement:h.comments||0}));
 }});
 if(!jobs.length)return Response.json({error:"Select at least one source."},{status:400});
 const settled=await Promise.allSettled(jobs.map(j=>j.run()));const signals:Signal[]=[];
 const statuses=settled.map((r,i)=>{if(r.status==="fulfilled"){signals.push(...r.value);return {source:jobs[i].source,ok:true,count:r.value.length};}return {source:jobs[i].source,ok:false,count:0,error:r.reason?.message||"Source unavailable"};});
 if(!statuses.some(s=>s.ok))return Response.json({error:"The sources could not be reached. Please try again later.",statuses},{status:502});
 return Response.json({topic,signals,ideas:synthesize(topic,signals),statuses,scannedAt:new Date().toISOString()},{headers:{"Cache-Control":"private, max-age=120"}});
}

