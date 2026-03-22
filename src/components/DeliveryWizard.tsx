import { useState, useEffect, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface JobItem {
  id: string;
  job_number: string;
  board_name: string;
  board_serial: string;
  details_of_problem: string;
  status: string;
  service_charge?: number | null;
  charge_type?: string | null;
  customer_name?: string;
  customer_id?: string | null;
  brand_name?: string;
  factory_challan_number?: string;
}

interface DeliveryWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: JobItem[];
  onCompleted: () => void;
}

interface JobDeliveryEntry {
  checked: boolean;
  amount: number;
  chargeType: string;
}

export function DeliveryWizard({ open, onOpenChange, jobs, onCompleted }: DeliveryWizardProps) {
  const eligibleJobs = jobs.filter((j) => j.status === "completed");

  const [entries, setEntries] = useState<Record<string, JobDeliveryEntry>>({});

  // Re-initialize entries whenever jobs prop changes
  useEffect(() => {
    const init: Record<string, JobDeliveryEntry> = {};
    const eligible = jobs.filter((j) => j.status === "completed");
    for (const job of eligible) {
      init[job.id] = {
        checked: true,
        amount: job.service_charge ?? 0,
        chargeType: job.charge_type || "Normal",
      };
    }
    setEntries(init);
  }, [jobs]);

  const [discount, setDiscount] = useState(0);
  const [receiveAmount, setReceiveAmount] = useState(0);
  const [receiveType, setReceiveType] = useState("Cash");
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), "dd-MM-yyyy"));
  const [submitting, setSubmitting] = useState(false);
  const [chequeFile, setChequeFile] = useState<File | null>(null);
  const [chequePreview, setChequePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalAmount = eligibleJobs
    .filter((j) => entries[j.id]?.checked)
    .reduce((sum, j) => sum + (entries[j.id]?.amount ?? 0), 0);

  const payableAmount = Math.max(0, totalAmount - discount);

  function updateEntry(id: string, updates: Partial<JobDeliveryEntry>) {
    setEntries((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  }

  function handleChequeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setChequeFile(file);
      setChequePreview(URL.createObjectURL(file));
    }
  }

  function removeChequeFile() {
    setChequeFile(null);
    setChequePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadChequePhoto(): Promise<string | null> {
    if (!chequeFile) return null;
    const ext = chequeFile.name.split(".").pop();
    const path = `cheque-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("cheques").upload(path, chequeFile);
    if (error) {
      toast.error("Failed to upload cheque photo");
      return null;
    }
    const { data: urlData } = supabase.storage.from("cheques").getPublicUrl(path);
    return urlData.publicUrl;
  }

  async function sendDeliverySms(job: JobItem, totalCharge: number) {
    if (!job.customer_id) return;
    try {
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
          estimated_cost: totalCharge,
          trigger_status: "picked-up",
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
      // Upload cheque photo if Cheque type selected
      let chequeUrl: string | null = null;
      if (receiveType === "Cheque") {
        if (!chequeFile) {
          toast.error("Please upload cheque photo");
          setSubmitting(false);
          return;
        }
        chequeUrl = await uploadChequePhoto();
        if (!chequeUrl) {
          setSubmitting(false);
          return;
        }
      }

      for (const job of selected) {
        const updateData: any = {
          status: "picked-up",
          discount,
          payable_amount: payableAmount,
          receive_amount: receiveAmount,
          receive_type: receiveType,
          delivery_date: deliveryDate,
        };
        if (chequeUrl) {
          updateData.cheque_url = chequeUrl;
        }
        const { error } = await supabase
          .from("jobs")
          .update(updateData)
          .eq("id", job.id);

        if (error) {
          toast.error(`Failed to update ${job.job_number}`);
          setSubmitting(false);
          return;
        }

        await sendDeliverySms(job, payableAmount);
      }
      toast.success("Jobs marked as Picked Up & SMS sent");
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
            <DialogTitle className="text-lg">Delivery / Bill Collection</DialogTitle>
            <div className="flex flex-col gap-0.5 text-sm">
              <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">
                CURRENT STATUS: COMPLETED
              </Badge>
              <Badge variant="secondary" className="bg-gray-200 text-gray-800 w-fit">
                CHANGE STATUS: COMPLETED TO PICKED UP
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
                        readOnly
                        className="w-28 bg-muted/30"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm font-medium">{entry?.chargeType || "Normal"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-32 text-right">Discount</label>
            <Input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-32 text-right">Payable Amount</label>
            <Input
              type="number"
              value={payableAmount}
              readOnly
              className="w-40 bg-muted/30 font-bold"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-32 text-right">Receive Amount</label>
            <Input
              type="number"
              min={0}
              value={receiveAmount}
              onChange={(e) => setReceiveAmount(parseFloat(e.target.value) || 0)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-32 text-right">Receive Type</label>
            <Select value={receiveType} onValueChange={setReceiveType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="bKash">bKash</SelectItem>
                <SelectItem value="Bank">Bank Transfer</SelectItem>
                <SelectItem value="Due">Due</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {receiveType === "Cheque" && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <label className="text-sm font-medium w-32 text-right pt-2">Cheque Photo</label>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleChequeFile}
                  className="hidden"
                />
                {!chequePreview ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Cheque Photo
                  </Button>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={chequePreview}
                      alt="Cheque"
                      className="h-24 rounded border object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeChequeFile}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 sm:col-span-2">
            <label className="text-sm font-medium w-32 text-right">Date</label>
            <Input
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-40"
            />
          </div>
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
