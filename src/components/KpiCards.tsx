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

  const statuses = [
    { key: "received", label: "Received" },
    { key: "diagnosing", label: "Diagnosing" },
    { key: "in-progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "picked-up", label: "Picked Up" },
  ];

  const cards = statuses.flatMap((s) => {
    const all = jobs.filter((j) => j.status === s.key);
    const daily = all.filter((j) => {
      if (s.key === "completed") return j.completed_date?.startsWith(today.split("-").reverse().join("-"));
      if (s.key === "picked-up") return j.delivery_date?.startsWith(today.split("-").reverse().join("-"));
      return j.job_date === today;
    });
    return [
      { label: `DAILY ${s.label.toUpperCase()}`, value: daily.length },
      { label: `TOTAL ${s.label.toUpperCase()}`, value: all.length },
    ];
  });

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border-l-4 border-l-accent border bg-card p-3 sm:p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-accent">
            {card.label}
          </p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-bold tracking-tight text-foreground">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
