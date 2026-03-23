import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, TrendingDown, Download, Loader2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import * as XLSX from "xlsx";

interface CashOutRow {
  id: string;
  date: string;
  category: string;
  description: string;
  memo_no: string;
  amount: number;
}

export default function CashOut() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [rows, setRows] = useState<CashOutRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .gte("expense_date", fromDate)
      .lte("expense_date", toDate)
      .order("expense_date", { ascending: true });

    if (error) {
      toast.error("Failed to fetch expense data");
      setLoading(false);
      return;
    }

    setRows((data || []).map((e: any) => ({
      id: e.id,
      date: e.expense_date,
      category: e.category_name || "",
      description: e.service_provider || e.remarks || "",
      memo_no: e.memo_no || "",
      amount: Number(e.amount) || 0,
    })));
    setLoading(false);
  }

  const total = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);

  function exportExcel() {
    const data = rows.map((r, i) => ({
      "Sl": i + 1,
      "Date": r.date,
      "Category": r.category,
      "Description": r.description,
      "Memo No": r.memo_no,
      "Amount (৳)": r.amount,
    }));
    data.push({ Sl: "" as any, Date: "", Category: "", Description: "", "Memo No": "TOTAL", "Amount (৳)": total });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cash Out");
    XLSX.writeFile(wb, `Cash_Out_${fromDate}_to_${toDate}.xlsx`);
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="rounded-lg bg-primary px-4 py-3">
          <h2 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            CASH OUT REPORT
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
                <p>CASH OUT &nbsp;|&nbsp; {fromDate} to {toDate}</p>
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
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Memo No</TableHead>
                    <TableHead className="text-right">Amount (৳)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No cash-out records found</TableCell></TableRow>
                  ) : (
                    <>
                      {rows.map((r, i) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">{i + 1}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{r.date}</TableCell>
                          <TableCell className="text-sm">{r.category}</TableCell>
                          <TableCell className="text-sm">{r.description || "—"}</TableCell>
                          <TableCell className="text-sm">{r.memo_no || "—"}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{r.amount.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2 bg-red-50">
                        <TableCell colSpan={5} className="text-sm text-right">TOTAL CASH OUT</TableCell>
                        <TableCell className="text-sm text-right text-red-700">৳ {total.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</TableCell>
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
