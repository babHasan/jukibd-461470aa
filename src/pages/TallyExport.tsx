import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Download } from "lucide-react";

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildTallyXml(jobs: any[], expenses: any[], incomes: any[], companyName: string) {
  let vouchers = "";

  // Sales vouchers from delivered jobs
  jobs.filter(j => j.status === "delivered" && Number(j.receive_amount) > 0).forEach(j => {
    vouchers += `
    <VOUCHER VCHTYPE="Sales" ACTION="Create">
      <DATE>${(j.delivery_date || j.job_date || "").replace(/-/g, "")}</DATE>
      <NARRATION>Job ${escapeXml(j.job_number)} - ${escapeXml(j.customer_name)}</NARRATION>
      <PARTYLEDGERNAME>${escapeXml(j.customer_name || "Cash")}</PARTYLEDGERNAME>
      <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>${escapeXml(j.customer_name || "Cash")}</LEDGERNAME>
        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
        <AMOUNT>-${Number(j.receive_amount).toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>Service Revenue</LEDGERNAME>
        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
        <AMOUNT>${Number(j.receive_amount).toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
    </VOUCHER>`;
  });

  // Payment vouchers from expenses
  expenses.forEach(e => {
    vouchers += `
    <VOUCHER VCHTYPE="Payment" ACTION="Create">
      <DATE>${(e.expense_date || "").replace(/-/g, "")}</DATE>
      <NARRATION>${escapeXml(e.category_name)} - ${escapeXml(e.remarks)}</NARRATION>
      <PARTYLEDGERNAME>Cash</PARTYLEDGERNAME>
      <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>${escapeXml(e.category_name || "Indirect Expenses")}</LEDGERNAME>
        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
        <AMOUNT>-${Number(e.amount).toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>Cash</LEDGERNAME>
        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
        <AMOUNT>${Number(e.amount).toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
    </VOUCHER>`;
  });

  // Receipt vouchers from incomes
  incomes.forEach(i => {
    vouchers += `
    <VOUCHER VCHTYPE="Receipt" ACTION="Create">
      <DATE>${(i.income_date || "").replace(/-/g, "")}</DATE>
      <NARRATION>${escapeXml(i.category_name)} - ${escapeXml(i.remarks)}</NARRATION>
      <PARTYLEDGERNAME>Cash</PARTYLEDGERNAME>
      <VOUCHERTYPENAME>Receipt</VOUCHERTYPENAME>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>Cash</LEDGERNAME>
        <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
        <AMOUNT>-${Number(i.amount).toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>${escapeXml(i.category_name || "Income")}</LEDGERNAME>
        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
        <AMOUNT>${Number(i.amount).toFixed(2)}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
    </VOUCHER>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters and Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          ${vouchers}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export default function TallyExport() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!fromDate || !toDate) { toast.error("Select date range"); return; }
    setExporting(true);

    const [{ data: jobs }, { data: expenses }, { data: incomes }, { data: company }] = await Promise.all([
      supabase.from("jobs").select("*").gte("job_date", fromDate).lte("job_date", toDate),
      supabase.from("expenses").select("*").gte("expense_date", fromDate).lte("expense_date", toDate),
      supabase.from("incomes").select("*").gte("income_date", fromDate).lte("income_date", toDate),
      supabase.from("company_info").select("company_name").limit(1).single(),
    ]);

    const xml = buildTallyXml(jobs || [], expenses || [], incomes || [], company?.company_name || "JUKIBD");
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tally_Export_${fromDate}_to_${toDate}.xml`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Tally XML exported successfully!");
    setExporting(false);
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Tally Export</h1>

        <Card>
          <CardHeader><CardTitle>Export Data for Tally</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your sales (delivered jobs), expenses, and incomes as Tally-compatible XML. 
              Import this file into Tally ERP using Gateway of Tally → Import Data.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>From Date</Label><Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
              <div><Label>To Date</Label><Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} /></div>
            </div>
            <Button onClick={handleExport} disabled={exporting} className="w-full" size="lg">
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting..." : "Export Tally XML"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">What gets exported?</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>• <strong>Sales Vouchers:</strong> Delivered jobs with received amounts</p>
            <p>• <strong>Payment Vouchers:</strong> All expenses in the date range</p>
            <p>• <strong>Receipt Vouchers:</strong> All incomes in the date range</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
