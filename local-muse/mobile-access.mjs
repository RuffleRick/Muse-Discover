import http from 'node:http';
import {randomBytes,randomInt,timingSafeEqual,createHash} from 'node:crypto';
import {networkStatus,startTunnel} from './mobile-network.mjs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const digest=s=>createHash('sha256').update(s).digest();
export function createPairing(now=()=>Date.now()){
 let code='',expires=0;const sessions=new Map(),attempts=new Map();
 return {
  rotate(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';code=Array.from({length:10},()=>alphabet[randomInt(alphabet.length)]).join('');expires=now()+10*60*1000;return code;},
  status(){for(const [token,until] of sessions)if(now()>=until)sessions.delete(token);return {code:now()<expires?code:null,expiresAt:expires,sessions:sessions.size};},
  pair(value,ip){
   let attempt=attempts.get(ip);if(!attempt||now()-attempt.since>=10*60*1000){attempt={since:now(),count:0};if(attempts.size>=100)throw Error('Too many pairing attempts. Disable and re-enable mobile access on the PC.');attempts.set(ip,attempt);}
   if(++attempt.count>5)throw Error('Too many attempts. Wait ten minutes before trying again.');
   if(!code||now()>=expires||!timingSafeEqual(digest(String(value||'').trim().toUpperCase()),digest(code)))throw Error('Pairing code is incorrect or expired. Generate a new code on the PC.');
   code='';expires=0;const token=randomBytes(32).toString('hex');sessions.set(token,now()+12*60*60*1000);return token;
  },
  authorized(token){const expires=sessions.get(token);if(!expires||now()>=expires){sessions.delete(token);return false;}return true;},
  logout(token){sessions.delete(token);},revoke(){code='';expires=0;sessions.clear();attempts.clear();}
 };
}
const cookie=req=>String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('muse_phone='))?.slice(11)||'';
export function createMobileAccess(root,{getNetwork=networkStatus,openTunnel=startTunnel,port=3009,appPort=3008}={}){
 const pairing=createPairing();let server=null,tunnel=null,address=null,changing=false;
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
 return {
  enabled(){return !!server&&!!tunnel;},
  async status(){return {enabled:!!server&&!!tunnel,url:tunnel?.url||null,network:await getNetwork(),...pairing.status()};},
  async enable(){
   if(changing)throw Error('Mobile setup is in progress.');
   changing=true;try{
   if(!server){
    tunnel=await openTunnel();address=new URL(tunnel.url).host;
    const gateway=http.createServer(async(req,res)=>{
     try{
      if(req.headers.host!==address||!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){json(res,403,{error:'Private phone access only.'});return;}
      const url=new URL(req.url,'https://'+address);
      if(req.method==='POST'&&(req.headers.origin!=='https://'+address||!req.headers['content-type']?.startsWith('application/json'))){json(res,403,{error:'Open Muse from its phone address.'});return;}
      if(url.pathname==='/pair'&&req.method==='POST'){
       let content='';for await(const chunk of req){content+=chunk;if(Buffer.byteLength(content)>1000)throw Error('Pairing request too large.');}
       const token=pairing.pair(JSON.parse(content).code,req.socket.remoteAddress);
       res.setHeader('Set-Cookie','muse_phone='+token+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200');json(res,200,{paired:true});return;
      }
      if(!pairing.authorized(cookie(req))){
       if(req.method==='GET'&&['/','/phone.js','/style.css'].includes(url.pathname)){
        const file=url.pathname==='/'?'phone.html':url.pathname.slice(1);
        res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'"});res.end(await readFile(path.join(root,'public',file)));return;
       }
       json(res,401,{error:'Pair this browser using the code shown on your PC.'});return;
      }
      if(url.pathname==='/api/mobile/logout'&&req.method==='POST'){
       pairing.logout(cookie(req));res.setHeader('Set-Cookie','muse_phone=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');json(res,200,{disconnected:true});return;
      }
      if(url.pathname.startsWith('/api/mobile')||url.pathname==='/api/stop'){json(res,403,{error:'Manage mobile access and stopping Muse from the PC.'});return;}
      // Forward only known app routes; never trust remote Host, Origin, or forwarding headers.
      const allowed=['/','/app.js','/style.css','/api/status','/api/state','/api/generate','/api/pin','/api/kit','/api/library/export','/api/library/backups','/api/library/import','/api/library/backup','/api/library/restore','/api/library/clear','/api/library/organize','/api/library/create'];
      if(!allowed.includes(url.pathname)||!['GET','POST'].includes(req.method)){json(res,404,{error:'Not found.'});return;}
      const proxy=http.request({hostname:'127.0.0.1',port:appPort,path:url.pathname,method:req.method,headers:{Host:'127.0.0.1:'+appPort,...(req.method==='POST'?{Origin:'http://127.0.0.1:'+appPort,'Content-Type':'application/json'}:{})}},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
      proxy.on('error',()=>{if(!res.headersSent)json(res,503,{error:'Muse on the PC is unavailable.'});else res.destroy();});req.on('aborted',()=>proxy.destroy());req.pipe(proxy);
     }catch(e){if(!res.headersSent)json(res,400,{error:e.message});else res.destroy();}
    });
    gateway.requestTimeout=30000;gateway.headersTimeout=15000;
    await new Promise((resolve,reject)=>{gateway.once('error',reject);gateway.listen(port,'127.0.0.1',resolve);});
    gateway.on('error',()=>{});server=gateway;tunnel.onExit(()=>{pairing.revoke();server?.closeAllConnections();server?.close();server=null;tunnel=null;address=null;});
   }
   pairing.rotate();return await this.status();
  }catch(e){await this.disable();throw e;}finally{changing=false;}
  },
  async disable(){pairing.revoke();const connection=tunnel;tunnel=null;if(connection)await connection.stop();const active=server;server=null;address=null;if(active){active.closeAllConnections();await new Promise(resolve=>active.close(resolve));}}
 };
}
