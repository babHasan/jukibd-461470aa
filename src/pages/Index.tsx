import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRepairs } from "@/context/RepairContext";
import { KpiCards } from "@/components/KpiCards";
import { RepairTable } from "@/components/RepairTable";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Phone, ChevronRight } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Job {
  id: string;
  job_number: string;
  brand_name: string;
  model_name: string;
  board_name: string;
  board_serial: string;
  details_of_problem: string;
  customer_name: string;
  customer_mobile: string;
  company_name: string;
  branch_name: string;
  factory_challan_number: string;
  job_date: string;
  status: string;
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

const Index = () => {
  const navigate = useNavigate();
  const { orders, updateStatus } = useRepairs();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("all");

  function fetchJobs() {
    supabase
      .from("jobs")
      .select("*, clients(contact_number, company_name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setJobs(data.map((j: any) => ({
            ...j,
            customer_mobile: j.clients?.contact_number || "",
            company_name: j.clients?.company_name || "",
          })));
        }
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

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.job_number.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.customer_name.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.brand_name.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.board_serial.toLowerCase().includes(jobSearch.toLowerCase());
    const matchesStatus = jobFilter === "all" || j.status === jobFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <KpiCards orders={orders} />
        <RepairTable orders={orders} onUpdateStatus={updateStatus} />

        {/* Job List Section */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-foreground">Job Orders</h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="pl-9 sm:w-56"
                />
              </div>
              <Select value={jobFilter} onValueChange={setJobFilter}>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Job No</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Branch</TableHead>
                  <TableHead className="font-semibold">Device</TableHead>
                  <TableHead className="font-semibold">Board</TableHead>
                  <TableHead className="font-semibold">Problem</TableHead>
                  <TableHead className="font-semibold">Challan</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                      No jobs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs.map((job) => {
                    const idx = jobStatusFlow.indexOf(job.status);
                    const next = idx < jobStatusFlow.length - 1 ? jobStatusFlow[idx + 1] : null;
                    return (
                      <TableRow key={job.id} className="group cursor-pointer" onClick={() => navigate(`/job/${job.id}`)}>
                        <TableCell className="font-mono text-sm font-medium">{job.job_number}</TableCell>
                        <TableCell className="text-sm">{job.job_date}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{job.customer_name}</p>
                            {job.company_name && <p className="text-xs text-muted-foreground">{job.company_name}</p>}
                            {job.customer_mobile && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />{job.customer_mobile}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{job.branch_name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{job.brand_name}</p>
                            <p className="text-xs text-muted-foreground">{job.model_name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{job.board_name}</p>
                            <p className="text-xs text-muted-foreground">{job.board_serial}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{job.details_of_problem}</TableCell>
                        <TableCell className="text-sm">{job.factory_challan_number || "—"}</TableCell>
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
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
