import test from 'node:test';
import assert from 'node:assert/strict';
import {explorationOptions,explorationContext,attachExploration,creativityLevels} from './exploration.mjs';
import {validateIdeas,makeKit} from './core.mjs';
test('exploration bounds user direction and allows only known creativity levels',()=>{
 assert.deepEqual(explorationOptions(),{keep:'',change:'',constraints:'',audience:'',creativity:'balanced',combineId:''});
 assert.equal(explorationOptions({keep:'x'.repeat(900),creativity:'__proto__'}).keep.length,600);
 assert.equal(explorationOptions({creativity:'__proto__'}).creativity,'balanced');
 assert.throws(()=>explorationOptions(null));assert.throws(()=>explorationOptions([]));
 assert.ok(creativityLevels.focused<creativityLevels.wild);
});
test('model direction preserves controls, audience adaptation and combination context',()=>{
 const settings=explorationOptions({keep:'card rules',change:'cooperative play',constraints:'offline',audience:'families',creativity:'wild',combineId:'b'});
 const context=explorationContext(settings,{name:'Garden planner',pitch:'Plan plants',twist:'season puzzle',features:['calendar'],audience:'gardeners'});
 assert.equal(context.keep,'card rules');assert.equal(context.change,'cooperative play');assert.equal(context.constraints,'offline');assert.equal(context.audience,'families');assert.equal(context.combine.name,'Garden planner');assert.match(context.distinctPaths,/different core interactions/);
});
test('validated variations preserve family, parent, sources and direction for reopening',()=>{
 const parent={id:'parent',family:'family'},source={id:'source',title:'Discussion'};
 const raw={ideas:Array.from({length:3},(_,n)=>({name:'Variation '+n,category:'Games',pitch:'Playable cards',twist:'Team rules '+n,audience:'Families',features:['one','two','three'],validation:'Test a round',evidence:'Discussion inspiration',sourceIds:['source']}))};
 const settings=explorationOptions({constraints:'offline',combineId:'other'});
 const result=attachExploration(validateIdeas(raw,[source],parent),parent,settings,{id:'other',name:'Other idea'});
 for(const idea of result){assert.equal(idea.parentId,'parent');assert.equal(idea.family,'family');assert.deepEqual(idea.sources,[source]);assert.equal(idea.exploration.constraints,'offline');assert.equal(idea.exploration.combineName,'Other idea');assert.deepEqual(idea.relatedIdeaIds,['other']);}
 assert.equal(new Set(result.map(i=>i.id)).size,3);
 assert.match(makeKit(result[0]).prompt,/Constraints: offline/);
 assert.throws(()=>attachExploration([result[0],{...result[0],name:'Renamed duplicate'}],parent,settings),/repeated a concept/);
});
