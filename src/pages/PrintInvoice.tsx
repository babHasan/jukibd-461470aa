import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Job {
  id: string;
  job_number: string;
  brand_name: string;
  model_name: string;
  board_name: string;
  board_serial: string;
  details_of_problem: string;
  customer_name: string;
  customer_id: string | null;
  factory_challan_number: string;
  job_date: string;
  status: string;
}

interface CompanyInfo {
  company_name: string;
  address: string;
  email: string;
  website: string;
  phone: string;
  mobile: string;
  logo_url: string | null;
}

interface ClientInfo {
  id: string;
  client_name: string;
  contact_number: string;
  address: string;
  company_name: string;
}

export default function PrintInvoice() {
  const [searchParams] = useSearchParams();
  const challan = searchParams.get("challan");
  const jobId = searchParams.get("job");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Fetch company info
      const { data: companyData } = await supabase
        .from("company_info")
        .select("*")
        .limit(1)
        .single();
      if (companyData) setCompany(companyData);

      // Fetch jobs
      let jobsData: Job[] = [];
      if (challan) {
        const { data } = await supabase
          .from("jobs")
          .select("*")
          .eq("factory_challan_number", challan)
          .order("created_at", { ascending: true });
        jobsData = data || [];
      } else if (jobId) {
        const { data } = await supabase
          .from("jobs")
          .select("*")
          .eq("id", jobId);
        jobsData = data || [];
      }
      setJobs(jobsData);

      // Fetch client info
      if (jobsData.length > 0 && jobsData[0].customer_id) {
        const { data: clientData } = await supabase
          .from("clients")
          .select("id, client_name, contact_number, address, company_name")
          .eq("id", jobsData[0].customer_id)
          .single();
        if (clientData) setClient(clientData);
      }

      setLoading(false);

      // Auto-print after a small delay
      setTimeout(() => window.print(), 600);
    }
    fetchData();
  }, [challan, jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No jobs found.</p>
      </div>
    );
  }

  const firstJob = jobs[0];
  const printDate = format(new Date(), "dd-MM-yyyy hh:mm:ss a");

  // Generate 15 empty rows to fill the table
  const totalRows = Math.max(15, jobs.length);

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        .invoice-page {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 210mm;
          margin: 0 auto;
          padding: 16px;
          color: #1a1a1a;
          font-size: 13px;
          line-height: 1.5;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        .invoice-table th,
        .invoice-table td {
          border: 1px solid #333;
          padding: 6px 8px;
          text-align: left;
          vertical-align: top;
          font-size: 12px;
        }
        .invoice-table th {
          background: #f0f0f0;
          font-weight: 700;
          font-size: 12px;
        }
        .invoice-table td {
          min-height: 28px;
        }
      `}</style>

      {/* Print / Close buttons */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          🖨️ Print
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors font-medium text-sm"
        >
          ✕ Close
        </button>
      </div>

      <div className="invoice-page">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2, margin: 0 }}>
            CUSTOMER COPY
          </h1>
        </div>

        {/* Company + Customer Info */}
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          {/* Customer Info - Left */}
          <div
            style={{
              flex: 1,
              border: "1px solid #333",
              padding: "10px 14px",
              fontSize: 12,
            }}
          >
            {client ? (
              <>
                <div><strong>C Code :</strong> {client.company_name || "—"}</div>
                <div><strong>C Name :</strong> {client.client_name}</div>
                <div><strong>Mobile :</strong> {client.contact_number}</div>
                <div><strong>Address :</strong> {client.address}</div>
              </>
            ) : (
              <>
                <div><strong>C Name :</strong> {firstJob.customer_name}</div>
              </>
            )}
            <div><strong>Print&nbsp;&nbsp;&nbsp;:</strong> {printDate}</div>
          </div>

          {/* Company Info - Right */}
          <div style={{ flex: 1, fontSize: 11.5, lineHeight: 1.6 }}>
            {company ? (
              <>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{company.company_name}</div>
                <div>{company.address}</div>
                {company.phone && <div>Tel: {company.phone}</div>}
                {company.mobile && <div>Mobile: {company.mobile}</div>}
                {company.email && <div>E-mail: {company.email}</div>}
                {company.website && <div>Web: {company.website}</div>}
              </>
            ) : (
              <div style={{ color: "#888" }}>Company info not configured</div>
            )}
          </div>
        </div>

        {/* Receive Title + Meta */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: 20,
            borderTop: "1px solid #ccc",
            paddingTop: 12,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              textDecoration: "underline",
              margin: 0,
            }}
          >
            Receive
          </h2>
          <div style={{ textAlign: "right", fontSize: 12 }}>
            <div>Date : {firstJob.job_date}</div>
            <div>Challan Number : {firstJob.factory_challan_number || "—"}</div>
          </div>
        </div>

        {/* Job Table */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}>Sl#</th>
              <th style={{ width: 70 }}>Job Number</th>
              <th>Machine type</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Board</th>
              <th>Board Serial</th>
              <th>Details of Problem</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalRows }).map((_, i) => {
              const job = jobs[i];
              return (
                <tr key={i}>
                  <td>{job ? i + 1 : ""}</td>
                  <td>{job?.job_number || ""}</td>
                  <td>{job?.board_name || ""}</td>
                  <td>{job?.brand_name || ""}</td>
                  <td>{job?.model_name || ""}</td>
                  <td>{job?.board_name || ""}</td>
                  <td>{job?.board_serial || ""}</td>
                  <td>{job?.details_of_problem || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Signatures */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 60,
            paddingTop: 0,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 120,
                borderTop: "1px solid #333",
                paddingTop: 4,
                fontSize: 12,
              }}
            >
              Received by
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 120,
                borderTop: "1px solid #333",
                paddingTop: 4,
                fontSize: 12,
              }}
            >
              Authorized by
            </div>
          </div>
        </div>
      </div>
    </>
  );
}