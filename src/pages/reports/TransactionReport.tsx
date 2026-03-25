import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, FileText, Download, Trash2, Printer } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";

interface ReportJob {
  id: string;
  job_number: string;
  job_date: string;
  factory_challan_number: string;
  customer_name: string;
  customer_id: string | null;
  branch_name: string;
  brand_name: string;
  model_name: string;
  board_name: string;
  board_serial: string;
  details_of_problem: string;
  status: string;
  customer_mobile: string;
  customer_address: string;
  company_name: string;
  service_charge: number | null;
  payable_amount: number | null;
  receive_amount: number | null;
}

interface ReportGroup {
  key: string;
  job_date: string;
  factory_challan_number: string;
  invoice_count: number;
  customer_name: string;
  company_name: string;
  customer_mobile: string;
  customer_address: string;
  jobs: ReportJob[];
}

const statusOptions = [
  { value: "all", label: "All" },
  { value: "received", label: "Received" },
  { value: "diagnosing", label: "Diagnosing" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "picked-up", label: "Delivery" },
];

export default function TransactionReport() {
  const { isAdmin } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [customerFilter, setCustomerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobs, setJobs] = useState<ReportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; client_name: string }[]>([]);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);

    let query = supabase
      .from("jobs")
      .select("*, clients(contact_number, company_name, address)")
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

    const mapped = (data || []).map((j: any) => ({
      ...j,
      customer_mobile: j.clients?.contact_number || "",
      customer_address: j.clients?.address || "",
      company_name: j.clients?.company_name || "",
    }));

    // Filter by customer if needed
    const filtered = customerFilter === "all"
      ? mapped
      : mapped.filter((j: ReportJob) => j.customer_id === customerFilter || j.customer_name === customerFilter);

    setJobs(filtered);
    setLoading(false);
  }

  // Fetch customers for dropdown
  useEffect(() => {
    supabase.from("clients").select("id, client_name").order("client_name").then(({ data }) => {
      if (data) setCustomers(data);
    });
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, ReportGroup>();
    let invoiceCounter = 0;
    for (const job of jobs) {
      const key = `${job.customer_id || job.customer_name}_${job.job_date}_${job.factory_challan_number}`;
      if (!map.has(key)) {
        invoiceCounter++;
        map.set(key, {
          key,
          job_date: job.job_date,
          factory_challan_number: job.factory_challan_number,
          invoice_count: invoiceCounter,
          customer_name: job.customer_name,
          company_name: job.company_name,
          customer_mobile: job.customer_mobile,
          customer_address: job.customer_address,
          jobs: [],
        });
      }
      map.get(key)!.jobs.push(job);
    }
    return Array.from(map.values());
  }, [jobs]);

  async function handleDelete(group: ReportGroup) {
    if (!confirm(`Delete all ${group.jobs.length} job(s) in this group?`)) return;
    for (const job of group.jobs) {
      const { error } = await supabase.from("jobs").delete().eq("id", job.id);
      if (error) {
        toast.error(`Failed to delete job ${job.job_number}`);
        return;
      }
    }
    toast.success("Deleted successfully");
    handleSearch();
  }

  function exportExcel() {
    const rows = groups.map((g, i) => ({
      "Sl No": i + 1,
      Date: g.job_date,
      "Tr No": g.factory_challan_number,
      Invoice: g.invoice_count,
      "Customer Name": g.customer_name,
      Company: g.company_name,
      Mobile: g.customer_mobile,
      Address: g.customer_address,
      "Board(s)": g.jobs.map((j) => j.board_name).join(", "),
      Status: g.jobs.map((j) => j.status).join(", "),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaction Report");
    XLSX.writeFile(wb, `Transaction_Report_${fromDate}_to_${toDate}.xlsx`);
  }

  const statusLabel = statusOptions.find((s) => s.value === statusFilter)?.label || "All";
  const customerLabel = customerFilter === "all" ? "ALL" : (customers.find((c) => c.id === customerFilter)?.client_name || customerFilter);

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-lg bg-primary px-4 py-3">
          <h2 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />
            GENERATE TRANSACTION REPORT
          </h2>
        </div>

        {/* Filters */}
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
            <label className="text-xs font-semibold">Customer</label>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.client_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-destructive">Status*</label>
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

        {/* Report results */}
        {searched && (
          <div className="space-y-3">
            {/* Report info header */}
            <div className="flex items-start justify-between rounded-lg bg-primary p-4">
              <div className="text-sm font-bold text-primary-foreground space-y-0.5">
                <p>REPORT &nbsp; : &nbsp; {statusLabel.toUpperCase()}</p>
                <p>CUSTOMER &nbsp; : &nbsp; {customerLabel}</p>
                <p>DATE RANGE &nbsp; : &nbsp; FROM {fromDate} TO {toDate}</p>
              </div>
              <Button variant="secondary" size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={exportExcel}>
                <Download className="h-4 w-4" />
                EXCEL EXPORT
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-card overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold w-12">Sl No</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Tr No</TableHead>
                    <TableHead className="font-semibold w-16">Invoice</TableHead>
                    <TableHead className="font-semibold">Customer Info</TableHead>
                    <TableHead className="font-semibold">Service</TableHead>
                    <TableHead className="font-semibold text-center">Print</TableHead>
                    <TableHead className="font-semibold text-center">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                    </TableRow>
                  ) : groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No records found</TableCell>
                    </TableRow>
                  ) : (
                    groups.map((group, idx) => (
                      <TableRow key={group.key} className="align-top border-b">
                        <TableCell className="text-sm font-medium">{idx + 1}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{group.job_date}</TableCell>
                        <TableCell className="text-sm font-mono">{group.factory_challan_number || "—"}</TableCell>
                        <TableCell className="text-sm">{group.invoice_count}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-0.5">
                            <p className="font-medium">{group.company_name || group.customer_name}</p>
                            {group.customer_address && <p className="text-xs text-muted-foreground">{group.customer_address}</p>}
                            {group.customer_mobile && <p className="text-xs text-muted-foreground">{group.customer_mobile}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="rounded border overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-muted/60">
                                  <th className="px-2 py-1 text-left font-semibold">Name</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.jobs.map((job) => (
                                  <tr key={job.id} className="border-t">
                                    <td className="px-2 py-1">{job.board_name || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            <Button size="sm" variant="outline" className="text-[10px] h-7 bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                              onClick={() => {
                                const url = group.factory_challan_number
                                  ? `/print-invoice?challan=${encodeURIComponent(group.factory_challan_number)}&type=office`
                                  : `/print-invoice?job=${group.jobs[0].id}&type=office`;
                                window.open(url, "_blank");
                              }}
                            >
                              <Printer className="h-3 w-3 mr-1" />
                              OFFICE COPY
                            </Button>
                            <Button size="sm" variant="outline" className="text-[10px] h-7 bg-green-600 text-white hover:bg-green-700 border-green-600"
                              onClick={() => {
                                const url = group.factory_challan_number
                                  ? `/print-invoice?challan=${encodeURIComponent(group.factory_challan_number)}`
                                  : `/print-invoice?job=${group.jobs[0].id}`;
                                window.open(url, "_blank");
                              }}
                            >
                              <Printer className="h-3 w-3 mr-1" />
                            CLIENT COPY
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-[10px] h-7"
                            onClick={() => handleDelete(group)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            DELETE
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
