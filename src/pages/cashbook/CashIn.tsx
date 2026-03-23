import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, TrendingUp, Download, Loader2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import * as XLSX from "xlsx";

interface CashInRow {
  id: string;
  date: string;
  description: string;
  source: string;
  amount: number;
  type: "job_collection" | "income";
}

export default function CashIn() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [rows, setRows] = useState<CashInRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);

    const [jobsRes, incomesRes] = await Promise.all([
      supabase
        .from("jobs")
        .select("id, job_date, customer_name, factory_challan_number, receive_amount")
        .gte("job_date", fromDate)
        .lte("job_date", toDate)
        .gt("receive_amount", 0),
      supabase
        .from("incomes")
        .select("id, income_date, category_name, remarks, amount")
        .gte("income_date", fromDate)
        .lte("income_date", toDate),
    ]);

    const cashInRows: CashInRow[] = [];

    (jobsRes.data || []).forEach((j: any) => {
      cashInRows.push({
        id: j.id,
        date: j.job_date,
        description: `Job Collection - ${j.customer_name}`,
        source: j.factory_challan_number || "Direct",
        amount: Number(j.receive_amount) || 0,
        type: "job_collection",
      });
    });

    (incomesRes.data || []).forEach((inc: any) => {
      cashInRows.push({
        id: inc.id,
        date: inc.income_date,
        description: inc.category_name || "Income",
        source: inc.remarks || "",
        amount: Number(inc.amount) || 0,
        type: "income",
      });
    });

    cashInRows.sort((a, b) => a.date.localeCompare(b.date));
    setRows(cashInRows);
    setLoading(false);
  }

  const total = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);

  function exportExcel() {
    const data = rows.map((r, i) => ({
      "Sl": i + 1,
      "Date": r.date,
      "Description": r.description,
      "Source/Ref": r.source,
      "Amount (৳)": r.amount,
    }));
    data.push({ Sl: "" as any, Date: "", Description: "", "Source/Ref": "TOTAL", "Amount (৳)": total });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cash In");
    XLSX.writeFile(wb, `Cash_In_${fromDate}_to_${toDate}.xlsx`);
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="rounded-lg bg-primary px-4 py-3">
          <h2 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            CASH IN REPORT
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
          <Button onClick={handleSearch} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            SEARCH
          </Button>
        </div>

        {searched && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-primary p-4">
              <div className="text-sm font-bold text-primary-foreground">
                <p>CASH IN &nbsp;|&nbsp; {fromDate} to {toDate}</p>
              </div>
              <Button variant="secondary" size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={exportExcel}>
                <Download className="h-4 w-4" />
                EXCEL
              </Button>
            </div>

            <div className="rounded-lg border bg-card overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Sl</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Source/Ref</TableHead>
                    <TableHead className="text-right">Amount (৳)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No cash-in records found</TableCell></TableRow>
                  ) : (
                    <>
                      {rows.map((r, i) => (
                        <TableRow key={r.id + r.type}>
                          <TableCell className="text-sm">{i + 1}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{r.date}</TableCell>
                          <TableCell className="text-sm">{r.description}</TableCell>
                          <TableCell className="text-sm">{r.source || "—"}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{r.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2 bg-green-50">
                        <TableCell colSpan={4} className="text-sm text-right">TOTAL CASH IN</TableCell>
                        <TableCell className="text-sm text-right text-green-700">৳ {total.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</TableCell>
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
