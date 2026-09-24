import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const vinOk=(v:string)=>/^[A-HJ-NPR-Z0-9]{17}$/.test(v);
Deno.serve(async req=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 try{
  const auth=req.headers.get("Authorization")||""; if(!auth.startsWith("Bearer ")) return json({error:"Authentication required."},401);
  const body=await req.json().catch(()=>({})); const vehicleId=String(body.vehicle_id||"").trim();
  if(!vehicleId) return json({error:"vehicle_id is required."},400);
  const url=Deno.env.get("SUPABASE_URL"), service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), apiUrl=Deno.env.get("CARFAX_API_URL"), apiKey=Deno.env.get("CARFAX_API_KEY");
  if(!url||!service) throw new Error("Supabase configuration is missing.");
  const db=createClient(url,service,{auth:{persistSession:false}});
  const {data:{user},error:ue}=await db.auth.getUser(auth.slice(7)); if(ue||!user) return json({error:"Authenticated user could not be verified."},401);
  const {data:profile,error:pe}=await db.from("profiles").select("shop_id,active").eq("id",user.id).maybeSingle(); if(pe) throw pe;
  if(!profile?.active||!profile.shop_id) return json({error:"Active shop membership is required."},403);
  const {data:v,error:ve}=await db.from("vehicles").select("id,shop_id,vin,year,make,model").eq("id",vehicleId).eq("shop_id",profile.shop_id).maybeSingle(); if(ve) throw ve;
  if(!v) return json({error:"Vehicle not found."},404);
  const vin=String(v.vin||"").trim().toUpperCase(); if(!vinOk(vin)) return json({error:"A valid 17-character VIN is required before requesting vehicle history."},400);
  if(!apiUrl||!apiKey) return json({status:"unavailable",provider:"CARFAX",message:"CARFAX business credentials are not configured. SERVIAUTO is ready for the licensed CARFAX endpoint, but no report is requested without credentials."},503);
  const endpoint=new URL(apiUrl); endpoint.searchParams.set("vin",vin);
  const response=await fetch(endpoint,{headers:{Accept:"application/json",Authorization:`Bearer ${apiKey}`}});
  const text=await response.text(); let payload:any; try{payload=JSON.parse(text)}catch{payload={raw:text}};
  if(!response.ok) return json({status:"error",provider:"CARFAX",message:"CARFAX provider request failed.",provider_status:response.status},502);
  const summary=payload?.summary??payload?.vehicle??{}; const events=Array.isArray(payload?.events)?payload.events:(Array.isArray(payload?.history)?payload.history:[]);
  const reportUrl=typeof payload?.report_url==="string"?payload.report_url:null;
  const {data:report,error:re}=await db.from("vehicle_history_reports").upsert({shop_id:profile.shop_id,vehicle_id:vehicleId,provider:"CARFAX",vin,report_status:"available",fetched_at:new Date().toISOString(),report_url:reportUrl,summary,events,raw_response:payload,error_message:null,updated_at:new Date().toISOString()},{onConflict:"vehicle_id,provider"}).select("id,provider,vin,report_status,fetched_at,report_url,summary,events").single();
  if(re) throw re; return json({status:"available",report});
 }catch(e){return json({error:e instanceof Error?e.message:"CARFAX history request failed."},500)}
});