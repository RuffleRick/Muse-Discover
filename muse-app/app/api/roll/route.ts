import {catalog,families} from "../../ideas";
export const dynamic="force-dynamic";
export async function POST(req:Request){
 try{
 const body=await req.json() as {category?:string;exclude?:unknown[];query?:string};
 const category=typeof body.category==="string"?body.category:"Everything";
 const query=typeof body.query==="string"?body.query.trim().slice(0,80).toLowerCase():"";
 const exclude=new Set(Array.isArray(body.exclude)?body.exclude.slice(0,100).filter(x=>typeof x==="string"):[]);
 const pool=catalog.filter(c=>(category==="Everything"||c.category===category)&&(!query||[c.name,c.pitch,c.audience,c.category,families.find(f=>f.id===c.family)?.topic||""].join(" ").toLowerCase().includes(query)));
 const shuffled=[...pool];
 for(let i=shuffled.length-1;i>0;i--){const n=new Uint32Array(1);crypto.getRandomValues(n);const j=n[0]%(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
 const ordered=[...shuffled.filter(c=>!exclude.has(c.id)),...shuffled.filter(c=>exclude.has(c.id))];
 const chosen:typeof catalog=[];const seen=new Set<string>(); if(category==="Everything"){for(const c of ordered){if(!seen.has(c.category)&&chosen.length<6){chosen.push(c);seen.add(c.category);}}} for(const c of ordered){if(chosen.length<6&&!chosen.some(x=>x.id===c.id))chosen.push(c);} return Response.json({ideas:chosen,total:pool.length,categories:[...new Set(catalog.map(c=>c.category))],mode:"curated",message:"Research-backed idea library. Rolling explores existing concepts; live AI generation and automatic Reddit discovery are not connected."},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"Could not roll ideas. Try again."},{status:400})}
}

