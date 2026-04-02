import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "");
  }

  const whole = Math.floor(Math.abs(num));
  return "Taka " + convert(whole) + " Only";
}

interface ColumnSetting {
  id: string;
  column_key: string;
  column_label: string;
  visible_in_delivery: boolean;
  visible_in_receive: boolean;
  display_order: number;
}

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
  service_charge: number | null;
  discount: number | null;
  payable_amount: number | null;
  receive_amount: number | null;
  charge_type: string | null;
  delivery_date: string | null;
  created_by_name?: string;
  delivered_by_name?: string;
  [key: string]: any;
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
  const idsParam = searchParams.get("ids");
  const copyType = searchParams.get("type");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: companyData } = await supabase
        .from("company_info")
        .select("*")
        .limit(1)
        .single();
      if (companyData) setCompany(companyData);

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
      } else if (idsParam) {
        const idList = idsParam.split(",").filter(Boolean);
        const { data } = await supabase
          .from("jobs")
          .select("*")
          .in("id", idList)
          .order("created_at", { ascending: true });
        jobsData = data || [];
      }
      setJobs(jobsData);

      if (jobsData.length > 0) {
        const firstJ = jobsData[0];
        let clientData = null;
        if (firstJ.customer_id) {
          const { data } = await supabase
            .from("clients")
            .select("id, client_name, contact_number, address, company_name")
            .eq("id", firstJ.customer_id)
            .single();
          clientData = data;
        }
        if (!clientData && firstJ.customer_name) {
          const { data } = await supabase
            .from("clients")
            .select("id, client_name, contact_number, address, company_name")
            .eq("client_name", firstJ.customer_name)
            .limit(1)
            .maybeSingle();
          clientData = data;
        }
        if (clientData) setClient(clientData);
      }

      setLoading(false);
      setTimeout(() => window.print(), 600);
    }
    fetchData();
  }, [challan, jobId, idsParam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-gray-300 border-t-gray-700 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Preparing invoice...</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-2">
          <p className="text-gray-400 text-4xl">📄</p>
          <p className="text-gray-500 font-medium">No jobs found for this invoice.</p>
        </div>
      </div>
    );
  }

  const firstJob = jobs[0];
  const printDate = format(new Date(), "dd-MM-yyyy hh:mm:ss a");
  const isDueCollection = copyType === "due-collection";
  const isCustomerPortal = copyType === "customer-portal" || copyType === "customer-portal-delivery";
  const isDelivery = copyType === "delivery" || copyType === "customer-portal-delivery" || firstJob.status === "picked-up" || isDueCollection;

  const totalRows = Math.max(isDelivery ? jobs.length : 15, jobs.length);

  const totalServiceCharge = jobs.reduce((sum, j) => sum + (j.service_charge || 0), 0);
  const totalDiscount = jobs.reduce((sum, j) => sum + (j.discount || 0), 0);
  const totalPayable = jobs.reduce((sum, j) => sum + (j.payable_amount || 0), 0);
  const totalReceived = jobs.reduce((sum, j) => sum + (j.receive_amount || 0), 0);
  const totalDue = totalPayable - totalReceived;

  const invoiceTitle = copyType === "office"
    ? "OFFICE COPY"
    : isDueCollection
    ? "DUE COLLECTION INVOICE"
    : isDelivery
    ? "DELIVERY INVOICE"
    : "CUSTOMER RECEIVE COPY";

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm 10mm 12mm 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { box-sizing: border-box; }
        .inv {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 210mm;
          margin: 0 auto;
          padding: 16px;
          color: #111;
          font-size: 12px;
          line-height: 1.5;
        }
        .inv-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .inv-company { flex: 1; }
        .inv-company h2 { font-size: 16px; font-weight: 800; margin: 0 0 2px 0; letter-spacing: 0.5px; }
        .inv-company p { margin: 0; font-size: 11px; color: #444; line-height: 1.4; }
        .inv-logo { width: 60px; height: 60px; object-fit: contain; margin-left: 12px; }
        .inv-title {
          text-align: center;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 2px;
          margin: 8px 0;
          padding: 6px 0;
          border: 1px solid #333;
          background: #f5f5f5;
        }
        .inv-meta {
          display: flex;
          gap: 12px;
          margin: 12px 0;
        }
        .inv-meta-box {
          flex: 1;
          border: 1px solid #aaa;
          padding: 8px 12px;
          font-size: 11.5px;
          line-height: 1.6;
          border-radius: 2px;
        }
        .inv-meta-box strong { font-weight: 700; }
        .inv-section-label {
          font-size: 15px;
          font-weight: 700;
          text-decoration: underline;
          margin: 14px 0 4px 0;
        }
        .inv-tbl {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 11.5px;
        }
        .inv-tbl th, .inv-tbl td {
          border: 1px solid #555;
          padding: 5px 7px;
          text-align: left;
          vertical-align: top;
        }
        .inv-tbl th {
          background: #e8e8e8;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .inv-tbl .num { text-align: right; font-variant-numeric: tabular-nums; }
        .inv-tbl .total-row { background: #f0f0f0; font-weight: 700; }
        .inv-tbl .grand-row { background: #ddd; font-weight: 800; font-size: 12px; }
        .inv-footer {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          padding-top: 0;
        }
        .inv-sig {
          text-align: center;
          width: 130px;
        }
        .inv-sig-line {
          border-top: 1px solid #333;
          padding-top: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .inv-words {
          margin-top: 8px;
          font-size: 11.5px;
          font-weight: 600;
          font-style: italic;
          padding: 4px 8px;
          border: 1px dashed #999;
          background: #fafafa;
        }
        .inv-stamp {
          display: flex;
          justify-content: center;
          margin-top: 30px;
        }
        .inv-stamp-box {
          border: 3px solid #1a6b3c;
          border-radius: 10px;
          padding: 10px 24px;
          text-align: center;
          transform: rotate(-5deg);
          opacity: 0.85;
        }
        .inv-stamp-title { font-size: 18px; font-weight: 900; color: #1a6b3c; letter-spacing: 3px; }
        .inv-stamp-sub { font-size: 10px; font-weight: 700; color: #1a6b3c; letter-spacing: 2px; margin-top: 2px; }
        .inv-stamp-date { font-size: 8px; color: #1a6b3c; margin-top: 3px; border-top: 1px solid #1a6b3c; padding-top: 3px; }
      `}</style>

      {/* Print / Close buttons */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-1.5"
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

      <div className="inv">
        {/* Company Header */}
        <div className="inv-header">
          <div className="inv-company">
            {company ? (
              <>
                <h2>{company.company_name}</h2>
                <p>{company.address}</p>
                {company.phone && <p>Tel: {company.phone} {company.mobile ? `| Mobile: ${company.mobile}` : ""}</p>}
                {company.email && <p>Email: {company.email} {company.website ? `| Web: ${company.website}` : ""}</p>}
              </>
            ) : (
              <h2 style={{ color: "#888" }}>Company info not configured</h2>
            )}
          </div>
          {company?.logo_url && (
            <img src={company.logo_url} alt="Logo" className="inv-logo" />
          )}
        </div>

        {/* Invoice Title */}
        <div className="inv-title">{invoiceTitle}</div>

        {/* Customer & Invoice Meta */}
        <div className="inv-meta">
          <div className="inv-meta-box">
            {client ? (
              <>
                <div><strong>Company Name :</strong> {client.company_name || "—"}</div>
                <div><strong>Client Name :</strong> {client.client_name}</div>
                <div><strong>Mobile :</strong> {client.contact_number}</div>
                <div><strong>Address :</strong> {client.address}</div>
              </>
            ) : (
              <div><strong>Client Name :</strong> {firstJob.customer_name}</div>
            )}
          </div>
          <div className="inv-meta-box" style={{ maxWidth: 220 }}>
            <div><strong>Date :</strong> {isDelivery && firstJob.delivery_date ? firstJob.delivery_date : firstJob.job_date}</div>
            <div><strong>Challan No :</strong> {firstJob.factory_challan_number || "—"}</div>
            <div><strong>Print :</strong> {printDate}</div>
            <div><strong>Total Items :</strong> {jobs.length}</div>
            {firstJob.created_by_name && (
              <div><strong>Created By :</strong> {firstJob.created_by_name}</div>
            )}
            {isDelivery && firstJob.delivered_by_name && (
              <div><strong>Delivered By :</strong> {firstJob.delivered_by_name}</div>
            )}
          </div>
          {/* QR Code for quick job lookup */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4px 8px", border: "1px solid #aaa", borderRadius: 2, minWidth: 90 }}>
            <QRCodeSVG
              value={jobs.length === 1 ? `JUKIBD-${firstJob.job_number}` : `JUKIBD-CH-${firstJob.factory_challan_number || firstJob.job_number}`}
              size={72}
              level="H"
            />
            <div style={{ fontSize: 8, marginTop: 3, fontWeight: 600, textAlign: "center" }}>
              {jobs.length === 1 ? firstJob.job_number : (firstJob.factory_challan_number || firstJob.job_number)}
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="inv-section-label">{isDelivery ? "Delivery" : "Receive"}</div>

        {/* Job Table */}
        <table className="inv-tbl">
          <thead>
            <tr>
              <th style={{ width: 28 }}>Sl</th>
              <th style={{ width: 68 }}>Job No.</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Board</th>
              <th>Board S/N</th>
              {isDelivery ? (
                <>
                  <th className="num">Charge</th>
                  <th className="num">Disc.</th>
                  <th className="num">Payable</th>
                </>
              ) : (
                <th>Problem Details</th>
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalRows }).map((_, i) => {
              const job = jobs[i];
              return (
                <tr key={i}>
                  <td>{job ? i + 1 : ""}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 11 }}>{job?.job_number || ""}</td>
                  <td>{job?.brand_name || ""}</td>
                  <td>{job?.model_name || ""}</td>
                  <td>{job?.board_name || ""}</td>
                  <td>{job?.board_serial || ""}</td>
                  {isDelivery ? (
                    <>
                      <td className="num">{job ? (job.service_charge || 0).toLocaleString() : ""}</td>
                      <td className="num">{job ? (job.discount || 0).toLocaleString() : ""}</td>
                      <td className="num">{job ? (job.payable_amount || 0).toLocaleString() : ""}</td>
                    </>
                  ) : (
                    <td>{job?.details_of_problem || ""}</td>
                  )}
                </tr>
              );
            })}
            {isDelivery && (
              <>
                <tr className="total-row">
                  <td colSpan={6} className="num">Sub Total</td>
                  <td className="num">{totalServiceCharge.toLocaleString()}</td>
                  <td className="num">{totalDiscount.toLocaleString()}</td>
                  <td className="num">{totalPayable.toLocaleString()}</td>
                </tr>
                <tr className="total-row">
                  <td colSpan={8} className="num">Received Amount</td>
                  <td className="num">{totalReceived.toLocaleString()}</td>
                </tr>
                <tr className="grand-row">
                  <td colSpan={8} className="num">{totalDue > 0 ? "Due Amount" : "Change"}</td>
                  <td className="num">{Math.abs(totalDue).toLocaleString()}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* Amount in Words */}
        {isDelivery && (
          <div className="inv-words">
            In Words: {numberToWords(totalPayable)}
          </div>
        )}

        {/* Verified Stamp */}
        {isCustomerPortal && (
          <div className="inv-stamp">
            <div className="inv-stamp-box">
              <div className="inv-stamp-title">VERIFIED</div>
              <div className="inv-stamp-sub">BY JUKIBD</div>
              <div className="inv-stamp-date">{printDate}</div>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="inv-footer">
          <div className="inv-sig">
            <div className="inv-sig-line">Received by</div>
          </div>
          <div className="inv-sig">
            <div className="inv-sig-line">Authorized by</div>
          </div>
        </div>
      </div>
    </>
  );
}
