const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data={ideas:[],pins:[]},board=[],view='board',selected=null,busy=false,jobId=null,poll=null,stopped=false;
async function api(route,body){
 const r=await fetch(route,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const d=await r.json();if(!r.ok)throw Error(d.error||'Request failed.');return d;
}
function status(message,kind='notice'){$('status').className=kind;$('status').textContent=message;}
function setBusy(v){busy=v;$('roll').disabled=v;$('query').disabled=v;$('category').disabled=v;$('modelStatus').textContent=v?'Generating on this PC':'Model stopped';}
function isPinned(id){return data.pins.some(p=>p.idea.id===id);}
function render(){
 $('pinCount').textContent=data.pins.length;
 for(const [id,v] of [['exploreNav','board'],['pinsNav','pins'],['libraryNav','library']])$(id).classList.toggle('active',view===v);
 const savedView=view==='pins'||view==='library';
 $('generationControls').hidden=savedView;
 $('librarySearchControls').hidden=!savedView;
 const all=view==='pins'?data.pins.map(p=>p.idea):view==='library'?[...data.ideas].reverse():board;
 const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const terms=savedView?normalize($('libraryQuery').value).trim().split(/\s+/).filter(Boolean):[];
 const notes=new Map(data.pins.map(p=>[p.idea.id,p.note]));
 const list=terms.length?all.filter(i=>{
  const text=normalize([i.name,i.category,i.pitch,i.twist,i.audience,...(i.features||[]),i.evidence,i.validation,...Object.values(i.exploration||{}),notes.get(i.id),...(i.sources||[]).flatMap(s=>[s.title,s.excerpt])].join(' '));
  return terms.every(term=>text.includes(term));
 }):all;
 $('heading').textContent=view==='pins'?'Keep the paths worth returning to.':view==='library'?'Every direction you’ve discovered.':'A little curiosity. A new direction.';
 $('intro').textContent=view==='pins'?'Search your pinned concepts and notes, or open an idea to keep exploring.':view==='library'?'Search by anything you remember, then open, pin, or branch a saved concept.':'Find a useful twist on a familiar problem, game, or everyday task.';
 $('libraryInfo').textContent=savedView?list.length+' of '+all.length+' '+(view==='pins'?'pinned ideas':'saved concepts')+(terms.length?' match your search':'') :data.ideas.length+' generated concepts in your local library · '+data.pins.length+' pinned';
 if(savedView&&!list.length){
  $('board').innerHTML='<div class="empty"><h2>'+(terms.length?'No matching ideas.':view==='pins'?'Your next favorite belongs here.':'Your library is ready for its first idea.')+'</h2><p>'+(terms.length?'Try fewer words or a different detail, or clear the search to see every idea.':view==='pins'?'Pin a concept to save it here with your notes.':'Use Explore to roll your first concepts.')+'</p></div>';
  return;
 }
 $('board').innerHTML=list.length?list.map(i=>'<article class="card"><div class="card-top"><span class="tag">'+esc(i.category)+'</span><button class="pin '+(isPinned(i.id)?'on':'')+'" data-pin="'+esc(i.id)+'" aria-label="'+(isPinned(i.id)?'Unpin':'Pin')+' '+esc(i.name)+'">'+(isPinned(i.id)?'★':'☆')+'</button></div><button class="title-button" data-open="'+esc(i.id)+'">'+esc(i.name)+'</button><p>'+esc(i.pitch)+'</p><p class="twist">'+esc(i.twist)+'</p><div class="card-bottom"><span>'+i.sources.length+' source'+(i.sources.length===1?'':'s')+' · LOCAL AI</span><button data-open="'+esc(i.id)+'">Explore idea →</button></div></article>').join(''):'<div class="empty"><h2>'+(view==='pins'?'Your next favorite belongs here.':'Start with a roll. Or follow a curiosity.')+'</h2><p>'+(view==='pins'?'Pin a concept to save it for later.':'Try “solitaire variants,” “leftovers,” or “photography.” Muse will find discussions and generate three new directions on your PC.')+'</p><p>The model stays stopped until you ask for new ideas.</p></div>';
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
 return history+combined+'<section class="exploration-panel" aria-label="Explore different paths"><h3>Explore different paths</h3><p>Choose a direction, then generate three variations. Each becomes a saved branch of this idea.</p><div class="exploration-fields"><div><label for="keepDirection">Keep this</label><textarea id="keepDirection" maxlength="600" placeholder="The core mechanic, useful feature, or style to preserve…"></textarea></div><div><label for="changeDirection">Change that</label><textarea id="changeDirection" maxlength="600" placeholder="A different interaction, workflow, or twist…"></textarea></div></div><label for="branchConstraints">Constraints</label><textarea id="branchConstraints" maxlength="600" placeholder="For example: offline, no accounts, one-week prototype, accessible controls…"></textarea><label for="branchAudience">Adapt for an audience</label><input id="branchAudience" maxlength="300" placeholder="Leave blank for the original audience"><div class="exploration-fields"><div><label for="branchCreativity">Creativity</label><select id="branchCreativity"><option value="focused">Focused · nearby improvements</option><option value="balanced" selected>Balanced · different approaches</option><option value="wild">Wild · surprising combinations</option></select></div><div><label for="combineIdea">Combine with a saved idea</label><select id="combineIdea"><option value="">No combination</option>'+others.map(i=>'<option value="'+esc(i.id)+'">'+esc(i.name)+'</option>').join('')+'</select></div></div><p class="search-hint">Directions guide the local model; check each result for fit. Combining ideas keeps the branch under this idea and links the other concept.</p></section>'+ideaTree(idea);
}
function ideaTree(idea){
 const all=[...new Map([...data.ideas,...data.pins.map(p=>p.idea)].map(i=>[i.id,i])).values()];
 const nodes=all.filter(i=>i.family===idea.family||i.id===idea.id);
 const ids=new Set(nodes.map(i=>i.id)),children=new Map();
 for(const i of nodes){const key=ids.has(i.parentId)?i.parentId:null;if(!children.has(key))children.set(key,[]);children.get(key).push(i);}
 const seen=new Set(),rows=[];
 function walk(start,depth){const stack=[{i:start,depth}];while(stack.length){const {i,depth}=stack.pop();if(seen.has(i.id))continue;seen.add(i.id);const direction=i.exploration;rows.push('<li class="tree-depth-'+Math.min(depth,6)+'"><button class="tree-node '+(i.id===idea.id?'current':'')+'" data-tree-open="'+esc(i.id)+'" '+(i.id===idea.id?'aria-current="true"':'')+'>'+esc(i.name)+(i.id===idea.id?' · viewing':'')+'</button><small>'+esc(i.parentId?'Branch'+(direction?.audience?' · for '+direction.audience:'')+(direction?.combineName?' · combined with '+direction.combineName:''):'Starting idea')+'</small></li>');for(const child of [...(children.get(i.id)||[])].reverse())stack.push({i:child,depth:depth+1});}}
 for(const root of children.get(null)||[])walk(root,0);for(const i of nodes)if(!seen.has(i.id))walk(i,0);
 return '<details class="idea-tree" open><summary>Idea tree · '+nodes.length+' '+(nodes.length===1?'path':'paths')+'</summary><p>Open any saved path to revisit, pin, or branch it. Indented paths descend from the idea above them.</p><ul>'+rows.join('')+'</ul></details>';
}
function openIdea(id){
 selected=find(id);if(!selected)return;
 const i=selected;
 $('detailCategory').textContent=i.category+' · Generated '+new Date(i.generatedAt).toLocaleDateString();
 $('detailBody').innerHTML='<h2>'+esc(i.name)+'</h2><p>'+esc(i.pitch)+'</p><h3>The twist</h3><p>'+esc(i.twist)+'</p><h3>Who it’s for</h3><p>'+esc(i.audience)+'</p><h3>The first useful version</h3><ul>'+i.features.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>'+explorationPanel(i)+'<div class="actions"><button id="branch" class="primary" '+(busy?'disabled':'')+'>Explore three new variations</button><button id="detailPin" class="secondary">'+(isPinned(i.id)?'Unpin idea':'Pin for later')+'</button></div><h3>What inspired this</h3><p>'+esc(i.evidence)+'</p>'+i.sources.map(s=>'<div class="source"><a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.title)+'</a><p>'+esc(s.excerpt)+'</p><small>'+esc(s.site)+' · '+esc(s.author)+' · fetched '+new Date(s.retrievedAt).toLocaleDateString()+(s.license?' · '+esc(s.license):'')+'</small></div>').join('')+'<h3>Validate before building</h3><p>'+esc(i.validation)+'</p><h3>Your Codex starting point</h3><div class="kit-settings"><label for="platform">Build as</label><select id="platform"><option value="web app">Web app</option><option value="desktop tool">Desktop tool</option><option value="Unity game prototype">Unity game prototype</option></select><label for="note">Your direction</label><textarea id="note" maxlength="2000" placeholder="Focus, style, features, or constraints…">'+esc(data.pins.find(p=>p.idea.id===i.id)?.note||'')+'</textarea></div><div class="actions"><button id="saveNote" class="secondary">Pin idea and notes</button><button id="makeKit" class="secondary">Create Codex kit</button></div><section id="kit"></section>';
 if(i.exploration){for(const [id,key] of [['keepDirection','keep'],['branchConstraints','constraints'],['branchAudience','audience'],['branchCreativity','creativity'],['combineIdea','combineId']])$(id).value=i.exploration[key]|| (key==='creativity'?'balanced':'');}
 $('branch').onclick=()=>{if(busy||stopped)return;const settings={keep:$('keepDirection').value,change:$('changeDirection').value,constraints:$('branchConstraints').value,audience:$('branchAudience').value,creativity:$('branchCreativity').value,combineId:$('combineIdea').value};$('detail').close();void generate(i.id,settings);};
 $('detailBody').onclick=e=>{const node=e.target.closest('[data-tree-open]');if(node){$('detail').close();openIdea(node.dataset.treeOpen);}};
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
$('clearLibrarySearch').onclick=()=>{$('libraryQuery').value='';render();$('libraryQuery').focus();};
$('board').onclick=e=>{const open=e.target.closest('[data-open]');const p=e.target.closest('[data-pin]');if(open)openIdea(open.dataset.open);else if(p)void pin(p.dataset.pin,isPinned(p.dataset.pin));};
for(const [id,v] of [['exploreNav','board'],['pinsNav','pins'],['libraryNav','library']])$(id).onclick=()=>{view=v;render();};
$('shuffle').onclick=()=>{if(!data.ideas.length){status('Generate your first concepts with Roll fresh ideas.');return;}board=[...data.ideas].sort(()=>Math.random()-.5).slice(0,6);view='board';render();status('Shuffled saved concepts. The model stayed stopped.');};
$('close').onclick=()=>$('detail').close();
$('detail').onclick=e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close();}};
$('stop').onclick=async()=>{try{await api('/api/stop',{});}finally{stopped=true;clearInterval(poll);clearInterval(heartbeat);setBusy(false);$('detail').close();$('roll').disabled=true;$('stop').disabled=true;$('modelStatus').textContent='Muse stopped';status('Muse is stopped. Your library and pins are saved. Reopen with Start Muse.cmd.');}};
const heartbeat=setInterval(()=>{if(!busy&&!stopped)api('/api/status').catch(()=>{});if(!stopped&&resourceDayChecked!==browserDay())void loadDailyResources();},20000);
let resources=null,resourcesBusy=false,resourceDayChecked=null;
function browserDay(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
function renderResources(){
 const list=resources?.items||[];
 $('resourceList').innerHTML=list.map(i=>'<article class="resource"><a href="'+esc(i.url)+'" target="_blank" rel="noopener noreferrer">'+esc(i.title)+' <span aria-hidden="true">↗</span></a><span class="resource-source">'+esc(i.source)+'</span></article>').join('')||'<p class="feed-note">No learning links available yet.</p>';
 if(resources){$('resourceStatus').textContent=(resources.refreshedAt?'Found '+new Date(resources.refreshedAt).toLocaleDateString():'Daily resources')+(resources.warnings?.length?' · '+resources.warnings.join(' '):'');}
}
async function loadDailyResources(){
 if(resourcesBusy||stopped)return;
 resourcesBusy=true;
 try{
  resources=await api('/api/resources');renderResources();
  if(!resources.checkedToday){$('resourceStatus').textContent='Searching for today’s learning links…';resources=await api('/api/resources/refresh',{});renderResources();}
  resourceDayChecked=resources.day;
 }catch(e){resourceDayChecked=browserDay();$('resourceStatus').textContent='Daily search unavailable. Saved links remain here; Muse will try again tomorrow.';}
 finally{resourcesBusy=false;}
}
function learningVisibility(show){$('learningFeed').hidden=!show;$('workspace').classList.toggle('learning-hidden',!show);$('toggleLearning').setAttribute('aria-expanded',String(show));}
try{learningVisibility(localStorage.getItem('muse-learning-hidden')!=='true');}catch{}
$('toggleLearning').onclick=()=>{const show=$('learningFeed').hidden;learningVisibility(show);try{localStorage.setItem('muse-learning-hidden',String(!show));}catch{}};
void loadDailyResources();
load().then(()=>{if(data.job?.state==='running'){setBusy(true);jobId=data.job.id;poll=setInterval(checkJob,1500);}}).catch(e=>status(e.message,'error'));

