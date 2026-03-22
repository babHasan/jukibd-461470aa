import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { RepairOrder, generateTicket } from "@/lib/repair-data";

interface AddRepairDialogProps {
  onAdd: (order: RepairOrder) => void;
}

export function AddRepairDialog({ onAdd }: AddRepairDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deviceType: "",
    deviceBrand: "",
    issue: "",
    estimatedCost: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    const order: RepairOrder = {
      id: crypto.randomUUID(),
      ticketNumber: generateTicket(),
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      deviceType: form.deviceType,
      deviceBrand: form.deviceBrand,
      issue: form.issue,
      status: "received",
      estimatedCost: Number(form.estimatedCost) || 0,
      notes: [],
      parts: [],
      createdAt: now,
      updatedAt: now,
    };
    onAdd(order);
    setForm({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      deviceType: "",
      deviceBrand: "",
      issue: "",
      estimatedCost: "",
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4" />
          New Repair
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Repair Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                required
                value={form.customerName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                required
                value={form.customerPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, customerPhone: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deviceBrand">Device</Label>
              <Input
                id="deviceBrand"
                placeholder="e.g. iPhone 15 Pro"
                required
                value={form.deviceBrand}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deviceBrand: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceType">Category</Label>
              <Input
                id="deviceType"
                placeholder="e.g. Smartphone"
                required
                value={form.deviceType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deviceType: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue">Issue Description</Label>
            <Textarea
              id="issue"
              required
              value={form.issue}
              onChange={(e) =>
                setForm((f) => ({ ...f, issue: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
            <Input
              id="estimatedCost"
              type="number"
              min="0"
              required
              value={form.estimatedCost}
              onChange={(e) =>
                setForm((f) => ({ ...f, estimatedCost: e.target.value }))
              }
            />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            Create Order
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
