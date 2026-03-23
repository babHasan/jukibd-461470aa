import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, Banknote, Download, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import * as XLSX from "xlsx";

export default function BalanceSheet() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);
  const [data, setData] = useState<{ cashIn: number; cashOut: number; jobCollection: number; otherIncome: number; expenses: number } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);

    const [jobsRes, incomesRes, expensesRes] = await Promise.all([
      supabase
        .from("jobs")
        .select("receive_amount")
        .gte("job_date", fromDate)
        .lte("job_date", toDate)
        .gt("receive_amount", 0),
      supabase
        .from("incomes")
        .select("amount")
        .gte("income_date", fromDate)
        .lte("income_date", toDate),
      supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", fromDate)
        .lte("expense_date", toDate),
    ]);

    const jobCollection = (jobsRes.data || []).reduce((s: number, j: any) => s + (Number(j.receive_amount) || 0), 0);
    const otherIncome = (incomesRes.data || []).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
    const expenses = (expensesRes.data || []).reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);

    setData({
      cashIn: jobCollection + otherIncome,
      cashOut: expenses,
      jobCollection,
      otherIncome,
      expenses,
    });
    setLoading(false);
  }

  const balance = data ? data.cashIn - data.cashOut : 0;

  function exportExcel() {
    if (!data) return;
    const rows = [
      { "Particulars": "Job Collection", "Amount (৳)": data.jobCollection },
      { "Particulars": "Other Income", "Amount (৳)": data.otherIncome },
      { "Particulars": "TOTAL CASH IN", "Amount (৳)": data.cashIn },
      { "Particulars": "", "Amount (৳)": "" as any },
      { "Particulars": "Expenses", "Amount (৳)": data.expenses },
      { "Particulars": "TOTAL CASH OUT", "Amount (৳)": data.cashOut },
      { "Particulars": "", "Amount (৳)": "" as any },
      { "Particulars": "NET BALANCE", "Amount (৳)": balance },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Balance Sheet");
    XLSX.writeFile(wb, `Balance_Sheet_${fromDate}_to_${toDate}.xlsx`);
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="rounded-lg bg-primary px-4 py-3">
          <h2 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            BALANCE SHEET
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
            GENERATE
          </Button>
        </div>

        {data && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={exportExcel}>
                <Download className="h-4 w-4" />
                EXCEL
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Cash In Summary */}
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-bold text-sm text-green-700 uppercase tracking-wide">Cash In</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Job Collection</span>
                      <span className="font-medium">৳ {data.jobCollection.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Other Income</span>
                      <span className="font-medium">৳ {data.otherIncome.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-green-700">
                      <span>Total Cash In</span>
                      <span>৳ {data.cashIn.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Out Summary */}
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-bold text-sm text-red-700 uppercase tracking-wide">Cash Out</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expenses</span>
                      <span className="font-medium">৳ {data.expenses.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-bold text-red-700">
                      <span>Total Cash Out</span>
                      <span>৳ {data.cashOut.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Net Balance */}
              <Card className={`border-l-4 ${balance >= 0 ? "border-l-blue-500" : "border-l-orange-500"}`}>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: balance >= 0 ? "hsl(220, 70%, 55%)" : "hsl(30, 90%, 50%)" }}>
                    Net Balance
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cash In</span>
                      <span className="font-medium text-green-600">+ ৳ {data.cashIn.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cash Out</span>
                      <span className="font-medium text-red-600">- ৳ {data.cashOut.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className={`flex justify-between border-t pt-2 font-bold text-lg ${balance >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                      <span>Balance</span>
                      <span>৳ {balance.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Showing data from {fromDate} to {toDate}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
