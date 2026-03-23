import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  PackageCheck,
  Stethoscope,
  Cog,
  CheckCircle2,
  Truck,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

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

const gradients = [
  "from-[hsl(260,60%,50%)] to-[hsl(280,70%,40%)]",
  "from-[hsl(200,80%,45%)] to-[hsl(220,70%,35%)]",
  "from-[hsl(35,90%,50%)] to-[hsl(15,80%,45%)]",
  "from-[hsl(150,55%,40%)] to-[hsl(170,60%,30%)]",
  "from-[hsl(210,20%,50%)] to-[hsl(220,25%,35%)]",
];

const statusIcons = [PackageCheck, Stethoscope, Cog, CheckCircle2, Truck];

export function KpiCards({ jobs }: KpiCardsProps) {
  const { user } = useAuth();
  const [profileName, setProfileName] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.name) setProfileName(data.name);
        });
    }
  }, [user]);

  const statuses = [
    { key: "received", label: "Received" },
    { key: "diagnosing", label: "Diagnosing" },
    { key: "in-progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "picked-up", label: "Picked Up" },
  ];

  const totalJobs = jobs.length;
  const todayJobs = jobs.filter((j) => j.job_date === today).length;

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(240,50%,25%)] via-[hsl(260,45%,30%)] to-[hsl(280,50%,22%)] p-6 sm:p-8 shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-20 bottom-0 h-24 w-24 rounded-full bg-[hsl(38,92%,50%)]/10 blur-xl" />
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/60 tracking-wide">Welcome to RepairDesk</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ lineHeight: "1.15" }}>
            Hi, {profileName || "Admin"} 👋
          </h2>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2">
              <TrendingUp className="h-4 w-4 text-[hsl(38,92%,60%)]" />
              <span className="text-sm font-semibold text-white">{totalJobs}</span>
              <span className="text-xs text-white/60">Total Jobs</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-4 py-2">
              <CalendarDays className="h-4 w-4 text-[hsl(150,60%,55%)]" />
              <span className="text-sm font-semibold text-white">{todayJobs}</span>
              <span className="text-xs text-white/60">Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {statuses.map((s, i) => {
          const Icon = statusIcons[i];
          const all = jobs.filter((j) => j.status === s.key);
          const daily = all.filter((j) => {
            if (s.key === "completed")
              return j.completed_date?.startsWith(
                today.split("-").reverse().join("-")
              );
            if (s.key === "picked-up")
              return j.delivery_date?.startsWith(
                today.split("-").reverse().join("-")
              );
            return j.job_date === today;
          });

          return (
            <div
              key={s.key}
              className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${gradients[i]} p-4 sm:p-5 shadow-md hover:shadow-xl transition-shadow duration-300`}
            >
              {/* Decorative circle */}
              <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />

              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/70">
                    {s.label}
                  </p>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white/40" />
                </div>

                <div className="mt-3 flex items-end gap-3">
                  <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight" style={{ lineHeight: "1" }}>
                    {all.length}
                  </p>
                  <div className="mb-1 flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5">
                    <CalendarDays className="h-3 w-3 text-white/70" />
                    <span className="text-[10px] font-semibold text-white/80">{daily.length} today</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
