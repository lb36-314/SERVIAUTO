import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const vin = String(body.vin ?? "").trim().toUpperCase();
    const make = String(body.make ?? "").trim();
    const model = String(body.model ?? "").trim();
    const year = Number(body.year) || null;
    const engine = String(body.engine ?? "").trim();
    const system = String(body.system ?? "").trim();

    if (!make || !model) {
      return new Response(JSON.stringify({ error: "Vehicle make and model are required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service configuration is missing.");
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    let query = db.from("repair_procedures")
      .select("id,year_from,year_to,make,model,engine,system,part_name,part_number,summary,source")
      .ilike("make", make)
      .ilike("model", model)
      .limit(50);

    if (year) query = query.or(`year_from.is.null,year_from.lte.${year}`);
    if (system) query = query.ilike("system", `%${system}%`);
    if (engine) query = query.or(`engine.is.null,engine.ilike.%${engine}%`);

    const { data, error } = await query;
    if (error) throw error;

    const procedures = (data ?? []).filter((row: any) => {
      if (!year) return true;
      return (!row.year_from || row.year_from <= year) && (!row.year_to || row.year_to >= year);
    });

    return new Response(JSON.stringify({
      vin: vin || null,
      vehicle: { year, make, model, engine: engine || null },
      matches: procedures,
      count: procedures.length,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Vehicle intelligence lookup failed." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
