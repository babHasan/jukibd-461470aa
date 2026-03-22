import { useState } from "react";
import { Wrench } from "lucide-react";
import { RepairOrder, RepairStatus, sampleOrders } from "@/lib/repair-data";
import { KpiCards } from "@/components/KpiCards";
import { RepairTable } from "@/components/RepairTable";
import { AddRepairDialog } from "@/components/AddRepairDialog";

const Index = () => {
  const [orders, setOrders] = useState<RepairOrder[]>(sampleOrders);

  function handleUpdateStatus(id: string, status: RepairStatus) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? { ...o, status, updatedAt: new Date().toISOString() }
          : o
      )
    );
  }

  function handleAddOrder(order: RepairOrder) {
    setOrders((prev) => [order, ...prev]);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <Wrench className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground">
                RepairDesk
              </h1>
              <p className="text-xs text-muted-foreground">
                Repair Management
              </p>
            </div>
          </div>
          <AddRepairDialog onAdd={handleAddOrder} />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <KpiCards orders={orders} />
        <RepairTable orders={orders} onUpdateStatus={handleUpdateStatus} />
      </main>
    </div>
  );
};

export default Index;
