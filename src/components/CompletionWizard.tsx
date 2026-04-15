import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface JobItem {
  id: string;
  job_number: string;
  board_name: string;
  board_serial: string;
  details_of_problem: string;
  status: string;
  customer_name?: string;
  customer_id?: string | null;
  brand_name?: string;
  factory_challan_number?: string;
}

interface CompletionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: JobItem[];
  onCompleted: () => void;
}

type ChargeType = "Normal" | "FOC" | "Damage";

interface JobCostEntry {
  checked: boolean;
  amount: number;
  chargeType: ChargeType;
}

export function CompletionWizard({ open, onOpenChange, jobs, onCompleted }: CompletionWizardProps) {
  const eligibleJobs = jobs.filter((j) => j.status === "in-progress");

  const [entries, setEntries] = useState<Record<string, JobCostEntry>>(() => {
    const init: Record<string, JobCostEntry> = {};
    for (const job of eligibleJobs) {
      init[job.id] = { checked: true, amount: 0, chargeType: "Normal" };
    }
    return init;
  });

  const [completedDate, setCompletedDate] = useState(format(new Date(), "dd-MM-yyyy"));
  const [submitting, setSubmitting] = useState(false);

  function updateEntry(id: string, updates: Partial<JobCostEntry>) {
    setEntries((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  }

  async function sendCompletionSms(job: JobItem, serviceCharge: number) {
    if (!job.customer_id) return;
    try {
      // Get customer phone
      const { data: client } = await supabase
        .from("clients")
        .select("contact_number")
        .eq("id", job.customer_id)
        .single();

      if (!client?.contact_number) return;

      await supabase.functions.invoke("send-sms", {
        body: {
          repair_order_id: job.id,
          customer_phone: client.contact_number,
          customer_name: job.customer_name || "",
          device_brand: job.brand_name || "",
          ticket_number: job.factory_challan_number || job.job_number,
          issue: job.details_of_problem || "",
          estimated_cost: serviceCharge,
          trigger_status: "completed",
        },
      });
    } catch (err) {
      console.error("SMS send failed for", job.job_number, err);
    }
  }

  async function handleSubmit() {
    const selected = eligibleJobs.filter((j) => entries[j.id]?.checked);
    if (selected.length === 0) {
      toast.error("Please select at least one job");
      return;
    }

    setSubmitting(true);
    try {
      const smsSentChallans = new Set<string>();
      for (const job of selected) {
        const entry = entries[job.id];
        const { error } = await supabase
          .from("jobs")
          .update({
            status: "completed",
            service_charge: entry.chargeType === "FOC" || entry.chargeType === "Damage" ? 0 : entry.amount,
            charge_type: entry.chargeType,
            completed_date: completedDate,
          })
          .eq("id", job.id);

        if (error) {
          toast.error(`Failed to update ${job.job_number}`);
          setSubmitting(false);
          return;
        }

        // Send SMS once per challan, not per job
        const challanKey = job.factory_challan_number || job.id;
        if (!smsSentChallans.has(challanKey)) {
          smsSentChallans.add(challanKey);
          const charge = entry.chargeType === "FOC" ? 0 : entry.amount;
          await sendCompletionSms(job, charge);
        }
      }
      toast.success("Jobs marked as completed");
      
      onOpenChange(false);
      onCompleted();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="space-y-1">
            <DialogTitle className="text-lg">Complete Jobs</DialogTitle>
            <div className="flex flex-col gap-0.5 text-sm">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 w-fit">
                CURRENT STATUS: IN PROGRESS
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">
                CHANGE STATUS: IN PROGRESS TO COMPLETED
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-muted/60 border-b">
                <th className="px-3 py-2 text-left font-semibold">SL</th>
                <th className="px-3 py-2 text-left font-semibold">Service</th>
                <th className="px-3 py-2 text-center font-semibold">Check</th>
                <th className="px-3 py-2 text-left font-semibold">Amount</th>
                <th className="px-3 py-2 text-left font-semibold">Type</th>
              </tr>
            </thead>
            <tbody>
              {eligibleJobs.map((job, idx) => {
                const entry = entries[job.id];
                return (
                  <tr key={job.id} className="border-b hover:bg-muted/30">
                    <td className="px-3 py-2 text-primary font-medium">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <div>
                        <span className="font-medium">{job.board_name}</span>
                        {job.board_serial && (
                          <span className="text-muted-foreground ml-1">({job.board_serial})</span>
                        )}
                      </div>
                      {job.details_of_problem && (
                        <p className="text-xs text-muted-foreground">{job.details_of_problem}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Checkbox
                        checked={entry?.checked}
                        onCheckedChange={(checked) =>
                          updateEntry(job.id, { checked: !!checked })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={entry?.amount ?? 0}
                        onChange={(e) =>
                          updateEntry(job.id, { amount: parseFloat(e.target.value) || 0 })
                        }
                        disabled={!entry?.checked || entry?.chargeType === "FOC" || entry?.chargeType === "Damage"}
                        className="w-28"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={entry?.chargeType}
                        onValueChange={(val) =>
                          updateEntry(job.id, {
                            chargeType: val as ChargeType,
                            amount: val === "FOC" || val === "Damage" ? 0 : entry?.amount ?? 0,
                          })
                        }
                        disabled={!entry?.checked}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="FOC">FOC</SelectItem>
                          <SelectItem value="Damage">Damage</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <label className="text-sm font-medium">Date</label>
          <Input
            value={completedDate}
            onChange={(e) => setCompletedDate(e.target.value)}
            className="w-40"
          />
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "SUBMIT"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
