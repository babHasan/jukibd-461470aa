import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Phone } from "lucide-react";

interface SearchJob {
  id: string;
  job_number: string;
  customer_name: string;
  customer_mobile: string;
  company_name: string;
  board_name: string;
  brand_name: string;
  board_serial: string;
  factory_challan_number: string;
  status: string;
}

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-800",
  diagnosing: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  "picked-up": "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  received: "Received",
  diagnosing: "Diagnosing",
  "in-progress": "In Progress",
  completed: "Completed",
  "picked-up": "Picked Up",
};

export function SearchJobWizard() {
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<SearchJob[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("jobs")
      .select("id, job_number, customer_name, board_name, brand_name, board_serial, factory_challan_number, status, clients(contact_number, company_name)")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }) => {
        if (data) {
          setJobs(
            data.map((j: any) => ({
              ...j,
              customer_mobile: j.clients?.contact_number || "",
              company_name: j.clients?.company_name || "",
            }))
          );
        }
      });
  }, [open]);

  const handleSelect = useCallback(
    (jobId: string) => {
      setOpen(false);
      navigate(`/job/${jobId}`);
    },
    [navigate]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search by job number, customer, mobile, board, challan..." />
      <CommandList>
        <CommandEmpty>No jobs found.</CommandEmpty>
        <CommandGroup heading="Jobs">
          {jobs.map((job) => (
            <CommandItem
              key={job.id}
              value={`${job.job_number} ${job.customer_name} ${job.customer_mobile} ${job.company_name} ${job.board_name} ${job.board_serial} ${job.factory_challan_number}`}
              onSelect={() => handleSelect(job.id)}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm">{job.job_number}</span>
                  <Badge variant="secondary" className={`text-[10px] ${statusColors[job.status] || ""}`}>
                    {statusLabels[job.status] || job.status}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {job.customer_name}
                  {job.company_name ? ` • ${job.company_name}` : ""}
                  {job.customer_mobile ? ` • ${job.customer_mobile}` : ""}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {job.board_name}{job.brand_name ? ` • ${job.brand_name}` : ""}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
