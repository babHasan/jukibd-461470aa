import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, FileDown } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface CustomerDue {
  customer_name: string;
  proprietor_name: string;
  mobile: string;
  address: string;
  total_due: number;
}

export default function CustomerLedger() {
  const [data, setData] = useState<CustomerDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("5");
  const [page, setPage] = useState(1);

  async function fetchLedger() {
    setLoading(true);
    // Get all jobs that have due amounts (payable > received)
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("customer_name, customer_id, service_charge, discount, payable_amount, receive_amount")
      .order("customer_name");

    if (error) {
      toast.error("Failed to load ledger");
      setLoading(false);
      return;
    }

    // Also fetch client data for proprietor/mobile/address
    const { data: clients } = await supabase
      .from("clients")
      .select("id, client_name, company_name, contact_number, address");

    const clientMap = new Map<string, { company: string; contact: string; address: string }>();
    (clients || []).forEach((c) => {
      clientMap.set(c.client_name.toLowerCase(), {
        company: c.company_name || "",
        contact: c.contact_number || "",
        address: c.address || "",
      });
      if (c.id) {
        clientMap.set(c.id, {
          company: c.company_name || "",
          contact: c.contact_number || "",
          address: c.address || "",
        });
      }
    });

    // Aggregate dues per customer
    const customerMap = new Map<string, CustomerDue>();
    (jobs || []).forEach((j) => {
      const payable = Number(j.payable_amount) || 0;
      const received = Number(j.receive_amount) || 0;
      const due = payable - received;
      if (due <= 0) return;

      const name = j.customer_name || "Unknown";
      const existing = customerMap.get(name);
      const clientInfo = clientMap.get(name.toLowerCase()) || clientMap.get(j.customer_id || "");

      if (existing) {
        existing.total_due += due;
      } else {
        customerMap.set(name, {
          customer_name: name,
          proprietor_name: clientInfo?.company || "",
          mobile: clientInfo?.contact || "",
          address: clientInfo?.address || "",
          total_due: due,
        });
      }
    });

    setData(Array.from(customerMap.values()).sort((a, b) => a.customer_name.localeCompare(b.customer_name)));
    setLoading(false);
  }

  useEffect(() => { fetchLedger(); }, []);

  const filtered = data.filter((c) =>
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.proprietor_name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search) ||
    c.address.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = perPage === "all" ? 1 : Math.max(1, Math.ceil(filtered.length / parseInt(perPage)));
  const displayed = perPage === "all"
    ? filtered
    : filtered.slice((page - 1) * parseInt(perPage), page * parseInt(perPage));
  const outstandingTotal = filtered.reduce((sum, c) => sum + c.total_due, 0);

  useEffect(() => { setPage(1); }, [search, perPage]);

  function exportExcel() {
    const rows = filtered.map((c, i) => ({
      "Sl No": i + 1,
      "Traders Name": c.customer_name,
      "Proprietor Name": c.proprietor_name,
      "Mobile": c.mobile,
      "Address": c.address,
      "Due": c.total_due,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customer Ledger");
    XLSX.writeFile(wb, "customer_ledger.xlsx");
    toast.success("Exported!");
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-primary text-primary-foreground px-4 py-2.5 rounded-lg">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <h2 className="text-lg font-bold">PARTY CUSTOMER LEDGER</h2>
          </div>
          <Button variant="secondary" size="sm" onClick={exportExcel} className="bg-accent text-accent-foreground hover:bg-accent/80">
            <FileDown className="mr-2 h-4 w-4" /> EXCEL EXPORT
          </Button>
        </div>

        {/* Controls */}
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

        {/* Table */}
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="w-16">Sl No</TableHead>
                <TableHead>Traders Name</TableHead>
                <TableHead>Proprietor Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Due</TableHead>
                <TableHead className="w-24 text-center">Ledger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : displayed.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No records found</TableCell></TableRow>
              ) : (
                displayed.map((c, idx) => (
                  <TableRow key={c.customer_name}>
                    <TableCell>{(perPage === "all" ? 0 : (page - 1) * parseInt(perPage)) + idx + 1}</TableCell>
                    <TableCell className="font-medium">{c.customer_name}</TableCell>
                    <TableCell>{c.proprietor_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{c.mobile || "—"}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[250px] truncate">{c.address || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{c.total_due.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-center">
                      <Button size="sm" variant="default" className="bg-accent text-accent-foreground hover:bg-accent/80">
                        LEDGER
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {displayed.length > 0 ? (perPage === "all" ? 1 : (page - 1) * parseInt(perPage) + 1) : 0} to{" "}
            {perPage === "all" ? filtered.length : Math.min(page * parseInt(perPage), filtered.length)} of {filtered.length} entries
          </p>
          {perPage !== "all" && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>&lt;</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <Button key={p} size="sm" variant={page === p ? "default" : "outline"} onClick={() => setPage(p)}>
                    {p}
                  </Button>
                );
              })}
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>&gt;</Button>
            </div>
          )}
        </div>

        {/* Outstanding Balance */}
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-primary/20 text-center py-2 font-bold text-foreground">OUTSTANDING BALANCE</div>
          <div className="flex items-center justify-between bg-accent/20 px-4 py-2.5">
            <span className="font-bold text-foreground">TOTAL</span>
            <span className="font-bold text-foreground text-lg">{outstandingTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} /=</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
