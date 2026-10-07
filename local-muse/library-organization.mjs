export const libraryStatuses={idea:'Idea',shortlisted:'Shortlisted',building:'Building',completed:'Completed',parked:'Parked'};
function names(value,key,limit){
 if(!Array.isArray(value)||value.length>limit)throw Error('Use up to '+limit+' '+key+'.');
 const seen=new Set(),result=[];
 for(const name of value){
  if(typeof name!=='string'||name.length>50||/[\u0000-\u001f\u007f,]/.test(name))throw Error('Each '+key+' name must be at most 50 characters, without commas or control characters.');
  const clean=name.trim().replace(/\s+/g,' '),signature=clean.toLowerCase();
  if(clean&&!seen.has(signature)){seen.add(signature);result.push(clean);}
 }
 return result;
}
export function organization(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid library organization.');
 if(typeof value.status!=='string'||!Object.hasOwn(libraryStatuses,value.status))throw Error('Choose a known project status.');
 return {tags:names(value.tags,'tag',12),collections:names(value.collections,'collection',5),status:value.status};
}
export function organizeIdea(state,id,value){
 if(typeof id!=='string'||!state.ideas.some(i=>i.id===id)&&!state.pins.some(p=>p.idea.id===id))throw Error('Concept not found.');
 const settings=organization(value);
 const updated=i=>i.id===id?{...i,organization:structuredClone(settings)}:i;
 return {...state,ideas:state.ideas.map(updated),pins:state.pins.map(p=>p.idea.id===id?{...p,idea:updated(p.idea)}:p)};
}
