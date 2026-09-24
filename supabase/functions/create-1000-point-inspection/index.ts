import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 const auth=req.headers.get("Authorization")||"";
 if(!auth.startsWith("Bearer ")) return json({error:"Authentication required."},401);
 try{
  const body=await req.json().catch(()=>({})); const roId=String(body.repair_order_id||"").trim(); if(!roId)return json({error:"repair_order_id is required."},400);
  const url=Deno.env.get("SUPABASE_URL")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db=createClient(url,service,{auth:{persistSession:false}});
  const {data:{user},error:ue}=await db.auth.getUser(auth.slice(7)); if(ue||!user)return json({error:"Authenticated user could not be verified."},401);
  const {data:p,error:pe}=await db.from("profiles").select("shop_id,active").eq("id",user.id).maybeSingle(); if(pe)throw pe;
  if(!p?.active||!p.shop_id)return json({error:"Active shop membership is required."},403);
  const {data:ro,error:re}=await db.from("repair_orders").select("id,shop_id,vehicle_id,technician_id").eq("id",roId).eq("shop_id",p.shop_id).maybeSingle(); if(re)throw re;if(!ro)return json({error:"Repair Order not found."},404);
  const {data:existing}=await db.from("inspections").select("id").eq("repair_order_id",roId).order("created_at",{ascending:false}).limit(1);
  let inspectionId=existing?.[0]?.id;
  if(!inspectionId){const {data:i,error:ie}=await db.from("inspections").insert({shop_id:p.shop_id,repair_order_id:roId,technician_id:ro.technician_id||user.id,inspection_date:new Date().toISOString()}).select("id").single();if(ie)throw ie;inspectionId=i.id;}
  const {data:tid,error:te}=await db.rpc("ensure_1000_point_inspection_template",{p_shop_id:p.shop_id});if(te)throw te;
  const {data:items,error:ite}=await db.from("inspection_template_items").select("sequence,category,item").eq("template_id",tid).order("sequence");
  if(ite)throw ite;if((items?.length||0)!==1000)return json({error:`Inspection template verification failed: expected 1000 points, found ${items?.length||0}.`},500);
  await db.from("inspection_items").delete().eq("inspection_id",inspectionId);
  const rows=items.map((x:any)=>({shop_id:p.shop_id,inspection_id:inspectionId,category:x.category,item:x.item,result:"not_checked",measurement:null,notes:null}));
  for(let i=0;i<rows.length;i+=200){const {error}=await db.from("inspection_items").insert(rows.slice(i,i+200));if(error)throw error;}
  return json({inspection_id:inspectionId,template_id:tid,point_count:1000,status:"ready"});
 }catch(e){return json({error:e instanceof Error?e.message:"Unable to create the 1,000-point inspection."},500)}
});