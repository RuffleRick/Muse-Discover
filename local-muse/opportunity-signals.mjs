import {words,selectSources,sourceScore,evidenceQuotes} from './research-quality.mjs';
import {isSearchSnippet} from './reddit-search.mjs';
const patterns={
 request:/\b(?:i wish|we wish|wish there (?:was|were)|if only|i(?:'m| am) looking for|we(?:'re| are) looking for|is there (?:an?|any) (?:app|tool|software|way)|(?:i|we) (?:need|want) (?:an?|some|better|simpler|a simple)\b|would (?:love|like) (?:an?|to)|there should be|feature request|missing (?:a |the )?feature)\b/i,
 complaint:/\b(?:frustrat\w*|annoy\w*|tedious|cumbersome|time.consuming|takes? too long|too complicated|too difficult|hard to|difficult to|struggl\w* (?:to|with)|pain point|a pain to|tired of|can(?:not|'t) (?:find|keep|track|manage|organize)|does(?:n't| not) (?:let|allow|support)|wastes? (?:my |our )?time)\b/i,
 workaround:/\b(?:workaround|by hand|manually|copy (?:and|&) paste|copy.past\w*|spreadsheet|sticky notes|pen and paper|switch(?:ing)? between|juggling (?:multiple|several)|have to (?:re.?enter|retype|repeat)|re.?enter(?:ing)? (?:the same|data))\b/i
};
const generic=new Set('this that there these those have has had been being was were not but can could would should will just really very more much many people someone something anything every each all too takes take taking need needs looking wish wishes like love want wants way use uses using used app tool software problem problems frustrating frustrated tedious cumbersome manually manual workaround hand spreadsheet because then when still also again'.split(' '));
const normalize=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
const fingerprint=s=>normalize(s).replace(/[^a-z0-9 ]/g,'');
function needWords(quote,topic){const topical=new Set(words(topic));return words(quote).map(w=>({scores:'score',scoring:'score',tracking:'track',tracked:'track',organizing:'organize',folders:'folder',files:'file',rules:'rule',scheduling:'schedule',scheduled:'schedule'}[w]||w)).filter(w=>!generic.has(w)&&!topical.has(w));}
function isNegated(sentence,index){return /\b(?:not|never|no longer|isn't|aren't|wasn't)\s+(?:\w+\s+){0,2}$/.test(sentence.slice(Math.max(0,index-45),index).toLowerCase());}
function activeMatch(pattern,text){const match=pattern.exec(text);return !!match&&!isNegated(text,match.index);}
export function detectSignals(source,topic=''){
 if(isSearchSnippet(source))return []; // Search chunks lack verified thread/author context.
 const excerpt=String(source.excerpt||'').slice(0,16000),signals=[];
 const topical=words(topic),bodyWords=words(excerpt);
 if(topical.length&&!topical.some(t=>bodyWords.some(w=>w===t||w===t+'s'||t===w+'s')))return signals;
 // Quotes are literal slices of the supplied excerpt, never model-written summaries.
 for(const sentence of excerpt.match(/[^.!?\n]+(?:[.!?]+|$)/g)||[]){
  const text=sentence.trim();if(text.length<20)continue;
  if(/\b(?:used to|previously|no longer)\b.{0,100}\b(?:but|now|fixed|solved|resolved)\b|\b(?:problem|issue) (?:is|was|has been) (?:fixed|solved|resolved)\b/i.test(text))continue;
  for(const [kind,pattern] of Object.entries(patterns)){
   const match=pattern.exec(text);if(!match||isNegated(text,match.index))continue;
   // A spreadsheet/manual step alone is not a complaint: require friction or a forced substitute.
   if(kind==='workaround'&&!activeMatch(patterns.complaint,text)&&!activeMatch(patterns.request,text)&&!activeMatch(/\b(?:have to|forced to|resort to|instead|only way|end up|workaround)\b/i,text))continue;
   const start=Math.max(0,match.index-80),quote=text.length<=300?text:text.slice(start,start+300);
   if(!signals.some(s=>s.kind===kind&&s.quote===quote))signals.push({sourceId:source.id,kind,quote});
  }
  if(signals.length>=6)break;
 }
 return signals.slice(0,6);
}
function similar(a,b){const overlap=a.filter(w=>b.includes(w)).length;return overlap>=2&&overlap/Math.min(a.length,b.length)>=0.5;}
function discussion(source){
 if(source.discussionId)return String(source.site||'')+':'+source.discussionId;
 const m=String(source.url||'').match(/^(https:\/\/[^/]+)\/questions\/(\d+)/);return m?m[1]+':'+m[2]:null;
}
function author(source){const key=source.authorId||source.author;return key?String(source.site||'')+':'+normalize(key):null;}
export function researchSummary(sources,topic=''){
 const unique=[];const seen=new Set();
 for(const source of sources){const key=fingerprint(source.excerpt);if(seen.has(source.url)||seen.has(key))continue;seen.add(source.url);seen.add(key);unique.push(source);}
 const signals=unique.flatMap(s=>detectSignals(s,topic)),groups=[];
 for(const signal of signals){
  const terms=[...new Set(needWords(signal.quote,topic))];if(terms.length<2)continue;
  // Match the first example, avoiding transitive chains that merge unrelated needs.
  let group=groups.find(g=>similar(g.terms,terms));
  if(!group){group={terms,signals:[]};groups.push(group);}group.signals.push(signal);
 }
 const mapped=groups.map(g=>{
  const ids=[...new Set(g.signals.map(s=>s.sourceId))],members=unique.filter(s=>ids.includes(s.id));
  const discussionCount=new Set(members.map(discussion).filter(Boolean)).size;
  const authorCount=new Set(members.map(author).filter(Boolean)).size;
  const counts=new Map();for(const s of g.signals)for(const w of new Set(needWords(s.quote,topic)))counts.set(w,(counts.get(w)||0)+1);
  const shared=[...counts].filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([w])=>w);
  return {label:(shared.length?shared:g.terms.slice(0,4)).join(' · '),sourceIds:ids,sourceCount:ids.length,discussionCount,authorCount,repeated:discussionCount>=2&&authorCount>=2,signals:g.signals};
 }).sort((a,b)=>Number(b.repeated)-Number(a.repeated)||b.sourceCount-a.sourceCount);
 return {version:1,topic,mode:signals.length?'need-signals':'interest-only',signals,groups:mapped,limitations:'Phrase and word-overlap heuristics on a small retrieved sample. Author identifiers are not verified people; repetition does not prove unmet demand, novelty, or low competition.'};
}
export function selectOpportunitySources(sources,topic,max=6){
 const relevant=selectSources(sources,topic,60),research=researchSummary(relevant,topic);
 const boost=s=>{const kinds=new Set(research.signals.filter(x=>x.sourceId===s.id).map(x=>x.kind));return kinds.size*2+(research.groups.some(g=>g.repeated&&g.sourceIds.includes(s.id))?4:0);};
 const ranked=relevant.sort((a,b)=>(sourceScore(b,topic)+boost(b))-(sourceScore(a,topic)+boost(a)));
 const picked=[],usedText=new Set();
 const add=s=>{if(!s)return;const key=fingerprint(s.excerpt);if(!usedText.has(key)&&!picked.some(p=>p.id===s.id)&&picked.length<max){picked.push(s);usedText.add(key);}};
 // Preserve supporting examples for the strongest repeated group before filling remaining slots.
 const repeat=research.groups.find(g=>g.repeated);
 if(repeat)for(const s of ranked.filter(s=>repeat.sourceIds.includes(s.id)).sort((a,b)=>sourceScore(b,topic)-sourceScore(a,topic))){
  if(!picked.some(p=>discussion(p)===discussion(s)||author(p)===author(s)))add(s);
  if(picked.length>=3)break;
 }
 // Include one relevant snippet when available, after preserving repeated-need examples.
 add(ranked.find(isSearchSnippet));
 for(const s of ranked)add(s);
 return {sources:picked,research:researchSummary(picked,topic)};
}
export function checkSignalGrounding(raw,sources,topic,{variation=false}={}){
 const research=researchSummary(sources,topic);if(variation||!research.signals.length)return;
 for(const idea of raw.ideas||[])if(!research.signals.some(s=>s.sourceId===idea.sourceIds?.[0]&&evidenceQuotes(s.quote).some(quote=>evidenceQuotes(idea.sourceQuote).includes(quote))))throw Error('Quality check stopped this roll: the idea must quote a detected complaint, wish, or workaround from its first cited source. Nothing was saved.');
}
export function promptResearch(research){
 const seen=new Set();const signals=research.signals.filter(s=>{const key=s.sourceId+':'+s.quote;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,12);
 return {mode:research.mode,signals,groups:research.groups.slice(0,6).map(({signals,...group})=>group),limitations:research.limitations};
}
