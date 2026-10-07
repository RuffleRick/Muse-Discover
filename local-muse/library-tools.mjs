import {mkdir,readFile,writeFile,rename,readdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {categories} from './core.mjs';
import {explorationOptions} from './exploration.mjs';
import {researchSummary} from './opportunity-signals.mjs';
import {isSearchSnippet} from './reddit-search.mjs';
import {organization} from './library-organization.mjs';
export const MAX_IMPORT_BYTES=20*1024*1024;
function string(v,key,max=2000){if(typeof v!=='string'||v.length>max)throw Error('Invalid or oversized '+key+'.');return v;}
function id(v,key){const s=string(v,key,100);if(!s.trim())throw Error('Missing '+key+'.');return s;}
function source(s){
 if(!s||typeof s!=='object')throw Error('Invalid source.');
 const url=string(s.url,'source URL',3000);let u;try{u=new URL(url);}catch{throw Error('Invalid source URL.');}
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Unsafe source URL.');
 const out={id:id(s.id,'source ID'),url,title:string(s.title,'source title'),excerpt:string(s.excerpt||'','source excerpt',16000)};
 for(const key of ['site','author','authorId','discussionId','retrievedAt','license'])if(s[key]!==undefined)out[key]=string(s[key],key);
 if(isSearchSnippet(s)){out.kind='search-snippet';out.provider='Tavily';delete out.authorId;out.author='';}
 return out;
}
function idea(i){
 if(!i||typeof i!=='object'||Array.isArray(i))throw Error('Invalid idea.');
 const out={id:id(i.id,'idea ID'),family:id(i.family||i.id,'family ID'),parentId:i.parentId==null?null:id(i.parentId,'parent ID')};
 for(const key of ['name','category','pitch','twist','audience','validation','evidence','generatedAt'])out[key]=string(i[key],key);
 if(!out.name.trim()||!categories.slice(1).includes(out.category)||!Number.isFinite(Date.parse(out.generatedAt)))throw Error('Invalid idea name, category, or date.');
 if(!Array.isArray(i.features)||i.features.length!==3||!Array.isArray(i.sources)||i.sources.length<1||i.sources.length>20)throw Error('Invalid idea features or sources.');
 out.features=i.features.map(f=>string(f,'feature'));out.sources=i.sources.map(source);out.mode=string(i.mode||'imported','mode',100);
 if(i.exploration){out.exploration=explorationOptions(i.exploration);out.exploration.combineName=string(i.exploration.combineName||'','combined name');}
 if(i.relatedIdeaIds){if(!Array.isArray(i.relatedIdeaIds)||i.relatedIdeaIds.length>20)throw Error('Invalid related ideas.');out.relatedIdeaIds=i.relatedIdeaIds.map(v=>id(v,'related ID'));}
 if(i.reasoning){const r=i.reasoning;if(!Array.isArray(r.inputs)||r.inputs.length<1||r.inputs.length>5)throw Error('Invalid prototype inputs.');out.reasoning={sourceQuote:string(r.sourceQuote,'source excerpt',350),inputs:r.inputs.map(v=>string(v,'prototype input',300)),workflow:string(r.workflow,'workflow',700),limitations:string(r.limitations,'limitations',500)};}
 if(i.research)out.research=researchSummary(out.sources,string(i.research.topic||'','research topic',140));
 if(i.organization!==undefined)out.organization=organization(i.organization);
 return out;
}
export function validateLibrary(value){
 if(value?.format!=='muse-library'||value.version!==1)throw Error('Choose a Muse library export (version 1).');
 if(!Array.isArray(value.ideas)||!Array.isArray(value.pins)||value.ideas.length>5000||value.pins.length>5000)throw Error('Invalid or oversized library.');
 const ideas=value.ideas.map(idea),pins=value.pins.map(p=>{if(!p||typeof p!=='object')throw Error('Invalid pin.');return {idea:idea(p.idea),note:string(p.note||'','pin note'),createdAt:string(p.createdAt,'pin date',100)};});
 for(const list of [ideas.map(i=>i.id),pins.map(p=>p.idea.id)])if(new Set(list).size!==list.length)throw Error('Duplicate IDs in the import.');
 return {ideas,pins};
}
export function exportLibrary(state){return {format:'muse-library',version:1,exportedAt:new Date().toISOString(),ideas:structuredClone(state.ideas),pins:structuredClone(state.pins)};}
export function mergeLibrary(state,incoming){
 const existing=new Map([...state.pins.map(p=>[p.idea.id,p.idea]),...state.ideas.map(i=>[i.id,i])]);
 const ideas=new Map(state.ideas.map(i=>[i.id,i]));for(const i of incoming.ideas)if(!ideas.has(i.id))ideas.set(i.id,existing.get(i.id)||i);
 const pins=new Map(state.pins.map(p=>[p.idea.id,p]));for(const p of incoming.pins)if(!pins.has(p.idea.id))pins.set(p.idea.id,{...p,idea:ideas.get(p.idea.id)||p.idea});
 if(ideas.size>5000||pins.size>5000)throw Error('The merged library exceeds the 5,000 item limit.');
 return {...state,ideas:[...ideas.values()],pins:[...pins.values()]};
}
export function clearGenerated(state){return {...state,ideas:[],pins:structuredClone(state.pins)};}
export async function createBackup(state,directory,reason='manual'){
 await mkdir(directory,{recursive:true});
 const name=Date.now()+'-'+randomUUID()+'.json',record={...exportLibrary(state),reason};
 await writeFile(path.join(directory,name+'.tmp'),JSON.stringify(record,null,2),'utf8');
 await rename(path.join(directory,name+'.tmp'),path.join(directory,name));return name;
}
export async function readBackup(directory,name){
 if(typeof name!=='string'||!/^\d{13}-[a-f0-9-]{36}\.json$/.test(name))throw Error('Invalid backup selection.');
 return validateLibrary(JSON.parse(await readFile(path.join(directory,name),'utf8')));
}
export async function listBackups(directory){
 let names;try{names=await readdir(directory);}catch(e){if(e.code==='ENOENT')return [];throw e;}
 const result=[];
 for(const name of names.filter(n=>/^\d{13}-[a-f0-9-]{36}\.json$/.test(n)).sort().reverse()){
  try{const record=JSON.parse(await readFile(path.join(directory,name),'utf8'));const d=validateLibrary(record);result.push({name,createdAt:record.exportedAt,reason:record.reason||'manual',ideas:d.ideas.length,pins:d.pins.length});}catch{}
 }
 return result;
}
