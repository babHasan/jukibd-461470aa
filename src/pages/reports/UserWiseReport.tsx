import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Printer } from "lucide-react";
import * as XLSX from "xlsx";

interface Profile {
  id: string;
  name: string;
}

interface JobRow {
  id: string;
  job_number: string;
  brand_name: string;
  model_name: string;
  board_name: string;
  customer_name: string;
  factory_challan_number: string;
  job_date: string;
  status: string;
  service_charge: number | null;
  payable_amount: number | null;
  receive_amount: number | null;
  created_by: string | null;
  created_by_name: string;
  delivered_by_name: string;
}

export default function UserWiseReport() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState("all");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("id, name").order("name").then(({ data }) => {
      if (data) setProfiles(data);
    });
  }, []);

  async function fetchReport() {
    setLoading(true);
    let query = supabase
      .from("jobs")
      .select("id, job_number, brand_name, model_name, board_name, customer_name, factory_challan_number, job_date, status, service_charge, payable_amount, receive_amount, created_by, created_by_name, delivered_by_name")
      .gte("job_date", dateFrom)
      .lte("job_date", dateTo)
      .order("job_date", { ascending: false });

    if (selectedUser !== "all") {
      query = query.eq("created_by", selectedUser);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to fetch report");
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchReport();
  }, []);

  // Group jobs by user
  const groupedByUser = jobs.reduce<Record<string, { name: string; jobs: JobRow[] }>>((acc, job) => {
    const key = job.created_by || "unknown";
    const name = job.created_by_name || "Unknown User";
    if (!acc[key]) acc[key] = { name, jobs: [] };
    acc[key].jobs.push(job);
    return acc;
  }, {});

  const totalJobs = jobs.length;
  const totalCharge = jobs.reduce((s, j) => s + (j.service_charge || 0), 0);
  const totalPayable = jobs.reduce((s, j) => s + (j.payable_amount || 0), 0);
  const totalReceived = jobs.reduce((s, j) => s + (j.receive_amount || 0), 0);

  function exportExcel() {
    if (jobs.length === 0) { toast.error("No data to export"); return; }

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = Object.entries(groupedByUser).map(([, g]) => ({
      "User Name": g.name,
      "Total Jobs": g.jobs.length,
      "Service Charge": g.jobs.reduce((s, j) => s + (j.service_charge || 0), 0),
      "Payable": g.jobs.reduce((s, j) => s + (j.payable_amount || 0), 0),
      "Received": g.jobs.reduce((s, j) => s + (j.receive_amount || 0), 0),
      "Due": g.jobs.reduce((s, j) => s + ((j.payable_amount || 0) - (j.receive_amount || 0)), 0),
    }));
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    // Detail sheet
    const detailData = jobs.map((j, i) => ({
      SL: i + 1,
      "Job No": j.job_number,
      "Date": j.job_date,
      "Customer": j.customer_name,
      "Brand": j.brand_name,
      "Model": j.model_name,
      "Board": j.board_name,
      "Challan": j.factory_challan_number,
      "Status": j.status,
      "Charge": j.service_charge || 0,
      "Payable": j.payable_amount || 0,
      "Received": j.receive_amount || 0,
      "Created By": j.created_by_name,
      "Delivered By": j.delivered_by_name,
    }));
    const ws2 = XLSX.utils.json_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, ws2, "Details");

    XLSX.writeFile(wb, `User_Wise_Report_${dateFrom}_to_${dateTo}.xlsx`);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader className="bg-primary py-2 px-4 rounded-t-lg">
            <CardTitle className="text-sm font-bold text-primary-foreground uppercase">User Wise Job Report</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">User</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="All Users" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">From</label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-sm w-40" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">To</label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-sm w-40" />
              </div>
              <Button size="sm" onClick={fetchReport} disabled={loading}>
                {loading ? "Loading..." : "Search"}
              </Button>
              <Button size="sm" variant="outline" onClick={exportExcel} className="gap-1">
                <FileText className="h-3.5 w-3.5" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1 no-print">
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-lg border bg-blue-50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Jobs</p>
                <p className="text-lg font-bold text-blue-700">{totalJobs}</p>
              </div>
              <div className="rounded-lg border bg-green-50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Charge</p>
                <p className="text-lg font-bold text-green-700">{totalCharge.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border bg-purple-50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Payable</p>
                <p className="text-lg font-bold text-purple-700">{totalPayable.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border bg-orange-50 p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Received</p>
                <p className="text-lg font-bold text-orange-700">{totalReceived.toLocaleString()}</p>
              </div>
            </div>

            {/* User-wise grouped tables */}
            {Object.entries(groupedByUser).map(([userId, group]) => {
              const userTotal = group.jobs.reduce((s, j) => s + (j.service_charge || 0), 0);
              const userPayable = group.jobs.reduce((s, j) => s + (j.payable_amount || 0), 0);
              const userReceived = group.jobs.reduce((s, j) => s + (j.receive_amount || 0), 0);
              return (
                <div key={userId} className="mb-6">
                  <div className="flex items-center justify-between bg-muted/60 rounded-t-lg px-4 py-2 border border-b-0">
                    <h3 className="text-sm font-bold">{group.name} <span className="text-muted-foreground font-normal">({group.jobs.length} jobs)</span></h3>
                    <div className="flex gap-4 text-xs">
                      <span>Charge: <strong>{userTotal.toLocaleString()}</strong></span>
                      <span>Payable: <strong>{userPayable.toLocaleString()}</strong></span>
                      <span>Received: <strong>{userReceived.toLocaleString()}</strong></span>
                      <span>Due: <strong>{(userPayable - userReceived).toLocaleString()}</strong></span>
                    </div>
                  </div>
                  <div className="overflow-auto border rounded-b-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs w-10">SL</TableHead>
                          <TableHead className="text-xs">Job No</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Customer</TableHead>
                          <TableHead className="text-xs">Brand</TableHead>
                          <TableHead className="text-xs">Model</TableHead>
                          <TableHead className="text-xs">Challan</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Charge</TableHead>
                          <TableHead className="text-xs text-right">Payable</TableHead>
                          <TableHead className="text-xs text-right">Received</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.jobs.map((job, idx) => (
                          <TableRow key={job.id}>
                            <TableCell className="text-xs">{idx + 1}</TableCell>
                            <TableCell className="text-xs font-mono">{job.job_number}</TableCell>
                            <TableCell className="text-xs">{job.job_date}</TableCell>
                            <TableCell className="text-xs">{job.customer_name}</TableCell>
                            <TableCell className="text-xs">{job.brand_name}</TableCell>
                            <TableCell className="text-xs">{job.model_name}</TableCell>
                            <TableCell className="text-xs">{job.factory_challan_number}</TableCell>
                            <TableCell className="text-xs capitalize">{job.status}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums">{(job.service_charge || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums">{(job.payable_amount || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right tabular-nums">{(job.receive_amount || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}

            {jobs.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">No data found for the selected criteria.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
