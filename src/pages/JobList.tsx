import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ClipboardList, Phone, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Job {
  id: string;
  job_number: string;
  brand_name: string;
  model_name: string;
  board_name: string;
  board_serial: string;
  details_of_problem: string;
  remarks: string;
  customer_name: string;
  customer_mobile: string;
  company_name: string;
  branch_name: string;
  factory_challan_number: string;
  job_date: string;
  status: string;
  created_at: string;
}

const jobStatusFlow = ["received", "diagnosing", "in-progress", "completed", "picked-up"];
const jobStatusLabels: Record<string, string> = {
  received: "Received",
  diagnosing: "Diagnosing",
  "in-progress": "In Progress",
  completed: "Completed",
  "picked-up": "Picked Up",
};
const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-800",
  diagnosing: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  "picked-up": "bg-gray-100 text-gray-800",
};

export default function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [perPage, setPerPage] = useState("10");

  function fetchJobs() {
    setLoading(true);
    supabase
      .from("jobs")
      .select("*, clients(contact_number)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setJobs(data.map((j: any) => ({
            ...j,
            customer_mobile: j.clients?.contact_number || "",
          })));
        }
        setLoading(false);
      });
  }

  useEffect(() => { fetchJobs(); }, []);

  async function handleJobStatusUpdate(jobId: string, currentStatus: string) {
    const idx = jobStatusFlow.indexOf(currentStatus);
    if (idx >= jobStatusFlow.length - 1) return;
    const next = jobStatusFlow[idx + 1];
    const { error } = await supabase.from("jobs").update({ status: next }).eq("id", jobId);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status updated to ${jobStatusLabels[next]}`);
      fetchJobs();
    }
  }

  const filtered = jobs.filter((j) => {
    const matchesSearch =
      j.job_number.toLowerCase().includes(search.toLowerCase()) ||
      j.brand_name.toLowerCase().includes(search.toLowerCase()) ||
      j.model_name.toLowerCase().includes(search.toLowerCase()) ||
      j.board_name.toLowerCase().includes(search.toLowerCase()) ||
      j.board_serial.toLowerCase().includes(search.toLowerCase()) ||
      j.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      j.branch_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const displayed = perPage === "all" ? filtered : filtered.slice(0, parseInt(perPage));

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">JOB LIST</h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Select value={perPage} onValueChange={setPerPage}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">records</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 w-56" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="diagnosing">Diagnosing</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="picked-up">Picked Up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border bg-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 font-semibold">SL</TableHead>
                <TableHead className="font-semibold">Job Number</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Mobile</TableHead>
                <TableHead className="font-semibold">Branch</TableHead>
                <TableHead className="font-semibold">Brand</TableHead>
                <TableHead className="font-semibold">Model</TableHead>
                <TableHead className="font-semibold">Board</TableHead>
                <TableHead className="font-semibold">Board Serial</TableHead>
                <TableHead className="font-semibold">Problem</TableHead>
                <TableHead className="font-semibold">Challan No</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={14} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : displayed.length === 0 ? (
                <TableRow><TableCell colSpan={14} className="text-center text-muted-foreground">No jobs found</TableCell></TableRow>
              ) : (
                displayed.map((job, idx) => {
                  const sIdx = jobStatusFlow.indexOf(job.status);
                  const next = sIdx < jobStatusFlow.length - 1 ? jobStatusFlow[sIdx + 1] : null;
                  return (
                    <TableRow key={job.id} className="group cursor-pointer" onClick={() => navigate(`/job/${job.id}`)}>
                      <TableCell className="text-xs">{idx + 1}</TableCell>
                      <TableCell className="text-xs font-mono font-medium">{job.job_number}</TableCell>
                      <TableCell className="text-xs">{job.job_date}</TableCell>
                      <TableCell className="text-xs">{job.customer_name}</TableCell>
                      <TableCell className="text-xs">
                        {job.customer_mobile ? (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{job.customer_mobile}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs">{job.branch_name}</TableCell>
                      <TableCell className="text-xs">{job.brand_name}</TableCell>
                      <TableCell className="text-xs">{job.model_name}</TableCell>
                      <TableCell className="text-xs">{job.board_name}</TableCell>
                      <TableCell className="text-xs">{job.board_serial}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{job.details_of_problem}</TableCell>
                      <TableCell className="text-xs">{job.factory_challan_number || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[10px] ${statusColors[job.status] || ""}`}>
                          {job.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {next && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs text-accent hover:text-accent"
                            onClick={(e) => { e.stopPropagation(); handleJobStatusUpdate(job.id, job.status); }}
                          >
                            {jobStatusLabels[next]}
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">{filtered.length} record(s) total</p>
      </div>
    </AppLayout>
  );
}
