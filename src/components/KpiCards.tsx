import { Wrench, Clock, CheckCircle2, TrendingUp, DollarSign } from "lucide-react";
import { RepairOrder } from "@/lib/repair-data";

interface KpiCardsProps {
  orders: RepairOrder[];
}

export function KpiCards({ orders }: KpiCardsProps) {
  const openOrders = orders.filter(
    (o) => !["completed", "picked-up"].includes(o.status)
  ).length;
  const completedToday = orders.filter(
    (o) =>
      o.status === "completed" &&
      o.updatedAt.startsWith("2026-03-22")
  ).length;
  const totalRevenue = orders
    .filter((o) => ["completed", "picked-up"].includes(o.status))
    .reduce((sum, o) => sum + o.estimatedCost, 0);
  const avgRepairCost =
    orders.length > 0
      ? Math.round(orders.reduce((s, o) => s + o.estimatedCost, 0) / orders.length)
      : 0;

  const cards = [
    {
      label: "Open Repairs",
      value: openOrders,
      icon: Wrench,
      accent: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Completed Today",
      value: completedToday,
      icon: CheckCircle2,
      accent: "text-status-completed",
      bg: "bg-status-completed/10",
    },
    {
      label: "Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      accent: "text-status-in-progress",
      bg: "bg-status-in-progress/10",
    },
    {
      label: "Avg. Repair Cost",
      value: `$${avgRepairCost}`,
      icon: TrendingUp,
      accent: "text-status-diagnosing",
      bg: "bg-status-diagnosing/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {card.label}
            </p>
            <div className={`rounded-lg p-2 ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.accent}`} />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
