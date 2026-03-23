import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.3";
import { connect } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SyncRequest {
  action: "push" | "pull" | "full_sync";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let mysqlConn;

  try {
    // Auth check - only admins
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !claims?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: claims.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action }: SyncRequest = await req.json();

    // Connect to MySQL
    mysqlConn = await connect({
      hostname: Deno.env.get("MYSQL_HOST")!,
      username: Deno.env.get("MYSQL_USER")!,
      password: Deno.env.get("MYSQL_PASSWORD")!,
      db: Deno.env.get("MYSQL_DATABASE")!,
      port: parseInt(Deno.env.get("MYSQL_PORT") || "3306"),
    });

    // Ensure MySQL table exists
    await mysqlConn.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id VARCHAR(36) PRIMARY KEY,
        job_number VARCHAR(100) NOT NULL,
        brand_name VARCHAR(255) DEFAULT '',
        model_name VARCHAR(255) DEFAULT '',
        board_name VARCHAR(255) DEFAULT '',
        board_serial VARCHAR(255) DEFAULT '',
        details_of_problem TEXT,
        customer_name VARCHAR(255) DEFAULT '',
        branch_name VARCHAR(255) DEFAULT '',
        factory_challan_number VARCHAR(255) DEFAULT '',
        status VARCHAR(50) DEFAULT 'received',
        charge_type VARCHAR(50) DEFAULT 'Normal',
        service_charge DECIMAL(12,2) DEFAULT 0,
        discount DECIMAL(12,2) DEFAULT 0,
        payable_amount DECIMAL(12,2) DEFAULT 0,
        receive_amount DECIMAL(12,2) DEFAULT 0,
        receive_type VARCHAR(50) DEFAULT 'Cash',
        remarks TEXT,
        job_date DATE,
        completed_date VARCHAR(100),
        delivery_date VARCHAR(100),
        created_by_name VARCHAR(255) DEFAULT '',
        delivered_by_name VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    let pushCount = 0;
    let pullCount = 0;

    // PUSH: Supabase → MySQL
    if (action === "push" || action === "full_sync") {
      const { data: jobs, error: jobsErr } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (jobsErr) throw new Error(`Supabase read error: ${jobsErr.message}`);

      for (const job of jobs || []) {
        await mysqlConn.execute(
          `INSERT INTO jobs (id, job_number, brand_name, model_name, board_name, board_serial,
            details_of_problem, customer_name, branch_name, factory_challan_number, status,
            charge_type, service_charge, discount, payable_amount, receive_amount, receive_type,
            remarks, job_date, completed_date, delivery_date, created_by_name, delivered_by_name, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             brand_name=VALUES(brand_name), model_name=VALUES(model_name), board_name=VALUES(board_name),
             board_serial=VALUES(board_serial), details_of_problem=VALUES(details_of_problem),
             customer_name=VALUES(customer_name), branch_name=VALUES(branch_name),
             factory_challan_number=VALUES(factory_challan_number), status=VALUES(status),
             charge_type=VALUES(charge_type), service_charge=VALUES(service_charge),
             discount=VALUES(discount), payable_amount=VALUES(payable_amount),
             receive_amount=VALUES(receive_amount), receive_type=VALUES(receive_type),
             remarks=VALUES(remarks), job_date=VALUES(job_date), completed_date=VALUES(completed_date),
             delivery_date=VALUES(delivery_date), created_by_name=VALUES(created_by_name),
             delivered_by_name=VALUES(delivered_by_name)`,
          [
            job.id, job.job_number, job.brand_name, job.model_name, job.board_name, job.board_serial,
            job.details_of_problem, job.customer_name, job.branch_name, job.factory_challan_number,
            job.status, job.charge_type, job.service_charge, job.discount, job.payable_amount,
            job.receive_amount, job.receive_type, job.remarks, job.job_date, job.completed_date,
            job.delivery_date, job.created_by_name, job.delivered_by_name, job.created_at,
          ]
        );
        pushCount++;
      }
    }

    // PULL: MySQL → Supabase
    if (action === "pull" || action === "full_sync") {
      const mysqlJobs = await mysqlConn.query("SELECT * FROM jobs");

      for (const mJob of mysqlJobs) {
        // Check if exists in Supabase
        const { data: existing } = await supabase
          .from("jobs")
          .select("id")
          .eq("id", mJob.id)
          .maybeSingle();

        if (!existing) {
          // Insert new job from MySQL
          const { error: insertErr } = await supabase.from("jobs").insert({
            id: mJob.id,
            job_number: mJob.job_number,
            brand_name: mJob.brand_name || "",
            model_name: mJob.model_name || "",
            board_name: mJob.board_name || "",
            board_serial: mJob.board_serial || "",
            details_of_problem: mJob.details_of_problem || "",
            customer_name: mJob.customer_name || "",
            branch_name: mJob.branch_name || "",
            factory_challan_number: mJob.factory_challan_number || "",
            status: mJob.status || "received",
            charge_type: mJob.charge_type || "Normal",
            service_charge: mJob.service_charge || 0,
            discount: mJob.discount || 0,
            payable_amount: mJob.payable_amount || 0,
            receive_amount: mJob.receive_amount || 0,
            receive_type: mJob.receive_type || "Cash",
            remarks: mJob.remarks || "",
            job_date: mJob.job_date || new Date().toISOString().split("T")[0],
            completed_date: mJob.completed_date || null,
            delivery_date: mJob.delivery_date || null,
            created_by_name: mJob.created_by_name || "",
            delivered_by_name: mJob.delivered_by_name || "",
          });
          if (!insertErr) pullCount++;
        }
      }
    }

    await mysqlConn.close();

    return new Response(
      JSON.stringify({
        success: true,
        action,
        pushed: pushCount,
        pulled: pullCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    if (mysqlConn) {
      try { await mysqlConn.close(); } catch { /* ignore */ }
    }
    console.error("MySQL sync error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
