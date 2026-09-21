import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const normalizeVin = (value: unknown) => String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
const isValidVin = (value: string) => value.length === 17 && !/[IOQ]/.test(value);
const normalizeCode = (value: unknown) => String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
const isValidDtc = (value: string) => /^[PBCU][0-9]{4}$/.test(value);

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
    const rawCodes = Array.isArray(body.codes) ? body.codes.map(normalizeCode).filter(Boolean) : [];
    const invalidCodes = Array.from(new Set(rawCodes.filter((code) => !isValidDtc(code))));
    const requestedCodes = Array.from(new Set(rawCodes.filter(isValidDtc))).slice(0, 30);
    if (!make || !model) return json({ error: "Vehicle make and model are required." }, 400);
    if (vin && !isValidVin(vin)) return json({ error: "VIN must be 17 characters and may not contain I, O, or Q.", vin_valid: false }, 400);
    if (invalidCodes.length) return json({ error: "One or more DTCs are invalid. Use a 5-character OBD-II code such as P0420.", invalid_codes: invalidCodes, codes: requestedCodes }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service configuration is missing.");
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    let query = db.from("repair_procedures").select("id,year_from,year_to,make,model,engine,system,part_name,part_number,summary,source").ilike("make", make).ilike("model", model).limit(100);
    if (year) query = query.or(`year_from.is.null,year_from.lte.${year}`);
    if (system) query = query.ilike("system", `%${system}%`);
    if (engine) query = query.or(`engine.is.null,engine.ilike.%${engine}%`);
    const { data, error } = await query;
    if (error) throw error;
    const procedures = (data ?? []).filter((row: any) => !year || ((!row.year_from || row.year_from <= year) && (!row.year_to || row.year_to >= year)));

    const rankedMatches = procedures.map((row: any) => {
      const haystack = `${row.system ?? ""} ${row.part_name ?? ""} ${row.summary ?? ""} ${row.source ?? ""}`.toUpperCase();
      const matchedCodes = requestedCodes.filter((code) => haystack.includes(code));
      const symptomMatch = Boolean(symptom && haystack.includes(symptom.toUpperCase()));
      const reasons: string[] = [];
      if (matchedCodes.length) reasons.push(`DTC match: ${matchedCodes.join(", ")}`);
      if (symptomMatch) reasons.push("Symptom match");
      if (row.part_number) reasons.push("Part number available");
      if (year && row.year_from && row.year_to && year >= row.year_from && year <= row.year_to) reasons.push("Exact year range");
      if (engine && row.engine && String(row.engine).toUpperCase() === engine.toUpperCase()) reasons.push("Exact engine match");
      const score = (matchedCodes.length * 10) + (symptomMatch ? 5 : 0) + (row.part_number ? 1 : 0) + (year && row.year_from && row.year_to && year >= row.year_from && year <= row.year_to ? 2 : 0) + (engine && row.engine && String(row.engine).toUpperCase() === engine.toUpperCase() ? 2 : 0);
      const confidence = Math.min(100, score * 5);
      return { ...row, matched_codes: matchedCodes, symptom_match: symptomMatch, relevance_score: score, confidence, match_reasons: reasons };
    }).filter((row: any) => row.relevance_score > 0).sort((a: any, b: any) => b.relevance_score - a.relevance_score);
    const codeMatches = requestedCodes.length ? rankedMatches.filter((row: any) => row.matched_codes.length > 0) : [];
    const recommendedParts = rankedMatches.filter((row: any) => row.part_name || row.part_number).slice(0, 20).map((row: any) => ({ part_name: row.part_name, part_number: row.part_number, system: row.system, summary: row.summary, relevance_score: row.relevance_score, confidence: row.confidence, match_reasons: row.match_reasons }));
    return json({ vin: vin || null, vin_valid: vin ? isValidVin(vin) : null, vehicle: { year, make, model, engine: engine || null }, codes: requestedCodes, symptom: symptom || null, matches: procedures, code_matches: codeMatches, ranked_matches: rankedMatches.slice(0, 50), recommended_parts: recommendedParts, count: procedures.length, code_match_count: codeMatches.length, ranked_match_count: rankedMatches.length });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Vehicle intelligence lookup failed." }, 500); }
});
