import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 try{
  const body=await req.json().catch(()=>({}));
  const repairOrderId=String(body.repair_order_id??"").trim();
  const items=Array.isArray(body.items)?body.items.slice(0,30):[];
  if(!repairOrderId)return json({error:"repair_order_id is required."},400);
  if(!items.length)return json({error:"At least one estimate item is required."},400);
  const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key)throw new Error("Supabase service configuration is missing.");
  const db=createClient(url,key,{auth:{persistSession:false}});
  const {data:ro,error:roError}=await db.from("repair_orders").select("id,shop_id").eq("id",repairOrderId).maybeSingle();
  if(roError)throw roError;if(!ro)return json({error:"Repair order not found."},404);
  let {data:estimate,error:estimateError}=await db.from("estimates").select("id,shop_id,repair_order_id,status").eq("repair_order_id",repairOrderId).maybeSingle();
  if(estimateError)throw estimateError;
  if(!estimate){const {data:created,error}=await db.from("estimates").insert({shop_id:ro.shop_id,repair_order_id:repairOrderId,subtotal:0,parts_total:0,labor_total:0,shop_supplies:0,tax:0,discount:0,total:0,status:"draft",customer_approved:false}).select("id,shop_id,repair_order_id,status").single();if(error)throw error;estimate=created;}
  const nums=items.map((x:any)=>String(x.part_number??"").trim()).filter(Boolean);
  const {data:catalog,error:catalogError}=nums.length?await db.from("parts").select("id,part_number,name,price,supplier,availability").eq("shop_id",ro.shop_id).in("part_number",nums):{data:[],error:null};
  if(catalogError)throw catalogError;
  const byNum=new Map((catalog??[]).map((p:any)=>[String(p.part_number).trim(),p]));
  const rows=items.map((x:any)=>{const n=String(x.part_number??"").trim(),p=byNum.get(n),q=Math.max(Number(x.quantity)||1,1),requested=Number(x.unit_price??x.price),price=Number.isFinite(requested)&&requested>0?requested:Math.max(Number(p?.price)||0,0);return{estimate_id:estimate!.id,item_type:x.item_type||"part",description:String(x.description??x.part_name??p?.name??"Diagnostic recommended part").trim(),part_number:n||null,part_id:p?.id??null,quantity:q,unit_cost:Math.max(Number(x.unit_cost??p?.price)||0,0),unit_price:price,labor_hours:Number(x.labor_hours)||0,labor_rate:Number(x.labor_rate)||0,taxable:x.taxable!==false,total:q*price};});
  const {data:inserted,error:itemError}=await db.from("estimate_items").insert(rows).select("id,description,part_number,part_id,quantity,unit_cost,unit_price,total");if(itemError)throw itemError;
  const {data:all,error:allError}=await db.from("estimate_items").select("item_type,total").eq("estimate_id",estimate.id);if(allError)throw allError;
  const partsTotal=(all??[]).filter((x:any)=>x.item_type==="part").reduce((s:number,x:any)=>s+Number(x.total||0),0),laborTotal=(all??[]).filter((x:any)=>x.item_type==="labor").reduce((s:number,x:any)=>s+Number(x.total||0),0),subtotal=partsTotal+laborTotal;
  const {error:updateError}=await db.from("estimates").update({parts_total:partsTotal,labor_total:laborTotal,subtotal,total:subtotal,updated_at:new Date().toISOString()}).eq("id",estimate.id);if(updateError)throw updateError;
  return json({estimate_id:estimate.id,repair_order_id:repairOrderId,inserted_items:inserted??[],catalog_matches:catalog??[],catalog_match_count:catalog?.length??0,parts_total:partsTotal,labor_total:laborTotal,subtotal,total:subtotal});
 }catch(error){return json({error:error instanceof Error?error.message:"Repair-order estimate conversion failed."},500);}
});
