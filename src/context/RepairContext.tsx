import { createContext, useContext, useState, ReactNode } from "react";
import {
  RepairOrder,
  RepairStatus,
  RepairNote,
  RepairPart,
  sampleOrders,
} from "@/lib/repair-data";

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

export function RepairProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<RepairOrder[]>(sampleOrders);

  function updateStatus(id: string, status: RepairStatus) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
      )
    );
  }

  function addOrder(order: RepairOrder) {
    setOrders((prev) => [order, ...prev]);
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
