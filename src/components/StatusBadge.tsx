import { RepairStatus, statusLabels } from "@/lib/repair-data";

const statusColorMap: Record<RepairStatus, string> = {
  received: "bg-status-received/15 text-status-received border-status-received/30",
  diagnosing: "bg-status-diagnosing/15 text-status-diagnosing border-status-diagnosing/30",
  "in-progress": "bg-status-in-progress/15 text-status-in-progress border-status-in-progress/30",
  completed: "bg-status-completed/15 text-status-completed border-status-completed/30",
  "picked-up": "bg-status-picked-up/15 text-status-picked-up border-status-picked-up/30",
};

interface StatusBadgeProps {
  status: RepairStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColorMap[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}
