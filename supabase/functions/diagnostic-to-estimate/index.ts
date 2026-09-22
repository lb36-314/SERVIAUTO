import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const repairOrderId = String(body.repair_order_id ?? "").trim();
    const parts = Array.isArray(body.parts) ? body.parts.slice(0, 30) : [];

    if (!repairOrderId) return json({ error: "repair_order_id is required." }, 400);
    if (!parts.length) return json({ error: "At least one diagnostic part is required." }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service configuration is missing.");

    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const { data: ro, error: roError } = await db
      .from("repair_orders")
      .select("id,shop_id")
      .eq("id", repairOrderId)
      .maybeSingle();
    if (roError) throw roError;
    if (!ro) return json({ error: "Repair order not found." }, 404);

    let { data: estimate, error: estimateError } = await db
      .from("estimates")
      .select("id,shop_id,repair_order_id,status")
      .eq("repair_order_id", repairOrderId)
      .maybeSingle();
    if (estimateError) throw estimateError;

    if (!estimate) {
      const { data: created, error: createError } = await db
        .from("estimates")
        .insert({
          shop_id: ro.shop_id,
          repair_order_id: repairOrderId,
          subtotal: 0,
          parts_total: 0,
          labor_total: 0,
          shop_supplies: 0,
          tax: 0,
          discount: 0,
          total: 0,
          status: "draft",
          customer_approved: false,
        })
        .select("id,shop_id,repair_order_id,status")
        .single();
      if (createError) throw createError;
      estimate = created;
    }

    const partNumbers = parts
      .map((part: any) => String(part.part_number ?? "").trim())
      .filter(Boolean);
    const { data: catalogParts, error: catalogError } = partNumbers.length
      ? await db.from("parts").select("id,part_number,name,price,supplier,availability").eq("shop_id", ro.shop_id).in("part_number", partNumbers)
      : { data: [], error: null };
    if (catalogError) throw catalogError;

    const catalogByNumber = new Map((catalogParts ?? []).map((part: any) => [String(part.part_number).trim(), part]));
    const rows = parts.map((part: any) => {
      const partNumber = String(part.part_number ?? "").trim();
      const catalog = catalogByNumber.get(partNumber);
      const quantity = Math.max(Number(part.quantity) || 1, 1);
      // Price is sourced from the shop catalog. Client-supplied prices are ignored
      // so a diagnostic request cannot tamper with estimate pricing.
      const unitPrice = Math.max(Number(catalog?.price) || 0, 0);
      return {
        estimate_id: estimate.id,
        item_type: "part",
        description: String(part.part_name ?? part.description ?? catalog?.name ?? "Diagnostic recommended part").trim(),
        part_number: partNumber || null,
        part_id: catalog?.id ?? null,
        quantity,
        unit_cost: unitPrice,
        unit_price: unitPrice,
        labor_hours: 0,
        labor_rate: 0,
        taxable: part.taxable !== false,
        total: quantity * unitPrice,
      };
    });

    const { data: inserted, error: itemError } = await db
      .from("estimate_items")
      .insert(rows)
      .select("id,description,part_number,part_id,quantity,unit_cost,unit_price,total");
    if (itemError) throw itemError;

    const { data: allItems, error: allItemsError } = await db
      .from("estimate_items")
      .select("item_type,quantity,unit_price,total")
      .eq("estimate_id", estimate.id);
    if (allItemsError) throw allItemsError;

    const partsTotal = (allItems ?? []).filter((x: any) => x.item_type === "part").reduce((sum: number, x: any) => sum + Number(x.total || 0), 0);
    const laborTotal = (allItems ?? []).filter((x: any) => x.item_type === "labor").reduce((sum: number, x: any) => sum + Number(x.total || 0), 0);
    const subtotal = partsTotal + laborTotal;

    const { error: updateError } = await db
      .from("estimates")
      .update({ parts_total: partsTotal, labor_total: laborTotal, subtotal, total: subtotal, updated_at: new Date().toISOString() })
      .eq("id", estimate.id);
    if (updateError) throw updateError;

    return json({
      estimate_id: estimate.id,
      repair_order_id: repairOrderId,
      inserted_items: inserted ?? [],
      catalog_matches: catalogParts ?? [],
      catalog_match_count: catalogParts?.length ?? 0,
      parts_total: partsTotal,
      labor_total: laborTotal,
      subtotal,
      total: subtotal,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Diagnostic-to-estimate conversion failed." }, 500);
  }
});
