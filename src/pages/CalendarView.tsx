import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRepairs } from "@/context/RepairContext";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from "date-fns";

export default function CalendarView() {
  const { orders } = useRepairs();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart); // 0=Sun

  const ordersByDate = useMemo(() => {
    const map = new Map<string, typeof orders>();
    for (const o of orders) {
      const key = format(new Date(o.createdAt), "yyyy-MM-dd");
      const existing = map.get(key) || [];
      existing.push(o);
      map.set(key, existing);
    }
    return map;
  }, [orders]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Calendar</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="px-2 py-2.5 text-center text-xs font-semibold text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Padding for start of month */}
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[100px] border-b border-r bg-muted/30 p-1" />
            ))}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayOrders = ordersByDate.get(key) || [];
              const today = isToday(day);
              return (
                <div
                  key={key}
                  className={`min-h-[100px] border-b border-r p-1.5 ${
                    today ? "bg-accent/5" : ""
                  }`}
                >
                  <div
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      today
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayOrders.slice(0, 3).map((o) => (
                      <Link
                        key={o.id}
                        to={`/repair/${o.id}`}
                        className="block truncate rounded px-1 py-0.5 text-[10px] font-medium transition-colors hover:bg-muted"
                      >
                        <span className="font-mono">{o.ticketNumber}</span>{" "}
                        <span className="text-muted-foreground">{o.deviceBrand.split(" ").slice(-1)}</span>
                      </Link>
                    ))}
                    {dayOrders.length > 3 && (
                      <p className="px-1 text-[10px] text-muted-foreground">
                        +{dayOrders.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
