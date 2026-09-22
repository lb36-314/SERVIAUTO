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
const getModelYearCandidates = (vin: string, decodedYear: string | null) => {
  if (vin.length !== 17) return null;
  const code = vin[9];
  const yearMap: Record<string, number> = {
    A: 1980, B: 1981, C: 1982, D: 1983, E: 1984, F: 1985, G: 1986, H: 1987, J: 1988, K: 1989, L: 1990, M: 1991, N: 1992, P: 1993, R: 1994, S: 1995, T: 1996, V: 1997, W: 1998, X: 1999, Y: 2000,
    1: 2001, 2: 2002, 3: 2003, 4: 2004, 5: 2005, 6: 2006, 7: 2007, 8: 2008, 9: 2009,
  };
  const base = yearMap[code];
  if (!base) return null;
  const candidates = [base, base + 30];
  const decoded = decodedYear ? Number(decodedYear) : null;
  return {
    code,
    candidates,
    resolved_year: decoded && candidates.includes(decoded) ? decoded : null,
    requires_decoder: !decoded || !candidates.includes(decoded),
  };
};
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
    const vehicleId = String(body.vehicle_id ?? "").trim();
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
    const vinModelYear = vin ? getModelYearCandidates(vin, vinDecode?.model_year ?? null) : null;
    const vinWarnings: string[] = [];
    if (vin && vinCheckValid === false) vinWarnings.push("VIN failed the standard check-digit validation; authoritative VIN decoding was skipped.");
    if (vin && vinCheckValid === true && !vinDecode) vinWarnings.push("VIN passed structural and check-digit validation, but NHTSA vPIC decoding was unavailable; vehicle identity remains unverified by the external decoder.");
    if (vinDecode) {
      if (vinDecode.make && make && vinDecode.make.toUpperCase() !== make.toUpperCase()) vinWarnings.push(`VIN decoder make (${vinDecode.make}) differs from supplied make (${make}).`);
      if (vinDecode.model && model && vinDecode.model.toUpperCase() !== model.toUpperCase()) vinWarnings.push(`VIN decoder model (${vinDecode.model}) differs from supplied model (${model}).`);
      if (vinDecode.model_year && year && Number(vinDecode.model_year) !== year) vinWarnings.push(`VIN decoder model year (${vinDecode.model_year}) differs from supplied year (${year}).`);
    }
    if (vinModelYear?.requires_decoder) vinWarnings.push(`VIN model-year code ${vinModelYear.code} has a 30-year cycle; an authoritative decoder is required to resolve the exact model year.`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase service configuration is missing.");
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    let vinPersistence: { attempted: boolean; persisted: boolean; error?: string } = { attempted: false, persisted: false };

    if (vehicleId && vin) {
      vinPersistence.attempted = true;
      const authorization = req.headers.get("Authorization") ?? "";
      const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
      if (!token) return json({ error: "Authorization is required when vehicle_id is supplied." }, 401);
      const { data: authData, error: authError } = await db.auth.getUser(token);
      if (authError || !authData.user) return json({ error: "Authenticated user could not be verified." }, 401);

      const { data: profile, error: profileError } = await db.from("profiles").select("shop_id,active").eq("id", authData.user.id).maybeSingle();
      if (profileError) throw profileError;
      if (!profile?.active || !profile.shop_id) return json({ error: "Active shop membership is required to persist VIN verification." }, 403);

      const { data: vehicle, error: vehicleError } = await db.from("vehicles").select("id,shop_id").eq("id", vehicleId).eq("shop_id", profile.shop_id).maybeSingle();
      if (vehicleError) throw vehicleError;
      if (!vehicle) return json({ error: "Vehicle was not found in the authenticated user's shop." }, 404);

      const { error: updateError } = await db.from("vehicles").update({
        vin_verified_at: new Date().toISOString(),
        vin_decoder_source: vinDecode?.source ?? null,
        vin_decoded: vinDecode,
        vin_warnings: vinWarnings,
        updated_at: new Date().toISOString(),
      }).eq("id", vehicleId).eq("shop_id", profile.shop_id);
      if (updateError) throw updateError;
      vinPersistence.persisted = true;
    }

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
    return json({ vehicle_id: vehicleId || null, vin: vin || null, vin_valid: vin ? isValidVin(vin) : null, vin_check_digit_valid: vinCheckValid, vin_segments: vinSegments, vin_model_year: vinModelYear, vin_decode: vinDecode, vin_warnings: vinWarnings, vin_persistence: vinPersistence, vehicle: { year, make, model, engine: engine || null }, codes: requestedCodes, symptom: symptom || null, matches: procedures, code_matches: codeMatches, ranked_matches: rankedMatches.slice(0, 50), recommended_parts: recommendedParts, count: procedures.length, code_match_count: codeMatches.length, ranked_match_count: rankedMatches.length });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Vehicle intelligence lookup failed." }, 500); }
});
