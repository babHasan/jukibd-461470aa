import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

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
    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { action, table, data, filters } = await req.json();

    // Connect to MySQL
    const mysqlClient = await new Client().connect({
      hostname: Deno.env.get("MYSQL_HOST")!,
      db: Deno.env.get("MYSQL_DATABASE")!,
      username: Deno.env.get("MYSQL_USER")!,
      password: Deno.env.get("MYSQL_PASSWORD")!,
      port: 3306,
    });

    let result: any = null;

    switch (action) {
      case "select": {
        if (!table) throw new Error("table is required");
        let query = `SELECT * FROM \`${table}\``;
        const params: any[] = [];
        if (filters && typeof filters === "object") {
          const conditions = Object.entries(filters).map(([key, value]) => {
            params.push(value);
            return `\`${key}\` = ?`;
          });
          if (conditions.length > 0) query += ` WHERE ${conditions.join(" AND ")}`;
        }
        query += " LIMIT 100";
        const rows = await mysqlClient.execute(query, params);
        result = rows.rows || [];
        break;
      }

      case "insert": {
        if (!table || !data) throw new Error("table and data required");
        const keys = Object.keys(data);
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map((k) => data[k]);
        const query = `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(", ")}) VALUES (${placeholders})`;
        const res = await mysqlClient.execute(query, values);
        result = { affectedRows: res.affectedRows, lastInsertId: res.lastInsertId };
        break;
      }

      case "upsert": {
        if (!table || !data) throw new Error("table and data required");
        const keys = Object.keys(data);
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map((k) => data[k]);
        const updateClauses = keys.map((k) => `\`${k}\` = VALUES(\`${k}\`)`).join(", ");
        const query = `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(", ")}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateClauses}`;
        const res = await mysqlClient.execute(query, values);
        result = { affectedRows: res.affectedRows };
        break;
      }

      case "update": {
        if (!table || !data || !filters) throw new Error("table, data, and filters required");
        const setClauses = Object.keys(data).map((k) => `\`${k}\` = ?`);
        const whereClauses = Object.keys(filters).map((k) => `\`${k}\` = ?`);
        const params = [...Object.values(data), ...Object.values(filters)];
        const query = `UPDATE \`${table}\` SET ${setClauses.join(", ")} WHERE ${whereClauses.join(" AND ")}`;
        const res = await mysqlClient.execute(query, params);
        result = { affectedRows: res.affectedRows };
        break;
      }

      case "tables": {
        const rows = await mysqlClient.execute("SHOW TABLES");
        result = rows.rows || [];
        break;
      }

      case "create_jobs_table": {
        await mysqlClient.execute(`
          CREATE TABLE IF NOT EXISTS \`jobs\` (
            \`id\` VARCHAR(36) PRIMARY KEY,
            \`job_number\` VARCHAR(100) NOT NULL,
            \`brand_name\` VARCHAR(255) DEFAULT '',
            \`model_name\` VARCHAR(255) DEFAULT '',
            \`board_name\` VARCHAR(255) DEFAULT '',
            \`board_serial\` VARCHAR(255) DEFAULT '',
            \`details_of_problem\` TEXT,
            \`remarks\` TEXT,
            \`customer_name\` VARCHAR(255) DEFAULT '',
            \`customer_mobile\` VARCHAR(50) DEFAULT '',
            \`branch_name\` VARCHAR(255) DEFAULT '',
            \`factory_challan_number\` VARCHAR(255) DEFAULT '',
            \`job_date\` DATE NULL,
            \`status\` VARCHAR(50) DEFAULT 'received',
            \`service_charge\` DECIMAL(10,2) DEFAULT 0,
            \`charge_type\` VARCHAR(50) DEFAULT 'Normal',
            \`discount\` DECIMAL(10,2) DEFAULT 0,
            \`payable_amount\` DECIMAL(10,2) DEFAULT 0,
            \`receive_amount\` DECIMAL(10,2) DEFAULT 0,
            \`receive_type\` VARCHAR(50) DEFAULT 'Cash',
            \`completed_date\` VARCHAR(50) NULL,
            \`delivery_date\` VARCHAR(50) NULL,
            \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        result = { message: "jobs table created or already exists" };
        break;
      }

      default:
        throw new Error("Invalid action. Use: select, insert, upsert, update, tables, create_jobs_table");
    }

    await mysqlClient.close();

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("MySQL sync error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
