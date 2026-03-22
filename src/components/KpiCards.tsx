import { RepairOrder } from "@/lib/repair-data";

interface KpiCardsProps {
  orders: RepairOrder[];
}

export function KpiCards({ orders }: KpiCardsProps) {
  const today = new Date().toISOString().slice(0, 10);

  const todayReceived = orders.filter(
    (o) => o.status === "received" && o.createdAt.startsWith(today)
  ).length;
  const totalReceived = orders.filter((o) => o.status === "received").length;

  const todayOnRepair = orders.filter(
    (o) =>
      ["diagnosing", "in-progress"].includes(o.status) &&
      o.updatedAt.startsWith(today)
  ).length;
  const totalOnRepair = orders.filter((o) =>
    ["diagnosing", "in-progress"].includes(o.status)
  ).length;

  const todayCompleted = orders.filter(
    (o) => o.status === "completed" && o.updatedAt.startsWith(today)
  ).length;
  const totalCompleted = orders.filter((o) => o.status === "completed").length;

  const todayDelivery = orders.filter(
    (o) => o.status === "picked-up" && o.updatedAt.startsWith(today)
  ).length;
  const totalDelivery = orders.filter((o) => o.status === "picked-up").length;

  const cards = [
    { label: "TODAY RECEIVED", labelBn: "আজকের রিসিভ", value: todayReceived },
    { label: "TOTAL RECEIVED", labelBn: "মোট রিসিভ", value: totalReceived },
    { label: "TODAY ON REPAIR", labelBn: "আজকের মেরামত", value: todayOnRepair },
    { label: "TOTAL ON REPAIR", labelBn: "মোট মেরামত", value: totalOnRepair },
    { label: "TODAY COMPLETED", labelBn: "আজকের সম্পন্ন", value: todayCompleted },
    { label: "TOTAL COMPLETED", labelBn: "মোট সম্পন্ন", value: totalCompleted },
    { label: "TODAY DELIVERY", labelBn: "আজকের ডেলিভারি", value: todayDelivery },
    { label: "TOTAL DELIVERY", labelBn: "মোট ডেলিভারি", value: totalDelivery },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border-l-4 border-l-accent border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {card.label}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
