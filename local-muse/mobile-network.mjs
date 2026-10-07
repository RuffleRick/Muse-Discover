import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {access} from 'node:fs/promises';
const run=promisify(execFile);
const executable='C:\\Program Files\\Tailscale\\tailscale.exe';
export function occupied(config){
 if(!config||typeof config!=='object')return false;
 if(config.TCP?.['8443']||Object.values(config.AllowFunnel||{}).some(Boolean))return true;
 return Object.values(config.Foreground||{}).some(occupied);
}
export async function networkStatus(){
 try{await access(executable);}catch{return {installed:false,connected:false};}
 try{const {stdout}=await run(executable,['status','--json'],{windowsHide:true,timeout:5000,maxBuffer:1024*1024});const state=JSON.parse(stdout);const hostname=state.Self?.DNSName?.replace(/\.$/,'');return {installed:true,connected:state.BackendState==='Running'&&!!hostname,hostname};}
 catch{return {installed:true,connected:false};}
}
export async function startTunnel({getStatus=networkStatus,command=run,launch=spawn}={}){
 const state=await getStatus();
 if(!state.connected)throw Error(state.installed?'Sign in to Tailscale on this PC, then try again.':'Install Tailscale on the PC and phone, then sign in to the same account.');
 if(!/^[a-z0-9][a-z0-9.-]*\.ts\.net$/i.test(state.hostname))throw Error('Tailscale did not provide a valid private hostname.');
 const {stdout}=await command(executable,['serve','status','--json'],{windowsHide:true,timeout:5000});
 const config=JSON.parse(stdout);
 if(occupied(config))throw Error('An existing Tailscale service uses port 8443 or public Funnel is enabled. Muse will not change that setup.');
 const child=launch(executable,['serve','--https=8443','http://127.0.0.1:3009'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 let output='';
 await new Promise((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);child.removeListener('error',fail);child.removeListener('exit',earlyExit);};
  const fail=e=>{cleanup();child.kill();reject(e);};
  const earlyExit=()=>fail(Error('Tailscale Serve could not start. Enable HTTPS in your Tailscale account, then retry.'));
  const timer=setTimeout(()=>fail(Error('Tailscale HTTPS needs setup. Open Tailscale HTTPS settings, enable HTTPS certificates, then retry.')),12000);
  child.once('error',fail);child.once('exit',earlyExit);
  const observe=chunk=>{output=(output+chunk).slice(-8000);if(output.includes('Ctrl+C')){cleanup();resolve();}};
  child.stdout.on('data',observe);child.stderr.on('data',observe);
 });
 return {url:'https://'+state.hostname+':8443',stop:async()=>{if(child.exitCode!==null)return;await new Promise(resolve=>{child.once('exit',resolve);child.kill();setTimeout(resolve,2000).unref();});},onExit:fn=>child.once('exit',fn)};
}
