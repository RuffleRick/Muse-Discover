const phone=location.hostname!=='127.0.0.1';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data={ideas:[],pins:[]},board=[],view='board',selected=null,busy=false,jobId=null,poll=null,stopped=false;
async function api(route,body){
 const r=await fetch(route,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(r.status===401&&phone){location.reload();throw Error('Pair this phone again on your PC.');}const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed.');return d;
}
function status(message,kind='notice'){$('status').className=kind;$('status').textContent=message;}
function setBusy(v){busy=v;$('roll').disabled=v;$('query').disabled=v;$('category').disabled=v;$('modelStatus').textContent=v?'Generating on this PC':'Model stopped';syncTools();}
function isPinned(id){return data.pins.some(p=>p.idea.id===id);}
function syncLibraryFilters(all){
 for(const [id,key,label] of [['libraryTag','tags','All tags'],['libraryCollection','collections','All collections']]){
  const select=$(id),current=select.value;
  const names=[...new Map(all.flatMap(i=>i.organization?.[key]||[]).map(n=>[n.toLowerCase(),n])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  select.innerHTML='<option value="">'+label+'</option>'+names.map(([value,name])=>'<option value="'+esc(value)+'">'+esc(name)+'</option>').join('');
  select.value=names.some(([value])=>value===current)?current:'';
 }
 const select=$('libraryStatus'),current=select.value;
 select.innerHTML='<option value="">All statuses</option>'+Object.entries(data.libraryStatuses||{}).map(([value,label])=>'<option value="'+esc(value)+'">'+esc(label)+'</option>').join('');select.value=current;
}
function matchesOrganization(idea,tag,collection,projectStatus){
 const settings=idea.organization||{tags:[],collections:[],status:'idea'};
 return (!tag||settings.tags.some(n=>n.toLowerCase()===tag))&&(!collection||settings.collections.some(n=>n.toLowerCase()===collection))&&(!projectStatus||settings.status===projectStatus);
}
function organizationBadges(idea){
 const settings=idea.organization;if(!settings)return '';
 return '<div class="organization-badges">'+(settings.status!=='idea'?'<span>'+esc(data.libraryStatuses?.[settings.status]||settings.status)+'</span>':'')+settings.tags.map(n=>'<span>#'+esc(n)+'</span>').join('')+settings.collections.map(n=>'<span>Collection: '+esc(n)+'</span>').join('')+'</div>';
}
function render(){
 $('pinCount').textContent=data.pins.length;
 for(const [id,v] of [['exploreNav','board'],['pinsNav','pins'],['libraryNav','library']])$(id).classList.toggle('active',view===v);
 const savedView=view==='pins'||view==='library';
 $('generationControls').hidden=savedView;
 $('librarySearchControls').hidden=!savedView;
 const all=view==='pins'?data.pins.map(p=>p.idea):view==='library'?[...data.ideas].reverse():board;
 if(savedView)syncLibraryFilters(all);
 const tag=savedView?$('libraryTag').value:'',collection=savedView?$('libraryCollection').value:'',projectStatus=savedView?$('libraryStatus').value:'';
 const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const terms=savedView?normalize($('libraryQuery').value).trim().split(/\s+/).filter(Boolean):[];
 const notes=new Map(data.pins.map(p=>[p.idea.id,p.note]));
 const list=all.filter(i=>{
  const settings=i.organization||{tags:[],collections:[],status:'idea'};
  const text=normalize([i.name,i.category,i.pitch,i.twist,i.audience,...(i.features||[]),i.evidence,i.validation,...Object.values(i.exploration||{}),...settings.tags,...settings.collections,data.libraryStatuses?.[settings.status]||settings.status,notes.get(i.id),...(i.sources||[]).flatMap(s=>[s.title,s.excerpt])].join(' '));
  return terms.every(term=>text.includes(term))&&matchesOrganization(i,tag,collection,projectStatus);
 });
 const filtering=terms.length||tag||collection||projectStatus;
 $('heading').textContent=view==='pins'?'Keep the paths worth returning to.':view==='library'?'Every direction you’ve discovered.':'A little curiosity. A new direction.';
 $('intro').textContent=view==='pins'?'Search your pinned concepts and notes, or open an idea to keep exploring.':view==='library'?'Search by anything you remember, then open, pin, or branch a saved concept.':'Find a useful twist on a familiar problem, game, or everyday task.';
 $('libraryInfo').textContent=savedView?list.length+' of '+all.length+' '+(view==='pins'?'pinned ideas':'saved concepts')+(filtering?' match your search and filters':'') :data.ideas.length+' generated concepts in your local library · '+data.pins.length+' pinned';
 if(savedView&&!list.length){
  $('board').innerHTML='<div class="empty"><h2>'+(filtering?'No matching ideas.':view==='pins'?'Your next favorite belongs here.':'Your library is ready for its first idea.')+'</h2><p>'+(filtering?'Try fewer words or different filters, or use Clear to see every idea.':view==='pins'?'Pin a concept to save it here with your notes.':'Use Explore to roll your first concepts.')+'</p></div>';
  return;
 }
 $('board').innerHTML=list.length?list.map(i=>'<article class="card"><div class="card-top"><span class="tag">'+esc(i.category)+'</span><button class="pin '+(isPinned(i.id)?'on':'')+'" data-pin="'+esc(i.id)+'" aria-label="'+(isPinned(i.id)?'Unpin':'Pin')+' '+esc(i.name)+'">'+(isPinned(i.id)?'★':'☆')+'</button></div><button class="title-button" data-open="'+esc(i.id)+'">'+esc(i.name)+'</button><p>'+esc(i.pitch)+'</p><p class="twist">'+esc(i.twist)+'</p>'+organizationBadges(i)+'<div class="card-bottom"><span>'+i.sources.length+' source'+(i.sources.length===1?'':'s')+' · LOCAL AI</span><button data-open="'+esc(i.id)+'">Explore idea →</button></div></article>').join(''):'<div class="empty"><h2>'+(view==='pins'?'Your next favorite belongs here.':'Start with a roll. Or follow a curiosity.')+'</h2><p>'+(view==='pins'?'Pin a concept to save it for later.':'Try “solitaire variants,” “leftovers,” or “photography.” Muse will find discussions and generate up to three new directions on your PC.')+'</p><p>The model stays stopped until you ask for new ideas.</p></div>';
}
function find(id){return data.ideas.find(i=>i.id===id)||data.pins.find(p=>p.idea.id===id)?.idea;}
async function load(){data=await api('/api/state');if(!board.length)board=data.ideas.slice(-3);render();}
async function pin(id,remove,note){try{const d=await api('/api/pin',{id,remove,note:note??data.pins.find(p=>p.idea.id===id)?.note??''});data.pins=d.pins;render();if(selected?.id===id && $('detailPin'))$('detailPin').textContent=isPinned(id)?'Unpin idea':'Pin for later';status(remove?'Idea unpinned.':'Idea and notes saved on this PC.');}catch(e){status(e.message,'error');}}
async function generate(parentId,exploration){
 if(busy||stopped)return;
 setBusy(true);status('Finding discussions and starting local generation…','working');
 try{
 const d=await api('/api/generate',{category:$('category').value,query:$('query').value,parentId,exploration});
 jobId=d.job.id;poll=setInterval(checkJob,1500);
 }catch(e){setBusy(false);status(e.message,'error');}
}
async function checkJob(){
 try{
 const d=await api('/api/status');
 const j=d.job;if(!j||j.id!==jobId)return;
 status(j.message,j.state==='error'?'error':j.state==='running'?'working':'notice');
 if(j.state!=='running'){
 clearInterval(poll);poll=null;setBusy(false);
 await load();
 if(j.state==='done'){board=j.ideas;view='board';render();status(j.message+(j.warnings?.length?' '+j.warnings.join(' '):''));}
 }
 }catch(e){clearInterval(poll);poll=null;setBusy(false);status('Muse stopped or disconnected. Reopen it with Start Muse.cmd.','error');}
}
function explorationPanel(idea){
 const others=[...new Map([...data.ideas,...data.pins.map(p=>p.idea)].map(i=>[i.id,i])).values()].filter(i=>i.id!==idea.id).sort((a,b)=>a.name.localeCompare(b.name));
 const settings=idea.exploration;
 const history=settings?'<details class="branch-history"><summary>Direction used for this branch</summary><p>'+esc([settings.keep&&'Kept: '+settings.keep,settings.change&&'Changed: '+settings.change,settings.constraints&&'Constraints: '+settings.constraints,settings.audience&&'Audience: '+settings.audience,'Creativity: '+settings.creativity,settings.combineName&&'Combined with: '+settings.combineName].filter(Boolean).join(' · '))+'</p></details>':'';
 const combined=settings?.combineId&&find(settings.combineId)?'<p><button class="secondary" data-tree-open="'+esc(settings.combineId)+'">Open combined idea: '+esc(settings.combineName)+'</button></p>':'';
 return history+combined+parentChanges(idea)+'<section class="exploration-panel" aria-label="Explore different paths"><h3>Explore different paths</h3><p>Choose a direction, then generate up to three variations. Each becomes a saved branch of this idea.</p><details class="direction-picker"><summary>Try a brainstorming direction</summary><label for="directionPreset">Direction</label><select id="directionPreset"><option value="">Choose a direction</option>'+(data.brainstormDirections||[]).map(d=>'<option value="'+esc(d.id)+'">'+esc(d.label)+'</option>').join('')+'</select><button id="applyDirection" class="secondary" type="button">Use this direction</button><p class="search-hint">Replaces Change that. Audience and constraints are filled only when empty. Edit any wording before generating.</p><p id="directionFeedback" role="status" aria-live="polite"></p></details><div class="exploration-fields"><div><label for="keepDirection">Keep this</label><textarea id="keepDirection" maxlength="600" placeholder="The core mechanic, useful feature, or style to preserve…"></textarea></div><div><label for="changeDirection">Change that</label><textarea id="changeDirection" maxlength="600" placeholder="A different interaction, workflow, or twist…"></textarea></div></div><label for="branchConstraints">Constraints</label><textarea id="branchConstraints" maxlength="600" placeholder="For example: offline, no accounts, one-week prototype, accessible controls…"></textarea><label for="branchAudience">Adapt for an audience</label><input id="branchAudience" maxlength="300" placeholder="Leave blank for the original audience"><div class="exploration-fields"><div><label for="branchCreativity">Creativity</label><select id="branchCreativity"><option value="focused">Focused · nearby improvements</option><option value="balanced" selected>Balanced · different approaches</option><option value="wild">Wild · surprising combinations</option></select></div><div><label for="combineIdea">Combine with a saved idea</label><select id="combineIdea"><option value="">No combination</option>'+others.map(i=>'<option value="'+esc(i.id)+'">'+esc(i.name)+'</option>').join('')+'</select></div></div><p class="search-hint">Directions guide the local model; check each result for fit. Combining ideas keeps the branch under this idea and links the other concept.</p></section>'+ideaTree(idea)+pathComparison(idea);
}
function familyIdeas(idea){
 return [...new Map([...data.ideas,...data.pins.map(p=>p.idea),idea].map(i=>[i.id,i])).values()].filter(i=>i.id===idea.id||(idea.family&&i.family===idea.family));
}
function parentChanges(idea){
 if(!idea.parentId)return '';
 const parent=find(idea.parentId);
 if(!parent)return '<details class="branch-history"><summary>What changed from the parent</summary><p>The parent is no longer in the library or pins. This saved branch is still available.</p></details>';
 const fields=[['Concept','pitch'],['Twist','twist'],['Audience','audience'],['First useful version','features']];
 const rows=fields.filter(([,key])=>JSON.stringify(parent[key])!==JSON.stringify(idea[key])).map(([label,key])=>{
  const value=x=>Array.isArray(x)?x.join(' · '):x;
  return '<div class="parent-change"><h3>'+label+'</h3><p><strong>Before:</strong> '+esc(value(parent[key]))+'</p><p><strong>This path:</strong> '+esc(value(idea[key]))+'</p></div>';
 });
 return '<details class="branch-history"><summary>What changed from the parent</summary><p>Compares saved wording; it does not judge whether a change is better.</p>'+rows.join('')+(rows.length?'':'<p>The concept, twist, audience, and first version have the same wording.</p>')+'<button class="secondary" data-tree-open="'+esc(parent.id)+'">Open parent: '+esc(parent.name)+'</button></details>';
}
function comparisonCards(ids){
 return ids.slice(0,3).map(id=>find(id)).filter(Boolean).map(i=>'<article class="comparison-card"><button class="tree-node" data-tree-open="'+esc(i.id)+'">'+esc(i.name)+'</button><h3>Concept</h3><p>'+esc(i.pitch)+'</p><h3>Twist</h3><p>'+esc(i.twist)+'</p><h3>Audience</h3><p>'+esc(i.audience)+'</p><h3>First useful version</h3><ul>'+(i.features||[]).map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>'+(i.exploration?.constraints?'<h3>Constraints</h3><p>'+esc(i.exploration.constraints)+'</p>':'')+'</article>').join('');
}
function pathComparison(idea){
 const nodes=familyIdeas(idea);
 const defaults=[idea.id];if(nodes.some(i=>i.id===idea.parentId))defaults.push(idea.parentId);else if(nodes.length>1)defaults.push(nodes.find(i=>i.id!==idea.id).id);
 return '<details class="path-comparison"><summary>Compare saved paths</summary><p>Choose up to three paths from this idea tree. Comparing uses saved text and keeps the model stopped.</p><div class="comparison-choices">'+nodes.map(i=>'<label><input type="checkbox" data-compare-path="'+esc(i.id)+'" '+(defaults.includes(i.id)?'checked':'')+'> '+esc(i.name)+'</label>').join('')+'</div><p id="pathComparisonStatus" role="status" aria-live="polite">'+(nodes.length===1?'Generate variations when you want more paths to compare.':'')+'</p><div id="pathComparisonCards" class="comparison-cards">'+comparisonCards(defaults)+'</div></details>';
}
function applyBrainstormDirection(){
 const preset=(data.brainstormDirections||[]).find(d=>d.id===$('directionPreset').value);
 if(!preset){$('directionFeedback').textContent='Choose a direction first.';return;}
 $('changeDirection').value=preset.change;
 if(!$('branchAudience').value.trim()&&preset.audience)$('branchAudience').value=preset.audience;
 if(!$('branchConstraints').value.trim()&&preset.constraints)$('branchConstraints').value=preset.constraints;
 $('directionFeedback').textContent='Direction ready. Review the fields, then choose Explore new variations.';
}
function updatePathComparison(event){
 const checkbox=event.target.closest('[data-compare-path]');if(!checkbox)return;
 let choices=[...$('detailBody').querySelectorAll('[data-compare-path]:checked')];
 if(choices.length>3){checkbox.checked=false;choices=choices.filter(c=>c!==checkbox);$('pathComparisonStatus').textContent='Compare up to three paths. Uncheck one before adding another.';}
 else $('pathComparisonStatus').textContent=choices.length?'':'Select a saved path to compare.';
 $('pathComparisonCards').innerHTML=comparisonCards(choices.map(c=>c.dataset.comparePath));
}
function ideaTree(idea){
 const nodes=familyIdeas(idea);
 const ids=new Set(nodes.map(i=>i.id)),children=new Map();
 for(const i of nodes){const key=ids.has(i.parentId)?i.parentId:null;if(!children.has(key))children.set(key,[]);children.get(key).push(i);}
 const seen=new Set(),rows=[];
 function walk(start,depth){const stack=[{i:start,depth}];while(stack.length){const {i,depth}=stack.pop();if(seen.has(i.id))continue;seen.add(i.id);const direction=i.exploration;rows.push('<li class="tree-depth-'+Math.min(depth,6)+'"><button class="tree-node '+(i.id===idea.id?'current':'')+'" data-tree-open="'+esc(i.id)+'" '+(i.id===idea.id?'aria-current="true"':'')+'>'+esc(i.name)+(i.id===idea.id?' · viewing':'')+'</button><small>'+esc(i.parentId?'Branch'+(direction?.audience?' · for '+direction.audience:'')+(direction?.combineName?' · combined with '+direction.combineName:''):'Starting idea')+'</small></li>');for(const child of [...(children.get(i.id)||[])].reverse())stack.push({i:child,depth:depth+1});}}
 for(const root of children.get(null)||[])walk(root,0);for(const i of nodes)if(!seen.has(i.id))walk(i,0);
 return '<details class="idea-tree" open><summary>Idea tree · '+nodes.length+' '+(nodes.length===1?'path':'paths')+'</summary><p>Open any saved path to revisit, pin, or branch it. Indented paths descend from the idea above them.</p><ul>'+rows.join('')+'</ul></details>';
}
function organizationPanel(idea){
 const settings=idea.organization||{tags:[],collections:[],status:'idea'};
 return '<details class="idea-organization"><summary>Organize this idea</summary><p>Tags describe an idea. Collections group ideas you want to revisit together. These labels apply to this path only and do not run the model.</p><label for="ideaTags">Tags · comma separated · up to 12</label><input id="ideaTags" maxlength="622" value="'+esc(settings.tags.join(', '))+'" placeholder="offline, puzzle, quick prototype"><label for="ideaCollections">Collections · comma separated · up to 5</label><input id="ideaCollections" maxlength="258" value="'+esc(settings.collections.join(', '))+'" placeholder="Weekend projects, Games to try"><label for="ideaProjectStatus">Project status</label><select id="ideaProjectStatus">'+Object.entries(data.libraryStatuses||{idea:'Idea'}).map(([value,label])=>'<option value="'+esc(value)+'" '+(settings.status===value?'selected':'')+'>'+esc(label)+'</option>').join('')+'</select><button id="saveOrganization" class="secondary" type="button" '+(busy?'disabled':'')+'>Save organization</button><p class="search-hint">Each tag or collection name can contain up to 50 characters. Clear a field to remove its labels. Saving does not pin an idea.</p><p id="organizationStatus" role="status" aria-live="polite"></p></details>';
}
async function saveOrganization(id){
 if(busy||stopped)return;
 const button=$('saveOrganization');button.disabled=true;$('organizationStatus').textContent='Saving…';
 const split=value=>value.split(',').map(n=>n.trim()).filter(Boolean);
 try{
  const result=await api('/api/library/organize',{id,organization:{tags:split($('ideaTags').value),collections:split($('ideaCollections').value),status:$('ideaProjectStatus').value}});
  data.ideas=result.ideas;data.pins=result.pins;board=board.map(i=>find(i.id)||i);
  if(selected?.id===id){selected=find(id);$('ideaTags').value=selected.organization.tags.join(', ');$('ideaCollections').value=selected.organization.collections.join(', ');$('organizationStatus').textContent='Labels and status saved on this PC.';}
  render();
 }catch(e){if(selected?.id===id)$('organizationStatus').textContent=e.message;}
 finally{button.disabled=busy||stopped;}
}
function openIdea(id){
 selected=find(id);if(!selected)return;
 const i=selected;
 $('detailCategory').textContent=i.category+' · Generated '+new Date(i.generatedAt).toLocaleDateString();
 $('detailBody').innerHTML='<h2>'+esc(i.name)+'</h2><p>'+esc(i.pitch)+'</p><h3>The twist</h3><p>'+esc(i.twist)+'</p><h3>Who it’s for</h3><p>'+esc(i.audience)+'</p><h3>The first useful version</h3><ul>'+i.features.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>'+(i.reasoning?'<section class="source"><h3>How this could work</h3><p><strong>Inputs:</strong> '+esc(i.reasoning.inputs.join('; '))+'</p><p>'+esc(i.reasoning.workflow)+'</p><p><strong>Limits:</strong> '+esc(i.reasoning.limitations)+'</p><p><strong>Discussion excerpt:</strong> '+esc(i.reasoning.sourceQuote)+'</p></section>':'')+explorationPanel(i)+'<div class="actions"><button id="branch" class="primary" '+(busy?'disabled':'')+'>Explore new variations</button><button id="detailPin" class="secondary">'+(isPinned(i.id)?'Unpin idea':'Pin for later')+'</button></div><h3>What inspired this</h3><p>'+esc(i.evidence)+'</p>'+i.sources.map(s=>'<div class="source"><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a><p>'+esc(s.excerpt)+'</p><small>'+esc(s.site)+(s.kind==='search-snippet'||s.id.startsWith('reddit-search-')?' · snippet only · full thread not checked':'')+' · '+esc(s.author)+' · fetched '+new Date(s.retrievedAt).toLocaleDateString()+(s.license?' · '+esc(s.license):'')+'</small></div>').join('')+researchPanel(i)+'<h3>Validate before building</h3><p>'+esc(i.validation)+'</p><h3>Your Codex starting point</h3><div class="kit-settings"><label for="platform">Build as</label><select id="platform"><option value="web app">Web app</option><option value="desktop tool">Desktop tool</option><option value="Unity game prototype">Unity game prototype</option></select><label for="note">Your direction</label><textarea id="note" maxlength="2000" placeholder="Focus, style, features, or constraints…">'+esc(data.pins.find(p=>p.idea.id===i.id)?.note||'')+'</textarea></div><div class="actions"><button id="saveNote" class="secondary">Pin idea and notes</button><button id="makeKit" class="secondary">Create Codex kit</button></div><section id="kit"></section>';
 if(i.exploration){for(const [id,key] of [['keepDirection','keep'],['branchConstraints','constraints'],['branchAudience','audience'],['branchCreativity','creativity'],['combineIdea','combineId']])$(id).value=i.exploration[key]|| (key==='creativity'?'balanced':'');}
 $('branch').onclick=()=>{if(busy||stopped)return;const settings={keep:$('keepDirection').value,change:$('changeDirection').value,constraints:$('branchConstraints').value,audience:$('branchAudience').value,creativity:$('branchCreativity').value,combineId:$('combineIdea').value};$('detail').close();void generate(i.id,settings);};
 $('detailBody').onclick=e=>{const node=e.target.closest('[data-tree-open]');if(node){$('detail').close();openIdea(node.dataset.treeOpen);}};
 $('detailBody').insertAdjacentHTML('afterbegin',organizationPanel(i));
 $('saveOrganization').onclick=()=>void saveOrganization(i.id);
 $('applyDirection').onclick=applyBrainstormDirection;
 $('detailBody').onchange=updatePathComparison;
 $('detailPin').onclick=async()=>{await pin(i.id,isPinned(i.id));$('detailPin').textContent=isPinned(i.id)?'Unpin idea':'Pin for later';};
 $('saveNote').onclick=()=>void pin(i.id,false,$('note').value);
 $('makeKit').onclick=async()=>{
 try{
 const k=await api('/api/kit',{id:i.id,platform:$('platform').value,note:$('note').value});
 $('kit').innerHTML='<h3>Opening prompt</h3><pre>'+esc(k.prompt)+'</pre><h3>Build workflow</h3><ol>'+k.workflow.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol><div class="actions"><button id="copyKit" class="primary">Copy complete kit</button><button id="downloadKit" class="secondary">Download kit</button></div>';
 $('copyKit').onclick=async()=>{try{await navigator.clipboard.writeText(k.text);$('copyKit').textContent='Copied';}catch{$('copyKit').textContent='Use Download kit';}};
 $('downloadKit').onclick=()=>download(i.name+'-codex-kit.txt',k.text,'text/plain');
 }catch(e){$('kit').textContent=e.message;}
 };
 $('detail').showModal();
}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('searchForm').onsubmit=e=>{e.preventDefault();void generate();};
$('libraryQuery').oninput=()=>render();
$('clearLibrarySearch').onclick=()=>{for(const id of ['libraryQuery','libraryTag','libraryCollection','libraryStatus'])$(id).value='';render();$('libraryQuery').focus();};
for(const id of ['libraryTag','libraryCollection','libraryStatus'])$(id).onchange=()=>render();
$('board').onclick=e=>{const open=e.target.closest('[data-open]');const p=e.target.closest('[data-pin]');if(open)openIdea(open.dataset.open);else if(p)void pin(p.dataset.pin,isPinned(p.dataset.pin));};
for(const [id,v] of [['exploreNav','board'],['pinsNav','pins'],['libraryNav','library']])$(id).onclick=async()=>{view=v;render();try{await load();}catch(e){status(e.message,'error');}};
$('shuffle').onclick=()=>{if(!data.ideas.length){status('Generate your first concepts with Roll fresh ideas.');return;}board=[...data.ideas].sort(()=>Math.random()-.5).slice(0,6);view='board';render();status('Shuffled saved concepts. The model stayed stopped.');};
$('close').onclick=()=>$('detail').close();
$('detail').onclick=e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close();}};
$('stop').onclick=async()=>{if(phone){try{await api('/api/mobile/logout',{});location.reload();}catch(e){status(e.message,'error');}return;}try{await api('/api/stop',{});}finally{stopped=true;clearInterval(poll);clearInterval(heartbeat);setBusy(false);$('detail').close();$('roll').disabled=true;$('stop').disabled=true;$('modelStatus').textContent='Muse stopped';status('Muse is stopped. Your library and pins are saved. Reopen with Start Muse.cmd.');}};
const heartbeat=setInterval(()=>{if(!busy&&!stopped)api('/api/status').catch(()=>{});},20000);
load().then(()=>{if(data.job?.state==='running'){setBusy(true);jobId=data.job.id;poll=setInterval(checkJob,1500);}}).catch(e=>status(e.message,'error'));


let toolsBusy=false,backups=[];
const toolIds=['exportLibrary','importLibrary','createBackup','restoreBackup','clearGenerated','backupChoice','importFile'];
function syncTools(){for(const id of toolIds)$(id).disabled=busy||stopped||toolsBusy; if(!busy&&!stopped&&!toolsBusy)$('restoreBackup').disabled=!$('backupChoice').value;}
function toolsStatus(message){$('toolsStatus').textContent=message;}
async function refreshBackups(){
 try{const d=await api('/api/library/backups');backups=d.backups;const selected=$('backupChoice').value;$('backupChoice').innerHTML='<option value="">'+(backups.length?'Choose a backup':'No backups yet')+'</option>'+backups.map(b=>'<option value="'+esc(b.name)+'">'+esc(new Date(b.createdAt).toLocaleString()+' · '+b.ideas+' ideas / '+b.pins+' pins · '+({'manual':'manual','pre-import':'before import','pre-clear':'before clearing','pre-restore':'before restore'}[b.reason]||'backup'))+'</option>').join('');if(backups.some(b=>b.name===selected))$('backupChoice').value=selected;syncTools();}catch(e){toolsStatus(e.message);}
}
async function libraryOperation(route,payload,message,changes=true){
 if(busy||stopped||toolsBusy)return;toolsBusy=true;syncTools();toolsStatus('Working…');
 try{await api(route,payload);if(changes){board=[];view='library';$('libraryQuery').value='';$('detail').close();await load();}await refreshBackups();toolsStatus(message);status(message);}
 catch(e){toolsStatus(e.message);}finally{toolsBusy=false;syncTools();}
}
$('libraryTools').addEventListener('toggle',()=>{if($('libraryTools').open){void refreshBackups();if(!phone){void refreshMobile();void refreshRedditSearch();}}});
$('backupChoice').onchange=syncTools;
$('exportLibrary').onclick=async()=>{if(busy||stopped||toolsBusy)return;toolsBusy=true;syncTools();try{const library=await api('/api/library/export');download('muse-library-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json',JSON.stringify(library,null,2),'application/json');toolsStatus('Library export downloaded. Keep it somewhere safe.');}catch(e){toolsStatus(e.message);}finally{toolsBusy=false;syncTools();}};
$('importLibrary').onclick=()=>{if(!busy&&!stopped&&!toolsBusy)$('importFile').click();};
$('importFile').onchange=async()=>{const file=$('importFile').files[0];$('importFile').value='';if(!file||busy||stopped||toolsBusy)return;try{if(file.size>20*1024*1024)throw Error('Choose a library export smaller than 20 MB.');const library=JSON.parse(await file.text());if(library.format!=='muse-library'||library.version!==1||!Array.isArray(library.ideas)||!Array.isArray(library.pins))throw Error('Choose a Muse library export (version 1).');if(!confirm('Merge '+library.ideas.length+' ideas and '+library.pins.length+' pins into Muse? Existing items and notes will be kept when IDs match. A backup is created first.'))return;await libraryOperation('/api/library/import',{library},'Import complete. Existing items and pin notes were preserved.');}catch(e){toolsStatus(e.message);}};
$('createBackup').onclick=()=>void libraryOperation('/api/library/backup',{},'Backup saved on this PC.',false);
$('restoreBackup').onclick=()=>{const backup=backups.find(b=>b.name===$('backupChoice').value);if(!backup||busy||stopped||toolsBusy)return;if(confirm('Restore '+new Date(backup.createdAt).toLocaleString()+'? Your library and pins will be replaced with '+backup.ideas+' ideas and '+backup.pins+' pins from that backup. The current state is backed up first, so you can undo this.'))void libraryOperation('/api/library/restore',{name:backup.name,confirm:true},'Backup restored. Your previous state is available in backups.');};
$('clearGenerated').onclick=()=>{if(busy||stopped||toolsBusy)return;if(confirm('Clear all '+data.ideas.length+' generated-library ideas? All '+data.pins.length+' pins and their notes will remain. Muse creates a backup first so you can restore the cleared ideas.'))void libraryOperation('/api/library/clear',{confirm:true},'Generated library cleared. Your pins and notes are kept; a backup is available.');};
syncTools();


let mobileBusy=false;
function mobileControls(){for(const id of ['enableMobile','disableMobile','refreshMobile'])$(id).disabled=mobileBusy||stopped;}
function showMobile(d){
 const network=d.network.installed?(d.network.connected?'Tailscale connected.':'Sign in to Tailscale on this PC.'):'Install Tailscale on this PC to get started.';
 $('mobileStatus').innerHTML='<p>'+esc(network)+'</p>'+(d.enabled?'<p>Open on your phone: <a href="'+esc(d.url)+'" target="_blank" rel="noopener noreferrer">'+esc(d.url)+'</a></p><p>Pairing code: <strong class="pair-code">'+esc(d.code||'Used · generate a new code to pair another browser')+'</strong></p>'+(d.code?'<p>Code expires at '+esc(new Date(d.expiresAt).toLocaleTimeString())+'.</p>':'')+'<p>'+d.sessions+' paired browser(s). Disable access to disconnect all phones.</p>':'<p>Mobile access is off. It starts only when you enable it here.</p>');
}
async function refreshMobile(){try{showMobile(await api('/api/mobile'));}catch(e){$('mobileStatus').textContent=e.message;}}
async function changeMobile(action){if(mobileBusy||stopped)return;mobileBusy=true;mobileControls();$('mobileStatus').textContent='Setting up private access…';try{showMobile(await api('/api/mobile/'+action,{}));}catch(e){$('mobileStatus').textContent=e.message;}finally{mobileBusy=false;mobileControls();}}
$('enableMobile').onclick=()=>void changeMobile('enable');
$('disableMobile').onclick=()=>void changeMobile('disable');
$('refreshMobile').onclick=()=>void refreshMobile();
if(phone){$('mobileTools').hidden=true;$('redditSearchTools').hidden=true;$('stop').textContent='Disconnect phone';$('privacyNote').textContent='Private on your home PC · generation only when requested';}

let redditSearchBusy=false;
function showRedditSearch(d){$('redditSearchStatus').textContent=(d.enabled?'Enabled':d.configured?'Disabled · key saved':'Not connected')+' · '+d.used+' / '+d.limit+' Muse search attempts in '+d.month+(d.paused?' · paused by usage limit or provider backoff':'')+'. No full Reddit threads are fetched.';}
async function refreshRedditSearch(){try{showRedditSearch(await api('/api/reddit-search'));}catch(e){$('redditSearchStatus').textContent=e.message;}}
async function configureRedditSearch(input){
 if(redditSearchBusy||busy||stopped)return;redditSearchBusy=true;
 for(const id of ['connectRedditSearch','disableRedditSearch','removeRedditKey'])$(id).disabled=true;
 $('redditSearchStatus').textContent='Saving search settings…';
 try{showRedditSearch(await api('/api/reddit-search',input));}
 catch(e){$('redditSearchStatus').textContent=e.message;}
 finally{$('tavilyKey').value='';redditSearchBusy=false;for(const id of ['connectRedditSearch','disableRedditSearch','removeRedditKey'])$(id).disabled=stopped;}
}
$('connectRedditSearch').onclick=()=>void configureRedditSearch({key:$('tavilyKey').value,enabled:true,freePlanConfirmed:$('tavilyFreePlan').checked});
$('disableRedditSearch').onclick=()=>void configureRedditSearch({enabled:false});
$('removeRedditKey').onclick=()=>void configureRedditSearch({remove:true});


function researchPanel(idea){
 const r=idea.research;if(!r)return '';
 if(r.mode==='interest-only')return '<section class="source"><h3>Research signals</h3><p>Interest-led idea: no explicit complaint, wish, or troublesome workaround was detected in its cited excerpts.</p><p>This is a creative possibility, not evidence of an unmet need.</p></section>';
 const kinds={complaint:'Complaint / friction',request:'Wish / request',workaround:'Troublesome workaround'};
 const repeated=r.groups.filter(g=>g.repeated);
 return '<details class="source research-signals"><summary>Research signals · '+r.signals.length+' · '+(repeated.length?'similar needs across discussions':'repetition not established')+'</summary><p>Detected in this idea’s cited sources. Similar wording is provisional evidence, not proven demand.</p>'+r.signals.map(s=>{const source=idea.sources.find(x=>x.id===s.sourceId);return '<p><strong>'+esc(kinds[s.kind]||s.kind)+'</strong><br>“'+esc(s.quote)+'”'+(source?'<br><a href="'+esc(source.url)+'" target="_blank" rel="noopener noreferrer">'+esc(source.title)+'</a>':'')+'</p>';}).join('')+repeated.map(g=>'<p><strong>Similar need: '+esc(g.label)+'</strong><br>'+g.discussionCount+' discussions · '+g.authorCount+' author identifiers · '+g.sourceCount+' cited excerpts</p>').join('')+'<p>'+esc(r.limitations)+'</p></details>';
}
