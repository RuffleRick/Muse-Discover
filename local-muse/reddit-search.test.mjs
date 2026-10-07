import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {createRedditSearch,redditSnippets,MONTHLY_SEARCH_LIMIT} from './reddit-search.mjs';
import {collect,makeKit} from './core.mjs';
import {detectSignals,selectOpportunitySources} from './opportunity-signals.mjs';
import {validateLibrary,exportLibrary} from './library-tools.mjs';
import {generationPrompt} from './engine.mjs';
const key='tvly-test-placeholder-not-a-real-secret';
const result={title:'Solitaire variants',url:'https://www.reddit.com/r/solitaire/comments/abc123/example/?utm_source=test',content:'I wish solitaire games offered more interesting variants for teaching card rules. Solitaire variants could explore different scoring and cooperative play instead of repeating familiar games.'};
const json=(payload,status=200,headers={})=>new Response(JSON.stringify(payload),{status,headers});
async function temporary(fn){const folder=await mkdtemp(path.join(os.tmpdir(),'muse-search-test-'));try{await fn(folder);}finally{assert.ok(path.resolve(folder).startsWith(path.resolve(os.tmpdir())+path.sep+'muse-search-test-'));await rm(folder,{recursive:true,force:true});}}
const enable=client=>client.configure({key,enabled:true,freePlanConfirmed:true});
test('configuration is opt-in and does not call provider or disclose credentials',()=>temporary(async folder=>{
 let calls=0;const client=createRedditSearch(folder,{fetcher:()=>{calls++;throw Error(key);}});
 assert.equal((await client.status()).configured,false);assert.equal((await client.search('solitaire')).sources.length,0);
 await assert.rejects(client.configure({key,enabled:true}),/free plan/);
 const status=await enable(client);assert.equal(status.enabled,true);assert.ok(!JSON.stringify(status).includes(key));assert.equal(calls,0);
 await assert.rejects(client.search('solitaire'),e=>!e.message.includes(key)&&/could not be reached/.test(e.message));
 assert.equal((await client.status()).used,1);
 await client.configure({remove:true});assert.equal((await client.status()).used,1);assert.equal((await client.status()).configured,false);
}));
test('one basic domain-restricted search with no answer, raw fetch, redirect, or retries',()=>temporary(async folder=>{
 const requests=[];const client=createRedditSearch(folder,{fetcher:async(url,options)=>{requests.push({url,options});return json({results:[result],usage:{credits:1}});}});
 await enable(client);const response=await client.search('solitaire');assert.equal(requests.length,1);
 const {url,options}=requests[0],b=JSON.parse(options.body);assert.equal(url,'https://api.tavily.com/search');assert.equal(options.redirect,'error');
 assert.equal(b.query,'site:reddit.com solitaire');assert.deepEqual(b.include_domains,['reddit.com']);assert.equal(b.search_depth,'basic');assert.equal(b.auto_parameters,false);assert.equal(b.include_answer,false);assert.equal(b.include_raw_content,false);assert.equal(b.safe_search,true);
 assert.equal(response.sources[0].kind,'search-snippet');assert.equal(response.sources[0].author,'');assert.equal((await client.status()).used,1);
}));
test('only canonical Reddit discussion links survive; duplicates and unsafe or short snippets excluded',()=>{
 const sources=redditSnippets([result,{...result,url:'https://old.reddit.com/r/solitaire/comments/abc123/other/'},...['https://reddit.com.evil.test/r/a/comments/x/','https://reddit.com@evil.test/r/a/comments/x/','http://reddit.com/r/a/comments/x/','https://reddit.com:444/r/a/comments/x/','https://reddit.com/user/example/'].map(url=>({...result,url})),{...result,url:'https://reddit.com/r/a/comments/new/',content:'Too short'}]);
 assert.equal(sources.length,1);assert.equal(sources[0].url,'https://www.reddit.com/r/solitaire/comments/abc123/');
 assert.equal(sources[0].id,'reddit-search-abc123');assert.equal(sources[0].authorId,undefined);
});
test('persistent cap survives restart, removal and new keys; month rollover permits searches',()=>temporary(async folder=>{
 let timestamp=Date.parse('2026-10-07T10:00:00Z'),calls=0;const options={now:()=>timestamp,fetcher:async()=>{calls++;return json({results:[]});}};
 let client=createRedditSearch(folder,options);await enable(client);
 const file=path.join(folder,'reddit-search.json'),d=JSON.parse(await readFile(file,'utf8'));d.used=MONTHLY_SEARCH_LIMIT-1;await writeFile(file,JSON.stringify(d));
 await Promise.all([client.search('one'),client.search('two')]);assert.equal(calls,1);assert.equal((await client.status()).used,MONTHLY_SEARCH_LIMIT);
 await client.configure({remove:true});client=createRedditSearch(folder,options);await enable(client);await client.search('three');assert.equal(calls,1);
 timestamp=Date.parse('2026-11-01T00:00:00Z');await client.search('four');assert.equal(calls,2);assert.equal((await client.status()).used,1);
}));
test('rate backoff and exhausted provider allowance prevent more calls',()=>temporary(async folder=>{
 let timestamp=Date.parse('2026-10-07T10:00:00Z'),calls=0;
 const client=createRedditSearch(folder,{now:()=>timestamp,fetcher:async()=>{calls++;return json({},calls===1?429:432,{'retry-after':new Date(timestamp+120000).toUTCString()});}});
 await enable(client);await assert.rejects(client.search('one'),/pause/);await client.search('two');assert.equal(calls,1);
 timestamp+=121000;await assert.rejects(client.search('three'),/usage limit/);await client.search('four');assert.equal(calls,2);assert.equal((await client.status()).used,2);
}));
test('unreadable settings fail closed before any provider request',()=>temporary(async folder=>{
 await writeFile(path.join(folder,'reddit-search.json'),'not json');let calls=0;
 const client=createRedditSearch(folder,{fetcher:async()=>{calls++;return json({});}});await assert.rejects(client.search('topic'),/paused/);assert.equal(calls,0);
}));
test('snippet provenance survives import, appears in kits/prompts, and never becomes a need signal',()=>{
 const sources=redditSnippets([result]);assert.deepEqual(detectSignals(sources[0],'solitaire'),[]);
 assert.equal(selectOpportunitySources(sources,'solitaire').research.mode,'interest-only');
 const idea={id:'idea',family:'idea',parentId:null,name:'Solitaire lessons',category:'Games',pitch:'Learn card rules',twist:'Cooperate',audience:'Families',features:['Cards','Rules','Scores'],validation:'Try a sample',evidence:'Search inspiration',sources,generatedAt:'2026-10-07T10:00:00Z'};
 const imported=validateLibrary(exportLibrary({ideas:[idea],pins:[]})).ideas[0];assert.equal(imported.sources[0].kind,'search-snippet');assert.match(makeKit(imported).text,/Full threads were not fetched/);
 const prompt=generationPrompt({sources,term:'solitaire',category:'Games'});assert.equal(prompt.sources[0].kind,'search-snippet');assert.match(prompt.searchSnippetInstructions,/tentative creative inspiration/);
 delete sources[0].kind;assert.deepEqual(detectSignals(sources[0]),[]); // Older exports still carry reserved IDs.
});
test('collection includes Reddit snippets, caches without spending again, and respects config changes',()=>temporary(async folder=>{
 const original=globalThis.fetch;let searches=0;
 globalThis.fetch=async()=>json({items:[],hits:[]});
 try{
 const client=createRedditSearch(folder,{fetcher:async()=>{searches++;return json({results:[result]});}});await enable(client);
 const state={sourceCache:{}};const a=await collect(state,'Games','solitaire',{redditSearch:client});assert.equal(a.sources[0].kind,'search-snippet');
 assert.equal((await collect(state,'Games','solitaire',{redditSearch:client})).cached,true);assert.equal(searches,1);
 await client.configure({enabled:false});await assert.rejects(collect(state,'Games','solitaire',{redditSearch:client}),/No sufficiently relevant/);assert.equal(searches,1);
 }finally{globalThis.fetch=original;}
}));
test('provider failure still allows existing discussion sources to generate',()=>temporary(async folder=>{
 const original=globalThis.fetch;
 globalThis.fetch=async url=>String(url).includes('stackexchange')?json({items:[]}):json({hits:[{objectID:'1',story_title:'Solitaire variants',comment_text:result.content,author:'example',story_id:'2',created_at:'2026-10-07T10:00:00Z'}]});
 try{const client=createRedditSearch(folder,{fetcher:async()=>{throw Error('secret');}});await enable(client);const found=await collect({sourceCache:{}},'Games','solitaire',{redditSearch:client});assert.equal(found.sources[0].site,'Hacker News');assert.ok(found.warnings.some(w=>w.includes('could not be reached')));
 await writeFile(path.join(folder,'reddit-search.json'),'invalid settings');const fallback=await collect({sourceCache:{}},'Games','solitaire',{redditSearch:client});assert.equal(fallback.sources[0].site,'Hacker News');assert.ok(fallback.warnings.some(w=>w.includes('paused')));}
 finally{globalThis.fetch=original;}
}));
