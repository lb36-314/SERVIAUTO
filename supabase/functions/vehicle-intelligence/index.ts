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

const normalizeVin = (value: unknown) => String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
const isValidVin = (value: string) => value.length === 17 && !/[IOQ]/.test(value);
const normalizeCode = (value: unknown) => String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const vin = normalizeVin(body.vin);
    const make = String(body.make ?? "").trim();
    const model = String(body.model ?? "").trim();
    const year = Number(body.year) || null;
    const engine = String(body.engine ?? "").trim();
    const system = String(body.system ?? "").trim();
    const symptom = String(body.symptom ?? "").trim();
    const requestedCodes = Array.isArray(body.codes)
      ? Array.from(new Set(body.codes.map(normalizeCode).filter(Boolean))).slice(0, 30)
      : [];

    if (!make || !model) return json({ error: "Vehicle make and model are required." }, 400);
    if (vin && !isValidVin(vin)) return json({ error: "VIN must be 17 characters and may not contain I, O, or Q.", vin_valid: false }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service configuration is missing.");

    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    let query = db.from("repair_procedures")
      .select("id,year_from,year_to,make,model,engine,system,part_name,part_number,summary,source")
      .ilike("make", make)
      .ilike("model", model)
      .limit(100);

    if (year) query = query.or(`year_from.is.null,year_from.lte.${year}`);
    if (system) query = query.ilike("system", `%${system}%`);
    if (engine) query = query.or(`engine.is.null,engine.ilike.%${engine}%`);

    const { data, error } = await query;
    if (error) throw error;

    const procedures = (data ?? []).filter((row: any) => {
      if (!year) return true;
      return (!row.year_from || row.year_from <= year) && (!row.year_to || row.year_to >= year);
    });

    const codeMatches = requestedCodes.length
      ? procedures.filter((row: any) => {
          const haystack = `${row.system ?? ""} ${row.part_name ?? ""} ${row.summary ?? ""}`.toUpperCase();
          return requestedCodes.some((code) => haystack.includes(code));
        })
      : [];

    const rankedMatches = procedures.map((row: any) => {
      const haystack = `${row.system ?? ""} ${row.part_name ?? ""} ${row.summary ?? ""}`.toUpperCase();
      const matchedCodes = requestedCodes.filter((code) => haystack.includes(code));
      const symptomMatch = symptom && haystack.includes(symptom.toUpperCase());
      const score = (matchedCodes.length * 10) + (symptomMatch ? 5 : 0) + (row.part_number ? 1 : 0);
      return { ...row, matched_codes: matchedCodes, symptom_match: Boolean(symptomMatch), relevance_score: score };
    }).filter((row: any) => row.relevance_score > 0).sort((a: any, b: any) => b.relevance_score - a.relevance_score);

    const recommendedParts = rankedMatches
      .filter((row: any) => row.part_name || row.part_number)
      .slice(0, 20)
      .map((row: any) => ({ part_name: row.part_name, part_number: row.part_number, system: row.system, summary: row.summary, relevance_score: row.relevance_score }));

    return json({
      vin: vin || null,
      vin_valid: vin ? isValidVin(vin) : null,
      vehicle: { year, make, model, engine: engine || null },
      codes: requestedCodes,
      symptom: symptom || null,
      matches: procedures,
      code_matches: codeMatches,
      ranked_matches: rankedMatches.slice(0, 50),
      recommended_parts: recommendedParts,
      count: procedures.length,
      code_match_count: codeMatches.length,
      ranked_match_count: rankedMatches.length,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Vehicle intelligence lookup failed." }, 500);
  }
});
