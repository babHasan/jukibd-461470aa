import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, Plus, Search, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";

interface Warranty {
  id: string;
  job_id: string | null;
  job_number: string;
  customer_name: string;
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_type: string;
  terms: string;
  status: string;
}

const emptyForm = {
  job_number: "", customer_name: "", warranty_start_date: format(new Date(), "yyyy-MM-dd"),
  warranty_end_date: "", warranty_type: "Standard", terms: "", status: "active",
};

export default function WarrantyList() {
  const [items, setItems] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetch_ = async () => {
    const { data } = await supabase.from("warranties").select("*").order("warranty_end_date", { ascending: true });
    setItems((data as unknown as Warranty[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  const handleSave = async () => {
    if (!form.customer_name.trim() || !form.warranty_end_date) { toast.error("Customer & end date required"); return; }
    if (editId) {
      const { error } = await supabase.from("warranties").update({ ...form, updated_at: new Date().toISOString() } as any).eq("id", editId);
      if (error) { toast.error(error.message); return; }
      toast.success("Warranty updated");
    } else {
      const { error } = await supabase.from("warranties").insert(form as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Warranty added");
    }
    setOpen(false); setEditId(null); setForm(emptyForm); fetch_();
  };

  const handleEdit = (w: Warranty) => {
    setEditId(w.id);
    setForm({ job_number: w.job_number, customer_name: w.customer_name, warranty_start_date: w.warranty_start_date, warranty_end_date: w.warranty_end_date, warranty_type: w.warranty_type, terms: w.terms, status: w.status });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this warranty?")) return;
    await supabase.from("warranties").delete().eq("id", id);
    toast.success("Warranty deleted"); fetch_();
  };

  const getStatusBadge = (w: Warranty) => {
    if (w.status === "void") return <Badge variant="outline">Void</Badge>;
    const days = differenceInDays(parseISO(w.warranty_end_date), new Date());
    if (days < 0) return <Badge variant="destructive">Expired</Badge>;
    if (days <= 30) return <Badge className="bg-orange-500 text-white">Expiring Soon ({days}d)</Badge>;
    return <Badge className="bg-green-600 text-white">Active ({days}d left)</Badge>;
  };

  const filtered = items.filter(i =>
    i.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    i.job_number.toLowerCase().includes(search.toLowerCase())
  );

  const expiringSoon = items.filter(i => {
    if (i.status === "void") return false;
    const days = differenceInDays(parseISO(i.warranty_end_date), new Date());
    return days >= 0 && days <= 30;
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6" /> Warranty Tracking</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Warranty</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{editId ? "Edit Warranty" : "Add Warranty"}</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Job Number</Label><Input value={form.job_number} onChange={e => setForm({...form, job_number: e.target.value})} /></div>
                  <div><Label>Customer Name *</Label><Input value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Start Date</Label><Input type="date" value={form.warranty_start_date} onChange={e => setForm({...form, warranty_start_date: e.target.value})} /></div>
                  <div><Label>End Date *</Label><Input type="date" value={form.warranty_end_date} onChange={e => setForm({...form, warranty_end_date: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Type</Label><Input value={form.warranty_type} onChange={e => setForm({...form, warranty_type: e.target.value})} placeholder="Standard / Extended" /></div>
                  <div><Label>Status</Label>
                    <select className="w-full border rounded px-3 py-2 text-sm" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="active">Active</option><option value="void">Void</option>
                    </select>
                  </div>
                </div>
                <div><Label>Terms</Label><Input value={form.terms} onChange={e => setForm({...form, terms: e.target.value})} /></div>
                <Button onClick={handleSave}>{editId ? "Update" : "Add"} Warranty</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {expiringSoon.length > 0 && (
          <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-medium">
                <AlertTriangle className="h-5 w-5" />
                <span>{expiringSoon.length} warranty(ies) expiring within 30 days!</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by customer or job#..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No warranties found</TableCell></TableRow>
                ) : filtered.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="font-mono">{w.job_number || "-"}</TableCell>
                    <TableCell className="font-medium">{w.customer_name}</TableCell>
                    <TableCell>{w.warranty_type}</TableCell>
                    <TableCell>{format(parseISO(w.warranty_start_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{format(parseISO(w.warranty_end_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>{getStatusBadge(w)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(w)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(w.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
