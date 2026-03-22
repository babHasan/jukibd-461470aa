import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Search, FileUp, HardDrive } from "lucide-react";
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

interface Board {
  id: string;
  name: string;
  remarks: string;
  image_url: string | null;
}

export default function BoardList() {
  const { isAdmin } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("5");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Board | null>(null);
  const [form, setForm] = useState({ name: "", remarks: "" });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchBoards() {
    setLoading(true);
    const { data, error } = await supabase.from("boards").select("*").order("created_at", { ascending: true });
    if (!error) setBoards(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchBoards(); }, []);

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
          .filter((r) => r["Board Name"] || r["board_name"] || r["name"] || r["Name"])
          .map((r) => ({
            name: (r["Board Name"] || r["board_name"] || r["name"] || r["Name"] || "").toString().trim(),
            remarks: (r["Remarks"] || r["remarks"] || "").toString().trim(),
          }))
          .filter((r) => r.name);
        if (toInsert.length === 0) {
          toast.error("No valid rows found. Ensure column header is 'Board Name' or 'Name'.");
          return;
        }
        const { error } = await supabase.from("boards").insert(toInsert);
        if (error) toast.error("Import failed: " + error.message);
        else { toast.success(`${toInsert.length} board(s) imported!`); fetchBoards(); }
      } catch { toast.error("Failed to parse Excel file"); }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: "", remarks: "" });
    setDialogOpen(true);
  }

  function openEdit(board: Board) {
    setEditing(board);
    setForm({ name: board.name, remarks: board.remarks });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Board name is required"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("boards").update({ name: form.name.trim(), remarks: form.remarks.trim() }).eq("id", editing.id);
      if (error) toast.error("Failed to update"); else { toast.success("Board updated"); fetchBoards(); }
    } else {
      const { error } = await supabase.from("boards").insert({ name: form.name.trim(), remarks: form.remarks.trim() });
      if (error) toast.error("Failed to add board"); else { toast.success("Board added"); fetchBoards(); }
    }
    setSaving(false);
    setDialogOpen(false);
  }

  const filtered = boards.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.remarks.toLowerCase().includes(search.toLowerCase())
  );
  const displayed = perPage === "all" ? filtered : filtered.slice(0, parseInt(perPage));

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDrive className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">BOARD LIST</h2>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAdd}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    ADD NEW BOARD
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editing ? "Edit Board" : "Add New Board"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Board Name *</Label>
                      <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Main Board" />
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

        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="w-16">Sl No</TableHead>
                <TableHead>Board Name</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Image</TableHead>
                {isAdmin && <TableHead className="w-24 text-right">Edit</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : displayed.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No boards found</TableCell></TableRow>
              ) : (
                displayed.map((board, idx) => (
                  <TableRow key={board.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium">{board.name}</TableCell>
                    <TableCell className="text-muted-foreground">{board.remarks || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{board.image_url ? <img src={board.image_url} alt={board.name} className="h-8 w-8 object-cover rounded" /> : "No Image"}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button size="sm" variant="default" onClick={() => openEdit(board)}>
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
