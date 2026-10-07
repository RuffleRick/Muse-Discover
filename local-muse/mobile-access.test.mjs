import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {createPairing,createMobileAccess} from './mobile-access.mjs';
import {occupied,startTunnel} from './mobile-network.mjs';
import {EventEmitter} from 'node:events';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
test('Serve runs hidden in foreground and stops only its owned process',async()=>{
 const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.exitCode=null;child.kill=()=>{child.exitCode=0;child.emit('exit',0);};let launchArgs;
 const tunnel=await startTunnel({getStatus:async()=>({installed:true,connected:true,hostname:'muse.example.ts.net'}),command:async()=>({stdout:'{}'}),launch:(...args)=>{launchArgs=args;queueMicrotask(()=>child.stdout.emit('data','Available within your tailnet: Press Ctrl+C to exit.'));return child;}});
 assert.deepEqual(launchArgs[1],['serve','--https=8443','http://127.0.0.1:3009']);assert.equal(launchArgs[2].windowsHide,true);assert.equal(tunnel.url,'https://muse.example.ts.net:8443');await tunnel.stop();assert.equal(child.exitCode,0);
});
test('phone Disconnect logs out the phone without stopping the PC',async()=>{
 const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false,disabled:false,addEventListener(){}});return elements.get(id);};let route,reloaded=0;
 const context=vm.createContext({document:{getElementById:element},location:{hostname:'muse.example.ts.net',reload(){reloaded++;}},setInterval(){},clearInterval(){},fetch:async path=>{if(path==='/api/state')return new Promise(()=>{});route=path;return {ok:true,status:200,json:async()=>({})};}});
 vm.runInContext(await readFile(new URL('./public/app.js',import.meta.url),'utf8'),context);
 assert.equal(element('mobileTools').hidden,true);assert.equal(element('stop').textContent,'Disconnect phone');await element('stop').onclick();assert.equal(route,'/api/mobile/logout');assert.equal(reloaded,1);
});
test('tunnel setup refuses occupied ports and existing public sharing',()=>{
 assert.equal(occupied({TCP:{443:{HTTPS:true}}}),false);
 assert.equal(occupied({TCP:{8443:{HTTPS:true}}}),true);
 assert.equal(occupied({Foreground:{abc:{TCP:{8443:{HTTPS:true}}}}}),true);
 assert.equal(occupied({AllowFunnel:{'machine.example.ts.net:443':true}}),true);
});
test('pairing codes are single-use and sessions expire or revoke',()=>{
 let time=1;const pair=createPairing(()=>time),code=pair.rotate();assert.match(code,/^[A-Z2-9]{10}$/);
 assert.throws(()=>pair.pair('wrong','a'),/incorrect/);
 const token=pair.pair(code.toLowerCase(),'a');assert.equal(pair.authorized(token),true);assert.equal(pair.status().code,null);
 assert.throws(()=>pair.pair(code,'b'),/incorrect/);
 pair.rotate();assert.equal(pair.authorized(token),true);time+=12*60*60*1000;assert.equal(pair.authorized(token),false);assert.equal(pair.status().sessions,0);
 pair.rotate();time+=10*60*1000;assert.throws(()=>pair.pair(pair.status().code,'a'),/expired/);
 const next=pair.pair(pair.rotate(),'a');pair.revoke();assert.equal(pair.authorized(next),false);assert.equal(pair.status().code,null);
});
test('pairing guesses are bounded and reset only after the cooldown',()=>{
 let time=1;const pair=createPairing(()=>time);const code=pair.rotate();
 for(let i=0;i<5;i++)assert.throws(()=>pair.pair('wrong','a'),/incorrect/);
 assert.throws(()=>pair.pair(code,'a'),/Too many/);time+=10*60*1000;
 assert.ok(pair.pair(pair.rotate(),'a'));pair.logout('invalid');
});
function request(port,route,headers={},body){return new Promise((resolve,reject)=>{
 const req=http.request({hostname:'127.0.0.1',port,path:route,method:body===undefined?'GET':'POST',headers:{Host:'muse.example.ts.net:8443',...headers}},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text}));});req.on('error',reject);if(body!==undefined)req.write(JSON.stringify(body));req.end();
});}
test('gateway pairs before exposing data, protects administration, and rewrites trusted proxy headers',async()=>{
 const upstream=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({route:req.url,host:req.headers.host,origin:req.headers.origin,forwarded:req.headers['x-forwarded-host']}));});
 await new Promise(resolve=>upstream.listen(0,'127.0.0.1',resolve));
 const reserve=http.createServer();await new Promise(resolve=>reserve.listen(0,'127.0.0.1',resolve));const port=reserve.address().port;await new Promise(resolve=>reserve.close(resolve));
 let stopped=0,exit;
 const gateway=createMobileAccess(fileURLToPath(new URL('.',import.meta.url)),{port,appPort:upstream.address().port,getNetwork:async()=>({installed:true,connected:true}),openTunnel:async()=>({url:'https://muse.example.ts.net:8443',onExit:fn=>exit=fn,stop:async()=>{stopped++;}})});
 try{
 assert.equal(gateway.enabled(),false);assert.equal((await gateway.status()).enabled,false);const state=await gateway.enable();assert.equal(gateway.enabled(),true);
 assert.equal((await request(port,'/api/state')).status,401);
 assert.match((await request(port,'/')).text,/One-time pairing code/);
 assert.equal((await request(port,'/api/state',{Host:'evil.example'})).status,403);
 const post={Origin:'https://muse.example.ts.net:8443','Content-Type':'application/json'};
 assert.equal((await request(port,'/pair',{'Content-Type':'application/json'},{code:state.code})).status,403);
 const paired=await request(port,'/pair',post,{code:state.code});assert.equal(paired.status,200);assert.match(paired.headers['set-cookie'][0],/HttpOnly; Secure; SameSite=Strict/);
 const Cookie=paired.headers['set-cookie'][0].split(';')[0];
 const response=await request(port,'/api/state',{Cookie,'X-Forwarded-Host':'evil.example'});assert.equal(response.status,200);assert.equal(JSON.parse(response.text).host,'127.0.0.1:'+upstream.address().port);assert.equal(JSON.parse(response.text).forwarded,undefined);
 for(const route of ['/api/stop','/api/mobile','/api/mobile/enable'])assert.equal((await request(port,route,{Cookie,...post},{})).status,403);
 assert.equal((await request(port,'/api/pin',{Cookie,...post,Origin:'https://evil.example'},{})).status,403);
 assert.equal(JSON.parse((await request(port,'/api/pin',{Cookie,...post},{})).text).origin,'http://127.0.0.1:'+upstream.address().port);
 assert.equal((await request(port,'/data/library.json',{Cookie})).status,404);
 await gateway.enable();assert.equal((await request(port,'/api/state',{Cookie})).status,200);
 assert.equal((await request(port,'/api/mobile/logout',{Cookie,...post},{})).status,200);
 assert.equal((await request(port,'/api/state',{Cookie})).status,401);
 await gateway.disable();assert.equal(stopped,1);assert.equal(gateway.enabled(),false);assert.equal((await gateway.status()).enabled,false);
 await assert.rejects(request(port,'/api/state'));
 await gateway.enable();exit();assert.equal((await gateway.status()).enabled,false);assert.equal((await gateway.status()).sessions,0);
 }finally{await gateway.disable();upstream.closeAllConnections();await new Promise(resolve=>upstream.close(resolve));}
});
test('failed network setup leaves access off',async()=>{
 const gateway=createMobileAccess('.', {getNetwork:async()=>({installed:false}),openTunnel:async()=>{throw Error('Not signed in');}});
 await assert.rejects(gateway.enable(),/Not signed in/);assert.equal((await gateway.status()).enabled,false);
});
