import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ jobs: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const trimmed = query.trim();

    // Search by job_number or factory_challan_number
    const { data, error } = await supabase
      .from("jobs")
      .select("id, job_number, brand_name, model_name, board_name, board_serial, details_of_problem, customer_name, branch_name, factory_challan_number, job_date, status, created_at")
      .or(`job_number.ilike.%${trimmed}%,factory_challan_number.ilike.%${trimmed}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return new Response(JSON.stringify({ jobs: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ jobs: data || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ jobs: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
