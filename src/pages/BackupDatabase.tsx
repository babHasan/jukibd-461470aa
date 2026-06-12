import { useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, Download, Loader2, RefreshCw, ArrowUpFromLine, ArrowDownToLine, Upload } from "lucide-react";
import { FileCode } from "lucide-react";
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
  const [sqlExporting, setSqlExporting] = useState(false);
  const [sqlProgress, setSqlProgress] = useState(0);
  const [sqlCurrentTable, setSqlCurrentTable] = useState("");
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

  function sqlEscape(val: any): string {
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "number") return isFinite(val) ? String(val) : "NULL";
    if (typeof val === "boolean") return val ? "1" : "0";
    if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
    if (typeof val === "object") {
      return `'${JSON.stringify(val).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
    }
    const s = String(val);
    return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
  }

  function inferMysqlType(values: any[]): string {
    const sample = values.find((v) => v !== null && v !== undefined);
    if (sample === undefined) return "TEXT";
    if (typeof sample === "number") {
      return Number.isInteger(sample) ? "BIGINT" : "DECIMAL(18,4)";
    }
    if (typeof sample === "boolean") return "TINYINT(1)";
    if (typeof sample === "object") return "JSON";
    const s = String(sample);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return "DATETIME";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return "DATE";
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return "VARCHAR(36)";
    const maxLen = Math.max(...values.filter((v) => v != null).map((v) => String(v).length), 1);
    if (maxLen <= 255) return "VARCHAR(255)";
    return "TEXT";
  }

  function formatValueForSql(val: any): any {
    if (val === null || val === undefined) return null;
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
      return val.slice(0, 19).replace("T", " ");
    }
    return val;
  }

  async function handleSqlExport() {
    setSqlExporting(true);
    setSqlProgress(0);
    try {
      const lines: string[] = [];
      const now = new Date();
      lines.push(`-- MySQL Database Dump`);
      lines.push(`-- Generated: ${now.toISOString()}`);
      lines.push(`-- Source: Lovable Cloud (PostgreSQL) → MySQL Compatible Export`);
      lines.push(``);
      lines.push(`SET FOREIGN_KEY_CHECKS=0;`);
      lines.push(`SET NAMES utf8mb4;`);
      lines.push(``);

      for (let i = 0; i < TABLES.length; i++) {
        const table = TABLES[i];
        setSqlCurrentTable(table);
        setSqlProgress(Math.round((i / TABLES.length) * 100));

        const rows = await fetchAllRows(table);

        lines.push(`-- ---------------------------`);
        lines.push(`-- Table: ${table}`);
        lines.push(`-- ---------------------------`);
        lines.push(`DROP TABLE IF EXISTS \`${table}\`;`);

        if (rows.length === 0) {
          lines.push(`-- (no rows; schema unknown — table not created)`);
          lines.push(``);
          continue;
        }

        const cols = Object.keys(rows[0]);
        const colDefs = cols.map((c) => {
          const vals = rows.map((r) => r[c]);
          const type = inferMysqlType(vals);
          const isId = c === "id";
          return `  \`${c}\` ${type}${isId ? " NOT NULL" : " NULL"}`;
        });
        if (cols.includes("id")) colDefs.push(`  PRIMARY KEY (\`id\`)`);

        lines.push(`CREATE TABLE \`${table}\` (`);
        lines.push(colDefs.join(",\n"));
        lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
        lines.push(``);

        const colList = cols.map((c) => `\`${c}\``).join(", ");
        const batchSize = 100;
        for (let j = 0; j < rows.length; j += batchSize) {
          const batch = rows.slice(j, j + batchSize);
          const values = batch
            .map(
              (r) =>
                `(${cols.map((c) => sqlEscape(formatValueForSql(r[c]))).join(", ")})`
            )
            .join(",\n");
          lines.push(`INSERT INTO \`${table}\` (${colList}) VALUES\n${values};`);
        }
        lines.push(``);
      }

      lines.push(`SET FOREIGN_KEY_CHECKS=1;`);
      setSqlProgress(100);
      setSqlCurrentTable("");

      const blob = new Blob([lines.join("\n")], { type: "application/sql" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fname = `backup_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.sql`;
      a.href = url;
      a.download = fname;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("MySQL SQL dump downloaded! Import via phpMyAdmin.");
    } catch (err: any) {
      console.error("SQL export failed:", err);
      toast.error("SQL export failed: " + (err.message || "Unknown error"));
    } finally {
      setSqlExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportProgress(0);
    let totalInserted = 0;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });

      const validSheets = wb.SheetNames.filter((name) =>
        TABLES.includes(name as TableName)
      );

      if (validSheets.length === 0) {
        toast.error("No valid table sheets found in file");
        return;
      }

      for (let i = 0; i < validSheets.length; i++) {
        const sheetName = validSheets[i] as TableName;
        setImportCurrentTable(sheetName);
        setImportProgress(Math.round((i / validSheets.length) * 100));

        const ws = wb.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        if (rows.length === 0) continue;

        // Upsert in batches of 100
        for (let j = 0; j < rows.length; j += 100) {
          const batch = rows.slice(j, j + 100);
          const { error } = await supabase
            .from(sheetName)
            .upsert(batch, { onConflict: "id" });
          if (error) {
            console.error(`Import error on ${sheetName}:`, error);
            toast.error(`${sheetName} import error: ${error.message}`);
          } else {
            totalInserted += batch.length;
          }
        }
      }

      setImportProgress(100);
      setImportCurrentTable("");
      toast.success(`Database restore complete! ${totalInserted} records imported.`);
    } catch (err: any) {
      console.error("Import failed:", err);
      toast.error("Import failed: " + (err.message || "Unknown error"));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

        {/* Database Import/Restore */}
        <div className="rounded-lg border bg-card p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Restore Database</h2>
              <p className="text-sm text-muted-foreground">Upload backup Excel file to restore data</p>
            </div>
          </div>
          <div className="rounded-md border bg-destructive/5 p-4 text-sm text-destructive">
            ⚠️ Warning: This will overwrite existing records with matching IDs. Please ensure you are uploading a valid backup file.
          </div>
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {importProgress < 100 ? `Importing: ${importCurrentTable}...` : "Finalizing..."}
                </span>
                <span className="font-medium text-foreground">{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            variant="outline"
            className="w-full gap-2"
            size="lg"
          >
            {importing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload & Restore Database</>
            )}
          </Button>
        </div>
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