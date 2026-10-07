import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {brainstormDirections,explorationOptions,explorationContext} from './exploration.mjs';
const script=await readFile(new URL('./public/app.js',import.meta.url),'utf8');
const root={id:'root',family:'family',name:'Original',pitch:'Original concept',twist:'Original twist',audience:'Everyone',features:['One feature']};
const branch={...root,id:'branch',parentId:'root',name:'A <branch>',twist:'A different twist',features:['New feature']};
function setup(state){
 const elements=new Map();
 const element=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',addEventListener(){}});return elements.get(id);};
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
