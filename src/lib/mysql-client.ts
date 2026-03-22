import { supabase } from "@/integrations/supabase/client";

interface MysqlQueryOptions {
  action: "select" | "insert" | "update" | "tables";
  table?: string;
  data?: Record<string, any>;
  filters?: Record<string, any>;
}

export async function mysqlQuery(options: MysqlQueryOptions) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/mysql-sync`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(options),
    }
  );

  const result = await response.json();
  if (!result.success) throw new Error(result.error);
  return result.data;
}
