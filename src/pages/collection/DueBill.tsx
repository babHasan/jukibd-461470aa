import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Phone, AlertCircle, Banknote, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  customer_id: string | null;
}

const DueBill = () => {
  const [jobs, setJobs] = useState<DueJob[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Collection dialog state
  const [collectJob, setCollectJob] = useState<DueJob | null>(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [confirmAmount, setConfirmAmount] = useState("");
  const [collectMethod, setCollectMethod] = useState("Cash");
  const [rebate, setRebate] = useState("0");
  const [remarks, setRemarks] = useState("");
  const [collectDate, setCollectDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [submitting, setSubmitting] = useState(false);

  const fetchDueJobs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
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
  }, []);

  useEffect(() => { fetchDueJobs(); }, [fetchDueJobs]);

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

  function openCollectDialog(job: DueJob) {
    const due = (job.payable_amount || 0) - (job.receive_amount || 0);
    setCollectJob(job);
    setCollectAmount(String(due));
    setConfirmAmount("");
    setCollectMethod("Cash");
    setRebate("0");
    setRemarks("");
    setCollectDate(format(new Date(), "yyyy-MM-dd"));
  }

  async function handleCollect() {
    if (!collectJob) return;
    const amount = parseFloat(collectAmount) || 0;
    const confirm = parseFloat(confirmAmount) || 0;
    const rebateVal = parseFloat(rebate) || 0;

    if (amount <= 0) {
      toast.error("Receive amount must be greater than 0");
      return;
    }
    if (amount !== confirm) {
      toast.error("Receive amount and confirm amount do not match");
      return;
    }

    const due = (collectJob.payable_amount || 0) - (collectJob.receive_amount || 0);
    if (amount > due) {
      toast.error("Receive amount cannot exceed due amount");
      return;
    }

    setSubmitting(true);
    try {
      const newReceived = (collectJob.receive_amount || 0) + amount;
      const newPayable = (collectJob.payable_amount || 0) - rebateVal;
      const fullyPaid = newReceived >= newPayable;

      const { error } = await supabase
        .from("jobs")
        .update({
          receive_amount: newReceived,
          payable_amount: newPayable,
          receive_type: fullyPaid ? collectMethod : "Due",
        })
        .eq("id", collectJob.id);

      if (error) throw error;

      toast.success(`৳${amount.toLocaleString()} collected successfully!`);
      setCollectJob(null);
      fetchDueJobs();
    } catch (err: any) {
      toast.error("Collection failed: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  }

  const dueForJob = collectJob
    ? (collectJob.payable_amount || 0) - (collectJob.receive_amount || 0)
    : 0;

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Summary Cards */}
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
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
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
                        <TableCell className="text-center flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1 text-xs"
                            onClick={() => openCollectDialog(job)}
                          >
                            <Banknote className="h-3.5 w-3.5" />
                            Collect
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                            onClick={() => window.open(`/print-invoice?job=${job.id}&type=due-collection`, "_blank")}
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Print
                          </Button>
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

      {/* Collection Dialog */}
      <Dialog open={!!collectJob} onOpenChange={(open) => !open && setCollectJob(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Collection From Customer
            </DialogTitle>
          </DialogHeader>

          {collectJob && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left column */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Customer</Label>
                  <Input value={collectJob.customer_name} readOnly className="bg-muted/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Amount</Label>
                  <Input value={`৳ ${dueForJob.toLocaleString()}`} readOnly className="bg-muted/50 font-bold text-destructive" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Mobile</Label>
                  <Input value={collectJob.customer_mobile || "—"} readOnly className="bg-muted/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Collection Method *</Label>
                  <Select value={collectMethod} onValueChange={setCollectMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="bKash">bKash</SelectItem>
                      <SelectItem value="Nagad">Nagad</SelectItem>
                      <SelectItem value="Bank">Bank Transfer</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Receive Amount *</Label>
                  <Input
                    type="number"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Confirm Receive Amount *</Label>
                  <Input
                    type="number"
                    value={confirmAmount}
                    onChange={(e) => setConfirmAmount(e.target.value)}
                    placeholder="Re-enter amount"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Rebate</Label>
                  <Input
                    type="number"
                    value={rebate}
                    onChange={(e) => setRebate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Collection Date *</Label>
                  <Input
                    type="date"
                    value={collectDate}
                    onChange={(e) => setCollectDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Full width remarks */}
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Remarks</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional remarks"
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectJob(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCollect} disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
              {submitting ? "Processing..." : "COLLECTION"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default DueBill;
