import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useRepairs } from "@/context/RepairContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  statusFlow,
  statusLabels,
  RepairPart,
  RepairNote,
} from "@/lib/repair-data";
import {
  ArrowLeft,
  ChevronRight,
  Phone,
  Mail,
  Clock,
  Package,
  MessageSquare,
  Plus,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

export default function RepairDetail() {
  const { id } = useParams<{ id: string }>();
  const { getOrder, updateStatus, addNote, addPart, removePart } = useRepairs();
  const order = getOrder(id || "");

  const [noteText, setNoteText] = useState("");
  const [partForm, setPartForm] = useState({ name: "", cost: "", quantity: "1" });
  const [showPartForm, setShowPartForm] = useState(false);

  if (!order) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg">Repair order not found.</p>
          <Link to="/" className="mt-4 text-accent hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </AppLayout>
    );
  }

  const nextStatus = (() => {
    const idx = statusFlow.indexOf(order.status);
    return idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  })();

  const partsCost = order.parts.reduce((s, p) => s + p.cost * p.quantity, 0);

  function handleAddNote() {
    if (!noteText.trim()) return;
    const note: RepairNote = {
      id: crypto.randomUUID(),
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
    };
    addNote(order.id, note);
    setNoteText("");
  }

  function handleAddPart(e: React.FormEvent) {
    e.preventDefault();
    const part: RepairPart = {
      id: crypto.randomUUID(),
      name: partForm.name,
      cost: Number(partForm.cost) || 0,
      quantity: Number(partForm.quantity) || 1,
    };
    addPart(order.id, part);
    setPartForm({ name: "", cost: "", quantity: "1" });
    setShowPartForm(false);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back + header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {order.ticketNumber}
              </h1>
              <p className="text-sm text-muted-foreground">
                {order.deviceBrand} — {order.issue}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            {nextStatus && (
              <Button
                size="sm"
                className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => updateStatus(order.id, nextStatus)}
              >
                Move to {statusLabels[nextStatus]}
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer & Device info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Customer
                </h3>
                <p className="text-lg font-semibold text-foreground">{order.customerName}</p>
                <div className="mt-2 space-y-1">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" /> {order.customerPhone}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {order.customerEmail}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Device
                </h3>
                <p className="text-lg font-semibold text-foreground">{order.deviceBrand}</p>
                <p className="text-sm text-muted-foreground">{order.deviceType}</p>
                <div className="mt-2 space-y-1">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Created {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            </div>

            {/* Issue */}
            <div className="rounded-lg border bg-card p-5">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Issue Description
              </h3>
              <p className="text-foreground">{order.issue}</p>
            </div>

            {/* Notes */}
            <div className="rounded-lg border bg-card p-5">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Repair Notes ({order.notes.length})
                </h3>
              </div>
              <div className="space-y-3">
                {order.notes.map((note) => (
                  <div key={note.id} className="rounded-md bg-muted/50 p-3">
                    <p className="text-sm text-foreground">{note.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                ))}
                {order.notes.length === 0 && (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[60px]"
                />
                <Button
                  size="sm"
                  className="shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Right column - Parts & Cost */}
          <div className="space-y-6">
            {/* Cost summary */}
            <div className="rounded-lg border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Cost Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Cost</span>
                  <span className="font-semibold text-foreground">${order.estimatedCost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parts Cost</span>
                  <span className="font-semibold text-foreground">${partsCost}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-base">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-accent">
                      ${order.estimatedCost + partsCost}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parts */}
            <div className="rounded-lg border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Parts ({order.parts.length})
                  </h3>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs text-accent"
                  onClick={() => setShowPartForm(!showPartForm)}
                >
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>

              {showPartForm && (
                <form onSubmit={handleAddPart} className="mb-4 space-y-3 rounded-md bg-muted/50 p-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Part Name</Label>
                    <Input
                      required
                      value={partForm.name}
                      onChange={(e) => setPartForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Cost ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        required
                        value={partForm.cost}
                        onChange={(e) => setPartForm((f) => ({ ...f, cost: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        required
                        value={partForm.quantity}
                        onChange={(e) => setPartForm((f) => ({ ...f, quantity: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Add Part
                  </Button>
                </form>
              )}

              <div className="space-y-2">
                {order.parts.map((part) => (
                  <div key={part.id} className="flex items-center justify-between rounded-md bg-muted/50 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{part.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ${part.cost} × {part.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        ${part.cost * part.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removePart(order.id, part.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {order.parts.length === 0 && (
                  <p className="text-sm text-muted-foreground">No parts added.</p>
                )}
              </div>
            </div>

            {/* Status timeline */}
            <div className="rounded-lg border bg-card p-5">
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Status Flow
              </h3>
              <div className="space-y-2">
                {statusFlow.map((s, i) => {
                  const currentIdx = statusFlow.indexOf(order.status);
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
                      <span
                        className={`text-sm ${
                          isPast ? "font-medium text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {statusLabels[s]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
