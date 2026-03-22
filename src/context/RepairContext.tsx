import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  RepairOrder,
  RepairStatus,
  RepairNote,
  RepairPart,
  sampleOrders,
} from "@/lib/repair-data";
import { supabase } from "@/integrations/supabase/client";

interface RepairContextValue {
  orders: RepairOrder[];
  updateStatus: (id: string, status: RepairStatus) => void;
  addOrder: (order: RepairOrder) => void;
  addNote: (orderId: string, note: RepairNote) => void;
  addPart: (orderId: string, part: RepairPart) => void;
  removePart: (orderId: string, partId: string) => void;
  getOrder: (id: string) => RepairOrder | undefined;
}

const RepairContext = createContext<RepairContextValue | null>(null);

const SMS_TRIGGER_STATUSES = ["received", "completed", "picked-up"];

async function sendSmsNotification(order: RepairOrder, status: RepairStatus) {
  if (!SMS_TRIGGER_STATUSES.includes(status)) return;

  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    await fetch(
      `https://${projectId}.supabase.co/functions/v1/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          repair_order_id: order.id,
          customer_phone: order.customerPhone,
          customer_name: order.customerName,
          device_brand: order.deviceBrand,
          ticket_number: order.ticketNumber,
          issue: order.issue,
          estimated_cost: order.estimatedCost,
          trigger_status: status,
        }),
      }
    );
  } catch (err) {
    console.error("SMS notification failed:", err);
  }
}

export function RepairProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<RepairOrder[]>(sampleOrders);
  const { user } = useAuth();

  async function logActivity(action: string, detail?: string) {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("name").eq("id", user.id).single();
    await supabase.from("user_activity_logs").insert({
      user_id: user.id,
      user_name: data?.name || "",
      action: detail ? `${action}: ${detail}` : action,
    });
  }

  function updateStatus(id: string, status: RepairStatus) {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const updated = { ...o, status, updatedAt: new Date().toISOString() };
          sendSmsNotification(updated, status);
          return updated;
        }
        return o;
      })
    );
  }

  function addOrder(order: RepairOrder) {
    setOrders((prev) => [order, ...prev]);
    sendSmsNotification(order, order.status);
  }

  function addNote(orderId: string, note: RepairNote) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, notes: [...o.notes, note], updatedAt: new Date().toISOString() }
          : o
      )
    );
  }

  function addPart(orderId: string, part: RepairPart) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, parts: [...o.parts, part], updatedAt: new Date().toISOString() }
          : o
      )
    );
  }

  function removePart(orderId: string, partId: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, parts: o.parts.filter((p) => p.id !== partId), updatedAt: new Date().toISOString() }
          : o
      )
    );
  }

  function getOrder(id: string) {
    return orders.find((o) => o.id === id);
  }

  return (
    <RepairContext.Provider
      value={{ orders, updateStatus, addOrder, addNote, addPart, removePart, getOrder }}
    >
      {children}
    </RepairContext.Provider>
  );
}

export function useRepairs() {
  const ctx = useContext(RepairContext);
  if (!ctx) throw new Error("useRepairs must be used within RepairProvider");
  return ctx;
}
