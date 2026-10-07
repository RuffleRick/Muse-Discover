import test from 'node:test';import assert from 'node:assert/strict';
import {resourceUrl,learningResult,chooseResults,localDay} from './resource-feed.mjs';
test('external links allow public HTTPS resources while rejecting unsafe targets',()=>{
 for(const url of ['javascript:alert(1)','http://example.com/','https://user@example.com/','https://127.0.0.1/','https://localhost/','https://example.internal/','https://example.com:444/'])assert.equal(resourceUrl(url),null);
 assert.equal(resourceUrl('https://dev.to/example#anchor'),'https://dev.to/example');assert.ok(resourceUrl('https://www.youtube.com/watch?v=HFM3se4lNiw'));
});
test('learning filter rejects unrelated and noninstructional results',()=>{
 assert.equal(learningResult({title:'How to install skills in Codex CLI'}),true);assert.equal(learningResult({title:'Codex workflow guide'}),true);
 assert.equal(learningResult({title:'A medieval codex discovered'}),false);assert.equal(learningResult({title:'OpenAI news'}),false);
 assert.equal(learningResult({title:'Show HN: Wolfia Codex – Ask anything about any code'}),false);
 assert.equal(learningResult({title:'Quest Codex – Free courses and guides for intentional living'}),false);
});
test('five-item selection deduplicates, favors unseen resources, and varies publishers',()=>{
 const items=[...Array.from({length:5},(_,n)=>({title:'Codex guide '+n,url:'https://dev.to/'+n})),...Array.from({length:4},(_,n)=>({title:'Codex skills '+n,url:'https://blog'+n+'.example/guide'}))];
 const picks=chooseResults([...items,items[0]],[],'2026-10-06');assert.equal(picks.length,5);assert.equal(new Set(picks.map(i=>i.url)).size,5);assert.ok(picks.filter(i=>i.source==='dev.to').length<=2);
 assert.deepEqual(picks,chooseResults(items,[],'2026-10-06'));assert.equal(chooseResults(items,[items[0].url],'2026-10-06').some(i=>i.url===items[0].url),false);
 assert.deepEqual(chooseResults([]),[]);assert.equal(chooseResults(items.slice(0,4)).length,4);
});
test('calendar day follows the local date',()=>{assert.equal(localDay(new Date(2026,9,6,23,59)),'2026-10-06');assert.equal(localDay(new Date(2026,9,7,0,1)),'2026-10-07');});
