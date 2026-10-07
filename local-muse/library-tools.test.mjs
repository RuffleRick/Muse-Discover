import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {exportLibrary,validateLibrary,mergeLibrary,clearGenerated,createBackup,listBackups,readBackup} from './library-tools.mjs';
const source={id:'s',url:'https://example.com/discussion',title:'Discussion',excerpt:'Inspiration',site:'example',author:'Author',retrievedAt:'2026-10-07T12:00:00Z'};
function idea(id,parentId=null){return {id,family:'family',parentId,name:'Idea '+id,category:'Tools',pitch:'Useful software',twist:'Different workflow',audience:'People',features:['One','Two','Three'],validation:'Test it',evidence:'Discussion',sources:[source],generatedAt:'2026-10-07T12:00:00Z',mode:'local-model',exploration:{keep:'interaction',change:'',audience:'',constraints:'offline',creativity:'focused',combineId:'other',combineName:'Other'},relatedIdeaIds:['other'],reasoning:{sourceQuote:'Discussion excerpt for context',inputs:['Manual entries'],workflow:'Enter data and review a simple result',limitations:'No external measurements available'}};}
const first=idea('root'),child=idea('child','root');
const original={ideas:[first,child],pins:[{idea:child,note:'My private note',createdAt:'2026-10-07T12:00:00Z'}],sourceCache:{private:true},backoffUntil:123};
test('export/import roundtrip keeps pins, notes, sources, and branch relationships without internal cache',()=>{
 const exported=exportLibrary(original);assert.equal(exported.sourceCache,undefined);const incoming=validateLibrary(JSON.parse(JSON.stringify(exported)));
 assert.deepEqual(incoming.ideas,original.ideas);assert.deepEqual(incoming.pins,original.pins);
 exported.ideas[0].name='Changed';assert.equal(original.ideas[0].name,'Idea root');
});
test('clear removes all generated tiles but preserves independent pinned snapshots and notes',()=>{
 const cleared=clearGenerated(original);assert.equal(cleared.ideas.length,0);assert.deepEqual(cleared.pins,original.pins);assert.deepEqual(original.ideas,[first,child]);
 cleared.pins[0].note='Different';assert.equal(original.pins[0].note,'My private note');
});
test('merge is repeatable and preserves current conflicts, pin notes, and pin-only ideas',()=>{
 const incoming=validateLibrary(exportLibrary({ideas:[{...child,name:'Old child'},idea('new')],pins:[{idea:child,note:'Old note',createdAt:'2026-10-07'}]}));
 const merged=mergeLibrary(original,incoming);assert.equal(merged.ideas.length,3);assert.equal(merged.ideas.find(i=>i.id==='child').name,child.name);assert.equal(merged.pins[0].note,'My private note');
 assert.deepEqual(mergeLibrary(merged,incoming),merged);
 assert.equal(mergeLibrary(clearGenerated(original),incoming).ideas.find(i=>i.id==='child').name,child.name);
});
test('invalid imports and unsafe URLs are rejected before any state change',()=>{
 for(const mutate of [d=>d.version=99,d=>d.ideas.push(d.ideas[0]),d=>d.ideas[0].features=null,d=>d.ideas[0].sources[0].url='javascript:alert(1)',d=>d.pins[0].note='x'.repeat(2001)]){
  const d=exportLibrary(original);mutate(d);assert.throws(()=>validateLibrary(d));
 }
 assert.equal(original.pins[0].note,'My private note');
});
test('disk backups restore cleared libraries and allow undoing a restore; path traversal is rejected',async()=>{
 const folder=await mkdtemp(path.join(os.tmpdir(),'muse-library-test-'));
 try{
  const beforeClear=await createBackup(original,folder,'pre-clear');const cleared=clearGenerated(original);
  const beforeRestore=await createBackup(cleared,folder,'pre-restore');
  assert.deepEqual(await readBackup(folder,beforeClear),{ideas:original.ideas,pins:original.pins});
  assert.deepEqual(await readBackup(folder,beforeRestore),{ideas:[],pins:original.pins});
  const list=await listBackups(folder);assert.equal(list.length,2);assert.equal(list.find(b=>b.name===beforeClear).ideas,2);
  await assert.rejects(readBackup(folder,'../../library.json'),/Invalid backup/);
 }finally{assert.ok(path.resolve(folder).startsWith(path.resolve(os.tmpdir())+path.sep+'muse-library-test-'));await rm(folder,{recursive:true,force:true});}
});
