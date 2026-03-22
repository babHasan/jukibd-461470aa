import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    // Verify caller
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser(token);
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
          if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
          }
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

      default:
        throw new Error("Invalid action. Use: select, insert, update, tables");
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
