import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from "date-fns";

const statusColors: Record<string, string> = {
  received: "bg-blue-100 text-blue-800",
  diagnosing: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  "picked-up": "bg-gray-100 text-gray-800",
};

interface Job {
  id: string;
  job_number: string;
  job_date: string;
  board_name: string;
  status: string;
}

export default function CalendarView() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  useEffect(() => {
    setLoading(true);
    const from = format(monthStart, "yyyy-MM-dd");
    const to = format(monthEnd, "yyyy-MM-dd");
    supabase
      .from("jobs")
      .select("id, job_number, job_date, board_name, status")
      .gte("job_date", from)
      .lte("job_date", to)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setJobs(data || []);
        setLoading(false);
      });
  }, [currentMonth]);

  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const j of jobs) {
      const key = j.job_date;
      const existing = map.get(key) || [];
      existing.push(j);
      map.set(key, existing);
    }
    return map;
  }, [jobs]);

  return (
    <AppLayout>
      <div className="space-y-4">
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
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

            <div className="grid grid-cols-7">
              {Array.from({ length: startPadding }).map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[90px] border-b border-r bg-muted/20 p-1" />
              ))}
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayJobs = jobsByDate.get(key) || [];
                const today = isToday(day);
                return (
                  <div
                    key={key}
                    className={`min-h-[90px] border-b border-r p-1.5 ${
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
                      {dayJobs.slice(0, 3).map((j) => (
                        <div
                          key={j.id}
                          onClick={() => navigate(`/job/${j.id}`)}
                          className="block truncate rounded px-1 py-0.5 text-[10px] font-medium cursor-pointer transition-colors hover:bg-muted"
                        >
                          <span className="font-mono">{j.job_number}</span>{" "}
                          <Badge variant="secondary" className={`text-[8px] px-1 py-0 ${statusColors[j.status] || ""}`}>
                            {j.status}
                          </Badge>
                        </div>
                      ))}
                      {dayJobs.length > 3 && (
                        <p className="px-1 text-[10px] text-muted-foreground font-medium">
                          +{dayJobs.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
