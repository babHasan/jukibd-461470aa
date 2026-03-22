import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ClipboardList, Eye } from "lucide-react";
import { Link } from "react-router-dom";
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
  branch_name: string;
  factory_challan_number: string;
  job_date: string;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-800",
  diagnosing: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  "picked-up": "bg-gray-100 text-gray-800",
};

export default function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState("10");

  async function fetchJobs() {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setJobs(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchJobs(); }, []);

  const filtered = jobs.filter((j) =>
    j.job_number.toLowerCase().includes(search.toLowerCase()) ||
    j.brand_name.toLowerCase().includes(search.toLowerCase()) ||
    j.model_name.toLowerCase().includes(search.toLowerCase()) ||
    j.board_name.toLowerCase().includes(search.toLowerCase()) ||
    j.board_serial.toLowerCase().includes(search.toLowerCase()) ||
    j.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    j.branch_name.toLowerCase().includes(search.toLowerCase())
  );
  const displayed = perPage === "all" ? filtered : filtered.slice(0, parseInt(perPage));

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">JOB LIST</h2>
        </div>

        <div className="flex items-center justify-between gap-4">
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
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-56" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="rounded-lg border bg-card overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="w-12">SL</TableHead>
                <TableHead>Job Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Board Serial</TableHead>
                <TableHead>Problem</TableHead>
                <TableHead>Challan No</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground">Loading...</TableCell></TableRow>
              ) : displayed.length === 0 ? (
                <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground">No jobs found</TableCell></TableRow>
              ) : (
                displayed.map((job, idx) => (
                  <TableRow key={job.id}>
                    <TableCell className="text-xs">{idx + 1}</TableCell>
                    <TableCell className="text-xs font-medium">{job.job_number}</TableCell>
                    <TableCell className="text-xs">{job.job_date}</TableCell>
                    <TableCell className="text-xs">{job.customer_name}</TableCell>
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
