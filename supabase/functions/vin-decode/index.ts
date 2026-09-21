import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { vin: input } = await req.json().catch(() => ({}));
    const vin = String(input ?? "").trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
      return new Response(JSON.stringify({ error: "VIN must be exactly 17 valid characters.", decode_valid: false }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`VIN decoder returned HTTP ${response.status}.`);
    const payload = await response.json();
    const raw = payload?.Results?.[0] ?? {};
    const pick = (key: string) => raw[key] || null;
    const year = Number(pick("ModelYear")) || null;
    const make = pick("Make");
    const model = pick("Model");
    const warnings = Array.isArray(payload?.Results)
      ? payload.Results.flatMap((result: any) => String(result?.ErrorText ?? "").split(";").map((x: string) => x.trim()).filter(Boolean))
      : [];
    const decodeValid = Boolean(year && make && model);
    return new Response(JSON.stringify({
      decode_valid: decodeValid,
      warnings: Array.from(new Set(warnings)),
      vehicle: {
        vin,
        year,
        make,
        model,
        trim: pick("Trim"),
        body_class: pick("BodyClass"),
        drive_type: pick("DriveType"),
        fuel_type: pick("FuelTypePrimary"),
        engine_cylinders: Number(pick("EngineCylinders")) || null,
        engine_displacement_l: Number(pick("DisplacementL")) || null,
        transmission: pick("TransmissionStyle"),
        plant_country: pick("PlantCountry"),
        manufacturer: pick("Manufacturer"),
        vehicle_type: pick("VehicleType"),
        raw,
      },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "VIN decode failed.", decode_valid: false }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
