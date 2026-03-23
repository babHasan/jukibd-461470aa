import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, PlusCircle, Edit, Search, FileUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Client {
  id: string;
  company_name: string;
  client_name: string;
  contact_number: string;
  email: string;
  address: string;
  remarks: string;
  image_url: string | null;
}

export default function Customers() {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("5");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({
    company_name: "", client_name: "", contact_number: "", email: "", address: "", remarks: "",
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchClients() {
    setLoading(true);
    const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: true });
    if (!error) setClients(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchClients(); }, []);

  function openAdd() {
    setEditing(null);
    setForm({ company_name: "", client_name: "", contact_number: "", email: "", address: "", remarks: "" });
    setDialogOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({
      company_name: client.company_name,
      client_name: client.client_name,
      contact_number: client.contact_number,
      email: client.email,
      address: client.address,
      remarks: client.remarks,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.client_name.trim()) { toast.error("Client name is required"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("clients").update({
        company_name: form.company_name.trim(),
        client_name: form.client_name.trim(),
        contact_number: form.contact_number.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        remarks: form.remarks.trim(),
        updated_at: new Date().toISOString(),
      }).eq("id", editing.id);
      if (error) toast.error("Failed to update"); else { toast.success("Client updated"); fetchClients(); }
    } else {
      const { error } = await supabase.from("clients").insert({
        company_name: form.company_name.trim(),
        client_name: form.client_name.trim(),
        contact_number: form.contact_number.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        remarks: form.remarks.trim(),
      });
      if (error) toast.error("Failed to add client"); else { toast.success("Client added"); fetchClients(); }
    }
    setSaving(false);
    setDialogOpen(false);
  }

  async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);
        const toInsert = rows
          .map((r) => ({
            company_name: (r["Company Name"] || r["company_name"] || "").toString().trim(),
            client_name: (r["Customer/Client Name"] || r["Client Name"] || r["client_name"] || r["Name"] || "").toString().trim(),
            contact_number: (r["Contact Number"] || r["contact_number"] || r["Phone"] || "").toString().trim(),
            email: (r["Email ID"] || r["Email"] || r["email"] || "").toString().trim(),
            address: (r["Address"] || r["address"] || "").toString().trim(),
            remarks: (r["Remarks"] || r["remarks"] || "").toString().trim(),
          }))
          .filter((r) => r.client_name);
        if (toInsert.length === 0) {
          toast.error("No valid rows found. Ensure column 'Client Name' or 'Name' exists.");
          return;
        }
        const { error } = await supabase.from("clients").insert(toInsert);
        if (error) toast.error("Import failed: " + error.message);
        else { toast.success(`${toInsert.length} client(s) imported!`); fetchClients(); }
      } catch { toast.error("Failed to parse Excel file"); }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const filtered = clients.filter((c) =>
    c.client_name.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name.toLowerCase().includes(search.toLowerCase()) ||
    c.contact_number.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );
  const displayed = perPage === "all" ? filtered : filtered.slice(0, parseInt(perPage));

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCircle className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">CLIENT LIST</h2>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button onClick={openAdd}>
                <PlusCircle className="mr-2 h-4 w-4" />
                ADD NEW CLIENT
              </Button>
              <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} className="hidden" onChange={handleImportExcel} />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <FileUp className="mr-2 h-4 w-4" />
                IMPORT EXCEL
              </Button>
            </div>
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

        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="w-12">Sl</TableHead>
                <TableHead>Company Name</TableHead>
                <TableHead>Customer/Client Name</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Email ID</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="w-20">Image</TableHead>
                {isAdmin && <TableHead className="w-20 text-right">Edit</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : displayed.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">No clients found</TableCell></TableRow>
              ) : (
                displayed.map((client, idx) => (
                  <TableRow key={client.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{client.company_name || "—"}</TableCell>
                    <TableCell>{client.client_name}</TableCell>
                    <TableCell className="text-muted-foreground">{client.contact_number || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{client.email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{client.address || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{client.remarks || "—"}</TableCell>
                    <TableCell>
                      {client.image_url ? (
                        <img src={client.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <ImageIcon className="h-3.5 w-3.5" /> No Image
                        </span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button size="sm" variant="default" onClick={() => openEdit(client)}>
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Client" : "Add New Client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Company Name</Label>
              <Input name="company_name" value={form.company_name} onChange={handleChange} placeholder="Company name" />
            </div>
            <div className="space-y-1.5">
              <Label>Customer/Client Name *</Label>
              <Input name="client_name" value={form.client_name} onChange={handleChange} placeholder="Client name" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contact Number</Label>
                <Input name="contact_number" value={form.contact_number} onChange={handleChange} placeholder="Phone number" />
              </div>
              <div className="space-y-1.5">
                <Label>Email ID</Label>
                <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input name="address" value={form.address} onChange={handleChange} placeholder="Address" />
            </div>
            <div className="space-y-1.5">
              <Label>Remarks</Label>
              <Input name="remarks" value={form.remarks} onChange={handleChange} placeholder="Remarks" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
