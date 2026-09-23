import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});
Deno.serve(async(req:Request)=>{if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});try{
 const auth=req.headers.get("Authorization");if(!auth)return json({error:"Authentication required."},401);
 const body=await req.json().catch(()=>({}));const estimateId=String(body.estimate_id??"").trim();if(!estimateId)return json({error:"estimate_id is required."},400);
 const url=Deno.env.get("SUPABASE_URL"),anon=Deno.env.get("SUPABASE_ANON_KEY"),service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");if(!url||!anon||!service)throw new Error("Supabase service configuration is missing.");
 const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});const {data:{user},error:userError}=await userClient.auth.getUser();if(userError||!user)return json({error:"Authenticated user could not be verified."},401);
 const db=createClient(url,service,{auth:{persistSession:false}});
 const {data:profile,error:profileError}=await db.from("profiles").select("shop_id,role").eq("id",user.id).maybeSingle();if(profileError)throw profileError;if(!profile?.shop_id)return json({error:"User is not associated with a shop."},403);
 const {data:estimate,error:estimateError}=await db.from("estimates").select("id,shop_id,repair_order_id,subtotal,tax,discount,total,status,customer_approved,approval_date").eq("id",estimateId).eq("shop_id",profile.shop_id).maybeSingle();if(estimateError)throw estimateError;if(!estimate)return json({error:"Estimate not found."},404);
 if(!estimate.customer_approved)return json({error:"Estimate must be customer-approved before invoicing."},409);
 const {data:ro,error:roLookupError}=await db.from("repair_orders").select("id,customer_id,status").eq("id",estimate.repair_order_id).eq("shop_id",profile.shop_id).maybeSingle();if(roLookupError)throw roLookupError;if(!ro)return json({error:"Repair Order not found."},404);
 const {data:existing,error:existingError}=await db.from("invoices").select("id,status,total,amount_paid,balance_due").eq("repair_order_id",estimate.repair_order_id).eq("shop_id",profile.shop_id).maybeSingle();if(existingError)throw existingError;if(existing)return json({invoice:existing,created:false,message:"Invoice already exists for this Repair Order."});
 const total=Math.max(Number(estimate.total)||0,0);
 const {data:invoice,error:invoiceError}=await db.from("invoices").insert({shop_id:profile.shop_id,repair_order_id:estimate.repair_order_id,customer_id:ro.customer_id,subtotal:Math.max(Number(estimate.subtotal)||0,0),tax:Math.max(Number(estimate.tax)||0,0),discount:Math.max(Number(estimate.discount)||0,0),total,amount_paid:0,balance_due:total,status:"Open"}).select("id,repair_order_id,customer_id,subtotal,tax,discount,total,amount_paid,balance_due,status").single();if(invoiceError)throw invoiceError;
 const {error:roError}=await db.from("repair_orders").update({status:"Approved",authorized_at:estimate.approval_date||new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",estimate.repair_order_id).eq("shop_id",profile.shop_id);if(roError){await db.from("invoices").delete().eq("id",invoice.id).eq("shop_id",profile.shop_id);throw roError;}
 return json({invoice,created:true});
}catch(error){return json({error:error instanceof Error?error.message:"Invoice creation failed."},500)}});