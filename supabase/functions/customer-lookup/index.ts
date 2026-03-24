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
    const body = await req.json();
    const query = body.query;
    const phone = body.phone;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Mode 1: Search by phone number — returns all jobs for that customer
    if (phone && typeof phone === "string" && phone.trim().length >= 4) {
      const trimmedPhone = phone.trim();

      // Find client by contact number
      const { data: clients } = await supabase
        .from("clients")
        .select("id, client_name, contact_number, company_name")
        .ilike("contact_number", `%${trimmedPhone}%`)
        .limit(5);

      if (!clients || clients.length === 0) {
        return new Response(JSON.stringify({ jobs: [], client: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const client = clients[0];
      const clientIds = clients.map(c => c.id);

      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, job_number, brand_name, model_name, board_name, board_serial, details_of_problem, customer_name, branch_name, factory_challan_number, job_date, status, created_at, service_charge, charge_type, payable_amount, receive_amount, discount, delivery_date")
        .in("customer_id", clientIds)
        .order("created_at", { ascending: false })
        .limit(100);

      return new Response(JSON.stringify({ jobs: jobs || [], client }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mode 2: Search by challan or job number (existing behavior)
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ jobs: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = query.trim();

    const { data, error } = await supabase
      .from("jobs")
      .select("id, job_number, brand_name, model_name, board_name, board_serial, details_of_problem, customer_name, branch_name, factory_challan_number, job_date, status, created_at, service_charge, charge_type, customer_id")
      .or(`factory_challan_number.ilike.%${trimmed}%,job_number.ilike.%${trimmed}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return new Response(JSON.stringify({ jobs: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch client company names
    if (data && data.length > 0) {
      const customerIds = [...new Set(data.filter(j => j.customer_id).map(j => j.customer_id))];
      if (customerIds.length > 0) {
        const { data: clients } = await supabase
          .from("clients")
          .select("id, company_name, contact_number")
          .in("id", customerIds);
        const clientMap = new Map((clients || []).map(c => [c.id, c]));
        for (const job of data) {
          const cl = job.customer_id ? clientMap.get(job.customer_id) : null;
          (job as any).company_name = cl?.company_name || "";
          (job as any).contact_number = cl?.contact_number || "";
        }
      }
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
