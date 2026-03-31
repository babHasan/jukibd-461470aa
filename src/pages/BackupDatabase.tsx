import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, Download, Loader2, RefreshCw, ArrowUpFromLine, ArrowDownToLine, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import * as XLSX from "xlsx";

const TABLES = [
  "jobs",
  "clients",
  "branches",
  "brands",
  "models",
  "boards",
  "profiles",
  "sms_config",
  "sms_templates",
  "sms_logs",
  "user_activity_logs",
  "user_permissions",
  "user_roles",
] as const;

type TableName = (typeof TABLES)[number];

const BackupDatabase = () => {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ pushed?: number; pulled?: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importCurrentTable, setImportCurrentTable] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchAllRows(table: TableName) {
    const rows: any[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      rows.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }
    return rows;
  }

  async function handleExport() {
    setExporting(true);
    setProgress(0);
    try {
      const wb = XLSX.utils.book_new();
      for (let i = 0; i < TABLES.length; i++) {
        const table = TABLES[i];
        setCurrentTable(table);
        setProgress(Math.round(((i) / TABLES.length) * 100));
        const rows = await fetchAllRows(table);
        const ws = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
        XLSX.utils.book_append_sheet(wb, ws, table);
      }
      setProgress(100);
      setCurrentTable("");
      const now = new Date();
      const filename = `backup_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("Database backup downloaded successfully!");
    } catch (err: any) {
      console.error("Backup failed:", err);
      toast.error("Backup failed: " + (err.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  }

  async function handleMySQLSync(action: "push" | "pull" | "full_sync") {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");

      const { data, error } = await supabase.functions.invoke("mysql-sync", {
        body: { action },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Sync failed");

      setSyncResult({ pushed: data.pushed, pulled: data.pulled });
      toast.success(
        `MySQL Sync সম্পন্ন! Push: ${data.pushed || 0}, Pull: ${data.pulled || 0}`
      );
    } catch (err: any) {
      console.error("MySQL sync failed:", err);
      toast.error("MySQL Sync ব্যর্থ: " + (err.message || "Unknown error"));
    } finally {
      setSyncing(false);
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-6">
        {/* Excel Backup */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Backup Database</h2>
              <p className="text-sm text-muted-foreground">Export all data as an Excel file</p>
            </div>
          </div>
          <div className="rounded-md border bg-muted/30 p-4 space-y-1">
            <p className="text-sm font-medium text-foreground">Tables included:</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {TABLES.map((t) => (
                <span key={t} className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {t}
                </span>
              ))}
            </div>
          </div>
          {exporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {progress < 100 ? `Exporting: ${currentTable}...` : "Preparing download..."}
                </span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
          <Button onClick={handleExport} disabled={exporting} className="w-full gap-2" size="lg">
            {exporting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</>
            ) : (
              <><Download className="h-4 w-4" /> Export Database Backup</>
            )}
          </Button>
        </div>

        {/* MySQL Sync */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <RefreshCw className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">MySQL Sync</h2>
              <p className="text-sm text-muted-foreground">Sync jobs data with external MySQL database</p>
            </div>
          </div>
          {syncResult && (
            <div className="rounded-md border bg-green-50 p-3 text-sm text-green-800">
              সিঙ্ক সম্পন্ন — Pushed: <strong>{syncResult.pushed ?? 0}</strong>, Pulled: <strong>{syncResult.pulled ?? 0}</strong>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button onClick={() => handleMySQLSync("push")} disabled={syncing} variant="outline" className="gap-2">
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpFromLine className="h-4 w-4" />}
              Push to MySQL
            </Button>
            <Button onClick={() => handleMySQLSync("pull")} disabled={syncing} variant="outline" className="gap-2">
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
              Pull from MySQL
            </Button>
            <Button onClick={() => handleMySQLSync("full_sync")} disabled={syncing} className="gap-2">
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Full Sync
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default BackupDatabase;