import {startModel,stopModel,model} from './engine.mjs';
try {
 await startModel();
 console.log('Downloading '+model+' (no generation)…');
 const r=await fetch('http://127.0.0.1:11435/api/pull',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:true})});
 if(!r.ok)throw Error('Model download returned HTTP '+r.status);
 const reader=r.body.getReader();const decoder=new TextDecoder();let pending='',last=0,success=false;
 while(true){
 const {done,value}=await reader.read();if(done)break;
 pending+=decoder.decode(value,{stream:true});
 const lines=pending.split('\n');pending=lines.pop();
 for(const line of lines){
 if(!line.trim())continue;
 const d=JSON.parse(line);if(d.error)throw Error(d.error);
 if(d.status==='success'){success=true;console.log('Local model download complete.');}
 else if(Date.now()-last>20000){last=Date.now();console.log(d.status+(d.total?' '+Math.round(100*(d.completed||0)/d.total)+'%':''));}
 }
 }
 if(!success)throw Error('Download did not report success.');
}finally{await stopModel();}

