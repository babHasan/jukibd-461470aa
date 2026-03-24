import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRepairs } from "@/context/RepairContext";
import { KpiCards } from "@/components/KpiCards";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Phone, ChevronRight, CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CompletionWizard } from "@/components/CompletionWizard";
import { DeliveryWizard } from "@/components/DeliveryWizard";
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

const Index = () => {
  const navigate = useNavigate();
  const { orders, updateStatus } = useRepairs();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardJobs, setWizardJobs] = useState<Job[]>([]);
  const [deliveryWizardOpen, setDeliveryWizardOpen] = useState(false);
  const [deliveryWizardJobs, setDeliveryWizardJobs] = useState<Job[]>([]);

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

  async function handleGroupStatusUpdate(group: JobGroup) {
    // Intercept in-progress → completed transition (open CompletionWizard)
    const inProgressJobs = group.jobs.filter((j) => j.status === "in-progress");
    if (inProgressJobs.length > 0) {
      setWizardJobs(group.jobs);
      setWizardOpen(true);
      return;
    }
    // Intercept completed → picked-up transition (open DeliveryWizard)
    const completedJobs = group.jobs.filter((j) => j.status === "completed");
    if (completedJobs.length > 0) {
      setDeliveryWizardJobs(group.jobs);
      setDeliveryWizardOpen(true);
      return;
    }

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

  const filteredJobs = jobs.filter((j) => {
    const s = jobSearch.toLowerCase();
    const matchesSearch =
      j.job_number.toLowerCase().includes(s) ||
      j.customer_name.toLowerCase().includes(s) ||
      j.company_name.toLowerCase().includes(s) ||
      j.customer_mobile.toLowerCase().includes(s) ||
      j.factory_challan_number.toLowerCase().includes(s) ||
      j.brand_name.toLowerCase().includes(s) ||
      j.board_serial.toLowerCase().includes(s);
    const matchesStatus = jobFilter === "all" || j.status === jobFilter;
    const jobDateObj = new Date(j.job_date + "T00:00:00");
    const matchesFrom = !fromDate || jobDateObj >= new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const matchesTo = !toDate || jobDateObj <= new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  const groups = useMemo(() => {
    const map = new Map<string, JobGroup>();
    for (const job of filteredJobs) {
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
  }, [filteredJobs]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <KpiCards jobs={jobs} />

        {/* Job Orders Section */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Job Orders</h2>
              <Button onClick={() => navigate("/add-job")} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="h-4 w-4" />
                Add Job
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search jobs..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="pl-9 w-full sm:w-56"
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full sm:w-[140px] justify-start text-left text-sm font-normal", !fromDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "dd/MM/yyyy") : "From Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full sm:w-[140px] justify-start text-left text-sm font-normal", !toDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "dd/MM/yyyy") : "To Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                {(fromDate || toDate) && (
                  <Button variant="ghost" size="sm" onClick={() => { setFromDate(undefined); setToDate(undefined); }}>
                    Clear
                  </Button>
                )}
                <Select value={jobFilter} onValueChange={setJobFilter}>
                  <SelectTrigger className="w-full sm:w-40">
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
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Customer & Info</TableHead>
                  <TableHead className="font-semibold">Service</TableHead>
                  <TableHead className="font-semibold">Challan Number</TableHead>
                  <TableHead className="font-semibold text-right">Change Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No jobs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <TableRow key={group.key} className={`align-top border-b ${rowBgColors[getGroupStatus(group.jobs)] || ""}`}>
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
                                  <td className="px-3 py-1.5 text-xs">{job.board_name}</td>
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

          {/* Mobile Card View */}
          <div className="md:hidden divide-y">
            {groups.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No jobs found.</div>
            ) : (
              groups.map((group) => (
                <div key={group.key} className={`p-4 space-y-3 ${rowBgColors[getGroupStatus(group.jobs)] || ""}`}>
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 text-sm min-w-0">
                      <p className="font-semibold text-foreground truncate">{group.customer_name}</p>
                      {group.company_name && <p className="text-xs text-muted-foreground">{group.company_name}</p>}
                      {group.customer_mobile && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {group.customer_mobile}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{group.job_date}</p>
                      {group.factory_challan_number && (
                        <p className="text-xs font-mono font-medium mt-0.5">{group.factory_challan_number}</p>
                      )}
                    </div>
                  </div>

                  {/* Jobs list */}
                  <div className="space-y-2">
                    {group.jobs.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-md border bg-card/80 p-3 space-y-1.5 cursor-pointer active:scale-[0.98] transition-transform"
                        onClick={() => navigate(`/job/${job.id}`)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-semibold">{job.job_number}</span>
                          <Badge variant="secondary" className={`text-[10px] ${statusColors[job.status] || ""}`}>
                            {jobStatusLabels[job.status] || job.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Board:</span> {job.board_name}</p>
                        {job.details_of_problem && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{job.details_of_problem}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-1 text-xs"
                    onClick={() => handleGroupStatusUpdate(group)}
                  >
                    Change Status
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
        <CompletionWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          jobs={wizardJobs}
          onCompleted={fetchJobs}
        />
        <DeliveryWizard
          open={deliveryWizardOpen}
          onOpenChange={setDeliveryWizardOpen}
          jobs={deliveryWizardJobs}
          onCompleted={fetchJobs}
        />
      </div>
    </AppLayout>
  );
};

export default Index;
