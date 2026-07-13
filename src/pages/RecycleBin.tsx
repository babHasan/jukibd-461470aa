import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { RotateCcw, Trash2, Search, Loader2 } from "lucide-react";

interface DeletedRow {
  table_name: string;
  row_id: string;
  label: string;
  deleted_at: string;
  deleted_by: string | null;
  deleted_by_name: string | null;
  data: Record<string, any>;
}

const TABLE_LABELS: Record<string, string> = {
  jobs: "Jobs",
  clients: "Clients",
  expenses: "Expenses",
  incomes: "Incomes",
  inventory: "Inventory",
  warranties: "Warranties",
  brands: "Brands",
  models: "Models",
  boards: "Boards",
  chart_of_accounts: "Chart of Accounts",
  branches: "Branches",
  expense_categories: "Expense Categories",
  income_categories: "Income Categories",
};

export default function RecycleBin() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<DeletedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_deleted_rows");
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
      setRows([]);
    } else {
      setRows((data as DeletedRow[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  async function restore(row: DeletedRow) {
    setBusy(row.row_id);
    const { error } = await supabase.rpc("restore_deleted_row", {
      _table: row.table_name,
      _id: row.row_id,
    });
    setBusy(null);
    if (error) {
      toast({ title: "Restore failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Restored", description: `${TABLE_LABELS[row.table_name]}: ${row.label}` });
      load();
    }
  }

  async function purge(row: DeletedRow) {
    if (!confirm(`Permanently delete "${row.label}"? This cannot be undone.`)) return;
    setBusy(row.row_id);
    const { error } = await supabase.rpc("purge_deleted_row", {
      _table: row.table_name,
      _id: row.row_id,
    });
    setBusy(null);
    if (error) {
      toast({ title: "Purge failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Permanently deleted", description: row.label });
      load();
    }
  }

  if (authLoading) return null;
  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const tableCounts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.table_name] = (acc[r.table_name] || 0) + 1;
    return acc;
  }, {});

  const filtered = rows.filter((r) => {
    if (filter !== "all" && r.table_name !== filter) return false;
    if (search && !r.label.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-destructive" /> Recycle Bin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Super-admin only. Rows deleted from anywhere in the app appear here. Restore them or purge them permanently.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All ({rows.length})
          </Button>
          {Object.keys(TABLE_LABELS).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={filter === t ? "default" : "outline"}
              onClick={() => setFilter(t)}
            >
              {TABLE_LABELS[t]} ({tableCounts[t] || 0})
            </Button>
          ))}
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deleted items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Recycle bin is empty.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Deleted By</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={`${r.table_name}-${r.row_id}`}>
                      <TableCell className="font-medium text-xs uppercase text-muted-foreground">
                        {TABLE_LABELS[r.table_name] || r.table_name}
                      </TableCell>
                      <TableCell className="font-medium">{r.label}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.deleted_by_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(r.deleted_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2 whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy === r.row_id}
                          onClick={() => restore(r)}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy === r.row_id}
                          onClick={() => purge(r)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Purge
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}