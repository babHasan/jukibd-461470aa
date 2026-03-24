import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, Plus, AlertTriangle, Search, Pencil, Trash2 } from "lucide-react";

interface InventoryItem {
  id: string;
  part_name: string;
  part_number: string;
  category: string;
  brand: string;
  quantity: number;
  min_stock_level: number;
  unit_price: number;
  supplier: string;
  location: string;
  remarks: string;
}

const emptyItem = {
  part_name: "", part_number: "", category: "", brand: "",
  quantity: 0, min_stock_level: 5, unit_price: 0,
  supplier: "", location: "", remarks: "",
};

export default function InventoryList() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyItem);

  const fetchItems = async () => {
    const { data } = await supabase.from("inventory").select("*").order("created_at", { ascending: false });
    setItems((data as unknown as InventoryItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    if (!form.part_name.trim()) { toast.error("Part name is required"); return; }
    if (editId) {
      const { error } = await supabase.from("inventory").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editId);
      if (error) { toast.error(error.message); return; }
      toast.success("Part updated");
    } else {
      const { error } = await supabase.from("inventory").insert(form as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Part added");
    }
    setOpen(false); setEditId(null); setForm(emptyItem); fetchItems();
  };

  const handleEdit = (item: InventoryItem) => {
    setEditId(item.id);
    setForm({ part_name: item.part_name, part_number: item.part_number, category: item.category, brand: item.brand, quantity: item.quantity, min_stock_level: item.min_stock_level, unit_price: item.unit_price, supplier: item.supplier, location: item.location, remarks: item.remarks });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this part?")) return;
    await supabase.from("inventory").delete().eq("id", id);
    toast.success("Part deleted"); fetchItems();
  };

  const filtered = items.filter(i =>
    i.part_name.toLowerCase().includes(search.toLowerCase()) ||
    i.part_number.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = items.filter(i => i.quantity <= i.min_stock_level);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6" /> Inventory / Parts</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm(emptyItem); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Add Part</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editId ? "Edit Part" : "Add New Part"}</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Part Name *</Label><Input value={form.part_name} onChange={e => setForm({...form, part_name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Part Number</Label><Input value={form.part_number} onChange={e => setForm({...form, part_number: e.target.value})} /></div>
                  <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Brand</Label><Input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} /></div>
                  <div><Label>Supplier</Label><Input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: +e.target.value})} /></div>
                  <div><Label>Min Stock</Label><Input type="number" value={form.min_stock_level} onChange={e => setForm({...form, min_stock_level: +e.target.value})} /></div>
                  <div><Label>Unit Price</Label><Input type="number" value={form.unit_price} onChange={e => setForm({...form, unit_price: +e.target.value})} /></div>
                </div>
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
                <div><Label>Remarks</Label><Input value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} /></div>
                <Button onClick={handleSave}>{editId ? "Update" : "Add"} Part</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {lowStock.length > 0 && (
          <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-medium">
                <AlertTriangle className="h-5 w-5" />
                <span>{lowStock.length} item(s) at or below minimum stock level!</span>
              </div>
              <div className="mt-1 text-sm text-orange-600 dark:text-orange-300">
                {lowStock.map(i => `${i.part_name} (${i.quantity}/${i.min_stock_level})`).join(", ")}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search parts..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>Part #</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No parts found</TableCell></TableRow>
                ) : filtered.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.part_name}</TableCell>
                    <TableCell>{item.part_number}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.brand}</TableCell>
                    <TableCell className="text-center">
                      {item.quantity <= item.min_stock_level
                        ? <Badge variant="destructive">{item.quantity}</Badge>
                        : <Badge variant="secondary">{item.quantity}</Badge>}
                    </TableCell>
                    <TableCell>৳{item.unit_price}</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
