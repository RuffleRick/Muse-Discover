import test from 'node:test';import assert from 'node:assert/strict';
import {routeSearch,selectSources,checkLogic} from './research-quality.mjs';
import {plain,validateIdeas,collect} from './core.mjs';
const discussion={id:'good',title:'Card games for families',url:'https://example.com/cards',excerpt:'We enjoy playing card games with our family but setup takes too long. We need a simple way to keep scores and learn the rules before each round.'};
test('routing avoids graphics-card and grammar communities for cards and special education',()=>{
 assert.deepEqual(routeSearch('Everything','card games'),{category:'Games',site:'boardgames'});
 assert.deepEqual(routeSearch('Tools','special education'),{category:'Tools',site:null});
 assert.equal(routeSearch('Everything','camera lenses').site,'photography');
});
test('selection rejects headline-only, thin, wrong-sense and off-topic excerpts; deduplicates relevant results',()=>{
 const candidates=[discussion,{...discussion,id:'duplicate'}, {...discussion,url:'https://example.com/gpu',title:'Can my graphics card cause games to crash?',excerpt:'My graphics card causes games to crash. '+discussion.excerpt},{...discussion,url:'https://example.com/headline',excerpt:'Card games for families'},{...discussion,url:'https://example.com/other',title:'How to cook a meal',excerpt:'A detailed discussion about cooking food. '.repeat(5)}];
 assert.deepEqual(selectSources(candidates,'card games'),[discussion]);
 assert.equal(selectSources([{...discussion,title:'Concrete types in C++',excerpt:'Special education example with concrete types. '.repeat(5)}],'special education').length,0);
 assert.equal(selectSources([{...discussion,title:'Legal terminology',excerpt:'A lawyer needs special education to operate in a complex legal system. '.repeat(3)}],'special education').length,0);
 assert.equal(selectSources([{...discussion,title:'Company towns',excerpt:'Special stores, education and healthcare for residents of a company town. '.repeat(3)}],'special education').length,0);
});
test('HTML is cleaned before truncation and hexadecimal entities are decoded',()=>{
 const html='<p class="'+('x'.repeat(1600))+'">A gardener&#x27;s question about planning plants</p>';
 assert.equal(plain(html,100),"A gardener's question about planning plants");
});
function prototype(overrides={}){return {name:'Family score keeper',category:'Games',pitch:'Record card-game scores',twist:'Simple shared score sheet',audience:'Families',features:['Enter players','Record round totals','Review history'],validation:'Play a round',evidence:'Setup friction inspires scoring tools',sourceIds:['good'],sourceQuote:'We enjoy playing card games with our family but setup takes too long.',inputs:['Player names and manually entered scores'],workflow:'Enter players, add each round score, and review the session totals.',limitations:'Only manually entered scores are available; the app does not recognize cards.',...overrides};}
test('quality checks require actual cited quotes and practical inputs and limits',()=>{
 assert.doesNotThrow(()=>checkLogic({ideas:[prototype()]},[discussion]));
 assert.throws(()=>checkLogic({ideas:[prototype({sourceQuote:'People say this market has no competition.'})]},[discussion]),/verifiable/);
 assert.throws(()=>checkLogic({ideas:[prototype({inputs:[]})]},[discussion]),/inputs/);
 assert.throws(()=>checkLogic({ideas:[prototype({pitch:'Upload any photo to reconstruct an exact focal length and perspective'})]},[discussion]),/alternate-lens/);
 assert.throws(()=>checkLogic({ideas:[prototype({pitch:'Estimate heavy metal contamination from soil chemistry'})]},[discussion]),/Chemical/);
});
test('one coherent idea is accepted without padding to three',()=>{assert.equal(validateIdeas({ideas:[prototype()]},[discussion],null).length,1);});
test('collection uses routed site, detailed comments and versioned cache without writing state to disk',async()=>{
 const previous=globalThis.fetch,calls=[];
 globalThis.fetch=async url=>{calls.push(String(url));const se=String(url).includes('stackexchange.com');return {ok:true,json:async()=>se?{items:[{question_id:1,title:discussion.title,link:'https://boardgames.stackexchange.com/questions/1/cards',body:discussion.excerpt,creation_date:1700000000}]}:{hits:[{objectID:'a',story_title:'Card games for families',comment_text:discussion.excerpt,author:'example',created_at:'2026-10-07'}]}};};
 try{const state={sourceCache:{}};const result=await collect(state,'Everything','card games');assert.ok(calls[0].includes('site=boardgames'));assert.ok(calls[1].includes('tags=comment'));assert.equal(result.sources.length,2);assert.match(result.sources[0].id,/^(se-boardgames-|hn-)/);await collect(state,'Everything','card games');assert.equal(calls.length,2);assert.ok(Object.keys(state.sourceCache)[0].startsWith('quality-v2:'));}
 finally{globalThis.fetch=previous;}
});
