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

interface ExpenseRow {
  id: string;
  expense_date: string;
  created_at: string;
  category_name: string;
  memo_no: string;
  service_provider: string;
  service_provider_memo: string;
  remarks: string;
  amount: number;
}

export default function ExpenseReport() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase.from("expense_categories").select("id, name").order("name").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  async function handleSearch() {
    setLoading(true);
    setSearched(true);

    let query = supabase
      .from("expenses")
      .select("*")
      .gte("expense_date", fromDate)
      .lte("expense_date", toDate)
      .order("expense_date", { ascending: true });

    if (categoryFilter !== "all") {
      query = query.eq("category_id", categoryFilter);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to fetch expense data");
      setLoading(false);
      return;
    }

    setRows((data || []).map((e: any) => ({
      ...e,
      amount: Number(e.amount) || 0,
    })));
    setLoading(false);
  }

  const totalAmount = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);

  function formatTime(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    } catch {
      return "";
    }
  }

  function exportExcel() {
    const data = rows.map((r, i) => ({
      "Sl No": i + 1,
      "Date": r.expense_date,
      "Time": formatTime(r.created_at),
      "Category": r.category_name,
      "Memo No": r.memo_no,
      "Service Provider": r.service_provider,
      "Provider Memo": r.service_provider_memo,
      "Remarks": r.remarks,
      "Amount": r.amount,
    }));
    data.push({ "Sl No": "" as any, Date: "", Time: "", Category: "", "Memo No": "", "Service Provider": "", "Provider Memo": "", Remarks: "TOTAL", Amount: totalAmount });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expense Report");
    XLSX.writeFile(wb, `Expense_Report_${fromDate}_to_${toDate}.xlsx`);
  }

  const categoryLabel = categoryFilter === "all" ? "ALL" : (categories.find((c) => c.id === categoryFilter)?.name || categoryFilter);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="rounded-lg bg-primary px-4 py-3">
          <h2 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
            <FileText className="h-5 w-5" />
            GENERATE EXPENSE REPORT
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
            <label className="text-xs font-semibold">Expense</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                <p>REPORT &nbsp; : &nbsp; EXPENSE</p>
                <p>CATEGORY &nbsp; : &nbsp; {categoryLabel}</p>
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
                    <TableHead className="font-semibold w-12">Sl No</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Time</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Memo No</TableHead>
                    <TableHead className="font-semibold">Service Provider</TableHead>
                    <TableHead className="font-semibold">Provider Memo</TableHead>
                    <TableHead className="font-semibold">Remarks</TableHead>
                    <TableHead className="font-semibold text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
                  ) : (
                    <>
                      {rows.map((r, idx) => (
                        <TableRow key={r.id} className="border-b bg-cyan-50/50">
                          <TableCell className="text-sm">{idx + 1}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{r.expense_date}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">{formatTime(r.created_at)}</TableCell>
                          <TableCell className="text-sm">{r.category_name}</TableCell>
                          <TableCell className="text-sm">{r.memo_no || "—"}</TableCell>
                          <TableCell className="text-sm">{r.service_provider || "—"}</TableCell>
                          <TableCell className="text-sm">{r.service_provider_memo || "—"}</TableCell>
                          <TableCell className="text-sm">{r.remarks || "—"}</TableCell>
                          <TableCell className="text-sm text-right font-medium">{r.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold border-t-2">
                        <TableCell colSpan={8} className="text-sm">TOTAL</TableCell>
                        <TableCell className="text-sm text-right">{totalAmount.toFixed(2)}</TableCell>
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
