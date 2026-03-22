import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, FileText, Download, Printer } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import * as XLSX from "xlsx";

interface CollectionRow {
  id: string;
  job_date: string;
  factory_challan_number: string;
  customer_name: string;
  customer_id: string | null;
  customer_mobile: string;
  company_name: string;
  receive_amount: number;
  discount: number;
  memo_number: string;
}

interface CollectionGroup {
  key: string;
  job_date: string;
  factory_challan_number: string;
  memo: string;
  customer_name: string;
  company_name: string;
  customer_mobile: string;
  collect_amount: number;
  rebate_amount: number;
}

export default function CollectionReport() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [customerFilter, setCustomerFilter] = useState("all");
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; client_name: string }[]>([]);

  useEffect(() => {
    supabase.from("clients").select("id, client_name").order("client_name").then(({ data }) => {
      if (data) setCustomers(data);
    });
  }, []);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);

    let query = supabase
      .from("jobs")
      .select("id, job_date, factory_challan_number, customer_name, customer_id, receive_amount, discount, clients(contact_number, company_name)")
      .gte("job_date", fromDate)
      .lte("job_date", toDate)
      .gt("receive_amount", 0)
      .order("job_date", { ascending: true });

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to fetch collection data");
      setLoading(false);
      return;
    }

    let mapped = (data || []).map((j: any) => ({
      ...j,
      customer_mobile: j.clients?.contact_number || "",
      company_name: j.clients?.company_name || "",
      receive_amount: Number(j.receive_amount) || 0,
      discount: Number(j.discount) || 0,
      memo_number: j.factory_challan_number || "",
    }));

    if (customerFilter !== "all") {
      mapped = mapped.filter((j: CollectionRow) => j.customer_id === customerFilter);
    }

    setRows(mapped);
    setLoading(false);
  }

  const groups = useMemo(() => {
    const map = new Map<string, CollectionGroup>();
    for (const row of rows) {
      const key = `${row.customer_id || row.customer_name}_${row.job_date}_${row.factory_challan_number}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          job_date: row.job_date,
          factory_challan_number: row.factory_challan_number,
          memo: row.factory_challan_number,
          customer_name: row.company_name || row.customer_name,
          company_name: row.company_name,
          customer_mobile: row.customer_mobile,
          collect_amount: 0,
          rebate_amount: 0,
        });
      }
      const g = map.get(key)!;
      g.collect_amount += row.receive_amount;
      g.rebate_amount += row.discount;
    }
    return Array.from(map.values());
  }, [rows]);

  const totalCollect = groups.reduce((s, g) => s + g.collect_amount, 0);
  const totalRebate = groups.reduce((s, g) => s + g.rebate_amount, 0);

  function exportExcel() {
    const data = groups.map((g, i) => ({
      "Sl": i + 1,
      "Date": g.job_date,
      "Tr No": g.factory_challan_number,
      "Memo": g.memo,
      "Customer": g.customer_name,
      "Mobile": g.customer_mobile,
      "Collect Amount": g.collect_amount,
      "Rebate Amount": g.rebate_amount,
    }));
    data.push({ Sl: "" as any, Date: "", "Tr No": "", Memo: "", Customer: "", Mobile: "TOTAL", "Collect Amount": totalCollect, "Rebate Amount": totalRebate });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Collection Report");
    XLSX.writeFile(wb, `Collection_Report_${fromDate}_to_${toDate}.xlsx`);
  }

  const customerLabel = customerFilter === "all" ? "ALL" : (customers.find((c) => c.id === customerFilter)?.client_name || customerFilter);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="rounded-lg bg-primary px-4 py-3">
          <h2 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />
            GENERATE COLLECTION REPORT
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
          <Button onClick={handleSearch} disabled={loading} className="gap-2">
            <Search className="h-4 w-4" />
            SEARCH
          </Button>
        </div>

        {searched && (
          <div className="space-y-3">
            <div className="flex items-start justify-between rounded-lg bg-primary p-4">
              <div className="text-sm font-bold text-primary-foreground space-y-0.5">
                <p>REPORT &nbsp; : &nbsp; COLLECTION</p>
                <p>CUSTOMER &nbsp; : &nbsp; {customerLabel}</p>
                <p>DATE RANGE &nbsp; : &nbsp; FROM {fromDate} TO {toDate}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={exportExcel}>
                  <Download className="h-4 w-4" />
                  EXCEL EXPORT
                </Button>
                <Button variant="secondary" size="sm" className="gap-2" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  PRINT
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-card overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-cyan-100">
                    <TableHead className="font-semibold w-12">Sl</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Tr No</TableHead>
                    <TableHead className="font-semibold">Memo</TableHead>
                    <TableHead className="font-semibold">Customer</TableHead>
                    <TableHead className="font-semibold">Mobile</TableHead>
                    <TableHead className="font-semibold text-right">Collect Amount</TableHead>
                    <TableHead className="font-semibold text-right">Rebate Amount</TableHead>
                    <TableHead className="font-semibold text-center">Print</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
                  ) : groups.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
                  ) : (
                    <>
                      {groups.map((g, idx) => (
                        <TableRow key={g.key} className="border-b bg-cyan-50/50">
                          <TableCell className="text-sm">{idx + 1}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{g.job_date}</TableCell>
                          <TableCell className="text-sm font-mono text-xs">{g.factory_challan_number || "—"}</TableCell>
                          <TableCell className="text-sm">{g.memo || "—"}</TableCell>
                          <TableCell className="text-sm font-medium">{g.customer_name}</TableCell>
                          <TableCell className="text-sm">{g.customer_mobile}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{g.collect_amount.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-right">{g.rebate_amount.toFixed(2)}</TableCell>
                          <TableCell className="text-center">
                            <Button size="sm" variant="outline" className="text-[10px] h-7 bg-blue-600 text-white hover:bg-blue-700 border-blue-600">
                              PRINT
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell colSpan={6} className="text-sm">TOTAL</TableCell>
                        <TableCell className="text-sm text-right">{totalCollect.toFixed(2)}</TableCell>
                        <TableCell className="text-sm text-right">{totalRebate.toFixed(2)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </>
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
