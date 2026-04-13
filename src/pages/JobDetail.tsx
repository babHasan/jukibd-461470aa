import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { ArrowLeft, ChevronLeft, ChevronRight, Phone, Clock, MapPin, DollarSign, Printer, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { CompletionWizard } from "@/components/CompletionWizard";
import { DeliveryWizard } from "@/components/DeliveryWizard";

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

interface JobDetail {
  id: string;
  job_number: string;
  brand_name: string;
  model_name: string;
  board_name: string;
  board_serial: string;
  details_of_problem: string;
  remarks: string;
  customer_name: string;
  customer_id: string | null;
  branch_name: string;
  factory_challan_number: string;
  job_date: string;
  status: string;
  created_at: string;
  challan_url: string | null;
  service_charge: number | null;
  charge_type: string | null;
  completed_date: string | null;
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [customerMobile, setCustomerMobile] = useState("");
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardJobs, setWizardJobs] = useState<any[]>([]);
  const [deliveryWizardOpen, setDeliveryWizardOpen] = useState(false);
  const [deliveryWizardJobs, setDeliveryWizardJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("jobs")
      .select("*, clients(contact_number)")
      .eq("id", id)
      .single()
      .then(({ data, error }: any) => {
        if (error || !data) {
          setJob(null);
        } else {
          setCustomerMobile(data.clients?.contact_number || "");
          setJob(data);
        }
        setLoading(false);
      });
  }, [id]);

  async function loadChallanJobs(
    currentJob: JobDetail,
    statusFilter: string,
    setJobs: (jobs: any[]) => void,
    setOpen: (open: boolean) => void
  ) {
    if (currentJob.factory_challan_number) {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("factory_challan_number", currentJob.factory_challan_number)
        .eq("customer_name", currentJob.customer_name)
        .eq("status", statusFilter);
      setJobs(data || [currentJob]);
    } else {
      setJobs([currentJob]);
    }
    setOpen(true);
  }

  async function handleUpdateStatus(newStatus: string) {
    if (!job) return;
    // Intercept in-progress → completed transition
    if (job.status === "in-progress" && newStatus === "completed") {
      await loadChallanJobs(job, "in-progress", setWizardJobs, setWizardOpen);
      return;
    }
    // Intercept completed → picked-up transition
    if (job.status === "completed" && newStatus === "picked-up") {
      await loadChallanJobs(job, "completed", setDeliveryWizardJobs, setDeliveryWizardOpen);
      return;
    }
    const { error } = await supabase.from("jobs").update({ status: newStatus }).eq("id", job.id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status updated to ${jobStatusLabels[newStatus]}`);
      setJob({ ...job, status: newStatus });
    }
  }

  function reloadJob() {
    if (!id) return;
    supabase
      .from("jobs")
      .select("*, clients(contact_number)")
      .eq("id", id)
      .single()
      .then(({ data, error }: any) => {
        if (!error && data) {
          setCustomerMobile(data.clients?.contact_number || "");
          setJob(data);
        }
      });
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  if (!job) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">Job not found.</p>
          <Link to="/" className="mt-4 text-accent hover:underline">Back to Dashboard</Link>
        </div>
      </AppLayout>
    );
  }

  const currentIdx = jobStatusFlow.indexOf(job.status);
  const nextStatus = currentIdx < jobStatusFlow.length - 1 ? jobStatusFlow[currentIdx + 1] : null;
  const prevStatus = currentIdx > 0 ? jobStatusFlow[currentIdx - 1] : null;

  async function handlePreviousStatus() {
    if (!job || !prevStatus) return;
    const updates: Record<string, any> = { status: prevStatus };
    // If moving back from completed, clear cost fields
    if (job.status === "completed") {
      updates.service_charge = 0;
      updates.charge_type = "Normal";
      updates.completed_date = null;
    }
    const { error } = await supabase.from("jobs").update(updates as any).eq("id", job.id);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status reverted to ${jobStatusLabels[prevStatus]}`);
      
      reloadJob();
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">{job.job_number.startsWith("JOB-") ? job.job_number : `JOB-${job.job_number}`}</h1>
              <p className="text-sm text-muted-foreground">
                {job.brand_name} — {job.model_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="secondary" className={`${statusColors[job.status] || ""}`}>
              {jobStatusLabels[job.status] || job.status}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => navigate(`/job/${job.id}/edit`)}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => {
                const url = job.factory_challan_number
                  ? `/print-invoice?challan=${encodeURIComponent(job.factory_challan_number)}`
                  : `/print-invoice?job=${job.id}`;
                window.open(url, "_blank");
              }}
            >
              <Printer className="h-3 w-3" />
              Print
            </Button>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive" className="gap-1">
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Job {job.job_number}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this job record.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={async () => {
                        const { error } = await supabase.from("jobs").delete().eq("id", job.id);
                        if (error) { toast.error("Failed to delete job"); return; }
                        toast.success("Job deleted");
                        navigate("/job-list");
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {prevStatus && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={handlePreviousStatus}
              >
                <ChevronLeft className="h-3 w-3" />
                Back to {jobStatusLabels[prevStatus]}
              </Button>
            )}
            {nextStatus && (
              <Button
                size="sm"
                className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => handleUpdateStatus(nextStatus)}
              >
                Move to {jobStatusLabels[nextStatus]}
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer & Branch */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Customer</h3>
                <p className="text-lg font-semibold text-foreground">{job.customer_name}</p>
                {customerMobile && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {customerMobile}
                  </p>
                )}
              </div>
              <div className="rounded-lg border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Branch</h3>
                <p className="text-lg font-semibold text-foreground">{job.branch_name}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(job.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>

            {/* Machine Info */}
            <div className="rounded-lg border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Machine Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Brand</p>
                  <p className="font-medium text-foreground">{job.brand_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p className="font-medium text-foreground">{job.model_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Board</p>
                  <p className="font-medium text-foreground">{job.board_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Board Serial</p>
                  <p className="font-medium text-foreground">{job.board_serial || "—"}</p>
                </div>
              </div>
            </div>

            {/* Problem & Remarks */}
            <div className="rounded-lg border bg-card p-5">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Details of Problem</h3>
              <p className="text-foreground">{job.details_of_problem || "No details provided."}</p>
            </div>

            {job.remarks && (
              <div className="rounded-lg border bg-card p-5">
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Remarks</h3>
                <p className="text-foreground">{job.remarks}</p>
              </div>
            )}

            {/* Challan Info */}
            <div className="rounded-lg border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Challan Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Factory Challan Number</p>
                  <p className="font-medium text-foreground">{job.factory_challan_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Job Date</p>
                  <p className="font-medium text-foreground">{job.job_date}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Status Flow */}
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-5">
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status Flow</h3>
              <div className="space-y-2">
                {jobStatusFlow.map((s, i) => {
                  const isPast = i <= currentIdx;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full border-2 ${
                          isPast
                            ? "border-accent bg-accent"
                            : "border-muted-foreground/30 bg-transparent"
                        }`}
                      />
                      <span className={`text-sm ${isPast ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                        {jobStatusLabels[s]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cost Summary - show when completed or picked-up */}
            {(job.status === "completed" || job.status === "picked-up") && (
              <div className="rounded-lg border bg-card p-5">
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Cost Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Charge Type</span>
                    <Badge variant={job.charge_type === "FOC" ? "secondary" : "default"}>
                      {job.charge_type || "Normal"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Service Charge</span>
                    <span className="text-lg font-bold text-foreground">
                      ৳{job.service_charge ?? 0}
                    </span>
                  </div>
                  {job.completed_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completed Date</span>
                      <span className="text-sm font-medium text-foreground">{job.completed_date}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {job && (
          <>
            <CompletionWizard
              open={wizardOpen}
              onOpenChange={setWizardOpen}
              jobs={wizardJobs}
              onCompleted={reloadJob}
            />
            <DeliveryWizard
              open={deliveryWizardOpen}
              onOpenChange={setDeliveryWizardOpen}
              jobs={deliveryWizardJobs}
              onCompleted={reloadJob}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
