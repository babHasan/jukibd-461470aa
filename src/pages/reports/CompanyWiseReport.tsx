import { useState, useMemo, useEffect, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, FileText, Download, Printer, Building2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";

interface JobRow {
  id: string;
  job_number: string;
  job_date: string;
  factory_challan_number: string;
  customer_name: string;
  customer_id: string | null;
  brand_name: string;
  model_name: string;
  board_name: string;
  board_serial: string;
  details_of_problem: string;
  status: string;
  service_charge: number;
  discount: number;
  payable_amount: number;
  receive_amount: number;
  charge_type: string | null;
  company_name: string;
  customer_mobile: string;
  customer_address: string;
}

interface CompanyGroup {
  company_name: string;
  jobs: JobRow[];
  total_service: number;
  total_discount: number;
  total_payable: number;
  total_received: number;
  total_due: number;
}

export default function CompanyWiseReport() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rows, setRows] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("clients")
      .select("company_name")
      .neq("company_name", "")
      .order("company_name")
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((c) => c.company_name).filter(Boolean))];
          setCompanies(unique);
        }
      });
  }, []);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);

    let query = supabase
      .from("jobs")
      .select("id, job_number, job_date, factory_challan_number, customer_name, customer_id, brand_name, model_name, board_name, board_serial, details_of_problem, status, service_charge, discount, payable_amount, receive_amount, charge_type, clients(company_name, contact_number, address)")
      .gte("job_date", fromDate)
      .lte("job_date", toDate)
      .order("job_date", { ascending: true });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to fetch report data");
      setLoading(false);
      return;
    }

    const mapped: JobRow[] = (data || []).map((j: any) => ({
      ...j,
      company_name: j.clients?.company_name || "",
      customer_mobile: j.clients?.contact_number || "",
      customer_address: j.clients?.address || "",
      service_charge: Number(j.service_charge) || 0,
      discount: Number(j.discount) || 0,
      payable_amount: Number(j.payable_amount) || 0,
      receive_amount: Number(j.receive_amount) || 0,
    }));

    const filtered = companyFilter === "all"
      ? mapped
      : mapped.filter((j) => j.company_name === companyFilter);

    setRows(filtered);
    setLoading(false);
  }

  const groups = useMemo<CompanyGroup[]>(() => {
    const map = new Map<string, JobRow[]>();
    for (const row of rows) {
      const key = row.company_name || row.customer_name || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries())
      .map(([company_name, jobs]) => {
        const total_service = jobs.reduce((s, j) => s + j.service_charge, 0);
        const total_discount = jobs.reduce((s, j) => s + j.discount, 0);
        const total_payable = jobs.reduce((s, j) => s + j.payable_amount, 0);
        const total_received = jobs.reduce((s, j) => s + j.receive_amount, 0);
        return {
          company_name,
          jobs,
          total_service,
          total_discount,
          total_payable,
          total_received,
          total_due: total_payable - total_received,
        };
      })
      .sort((a, b) => a.company_name.localeCompare(b.company_name));
  }, [rows]);

  const grandTotals = useMemo(() => ({
    jobs: groups.reduce((s, g) => s + g.jobs.length, 0),
    service: groups.reduce((s, g) => s + g.total_service, 0),
    discount: groups.reduce((s, g) => s + g.total_discount, 0),
    payable: groups.reduce((s, g) => s + g.total_payable, 0),
    received: groups.reduce((s, g) => s + g.total_received, 0),
    due: groups.reduce((s, g) => s + g.total_due, 0),
  }), [groups]);

  function exportExcel() {
    const detailRows: any[] = [];
    groups.forEach((g) => {
      g.jobs.forEach((j, i) => {
        detailRows.push({
          Company: i === 0 ? g.company_name : "",
          Date: j.job_date,
          "Job No": j.job_number,
          "Challan No": j.factory_challan_number,
          Customer: j.customer_name,
          Board: j.board_name,
          Status: j.status,
          "Service Charge": j.service_charge,
          Discount: j.discount,
          Payable: j.payable_amount,
          Received: j.receive_amount,
          Due: j.payable_amount - j.receive_amount,
        });
      });
      detailRows.push({
        Company: `SUBTOTAL: ${g.company_name}`,
        Date: "", "Job No": "", "Challan No": "", Customer: "", Board: "",
        Status: `${g.jobs.length} jobs`,
        "Service Charge": g.total_service,
        Discount: g.total_discount,
        Payable: g.total_payable,
        Received: g.total_received,
        Due: g.total_due,
      });
    });
    detailRows.push({
      Company: "GRAND TOTAL", Date: "", "Job No": "", "Challan No": "", Customer: "", Board: "",
      Status: `${grandTotals.jobs} jobs`,
      "Service Charge": grandTotals.service,
      Discount: grandTotals.discount,
      Payable: grandTotals.payable,
      Received: grandTotals.received,
      Due: grandTotals.due,
    });

    const summaryRows = groups.map((g, i) => ({
      Sl: i + 1,
      Company: g.company_name,
      "Total Jobs": g.jobs.length,
      "Service Charge": g.total_service,
      Discount: g.total_discount,
      Payable: g.total_payable,
      Received: g.total_received,
      Due: g.total_due,
    }));
    summaryRows.push({
      Sl: "" as any, Company: "GRAND TOTAL",
      "Total Jobs": grandTotals.jobs,
      "Service Charge": grandTotals.service,
      Discount: grandTotals.discount,
      Payable: grandTotals.payable,
      Received: grandTotals.received,
      Due: grandTotals.due,
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), "Detail");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Summary");
    XLSX.writeFile(wb, `Company_Wise_Report_${fromDate}_to_${toDate}.xlsx`);
  }

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Company Wise Report</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
        h2, h3 { margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .summary-header { background: #1e3a5f; color: white; padding: 8px; margin-top: 20px; }
        @media print { body { margin: 0; } }
      </style></head><body>`);
    w.document.write(`<h2>COMPANY WISE REPORT</h2>`);
    w.document.write(`<p><strong>Date Range:</strong> ${fromDate} to ${toDate}</p>`);
    w.document.write(`<p><strong>Company:</strong> ${companyFilter === "all" ? "ALL" : companyFilter}</p>`);
    w.document.write(`<hr/>`);

    // Summary table
    w.document.write(`<h3 class="summary-header">SUMMARY</h3>`);
    w.document.write(`<table><thead><tr><th>Sl</th><th>Company</th><th>Jobs</th><th class="text-right">Service</th><th class="text-right">Discount</th><th class="text-right">Payable</th><th class="text-right">Received</th><th class="text-right">Due</th></tr></thead><tbody>`);
    groups.forEach((g, i) => {
      w.document.write(`<tr><td>${i + 1}</td><td>${g.company_name}</td><td>${g.jobs.length}</td><td class="text-right">${g.total_service.toFixed(2)}</td><td class="text-right">${g.total_discount.toFixed(2)}</td><td class="text-right">${g.total_payable.toFixed(2)}</td><td class="text-right">${g.total_received.toFixed(2)}</td><td class="text-right">${g.total_due.toFixed(2)}</td></tr>`);
    });
    w.document.write(`<tr class="font-bold"><td colspan="2">GRAND TOTAL</td><td>${grandTotals.jobs}</td><td class="text-right">${grandTotals.service.toFixed(2)}</td><td class="text-right">${grandTotals.discount.toFixed(2)}</td><td class="text-right">${grandTotals.payable.toFixed(2)}</td><td class="text-right">${grandTotals.received.toFixed(2)}</td><td class="text-right">${grandTotals.due.toFixed(2)}</td></tr>`);
    w.document.write(`</tbody></table>`);

    // Detail per company
    groups.forEach((g) => {
      w.document.write(`<h3>${g.company_name} (${g.jobs.length} jobs)</h3>`);
      w.document.write(`<table><thead><tr><th>Sl</th><th>Date</th><th>Job No</th><th>Challan</th><th>Board</th><th>Status</th><th class="text-right">Service</th><th class="text-right">Discount</th><th class="text-right">Payable</th><th class="text-right">Received</th><th class="text-right">Due</th></tr></thead><tbody>`);
      g.jobs.forEach((j, i) => {
        const due = j.payable_amount - j.receive_amount;
        w.document.write(`<tr><td>${i + 1}</td><td>${j.job_date}</td><td>${j.job_number}</td><td>${j.factory_challan_number || "—"}</td><td>${j.board_name || "—"}</td><td>${j.status}</td><td class="text-right">${j.service_charge.toFixed(2)}</td><td class="text-right">${j.discount.toFixed(2)}</td><td class="text-right">${j.payable_amount.toFixed(2)}</td><td class="text-right">${j.receive_amount.toFixed(2)}</td><td class="text-right">${due.toFixed(2)}</td></tr>`);
      });
      w.document.write(`<tr class="font-bold"><td colspan="6">SUBTOTAL</td><td class="text-right">${g.total_service.toFixed(2)}</td><td class="text-right">${g.total_discount.toFixed(2)}</td><td class="text-right">${g.total_payable.toFixed(2)}</td><td class="text-right">${g.total_received.toFixed(2)}</td><td class="text-right">${g.total_due.toFixed(2)}</td></tr>`);
      w.document.write(`</tbody></table>`);
    });

    w.document.write(`</body></html>`);
    w.document.close();
    w.print();
  }

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "received", label: "Received" },
    { value: "diagnosing", label: "Diagnosing" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "picked-up", label: "Delivery" },
  ];

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="rounded-lg bg-primary px-4 py-3">
          <h2 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            COMPANY WISE REPORT
          </h2>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
          <div>
            <label className="text-xs font-semibold text-destructive">From *</label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="text-xs font-semibold text-destructive">To *</label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40" />
          </div>
          <div>
            <label className="text-xs font-semibold">Company</label>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSearch} disabled={loading} className="gap-2">
            <Search className="h-4 w-4" />
            SEARCH
          </Button>
        </div>

        {searched && (
          <div className="space-y-4" ref={printRef}>
            {/* Report header + actions */}
            <div className="flex flex-col sm:flex-row items-start justify-between rounded-lg bg-primary p-4 gap-3">
              <div className="text-sm font-bold text-primary-foreground space-y-0.5">
                <p>REPORT &nbsp; : &nbsp; COMPANY WISE</p>
                <p>COMPANY &nbsp; : &nbsp; {companyFilter === "all" ? "ALL" : companyFilter}</p>
                <p>DATE RANGE &nbsp; : &nbsp; FROM {fromDate} TO {toDate}</p>
                <p>TOTAL COMPANIES &nbsp; : &nbsp; {groups.length} &nbsp; | &nbsp; TOTAL JOBS &nbsp; : &nbsp; {grandTotals.jobs}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={exportExcel}>
                  <Download className="h-4 w-4" />
                  EXCEL
                </Button>
                <Button variant="secondary" size="sm" className="gap-2" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  PRINT
                </Button>
              </div>
            </div>

            {/* Summary Table */}
            <div className="rounded-lg border bg-card overflow-auto">
              <div className="bg-primary px-4 py-2">
                <h3 className="text-sm font-bold text-primary-foreground">SUMMARY</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold w-12">Sl</TableHead>
                    <TableHead className="font-semibold">Company</TableHead>
                    <TableHead className="font-semibold text-center">Jobs</TableHead>
                    <TableHead className="font-semibold text-right">Service Charge</TableHead>
                    <TableHead className="font-semibold text-right">Discount</TableHead>
                    <TableHead className="font-semibold text-right">Payable</TableHead>
                    <TableHead className="font-semibold text-right">Received</TableHead>
                    <TableHead className="font-semibold text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
                  ) : groups.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
                  ) : (
                    <>
                      {groups.map((g, idx) => (
                        <TableRow key={g.company_name}>
                          <TableCell className="text-sm">{idx + 1}</TableCell>
                          <TableCell className="text-sm font-medium">{g.company_name}</TableCell>
                          <TableCell className="text-sm text-center">{g.jobs.length}</TableCell>
                          <TableCell className="text-sm text-right">{g.total_service.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-right">{g.total_discount.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-right">{g.total_payable.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-right">{g.total_received.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{g.total_due.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell colSpan={2} className="text-sm">GRAND TOTAL</TableCell>
                        <TableCell className="text-sm text-center">{grandTotals.jobs}</TableCell>
                        <TableCell className="text-sm text-right">{grandTotals.service.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-right">{grandTotals.discount.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-right">{grandTotals.payable.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-right">{grandTotals.received.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-right">{grandTotals.due.toFixed(2)}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Detail per company */}
            {groups.map((g) => (
              <div key={g.company_name} className="rounded-lg border bg-card overflow-auto">
                <div className="bg-muted px-4 py-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {g.company_name}
                    <span className="text-xs font-normal text-muted-foreground">({g.jobs.length} jobs)</span>
                  </h3>
                  <span className="text-xs font-semibold">
                    Due: <span className={g.total_due > 0 ? "text-destructive" : "text-green-600"}>{g.total_due.toFixed(2)}</span>
                  </span>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden divide-y">
                  {g.jobs.map((j, i) => {
                    const due = j.payable_amount - j.receive_amount;
                    return (
                      <div key={j.id} className="p-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">#{i + 1} — {j.job_number}</span>
                          <span className="capitalize text-muted-foreground">{j.status}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{j.job_date} • {j.factory_challan_number || "—"}</div>
                        <div className="text-xs">{j.board_name || "—"} • {j.brand_name}</div>
                        <div className="grid grid-cols-2 gap-1 text-xs mt-1">
                          <span>Charge: {j.service_charge.toFixed(2)}</span>
                          <span>Discount: {j.discount.toFixed(2)}</span>
                          <span>Payable: {j.payable_amount.toFixed(2)}</span>
                          <span>Received: {j.receive_amount.toFixed(2)}</span>
                          <span className={`font-semibold ${due > 0 ? "text-destructive" : "text-green-600"}`}>Due: {due.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop table view */}
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent text-xs">
                      <TableHead className="font-semibold w-10">Sl</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Job No</TableHead>
                      <TableHead className="font-semibold">Challan</TableHead>
                      <TableHead className="font-semibold">Customer</TableHead>
                      <TableHead className="font-semibold">Board</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold text-right">Service</TableHead>
                      <TableHead className="font-semibold text-right">Discount</TableHead>
                      <TableHead className="font-semibold text-right">Payable</TableHead>
                      <TableHead className="font-semibold text-right">Received</TableHead>
                      <TableHead className="font-semibold text-right">Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.jobs.map((j, i) => {
                      const due = j.payable_amount - j.receive_amount;
                      return (
                        <TableRow key={j.id}>
                          <TableCell className="text-xs">{i + 1}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">{j.job_date}</TableCell>
                          <TableCell className="text-xs font-mono">{j.job_number}</TableCell>
                          <TableCell className="text-xs">{j.factory_challan_number || "—"}</TableCell>
                          <TableCell className="text-xs">{j.customer_name}</TableCell>
                          <TableCell className="text-xs">{j.board_name || "—"}</TableCell>
                          <TableCell className="text-xs capitalize">{j.status}</TableCell>
                          <TableCell className="text-xs text-right">{j.service_charge.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-right">{j.discount.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-right">{j.payable_amount.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-right">{j.receive_amount.toFixed(2)}</TableCell>
                          <TableCell className={`text-xs text-right font-medium ${due > 0 ? "text-destructive" : ""}`}>{due.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="font-bold border-t-2">
                      <TableCell colSpan={7} className="text-xs">SUBTOTAL</TableCell>
                      <TableCell className="text-xs text-right">{g.total_service.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right">{g.total_discount.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right">{g.total_payable.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right">{g.total_received.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-right">{g.total_due.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
