import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized");

    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Only admins can send bulk SMS");

    // Get SMS config
    const { data: smsConfig, error: cfgErr } = await supabase
      .from("sms_config")
      .select("api_key, sender_id")
      .limit(1)
      .maybeSingle();
    if (cfgErr) throw cfgErr;
    if (!smsConfig || !smsConfig.api_key || !smsConfig.sender_id) {
      throw new Error("SMS API Key বা Sender ID কনফিগার করা হয়নি।");
    }

    const { message } = await req.json();
    if (!message || !message.trim()) throw new Error("মেসেজ লিখুন");

    // Get all unique customer phone numbers from clients table
    const { data: customers, error: custErr } = await supabase
      .from("clients")
      .select("id, client_name, contact_number")
      .neq("contact_number", "");
    if (custErr) throw custErr;

    if (!customers || customers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "কোনো কাস্টমার পাওয়া যায়নি" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { phone: string; name: string; status: string }[] = [];
    const API_KEY = smsConfig.api_key;
    const SENDER_ID = smsConfig.sender_id;

    for (const customer of customers) {
      let phone = customer.contact_number.replace(/[^0-9]/g, "");
      if (!phone) continue;
      if (phone.startsWith("01") && phone.length === 11) {
        phone = "88" + phone;
      }

      try {
        const smsUrl = `http://bulksmsbd.net/api/smsapi?api_key=${API_KEY}&type=text&number=${phone}&senderid=${SENDER_ID}&message=${encodeURIComponent(message)}`;
        const smsRes = await fetch(smsUrl);
        const smsText = await smsRes.text();

        let apiResponse: Record<string, unknown>;
        try { apiResponse = JSON.parse(smsText); } catch { apiResponse = { raw: smsText }; }

        const status = smsRes.ok ? "sent" : "failed";
        results.push({ phone, name: customer.client_name, status });

        // Log each SMS
        await supabase.from("sms_logs").insert({
          repair_order_id: "bulk-announcement",
          customer_phone: phone,
          message_text: message,
          trigger_status: "announcement",
          api_response: apiResponse,
          status,
        });
      } catch {
        results.push({ phone, name: customer.client_name, status: "failed" });
      }
    }

    const sentCount = results.filter(r => r.status === "sent").length;
    const failedCount = results.filter(r => r.status === "failed").length;

    return new Response(
      JSON.stringify({ success: true, total: results.length, sent: sentCount, failed: failedCount, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Bulk SMS error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
