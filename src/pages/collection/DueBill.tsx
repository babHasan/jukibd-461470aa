import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Phone, AlertCircle } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface DueJob {
  id: string;
  job_number: string;
  customer_name: string;
  customer_mobile: string;
  company_name: string;
  branch_name: string;
  factory_challan_number: string;
  job_date: string;
  status: string;
  service_charge: number;
  discount: number;
  payable_amount: number;
  receive_amount: number;
  receive_type: string | null;
}

const DueBill = () => {
  const [jobs, setJobs] = useState<DueJob[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDueJobs() {
      setLoading(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("*, clients(contact_number, company_name)")
        .eq("receive_type", "Due")
        .order("created_at", { ascending: false });

      if (data) {
        setJobs(
          data.map((j: any) => ({
            ...j,
            customer_mobile: j.clients?.contact_number || "",
            company_name: j.clients?.company_name || "",
          }))
        );
      }
      setLoading(false);
    }
    fetchDueJobs();
  }, []);

  const filtered = jobs.filter((j) => {
    const s = search.toLowerCase();
    return (
      j.job_number.toLowerCase().includes(s) ||
      j.customer_name.toLowerCase().includes(s) ||
      j.company_name.toLowerCase().includes(s) ||
      j.customer_mobile.toLowerCase().includes(s) ||
      j.factory_challan_number.toLowerCase().includes(s)
    );
  });

  const totalDue = filtered.reduce(
    (sum, j) => sum + ((j.payable_amount || 0) - (j.receive_amount || 0)),
    0
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Due Bills</p>
            <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Due Amount</p>
            <p className="text-2xl font-bold text-destructive">৳ {totalDue.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total Received</p>
            <p className="text-2xl font-bold text-primary">
              ৳ {filtered.reduce((s, j) => s + (j.receive_amount || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Due Bills
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search due bills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 sm:w-64"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Job #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Challan #</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Payable</TableHead>
                  <TableHead className="text-right">Received</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No due bills found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((job) => {
                    const due = (job.payable_amount || 0) - (job.receive_amount || 0);
                    return (
                      <TableRow key={job.id}>
                        <TableCell className="text-sm whitespace-nowrap">{job.job_date}</TableCell>
                        <TableCell className="font-mono text-sm font-medium">{job.job_number}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{job.customer_name}</p>
                            {job.company_name && (
                              <p className="text-xs text-muted-foreground">{job.company_name}</p>
                            )}
                            {job.customer_mobile && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {job.customer_mobile}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{job.factory_challan_number || "—"}</TableCell>
                        <TableCell className="text-sm">{job.branch_name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          ৳ {(job.payable_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          ৳ {(job.receive_amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold text-destructive">
                          ৳ {due.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DueBill;
