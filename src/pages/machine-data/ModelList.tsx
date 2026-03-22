import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, PlusCircle, Edit, Search, FileUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Model {
  id: string;
  name: string;
  remarks: string;
}

export default function ModelList() {
  const { isAdmin } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("5");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Model | null>(null);
  const [form, setForm] = useState({ name: "", remarks: "" });
  const [saving, setSaving] = useState(false);

  async function fetchModels() {
    setLoading(true);
    const { data, error } = await supabase.from("models").select("*").order("created_at", { ascending: true });
    if (!error) setModels(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchModels(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", remarks: "" });
    setDialogOpen(true);
  }

  function openEdit(model: Model) {
    setEditing(model);
    setForm({ name: model.name, remarks: model.remarks });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Model name is required"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("models").update({ name: form.name.trim(), remarks: form.remarks.trim() }).eq("id", editing.id);
      if (error) toast.error("Failed to update"); else { toast.success("Model updated"); fetchModels(); }
    } else {
      const { error } = await supabase.from("models").insert({ name: form.name.trim(), remarks: form.remarks.trim() });
      if (error) toast.error("Failed to add model"); else { toast.success("Model added"); fetchModels(); }
    }
    setSaving(false);
    setDialogOpen(false);
  }

  const filtered = models.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.remarks.toLowerCase().includes(search.toLowerCase())
  );
  const displayed = perPage === "all" ? filtered : filtered.slice(0, parseInt(perPage));

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">MODEL LIST</h2>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAdd}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  ADD NEW MODEL
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Model" : "Add New Model"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Model Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. DDL-8000A" />
                  </div>
                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Input value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} placeholder="Optional remarks" />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select value={perPage} onValueChange={setPerPage}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">records</span>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-48" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="w-16">Sl No</TableHead>
                <TableHead>Model Name</TableHead>
                <TableHead>Remarks</TableHead>
                {isAdmin && <TableHead className="w-24 text-right">Edit</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : displayed.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No models found</TableCell></TableRow>
              ) : (
                displayed.map((model, idx) => (
                  <TableRow key={model.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell className="text-muted-foreground">{model.remarks || "—"}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button size="sm" variant="default" onClick={() => openEdit(model)}>
                          <Edit className="h-3.5 w-3.5 mr-1" /> EDIT
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} record(s) total</p>
      </div>
    </AppLayout>
  );
}
