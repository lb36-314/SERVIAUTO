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
const vinTransliteration: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const vinWeights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const vinCheckDigit = (vin: string) => {
  if (!isValidVin(vin)) return null;
  let sum = 0;
  for (let i = 0; i < vin.length; i += 1) {
    const char = vin[i];
    const value = /[0-9]/.test(char) ? Number(char) : vinTransliteration[char];
    if (value === undefined) return null;
    sum += value * vinWeights[i];
  }
  const remainder = sum % 11;
  return remainder === 10 ? "X" : String(remainder);
};
const hasValidVinCheckDigit = (vin: string) => {
  const expected = vinCheckDigit(vin);
  return expected === null ? null : vin[8] === expected;
};
const getVinSegments = (vin: string) => vin.length === 17 ? {
  wmi: vin.slice(0, 3),
  vds: vin.slice(3, 9),
  check_digit: vin[8],
  model_year_code: vin[9],
  plant_code: vin[10],
  vis: vin.slice(11),
  serial_number: vin.slice(11),
} : null;
const normalizeCode = (value: unknown) => String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
const isValidDtc = (value: string) => /^[PBCU][0-9]{4}$/.test(value);

const decodeVinWithVpic = async (vin: string) => {
  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`);
    if (!response.ok) return null;
    const payload = await response.json();
    const result = payload?.Results?.[0];
    if (!result) return null;
    const value = (key: string) => String(result[key] ?? "").trim();
    return {
      source: "NHTSA vPIC",
      make: value("Make") || null,
      model: value("Model") || null,
      model_year: value("ModelYear") || null,
      trim: value("Trim") || null,
      series: value("Series") || null,
      engine: value("EngineModel") || value("EngineCylinders") || null,
      body_class: value("BodyClass") || null,
      drive_type: value("DriveType") || null,
      plant_country: value("PlantCountry") || null,
      manufacturer: value("Manufacturer") || null,
    };
  } catch {
    return null;
  }
};

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

    const vinCheckValid = vin ? hasValidVinCheckDigit(vin) : null;
    const vinSegments = vin ? getVinSegments(vin) : null;
    const vinDecode = vin && vinCheckValid ? await decodeVinWithVpic(vin) : null;
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
    return json({ vin: vin || null, vin_valid: vin ? isValidVin(vin) : null, vin_check_digit_valid: vinCheckValid, vin_segments: vinSegments, vin_decode: vinDecode, vehicle: { year, make, model, engine: engine || null }, codes: requestedCodes, symptom: symptom || null, matches: procedures, code_matches: codeMatches, ranked_matches: rankedMatches.slice(0, 50), recommended_parts: recommendedParts, count: procedures.length, code_match_count: codeMatches.length, ranked_match_count: rankedMatches.length });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Vehicle intelligence lookup failed." }, 500); }
});
