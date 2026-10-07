import {randomUUID} from 'node:crypto';
import {categories} from './core.mjs';
export function personalIdea(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Enter your idea details.');
 function field(key,max,required=false){const v=value[key]??'';if(typeof v!=='string'||v.length>max)throw Error('Invalid or oversized '+key+'.');const clean=v.trim();if(required&&!clean)throw Error('Enter a '+key+'.');return clean;}
 const name=field('name',140,true),pitch=field('pitch',2000,true);
 if(pitch.length<20)throw Error('Describe your idea in at least 20 characters so Muse has enough to explore.');
 if(!categories.slice(1).includes(value.category))throw Error('Choose an idea category.');
 const twist=field('twist',600)||'Explore a useful twist while preserving the core idea.';
 const audience=field('audience',300)||'To be decided while exploring this idea.';
 const supplied=field('features',1504).split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
 if(supplied.length>3||supplied.some(v=>v.length>500))throw Error('Enter up to three features, one per line, at most 500 characters each.');
 const defaults=['Build the core interaction described in the idea.','Add clear feedback and a simple way to try it.','Test one complete small example.'];
 const features=[...supplied,...defaults.slice(supplied.length)].slice(0,3);
 const id=randomUUID(),generatedAt=new Date().toISOString();
 const excerpt='Concept: '+pitch+'\nTwist: '+twist+'\nAudience: '+audience+'\nFirst version:\n'+features.join('\n')+'\nName: '+name+'\nPersonal brainstorming brief supplied by the owner, not public research or evidence of demand.';
 const source={id:'brief-'+id,kind:'user-brief',title:'Your idea: '+name,excerpt,site:'Personal brief',author:'You',retrievedAt:generatedAt};
 return {id,family:id,parentId:null,name,category:value.category,pitch,twist,audience,features,validation:'Try the core interaction with a small example and check whether it provides the intended benefit.',evidence:'Your own brainstorming brief. No public research has been collected for this starting idea.',sources:[source],generatedAt,mode:'user-authored'};
}
