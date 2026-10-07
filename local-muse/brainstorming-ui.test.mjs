import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {brainstormDirections,explorationOptions,explorationContext} from './exploration.mjs';
import {libraryStatuses} from './library-organization.mjs';
import {personalIdea} from './personal-ideas.mjs';
const script=await readFile(new URL('./public/app.js',import.meta.url),'utf8');
const root={id:'root',family:'family',name:'Original',pitch:'Original concept',twist:'Original twist',audience:'Everyone',features:['One feature']};
const branch={...root,id:'branch',parentId:'root',name:'A <branch>',twist:'A different twist',features:['New feature']};
function setup(state){
 const elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',classList:{toggle(){}},addEventListener(){},showModal(){},close(){},reset(){},insertAdjacentHTML(position,html){this.innerHTML+=html;}});return elements.get(id);};
 let requests=0;
 const context=vm.createContext({document:{getElementById:element},location:{hostname:'127.0.0.1'},setInterval(){},fetch(){requests++;return new Promise(()=>{});},fixture:state,root,branch});
 vm.runInContext(script,context);vm.runInContext('data=fixture;',context);
 return {run:code=>vm.runInContext(code,context),element,requests:()=>requests,context};
}
test('all brainstorming presets survive existing generation direction normalization',()=>{
 assert.equal(brainstormDirections.length,8);assert.equal(new Set(brainstormDirections.map(d=>d.id)).size,8);
 for(const preset of brainstormDirections){const options=explorationOptions(preset);assert.equal(options.change,preset.change);assert.equal(explorationContext(options).change,preset.change);}
});
test('families include pin-only branches but exclude unrelated ungrouped ideas',()=>{
 const ui=setup({ideas:[root,{id:'other',name:'Other'}],pins:[{idea:branch}]});
 assert.deepEqual(Array.from(ui.run('familyIdeas(root).map(i=>i.id)')),['root','branch']);
 const ungrouped=setup({ideas:[{id:'a'},{id:'b'}],pins:[]});
 assert.deepEqual(Array.from(ungrouped.run('familyIdeas(data.ideas[0]).map(i=>i.id)')),['a']);
});
test('parent changes show only differing fields, escape text, and handle missing parents',()=>{
 const ui=setup({ideas:[root],pins:[{idea:branch}]});
 const html=ui.run('parentChanges(branch)');assert.match(html,/Original twist/);assert.match(html,/A different twist/);assert.doesNotMatch(html,/<h3>Audience/);assert.equal(ui.run('parentChanges(root)'),'');
 ui.run('data.ideas=[]');assert.match(ui.run('parentChanges(branch)'),/parent is no longer/);
 assert.match(ui.run('pathComparison(branch)'),/A &lt;branch&gt;/);assert.doesNotMatch(ui.run('comparisonCards(["branch"])'),/<branch>/);
});
test('presets change direction, fill empty fields, and preserve existing constraints without requests',()=>{
 const ui=setup({ideas:[root],pins:[],brainstormDirections});const before=ui.requests();
 ui.element('directionPreset').value='offline';ui.element('keepDirection').value='Preserve cards';ui.element('branchConstraints').value='No sound';
 ui.run('applyBrainstormDirection()');assert.equal(ui.element('branchConstraints').value,'No sound');assert.equal(ui.element('keepDirection').value,'Preserve cards');assert.match(ui.element('changeDirection').value,/local data/);
 ui.element('directionPreset').value='audience';ui.run('applyBrainstormDirection()');assert.equal(ui.element('branchAudience').value,'Beginners with no prior experience');
 ui.element('branchAudience').value='Families';ui.run('applyBrainstormDirection()');assert.equal(ui.element('branchAudience').value,'Families');assert.equal(ui.requests(),before);
});
test('comparison rejects a fourth selection, leaves drafts alone, and never requests generation',()=>{
 const ui=setup({ideas:[root,branch,{...root,id:'third'},{...root,id:'fourth'}],pins:[]});const before=ui.requests();
 const choices=['root','branch','third','fourth'].map(id=>({checked:true,dataset:{comparePath:id}}));
 ui.element('detailBody').querySelectorAll=()=>choices.filter(c=>c.checked);
 ui.context.event={target:{closest:()=>choices[3]}};ui.element('changeDirection').value='My draft';
 ui.run('updatePathComparison(event)');assert.equal(choices[3].checked,false);assert.match(ui.element('pathComparisonStatus').textContent,/up to three/);
 assert.equal((ui.element('pathComparisonCards').innerHTML.match(/class="comparison-card"/g)||[]).length,3);
 assert.equal(ui.element('changeDirection').value,'My draft');assert.equal(ui.requests(),before);
 for(const choice of choices)choice.checked=false;
 ui.run('updatePathComparison(event)');assert.equal(ui.element('pathComparisonCards').innerHTML,'');assert.match(ui.element('pathComparisonStatus').textContent,/Select a saved path/);
});
test('library organization filters combine and unlabelled ideas default to Idea status',()=>{
 const ui=setup({ideas:[],pins:[]});ui.context.organized={...root,organization:{tags:['Offline'],collections:['Weekend'],status:'building'}};
 assert.equal(ui.run('matchesOrganization(organized,"offline","weekend","building")'),true);
 assert.equal(ui.run('matchesOrganization(organized,"offline","weekend","parked")'),false);
 assert.equal(ui.run('matchesOrganization(root,"","","idea")'),true);
 assert.equal(ui.run('matchesOrganization(root,"offline","","")'),false);
});
test('saved search includes labels and combines filters with honest empty results without requests',()=>{
 const organized={...root,sources:[],category:'Tools',organization:{tags:['Offline'],collections:['Weekend'],status:'shortlisted'}};
 const ui=setup({ideas:[organized],pins:[],libraryStatuses});const before=ui.requests();ui.element('libraryQuery').value='weekend shortlisted';
 ui.run('view="library";render()');assert.match(ui.element('libraryInfo').textContent,/1 of 1/);
 ui.element('libraryStatus').value='parked';ui.run('render()');assert.match(ui.element('board').innerHTML,/No matching ideas/);assert.match(ui.element('libraryInfo').textContent,/0 of 1/);
 assert.equal(ui.requests(),before);
});
test('organization markup escapes labels and saving preserves unsent exploration drafts',async()=>{
 const organized={...root,sources:[],category:'Tools',organization:{tags:['<offline>'],collections:[],status:'idea'}};
 const ui=setup({ideas:[organized],pins:[],libraryStatuses});const html=ui.run('organizationPanel(data.ideas[0])');assert.match(html,/&lt;offline&gt;/);assert.doesNotMatch(html,/value="<offline>"/);
 ui.element('ideaTags').value='Puzzle';ui.element('ideaCollections').value='Weekend';ui.element('ideaProjectStatus').value='building';ui.element('changeDirection').value='Unsent draft';
 const calls=[];ui.context.fetch=async(route,options)=>{calls.push({route,body:JSON.parse(options.body)});return {ok:true,json:async()=>({ideas:[{...organized,organization:{tags:['Puzzle'],collections:['Weekend'],status:'building'}}],pins:[]})};};
 await ui.run('selected=data.ideas[0];saveOrganization("root")');assert.equal(calls.length,1);assert.equal(calls[0].route,'/api/library/organize');assert.equal(calls[0].body.organization.status,'building');assert.equal(ui.element('changeDirection').value,'Unsent draft');assert.match(ui.element('organizationStatus').textContent,/saved/);
});
test('saving a personal idea opens its branching controls without searches or generation',async()=>{
 const i=personalIdea({name:'My <puzzle>',pitch:'Arrange garden plants into a small puzzle layout.',category:'Games'});
 const ui=setup({ideas:[],pins:[],libraryStatuses,brainstormDirections});const calls=[];
 ui.context.fetch=async(route,options)=>{calls.push(route);return {ok:true,json:async()=>({idea:i,ideas:[i],pins:[]})};};
 ui.element('personalName').value=i.name;ui.element('personalPitch').value=i.pitch;ui.element('personalCategory').value=i.category;
 await ui.run('savePersonalIdea()');assert.deepEqual(calls,['/api/library/create']);assert.match(ui.element('detailBody').innerHTML,/Explore new variations/);assert.match(ui.element('detailBody').innerHTML,/My &lt;puzzle&gt;/);assert.doesNotMatch(ui.run('sourceCards(data.ideas[0])'),/href=/);assert.match(ui.element('board').innerHTML,/YOUR IDEA/);
});
