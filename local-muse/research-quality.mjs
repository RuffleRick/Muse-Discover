const stop=new Set('a an the and or for of to in on with from using how what why is are can do does app apps tool tools idea ideas create build want need'.split(' '));
export function detailedSource(source){const excerpt=String(source.excerpt||'').trim(),title=String(source.title||'').trim();return excerpt.length>=100&&excerpt.toLowerCase()!==title.toLowerCase();}
export function words(value){return [...new Set(String(value||'').toLowerCase().match(/[a-z0-9]+/g)||[])].filter(w=>w.length>2&&!stop.has(w));}
export function sourceScore(source,term){
 const excerpt=String(source.excerpt||'').trim(),title=String(source.title||'').trim();
 if(!detailedSource(source))return 0;
 const hay=(title+' '+excerpt).toLowerCase();
 if(/\b(card games?|solitaire)\b/i.test(term)&&/graphics card|credit card|sd card|micro.?sd|video card|card boosters|card drops|trading cards on steam/i.test(hay))return 0;
 if(/special education|\biep\b/i.test(term)&&/grammatically|meaning of|parse them|concrete types|hashing|c\+\+|university teaching/i.test(title))return 0;
 if(/special education|\biep\b/i.test(term)&&(!/\bspecial education\b|\biep\b/i.test(hay)||!(/\bstudents?\b|\bschools?\b|\bteachers?\b|classroom|learning disability|learning disabilities|individualized education|learning needs/i.test(hay))))return 0;
 const terms=words(term),tokens=words(hay),matched=terms.filter(t=>tokens.some(w=>w===t||w===t+'s'||t===w+'s')).length;
 const coverage=terms.length?matched/terms.length:0;
 if(!matched||coverage<(terms.length>1?0.6:1))return 0;
 return coverage*10+words(title).filter(w=>terms.includes(w)).length+Math.min(excerpt.length,1200)/1200;
}
export function selectSources(sources,term,max=6){
 const seen=new Set();return sources.map(s=>({s,score:sourceScore(s,term)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).filter(({s})=>{if(seen.has(s.url))return false;seen.add(s.url);return true;}).slice(0,max).map(({s})=>s);
}
export function routeSearch(category,query){
 const q=query.toLowerCase();
 if(/special education|\biep\b/.test(q))return {category:category==='Everything'?'Learning':category,site:null};
 const rules=[[/solitaire|card game|board game|puzzle/,'Games','boardgames'],[/gaming|video game/,'Games','gaming'],[/garden|plant|soil|seed/,'Hobbies','gardening'],[/photo|camera|lens/,'Hobbies','photography'],[/cook|meal|food|pantry|leftover/,'Everyday life','cooking'],[/house|home repair|diy/,'Everyday life','diy'],[/language|vocabulary|speaking/,'Learning','languagelearning'],[/music|instrument/,'Creative','music'],[/writ|story|novel/,'Creative','writing'],[/travel|trip/,'Community','travel'],[/parent|family|child/,'Community','parenting'],[/file|folder|computer|software|workflow|freelance/,'Tools','superuser']];
 const found=rules.find(([r])=>r.test(q));return found?{category:category==='Everything'?found[1]:category,site:found[2]}:null;
}
export const qualityFields={sourceQuote:{type:'string',minLength:20,maxLength:350},inputs:{type:'array',minItems:1,maxItems:5,items:{type:'string',minLength:1,maxLength:300}},workflow:{type:'string',minLength:25,maxLength:700},limitations:{type:'string',minLength:15,maxLength:500}};
export function checkLogic(raw,sources){
 const failures=[];
 for(const i of raw.ideas||[]){
  const first=sources.find(s=>s.id===i.sourceIds?.[0]);
  const normalize=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
  const quote=normalize(i.sourceQuote);
  if(quote.length<20||quote.length>350||!first||!detailedSource(first)||!normalize(first.excerpt).includes(quote))failures.push('An idea lacks a verifiable excerpt from its first cited discussion.');
  if(!Array.isArray(i.inputs)||!i.inputs.length||i.inputs.length>5||i.inputs.some(v=>typeof v!=='string'||!v.trim()||v.length>300)||typeof i.workflow!=='string'||i.workflow.trim().length<25||i.workflow.length>700||typeof i.limitations!=='string'||i.limitations.trim().length<15||i.limitations.length>500)failures.push('An idea does not explain its inputs, useful interaction, and limits.');
  const description=[i.pitch,i.twist,...(i.features||[])].join(' ');
  if(/\b(exact|exactly|accurate|accurately)\b/i.test(description)&&/depth of field|perspective|focal length/i.test(description)&&/upload.{0,30}(photo|image)|any.{0,15}(photo|image)/i.test(description))failures.push('An uploaded photo alone cannot support an exact alternate-lens or scene reconstruction claim.');
  if(/detect|measure|estimat|diagnos/i.test(description)&&/contaminant|heavy metal|lead\/cadmium|soil chemistry/i.test(description))failures.push('Chemical measurements require evidence and equipment outside a basic software prototype.');
 }
 if(failures.length)throw Error('Quality check stopped this roll: '+[...new Set(failures)].join(' ')+' Try a clearer topic or direction. Nothing was saved.');
}
