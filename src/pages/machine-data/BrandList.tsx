import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Laptop, PlusCircle, Edit, Search, FileUp } from "lucide-react";
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

interface Brand {
  id: string;
  name: string;
  remarks: string;
}

export default function BrandList() {
  const { isAdmin } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("5");

  // Add/Edit state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: "", remarks: "" });
  const [saving, setSaving] = useState(false);

  async function fetchBrands() {
    setLoading(true);
    const { data, error } = await supabase.from("brands").select("*").order("created_at", { ascending: true });
    if (!error) setBrands(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchBrands(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", remarks: "" });
    setDialogOpen(true);
  }

  function openEdit(brand: Brand) {
    setEditing(brand);
    setForm({ name: brand.name, remarks: brand.remarks });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Brand name is required"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("brands").update({ name: form.name.trim(), remarks: form.remarks.trim() }).eq("id", editing.id);
      if (error) toast.error("Failed to update"); else { toast.success("Brand updated"); fetchBrands(); }
    } else {
      const { error } = await supabase.from("brands").insert({ name: form.name.trim(), remarks: form.remarks.trim() });
      if (error) toast.error("Failed to add brand"); else { toast.success("Brand added"); fetchBrands(); }
    }
    setSaving(false);
    setDialogOpen(false);
  }

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.remarks.toLowerCase().includes(search.toLowerCase())
  );
  const displayed = perPage === "all" ? filtered : filtered.slice(0, parseInt(perPage));

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Laptop className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">BRAND LIST</h2>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAdd}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  ADD NEW BRAND
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit Brand" : "Add New Brand"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Brand Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. JUKI" />
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
                <TableHead>Brand Name</TableHead>
                <TableHead>Remarks</TableHead>
                {isAdmin && <TableHead className="w-24 text-right">Edit</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : displayed.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No brands found</TableCell></TableRow>
              ) : (
                displayed.map((brand, idx) => (
                  <TableRow key={brand.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="text-muted-foreground">{brand.remarks || "—"}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button size="sm" variant="default" onClick={() => openEdit(brand)}>
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
