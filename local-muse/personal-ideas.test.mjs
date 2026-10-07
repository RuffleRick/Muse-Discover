import test from 'node:test';
import assert from 'node:assert/strict';
import {personalIdea} from './personal-ideas.mjs';
import {exportLibrary,validateLibrary,clearGenerated,mergeLibrary} from './library-tools.mjs';
import {generationPrompt,bindEvidence} from './engine.mjs';
import {validateIdeas,makeKit} from './core.mjs';
import {attachExploration,explorationOptions} from './exploration.mjs';
import {detectSignals} from './opportunity-signals.mjs';
import {checkLogic,detailedSource} from './research-quality.mjs';
const draft={name:'My garden puzzle',category:'Games',pitch:'A puzzle where I arrange plants to create a compact garden without wasting space.'};
test('personal idea saves a self-contained root with optional defaults and honest provenance',()=>{
 const i=personalIdea(draft);assert.equal(i.family,i.id);assert.equal(i.parentId,null);assert.equal(i.mode,'user-authored');assert.equal(i.pitch,draft.pitch);assert.equal(i.features.length,3);assert.equal(i.sources[0].kind,'user-brief');assert.equal(i.sources[0].url,undefined);assert.ok(detailedSource(i.sources[0]));assert.match(i.sources[0].excerpt,/compact garden/);assert.notEqual(personalIdea(draft).id,i.id);
});
test('personal fields are bounded, category required and partial features retained',()=>{
 const i=personalIdea({...draft,features:'Drag plant tiles\nTest the layout',audience:'Gardeners',twist:'Seasonal choices'});assert.equal(i.features[0],'Drag plant tiles');assert.equal(i.features[1],'Test the layout');assert.equal(i.audience,'Gardeners');
 for(const change of [{name:''},{pitch:'short'},{category:'Everything'},{name:'x'.repeat(141)},{features:'a\nb\nc\nd'},{features:'x'.repeat(501)}])assert.throws(()=>personalIdea({...draft,...change}));
});
test('portable format and pinned clearing preserve personal roots and briefs',()=>{
 const i=personalIdea(draft),state={ideas:[i],pins:[{idea:i,note:'Keep this concept',createdAt:i.generatedAt}]};
 const restored=validateLibrary(exportLibrary(state));assert.deepEqual(restored.ideas[0],i);assert.deepEqual(restored.pins[0].idea,i);assert.equal(clearGenerated(restored).pins[0].idea.mode,'user-authored');assert.equal(mergeLibrary({ideas:[],pins:[]},restored).ideas[0].id,i.id);
 const kit=makeKit(i);assert.match(kit.text,/personal brief/);assert.doesNotMatch(kit.text,/undefined/);
});
test('personal roots use the standard evidence, feasibility and saved branch pipeline',()=>{
 const parent=personalIdea({...draft,pitch:'I wish there was a garden puzzle with meaningful plant arrangements and short sessions.'});const sources=parent.sources,options=explorationOptions({change:'Make it cooperative'});
 assert.deepEqual(detectSignals(sources[0]),[]);
 const prompt=generationPrompt({sources,category:'Games',term:parent.name},parent,[],options);
 assert.match(prompt.personalBriefInstructions,/not scraped discussions/);assert.match(prompt.sources[0].allowedEvidence[0].quote,/garden puzzle/);
 const raw=bindEvidence({ideas:[{name:'Shared garden',category:'Games',pitch:'Players arrange plant tiles together.',twist:'Each player has a different season.',audience:'Families',features:['Place tiles','Check arrangement','Finish a round'],validation:'Try one round',evidence:'Inspired by your personal brief.',sourceIds:[],evidenceId:prompt.sources[0].allowedEvidence[0].id,inputs:['Manual tile choices'],workflow:'Choose a tile, arrange it with another player, and review the layout.',limitations:'Plant relationships are fictional puzzle rules, not gardening predictions.'}]},prompt.sources.flatMap(s=>s.allowedEvidence));
 checkLogic(raw,sources);const branches=attachExploration(validateIdeas(raw,sources,parent),parent,options);assert.equal(branches[0].parentId,parent.id);assert.equal(branches[0].family,parent.family);assert.equal(branches[0].sources[0].kind,'user-brief');assert.equal(branches[0].exploration.change,'Make it cooperative');
});
