import test from 'node:test';
import assert from 'node:assert/strict';
import {resourceUrl,parseResources,dailyPicks} from './resource-feed.mjs';

test('remote links are limited to official learning pages and valid YouTube videos',()=>{
 for(const url of ['javascript:alert(1)','http://developers.openai.com/blog/x','https://evil.example/blog/x','https://developers.openai.com.evil.example/blog/x','https://user@developers.openai.com/blog/x','https://www.youtube.com/watch?v=bad','https://developers.openai.com:444/blog/x'])assert.equal(resourceUrl(url),null);
 assert.equal(resourceUrl('/blog/example.md'),'https://developers.openai.com/blog/example');
 assert.equal(resourceUrl('https://www.youtube.com/watch?v=HFM3se4lNiw&tracking=x'),'https://www.youtube.com/watch?v=HFM3se4lNiw');
});
test('markdown parser recognizes video links and rejects unrelated or unsafe entries',()=>{
 const items=parseResources('- [Guide](/cookbook/examples/codex/demo.md): summary\n- [Video](https://www.youtube.com/watch?v=HFM3se4lNiw)\n- [Bad](https://evil.example/post)\n- [Index](/llms.txt)','Tutorial');
 assert.equal(items.length,2);assert.equal(items[0].kind,'Tutorial');assert.equal(items[1].kind,'Video');
});
test('daily selection is stable within a day and rotates without duplicate or missing kinds',()=>{
 const items=['Article','Tutorial','Video'].flatMap(kind=>Array.from({length:5},(_,n)=>({kind,title:kind+n,url:'https://developers.openai.com/learn/'+kind+n})));
 const today=dailyPicks(items,'2026-10-06'),tomorrow=dailyPicks(items,'2026-10-07');
 assert.deepEqual(today,dailyPicks(items,'2026-10-06'));assert.notDeepEqual(today,tomorrow);
 assert.equal(new Set(today.map(i=>i.url)).size,9);
 for(const kind of ['Article','Tutorial','Video'])assert.equal(today.filter(i=>i.kind===kind).length,3);
 assert.deepEqual(dailyPicks([],'2026-10-06'),[]);
 assert.equal(dailyPicks(items.slice(0,1),'2026-10-06').length,1);
});
