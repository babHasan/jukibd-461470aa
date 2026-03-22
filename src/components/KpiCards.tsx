interface Job {
  id: string;
  status: string;
  job_date: string;
  created_at?: string;
  completed_date?: string | null;
  delivery_date?: string | null;
}

interface KpiCardsProps {
  jobs: Job[];
}

export function KpiCards({ jobs }: KpiCardsProps) {
  const today = new Date().toISOString().slice(0, 10);

  const todayReceived = jobs.filter(
    (j) => j.status === "received" && j.job_date === today
  ).length;
  const totalReceived = jobs.filter((j) => j.status === "received").length;

  const todayOnRepair = jobs.filter(
    (j) =>
      ["diagnosing", "in-progress"].includes(j.status) &&
      j.job_date === today
  ).length;
  const totalOnRepair = jobs.filter((j) =>
    ["diagnosing", "in-progress"].includes(j.status)
  ).length;

  const todayCompleted = jobs.filter(
    (j) => j.status === "completed" && j.completed_date?.startsWith(today.split("-").reverse().join("-"))
  ).length;
  const totalCompleted = jobs.filter((j) => j.status === "completed").length;

  const todayDelivery = jobs.filter(
    (j) => j.status === "picked-up" && j.delivery_date?.startsWith(today.split("-").reverse().join("-"))
  ).length;
  const totalDelivery = jobs.filter((j) => j.status === "picked-up").length;

  const cards = [
    { label: "TODAY RECEIVED", value: todayReceived },
    { label: "TOTAL RECEIVED", value: totalReceived },
    { label: "TODAY ON REPAIR", value: todayOnRepair },
    { label: "TOTAL ON REPAIR", value: totalOnRepair },
    { label: "TODAY COMPLETED", value: todayCompleted },
    { label: "TOTAL COMPLETED", value: totalCompleted },
    { label: "TODAY DELIVERY", value: todayDelivery },
    { label: "TOTAL DELIVERY", value: totalDelivery },
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
