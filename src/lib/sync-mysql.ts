import { supabase } from "@/integrations/supabase/client";

/**
 * Sync one or more jobs to the external MySQL database.
 * Fires and forgets — errors are logged but do not block the UI.
 */
export async function syncJobsToMySQL(jobIds: string[]) {
  if (!jobIds.length) return;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

    // Fetch full job rows from Supabase
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .in("id", jobIds);

    if (error || !jobs?.length) return;

    // Also fetch customer mobile from clients table
    const customerIds = [...new Set(jobs.map((j) => j.customer_id).filter(Boolean))];
    let clientMap: Record<string, string> = {};
    if (customerIds.length) {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, contact_number, company_name, address")
        .in("id", customerIds);
      if (clients) {
        for (const c of clients) {
          clientMap[c.id] = c.contact_number || "";
        }
      }
    }

    // Sync each job to MySQL (upsert by job id)
    for (const job of jobs) {
      const mysqlRow = {
        id: job.id,
        job_number: job.job_number,
        brand_name: job.brand_name,
        model_name: job.model_name,
        board_name: job.board_name,
        board_serial: job.board_serial,
        details_of_problem: job.details_of_problem,
        remarks: job.remarks,
        customer_name: job.customer_name,
        customer_mobile: job.customer_id ? (clientMap[job.customer_id] || "") : "",
        branch_name: job.branch_name,
        factory_challan_number: job.factory_challan_number,
        job_date: job.job_date,
        status: job.status,
        service_charge: job.service_charge ?? 0,
        charge_type: job.charge_type || "Normal",
        discount: job.discount ?? 0,
        payable_amount: job.payable_amount ?? 0,
        receive_amount: job.receive_amount ?? 0,
        receive_type: job.receive_type || "Cash",
        completed_date: job.completed_date || null,
        delivery_date: job.delivery_date || null,
        created_at: job.created_at,
      };

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/mysql-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "upsert",
            table: "jobs",
            data: mysqlRow,
            filters: { id: job.id },
          }),
        }
      );
    }
  } catch (err) {
    console.error("MySQL sync failed:", err);
  }
}
