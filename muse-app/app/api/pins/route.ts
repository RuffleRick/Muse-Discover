import {pinsDb} from "../../../db/pins";
import {getChatGPTUser} from "../../chatgpt-auth";
import {conceptSchema} from "../../ideas";
import {z} from "zod";
export const dynamic="force-dynamic";
const inputSchema=z.object({idea:conceptSchema,note:z.string().max(2000).default("")});
function sameOrigin(req:Request){const origin=req.headers.get("Origin");return !origin||origin===new URL(req.url).origin;}
export async function GET(){
 const user=await getChatGPTUser();
 if(!user)return Response.json({error:"Sign in to load your pinned ideas."},{status:401});
 try{const d=await pinsDb().prepare("SELECT payload,note,created_at FROM muse_pins WHERE owner_id=? ORDER BY created_at DESC LIMIT 500").bind(user.userId).all<{payload:string;note:string;created_at:string}>();
 return Response.json({pins:d.results.map(r=>({idea:JSON.parse(r.payload),note:r.note,createdAt:r.created_at}))},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Pin load failed",e);return Response.json({error:"Your pins could not be loaded. Please try again."},{status:503})}
}
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:"Sign in to pin an idea."},{status:401});
 if(!sameOrigin(req))return Response.json({error:"Invalid request origin."},{status:403});
 try{const raw=await req.text();if(raw.length>65000)return Response.json({error:"Idea is too large."},{status:413});
 const parsed=inputSchema.safeParse(JSON.parse(raw));if(!parsed.success)return Response.json({error:"Please provide a valid idea and note."},{status:400});
 const {idea,note}=parsed.data;
 await pinsDb().prepare("INSERT INTO muse_pins (owner_id,idea_id,payload,note,created_at) VALUES (?,?,?,?,?) ON CONFLICT(owner_id,idea_id) DO UPDATE SET payload=excluded.payload,note=excluded.note").bind(user.userId,idea.id,JSON.stringify(idea),note,new Date().toISOString()).run();
 return Response.json({saved:true});
 }catch(e){if(e instanceof SyntaxError)return Response.json({error:"Invalid idea data."},{status:400});console.error("Pin save failed",e);return Response.json({error:"Pin was not saved. Your idea is still here; try again."},{status:503})}
}
export async function DELETE(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:"Sign in to change pins."},{status:401});
 if(!sameOrigin(req))return Response.json({error:"Invalid request origin."},{status:403});
 const id=new URL(req.url).searchParams.get("id");if(!id||id.length>100)return Response.json({error:"Invalid idea ID."},{status:400});
 try{await pinsDb().prepare("DELETE FROM muse_pins WHERE owner_id=? AND idea_id=?").bind(user.userId,id).run();return Response.json({removed:true})}
 catch(e){console.error("Unpin failed",e);return Response.json({error:"Could not unpin this idea. Please try again."},{status:503})}
}
