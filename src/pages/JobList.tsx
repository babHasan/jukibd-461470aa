import { useEffect, useState, useMemo } from "react";
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
  customer_id: string | null;
}

interface JobGroup {
  key: string;
  customer_name: string;
  company_name: string;
  customer_mobile: string;
  branch_name: string;
  factory_challan_number: string;
  job_date: string;
  jobs: Job[];
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
const rowBgColors: Record<string, string> = {
  received: "bg-blue-50",
  diagnosing: "bg-yellow-50",
  "in-progress": "bg-orange-50",
  completed: "bg-green-50",
  "picked-up": "bg-gray-50",
};
function getGroupStatus(jobs: Job[]): string {
  const statuses = jobs.map((j) => j.status);
  const unique = [...new Set(statuses)];
  if (unique.length === 1) return unique[0];
  for (const s of jobStatusFlow) {
    if (unique.includes(s)) return s;
  }
  return statuses[0];
}

export default function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [perPage, setPerPage] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);

  function fetchJobs() {
    setLoading(true);
    supabase
      .from("jobs")
      .select("*, clients(contact_number, company_name)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setJobs(data.map((j: any) => ({
            ...j,
            customer_mobile: j.clients?.contact_number || "",
            company_name: j.clients?.company_name || "",
          })));
        }
        setLoading(false);
      });
  }

  useEffect(() => { fetchJobs(); }, []);

  async function handleGroupStatusUpdate(group: JobGroup) {
    const jobsToUpdate = group.jobs.filter((j) => {
      const idx = jobStatusFlow.indexOf(j.status);
      return idx < jobStatusFlow.length - 1;
    });
    if (jobsToUpdate.length === 0) return;

    for (const job of jobsToUpdate) {
      const idx = jobStatusFlow.indexOf(job.status);
      const next = jobStatusFlow[idx + 1];
      const { error } = await supabase.from("jobs").update({ status: next }).eq("id", job.id);
      if (error) {
        toast.error(`Failed to update ${job.job_number}`);
        return;
      }
    }
    toast.success("Status updated for all jobs in this group");
    fetchJobs();
  }

  const filtered = jobs.filter((j) => {
    const matchesSearch =
      j.job_number.toLowerCase().includes(search.toLowerCase()) ||
      j.brand_name.toLowerCase().includes(search.toLowerCase()) ||
      j.model_name.toLowerCase().includes(search.toLowerCase()) ||
      j.board_name.toLowerCase().includes(search.toLowerCase()) ||
      j.board_serial.toLowerCase().includes(search.toLowerCase()) ||
      j.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      j.company_name.toLowerCase().includes(search.toLowerCase()) ||
      j.branch_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const groups = useMemo(() => {
    const map = new Map<string, JobGroup>();
    for (const job of filtered) {
      const key = `${job.customer_id || job.customer_name}_${job.job_date}_${job.factory_challan_number}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          customer_name: job.customer_name,
          company_name: job.company_name,
          customer_mobile: job.customer_mobile,
          branch_name: job.branch_name,
          factory_challan_number: job.factory_challan_number,
          job_date: job.job_date,
          jobs: [],
        });
      }
      map.get(key)!.jobs.push(job);
    }
    return Array.from(map.values());
  }, [filtered]);

  const totalGroups = groups.length;
  const paginatedGroups = perPage === "all"
    ? groups
    : groups.slice((currentPage - 1) * parseInt(perPage), currentPage * parseInt(perPage));
  const totalPages = perPage === "all" ? 1 : Math.ceil(totalGroups / parseInt(perPage));

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, perPage]);

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
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Customer & Info</TableHead>
                <TableHead className="font-semibold">Service</TableHead>
                <TableHead className="font-semibold">Challan Number</TableHead>
                <TableHead className="font-semibold text-right">Change Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              ) : paginatedGroups.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No jobs found</TableCell></TableRow>
              ) : (
                paginatedGroups.map((group, gIdx) => (
                  <TableRow key={group.key} className="align-top border-b">
                    <TableCell className="text-sm font-medium">
                      {perPage === "all" ? gIdx + 1 : (currentPage - 1) * parseInt(perPage) + gIdx + 1}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{group.job_date}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-sm">
                        <p><span className="font-semibold">Name:</span> {group.customer_name}</p>
                        {group.company_name && (
                          <p><span className="font-semibold">Company:</span> {group.company_name}</p>
                        )}
                        {group.customer_mobile && (
                          <p className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {group.customer_mobile}
                          </p>
                        )}
                        {group.branch_name && (
                          <p><span className="font-semibold">Branch:</span> {group.branch_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="rounded border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/60">
                              <th className="px-3 py-1.5 text-left font-semibold text-xs">Board</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-xs">Details Of Problem</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-xs">Job Number</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-xs">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.jobs.map((job) => (
                              <tr
                                key={job.id}
                                className="border-t cursor-pointer hover:bg-accent/10 transition-colors"
                                onClick={() => navigate(`/job/${job.id}`)}
                              >
                                <td className="px-3 py-1.5 text-xs">
                                  <div>
                                    <span>{job.board_name}</span>
                                    {job.board_serial && (
                                      <span className="text-muted-foreground ml-1">({job.board_serial})</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-1.5 text-xs max-w-[180px] truncate">
                                  {job.details_of_problem || "—"}
                                </td>
                                <td className="px-3 py-1.5 text-xs font-mono font-medium">{job.job_number}</td>
                                <td className="px-3 py-1.5">
                                  <Badge variant="secondary" className={`text-[10px] ${statusColors[job.status] || ""}`}>
                                    {jobStatusLabels[job.status] || job.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{group.factory_challan_number || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs"
                        onClick={() => handleGroupStatusUpdate(group)}
                      >
                        Change Status
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {paginatedGroups.length > 0 ? (perPage === "all" ? 1 : (currentPage - 1) * parseInt(perPage) + 1) : 0} to{" "}
            {perPage === "all" ? totalGroups : Math.min(currentPage * parseInt(perPage), totalGroups)} of {totalGroups} entries
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                &lt;
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .map((p, i, arr) => (
                  <span key={p}>
                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-muted-foreground">…</span>}
                    <Button
                      variant={p === currentPage ? "default" : "outline"}
                      size="sm"
                      className="min-w-[32px]"
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  </span>
                ))}
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                &gt;
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
