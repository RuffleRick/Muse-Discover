import test from 'node:test';
import assert from 'node:assert/strict';
import {detectSignals,researchSummary,selectOpportunitySources,checkSignalGrounding} from './opportunity-signals.mjs';
import {exportLibrary,validateLibrary,createBackup,readBackup} from './library-tools.mjs';
import {makeKit} from './core.mjs';
import {generationPrompt} from './engine.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const topic='card games';
const first={id:'one',url:'https://example.com/one',title:'Card games score keeping',site:'Example',author:'Alice',authorId:'alice',discussionId:'one',excerpt:'For card games, recording round scores by hand is tedious and I have to re-enter totals every session. It disrupts our family evening and we lose the previous round totals.'};
const second={...first,id:'two',url:'https://example.com/two',author:'Bob',authorId:'bob',discussionId:'two',excerpt:'For card games, keeping round scores in a spreadsheet is cumbersome and I have to re-enter totals every session. Our group keeps losing the totals between evenings.'};
test('detects wishes, friction and forced workarounds with exact quotes',()=>{
 assert.deepEqual(new Set(detectSignals(first).map(s=>s.kind)),new Set(['complaint','workaround']));
 const wish={...first,excerpt:'I wish there were a simple way to teach card games rules to young children without overwhelming them with a long instruction booklet.'};
 assert.equal(detectSignals(wish)[0].kind,'request');for(const s of detectSignals(first))assert.ok(first.excerpt.includes(s.quote));
});
test('does not invent pain from happy workflows, negation, resolved issues, or headline-only topic matches',()=>{
 for(const excerpt of ['I use a spreadsheet for card games scores and enjoy the process. It works well for everyone in our family and we do not need another tool.','Keeping card games scores is not tedious and the spreadsheet is simple to use. We all like this process and intend to keep it.','I used to find card games score keeping tedious, but now the problem is solved and our family has a simple solution.','My browser is frustrating and I wish there were a better tool for synchronizing tabs across the computers in my house.'])assert.equal(detectSignals({...first,excerpt},topic).length,0);
});
test('groups matching needs across authors and discussions without merging unrelated needs',()=>{
 const rules={...first,id:'rules',url:'https://example.com/rules',authorId:'carol',discussionId:'three',excerpt:'For card games, I wish there were clearer rules that children could understand without reading long instructions during family evenings.'};
 const r=researchSummary([first,second,rules],topic),group=r.groups.find(g=>g.repeated);assert.ok(group);assert.deepEqual(group.sourceIds,['one','two']);assert.equal(group.discussionCount,2);assert.equal(group.authorCount,2);assert.equal(group.sourceCount,2);assert.equal(r.groups.some(g=>g.sourceIds.includes('rules')&&g.sourceIds.includes('one')),false);
});
test('same author, same discussion, duplicate text, and unknown identity do not establish repetition',()=>{
 for(const changed of [{...second,authorId:'alice'},{...second,discussionId:'one'},{...second,excerpt:first.excerpt},{...second,excerpt:first.excerpt.toUpperCase().replaceAll(',','')},{...second,authorId:undefined,author:''},{...second,discussionId:undefined,url:'https://example.com/unknown'}])assert.equal(researchSummary([first,changed],topic).groups.some(g=>g.repeated),false);
});
test('selection prioritizes need evidence and retains independent supporting excerpts',()=>{
 const neutral={...first,id:'neutral',url:'https://example.com/neutral',excerpt:'Card games are played by families in many different ways. Some enjoy strategy, others enjoy quick rounds, and everyone has preferences about the rules.'};
 const r=selectOpportunitySources([neutral,first,second],topic,2);assert.deepEqual(new Set(r.sources.map(s=>s.id)),new Set(['one','two']));assert.ok(r.research.groups.some(g=>g.repeated));
 assert.equal(selectOpportunitySources([neutral],topic).research.mode,'interest-only');
});
test('fresh generation must quote an actual detected signal; variations retain their own direction',()=>{
 const signal=detectSignals(first)[0];assert.doesNotThrow(()=>checkSignalGrounding({ideas:[{sourceIds:['one'],sourceQuote:signal.quote}]},[first],topic));
 assert.throws(()=>checkSignalGrounding({ideas:[{sourceIds:['one'],sourceQuote:'It disrupts our family evening and we lose the previous round totals.'}]},[first],topic),/detected complaint/);
 assert.throws(()=>checkSignalGrounding({ideas:[{sourceIds:['two'],sourceQuote:signal.quote}]},[first,second],topic),/detected complaint/);
 assert.doesNotThrow(()=>checkSignalGrounding({ideas:[{sourceIds:['one'],sourceQuote:'Context'}]},[first],topic,{variation:true}));
});
test('model receives bounded signal guidance, interest fallback, and branch directions',()=>{
 const input={sources:[first,second],term:topic,category:'Games'};
 const prompt=generationPrompt(input);assert.match(prompt.researchInstructions,/FIRST/);assert.ok(prompt.research.groups.some(g=>g.repeated));assert.equal(prompt.research.groups[0].signals,undefined);assert.ok(prompt.research.signals.length<=12);
 const interest=generationPrompt({...input,sources:[{...first,excerpt:'Card games are a relaxing family interest. We enjoy many strategies and styles of play during casual evenings and everyone has their favorites.'}]});assert.equal(interest.research.mode,'interest-only');assert.match(interest.researchInstructions,/Do not invent complaints/);
 const variation=generationPrompt(input,{name:'Scores',pitch:'Scores',twist:'History',audience:'Families',features:[]},[],{keep:'manual scores',change:'cooperative play'});assert.match(variation.researchInstructions,/branch direction/);assert.match(JSON.stringify(variation.exploration),/cooperative play/);
});
test('signal quotes are bounded literal slices even with long sentences',()=>{
 const source={...first,excerpt:'Card games '+('long introduction '.repeat(40))+'are tedious to score by hand and I have to re-enter totals '+('extra details '.repeat(50))+'.'};
 const signals=detectSignals(source);assert.ok(signals.length);for(const s of signals){assert.ok(s.quote.length<=300);assert.ok(source.excerpt.includes(s.quote));}
});
test('research panel explains evidence and safely escapes public source text',async()=>{
 const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{value:'',addEventListener(){}});return elements.get(id);};
 const context=vm.createContext({document:{getElementById:element},location:{hostname:'127.0.0.1'},setInterval(){},fetch:()=>new Promise(()=>{}),sample:{sources:[{...first,title:'<script>unsafe</script>'}],research:{...researchSummary([first],topic),signals:[{sourceId:first.id,kind:'request',quote:'<script>unsafe</script>'}]}}});
 vm.runInContext(await readFile(new URL('./public/app.js',import.meta.url),'utf8'),context);
 const html=vm.runInContext('researchPanel(sample)',context);assert.match(html,/repetition not established/);assert.match(html,/&lt;script&gt;/);assert.equal(html.includes('<script>'),false);
 context.sample={research:{mode:'interest-only'}};assert.match(vm.runInContext('researchPanel(sample)',context),/not evidence of an unmet need/);
});
test('export/import and backup restore preserve evidence and recompute untrusted counts',async()=>{
 const research=researchSummary([first,second],topic);
 const idea={id:'idea',family:'idea',parentId:null,name:'Score notebook',category:'Games',pitch:'Keep round scores',twist:'Retain history',audience:'Families',features:['Names','Scores','History'],validation:'Play one round',evidence:'Scoring friction',generatedAt:'2026-10-07T12:00:00Z',mode:'local-model',sources:[first,second],research};
 const original={ideas:[idea],pins:[{idea,note:'Remember this',createdAt:'2026-10-07'}]};
 const copy=exportLibrary(original);copy.ideas[0].research.groups[0].authorCount=999;const restored=validateLibrary(copy);assert.deepEqual(restored.ideas[0].research,research);assert.deepEqual(restored.pins[0].idea.research,research);
 assert.match(makeKit(idea,'web app','').text,/Observed research signals/);assert.match(makeKit(idea,'web app','').text,/not verified people/);
 const directory=await mkdtemp(path.join(os.tmpdir(),'muse-signals-test-'));
 try{const name=await createBackup(original,directory);assert.deepEqual((await readBackup(directory,name)).ideas[0].research,research);}finally{assert.ok(directory.startsWith(path.join(os.tmpdir(),'muse-signals-test-')));await rm(directory,{recursive:true,force:true});}
});
