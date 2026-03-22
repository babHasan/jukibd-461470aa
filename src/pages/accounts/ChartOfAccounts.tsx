import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";

const ACCOUNT_TYPES = ["Asset", "Liability", "Equity", "Revenue", "Expense"];

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  parent_id: string | null;
  description: string;
  is_active: boolean;
  created_at: string;
}

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [form, setForm] = useState({
    account_code: "",
    account_name: "",
    account_type: "Asset",
    parent_id: "",
    description: "",
  });

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chart_of_accounts")
      .select("*")
      .order("account_type")
      .order("account_code");
    if (error) toast.error(error.message);
    else setAccounts((data as Account[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const resetForm = () => {
    setForm({ account_code: "", account_name: "", account_type: "Asset", parent_id: "", description: "" });
    setEditingAccount(null);
  };

  const handleSubmit = async () => {
    if (!form.account_name.trim()) {
      toast.error("Account name is required");
      return;
    }
    const payload = {
      account_code: form.account_code,
      account_name: form.account_name,
      account_type: form.account_type,
      parent_id: form.parent_id || null,
      description: form.description,
    };

    if (editingAccount) {
      const { error } = await supabase
        .from("chart_of_accounts")
        .update(payload)
        .eq("id", editingAccount.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Account updated");
    } else {
      const { error } = await supabase
        .from("chart_of_accounts")
        .insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Account added");
    }
    resetForm();
    setDialogOpen(false);
    fetchAccounts();
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      parent_id: account.parent_id || "",
      description: account.description,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this account?")) return;
    const { error } = await supabase.from("chart_of_accounts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Account deleted"); fetchAccounts(); }
  };

  const filtered = accounts.filter((a) => {
    const matchSearch = a.account_name.toLowerCase().includes(search.toLowerCase()) ||
      a.account_code.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "All" || a.account_type === filterType;
    return matchSearch && matchType;
  });

  // Group by account_type
  const grouped = ACCOUNT_TYPES.reduce((acc, type) => {
    const items = filtered.filter((a) => a.account_type === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {} as Record<string, Account[]>);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-foreground">Chart of Accounts</h2>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Add Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Account Code</label>
                    <Input value={form.account_code} onChange={(e) => setForm({ ...form, account_code: e.target.value })} placeholder="e.g. 1001" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Account Type</label>
                    <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Account Name *</label>
                  <Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="Account name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Parent Account</label>
                  <Select value={form.parent_id} onValueChange={(v) => setForm({ ...form, parent_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {accounts.filter((a) => a.id !== editingAccount?.id).map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.account_code ? `${a.account_code} - ` : ""}{a.account_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
                </div>
                <Button onClick={handleSubmit} className="w-full">{editingAccount ? "Update" : "Save"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts..." className="pl-9" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No accounts found. Add your first account to get started.</p>
        ) : (
          Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{type}s</h3>
              <div className="rounded-lg border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-24">Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Description</TableHead>
                      <TableHead className="hidden sm:table-cell">Parent</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((account) => {
                      const parent = accounts.find((a) => a.id === account.parent_id);
                      return (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono text-xs">{account.account_code || "—"}</TableCell>
                          <TableCell className="font-medium">{account.account_name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{account.description || "—"}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{parent ? parent.account_name : "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
