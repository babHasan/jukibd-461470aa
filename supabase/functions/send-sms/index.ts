import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SmsRequest {
  repair_order_id: string;
  customer_phone: string;
  customer_name: string;
  device_brand: string;
  ticket_number: string;
  issue: string;
  estimated_cost: number;
  trigger_status: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch SMS config from database
    const { data: smsConfig, error: cfgErr } = await supabase
      .from("sms_config")
      .select("api_key, sender_id")
      .limit(1)
      .maybeSingle();

    if (cfgErr) throw cfgErr;
    if (!smsConfig || !smsConfig.api_key || !smsConfig.sender_id) {
      throw new Error("SMS API Key বা Sender ID কনফিগার করা হয়নি। SMS Settings থেকে সেট করুন।");
    }

    const BULKSMSBD_API_KEY = smsConfig.api_key;
    const BULKSMSBD_SENDER_ID = smsConfig.sender_id;

    const body: SmsRequest = await req.json();
    const {
      repair_order_id,
      customer_phone,
      customer_name,
      device_brand,
      ticket_number,
      issue,
      estimated_cost,
      trigger_status,
    } = body;

    // Fetch the active template for this trigger status
    const { data: template, error: tmplErr } = await supabase
      .from("sms_templates")
      .select("*")
      .eq("trigger_status", trigger_status)
      .eq("is_active", true)
      .maybeSingle();

    if (tmplErr) throw tmplErr;

    if (!template) {
      return new Response(
        JSON.stringify({ success: false, error: "No active template for this status" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Replace placeholders
    const message = template.template_text
      .replace(/\{\{customer_name\}\}/g, customer_name)
      .replace(/\{\{device_brand\}\}/g, device_brand)
      .replace(/\{\{ticket_number\}\}/g, ticket_number)
      .replace(/\{\{issue\}\}/g, issue)
      .replace(/\{\{estimated_cost\}\}/g, String(estimated_cost));

    // Clean phone number (keep digits only, add 88 prefix for BD if needed)
    let phone = customer_phone.replace(/[^0-9]/g, "");
    if (phone.startsWith("01") && phone.length === 11) {
      phone = "88" + phone;
    }

    // Call BulkSMSBD API
    const smsUrl = `http://bulksmsbd.net/api/smsapi?api_key=${BULKSMSBD_API_KEY}&type=text&number=${phone}&senderid=${BULKSMSBD_SENDER_ID}&message=${encodeURIComponent(message)}`;

    const smsResponse = await fetch(smsUrl);
    const smsResult = await smsResponse.text();

    let apiResponse: Record<string, unknown>;
    try {
      apiResponse = JSON.parse(smsResult);
    } catch {
      apiResponse = { raw: smsResult };
    }

    const smsStatus = smsResponse.ok ? "sent" : "failed";

    // Log to sms_logs
    await supabase.from("sms_logs").insert({
      repair_order_id,
      customer_phone: phone,
      message_text: message,
      trigger_status,
      api_response: apiResponse,
      status: smsStatus,
    });

    return new Response(
      JSON.stringify({ success: true, status: smsStatus, api_response: apiResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("SMS send error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
